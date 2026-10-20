import asyncio
import logging
import time
from typing import Optional
import redis.asyncio as aioredis
from app.core.config import get_settings

logger = logging.getLogger("mutex_ledger.redis")
settings = get_settings()


class RedisClient:
    """Manages Redis connection with async fallback for in-memory leasing."""
    _client: Optional[aioredis.Redis] = None
    _in_memory_cache: dict[str, str] = {}
    _in_memory_expiry: dict[str, float] = {}
    _is_fallback: bool = False
    _lock = asyncio.Lock()

    @classmethod
    async def get_client(cls) -> Optional[aioredis.Redis]:
        if cls._client is None and not cls._is_fallback:
            try:
                client = aioredis.from_url(
                    settings.get_redis_url(),
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=1.5,
                    socket_timeout=1.5,
                )
                await client.ping()
                cls._client = client
                logger.info("Connected to Redis instance successfully.")
            except Exception as e:
                logger.warning(f"Unable to connect to Redis ({settings.get_redis_url()}): {e}. Enabling in-memory fallback cache/lock layer.")
                cls._is_fallback = True
                cls._client = None
        return cls._client

    @classmethod
    async def get(cls, key: str) -> Optional[str]:
        client = await cls.get_client()
        if client:
            try:
                return await client.get(key)
            except Exception as e:
                logger.warning(f"Redis get error: {e}, falling back to in-memory store")
        
        async with cls._lock:
            # Check expiry
            if key in cls._in_memory_expiry:
                if time.time() > cls._in_memory_expiry[key]:
                    cls._in_memory_cache.pop(key, None)
                    cls._in_memory_expiry.pop(key, None)
                    return None
            return cls._in_memory_cache.get(key)

    @classmethod
    async def set(cls, key: str, value: str, ex: int = 300) -> bool:
        client = await cls.get_client()
        if client:
            try:
                return await client.set(key, value, ex=ex)
            except Exception as e:
                logger.warning(f"Redis set error: {e}, falling back to in-memory store")

        async with cls._lock:
            cls._in_memory_cache[key] = value
            cls._in_memory_expiry[key] = time.time() + ex
            return True

    @classmethod
    async def setnx(cls, key: str, value: str, ex: int = 300) -> bool:
        """Atomic set if not exists with expiration."""
        client = await cls.get_client()
        if client:
            try:
                # Redis SET with NX and EX
                result = await client.set(key, value, nx=True, ex=ex)
                return bool(result)
            except Exception as e:
                logger.warning(f"Redis setnx error: {e}, falling back to in-memory store")

        async with cls._lock:
            now = time.time()
            if key in cls._in_memory_expiry and now > cls._in_memory_expiry[key]:
                cls._in_memory_cache.pop(key, None)
                cls._in_memory_expiry.pop(key, None)
            
            if key in cls._in_memory_cache:
                return False
            
            cls._in_memory_cache[key] = value
            cls._in_memory_expiry[key] = now + ex
            return True

    @classmethod
    async def delete(cls, key: str) -> None:
        client = await cls.get_client()
        if client:
            try:
                await client.delete(key)
                return
            except Exception as e:
                logger.warning(f"Redis delete error: {e}")
        async with cls._lock:
            cls._in_memory_cache.pop(key, None)
            cls._in_memory_expiry.pop(key, None)
