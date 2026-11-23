import time
from typing import Callable
from fastapi import Request, HTTPException, status
from app.core.redis import RedisClient
import logging

logger = logging.getLogger("pesaflip.ratelimit")


class RateLimiter:
    """
    Sliding window / token counter rate limiter backed by Redis (with async in-memory fallback).
    Protects sensitive authentication and API endpoints against brute-force attacks and abuse.
    """

    def __init__(self, requests_limit: int = 5, window_seconds: int = 60, prefix: str = "rl"):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.prefix = prefix

    async def __call__(self, request: Request):
        # Extract client IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        key = f"{self.prefix}:{client_ip}:{request.url.path}"

        try:
            current_count_str = await RedisClient.get(key)
            current_count = int(current_count_str) if current_count_str else 0

            if current_count >= self.requests_limit:
                logger.warning(f"Rate limit exceeded for IP {client_ip} on {request.url.path}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many attempts. Please slow down and try again later.",
                    headers={"Retry-After": str(self.window_seconds)},
                )

            # Increment counter
            await RedisClient.set(key, str(current_count + 1), ex=self.window_seconds)

        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Rate limiter non-fatal check error: {e}")

