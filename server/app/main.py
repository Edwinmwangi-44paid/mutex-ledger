import logging
from contextlib import asynccontextmanager
from decimal import Decimal
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import init_db, get_session_factory
from app.core.redis import RedisClient
from app.api.v1 import wallets, ledger
from app.models.ledger import Wallet

# Logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("mutex_ledger.main")

settings = get_settings()

SEED_WALLETS = [
    {
        "id": uuid.UUID("892af410-0000-0000-0000-000000000001"),
        "user_id": uuid.UUID("00000000-0000-0000-0000-000000000001"),
        "currency": "USD",
        "balance": Decimal("14850250.7500"),
    },
    {
        "id": uuid.UUID("310cb912-0000-0000-0000-000000000002"),
        "user_id": uuid.UUID("00000000-0000-0000-0000-000000000002"),
        "currency": "USD",
        "balance": Decimal("521400.0000"),
    },
    {
        "id": uuid.UUID("762ea184-0000-0000-0000-000000000003"),
        "user_id": uuid.UUID("00000000-0000-0000-0000-000000000003"),
        "currency": "USD",
        "balance": Decimal("8432190.5000"),
    },
    {
        "id": uuid.UUID("994df001-0000-0000-0000-000000000004"),
        "user_id": uuid.UUID("00000000-0000-0000-0000-000000000004"),
        "currency": "USD",
        "balance": Decimal("2901240.2500"),
    },
]


async def seed_initial_wallets():
    session_factory = get_session_factory()
    async with session_factory() as session:
        for item in SEED_WALLETS:
            stmt = select(Wallet).where(Wallet.id == item["id"])
            existing = (await session.execute(stmt)).scalars().first()
            if not existing:
                w = Wallet(
                    id=item["id"],
                    user_id=item["user_id"],
                    currency=item["currency"],
                    balance=item["balance"],
                )
                session.add(w)
        await session.commit()
    logger.info("Seed wallets successfully initialized.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Seed data
    logger.info("Initializing Mutex Ledger Core database engine...")
    await init_db()
    await seed_initial_wallets()
    
    # Try connecting to Redis
    await RedisClient.get_client()
    logger.info("Mutex Ledger Core operational.")

    yield

    # Shutdown
    logger.info("Shutting down Mutex Ledger Core...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="High-concurrency, ACID-compliant double-entry ledger platform with row-level pessimistic locking and Redis idempotency leases.",
    lifespan=lifespan,
)

# Cross-Origin Resource Sharing (CORS) for Frontend Integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(wallets.router, prefix=settings.API_V1_STR)
app.include_router(ledger.router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "engine": "ACID_PESSIMISTIC_LOCK",
        "idempotency_ttl_seconds": settings.IDEMPOTENCY_LEASE_SECONDS,
    }
