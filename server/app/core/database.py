import os
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine,
)
from app.core.config import get_settings
from app.models.ledger import Base

logger = logging.getLogger("pesaflip.db")

settings = get_settings()

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        db_url = settings.get_database_url()
        
        # Check if running with postgresql asyncpg
        if db_url.startswith("postgresql+asyncpg"):
            _engine = create_async_engine(
                db_url,
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                pool_timeout=settings.DB_POOL_TIMEOUT,
                pool_recycle=settings.DB_POOL_RECYCLE,
                echo=False,
            )
        else:
            # Fallback (e.g. SQLite async engine for local development without active Postgres)
            _engine = create_async_engine(
                db_url,
                echo=False,
            )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        engine = get_engine()
        _session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _session_factory


async def init_db() -> None:
    """Initialize database tables."""
    engine = get_engine()
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.warning(
            f"Could not connect to configured DB ({settings.get_database_url()}): {e}. "
            "Switching engine to local high-concurrency async SQLite storage..."
        )
        # Fallback to local async sqlite
        global _engine, _session_factory
        sqlite_url = "sqlite+aiosqlite:///./mutex_ledger.db"
        _engine = create_async_engine(sqlite_url, echo=False)
        _session_factory = async_sessionmaker(
            bind=_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
        async with _engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"Initialized fallback database with {sqlite_url}")


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for obtaining an isolated AsyncSession."""
    session_factory = get_session_factory()
    async with session_factory() as session:
        yield session
