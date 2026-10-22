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
from app.core.auth import hash_password
from app.api.v1 import wallets, ledger, auth
from app.models.ledger import Wallet, User

# Logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("mutex_ledger.main")

settings = get_settings()

SEED_USERS = [
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000001"),
        "email": "agent.smith@mutex.core",
        "password": "Password123!",
        "wallet_id": uuid.UUID("892af410-0000-0000-0000-000000000001"),
        "currency": "USD",
        "balance": Decimal("1000.0000"),
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000002"),
        "email": "operator.neo@mutex.core",
        "password": "Password123!",
        "wallet_id": uuid.UUID("310cb912-0000-0000-0000-000000000002"),
        "currency": "USD",
        "balance": Decimal("1000.0000"),
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000003"),
        "email": "trinity.cipher@mutex.core",
        "password": "Password123!",
        "wallet_id": uuid.UUID("762ea184-0000-0000-0000-000000000003"),
        "currency": "USD",
        "balance": Decimal("1000.0000"),
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000004"),
        "email": "morpheus.root@mutex.core",
        "password": "Password123!",
        "wallet_id": uuid.UUID("994df001-0000-0000-0000-000000000004"),
        "currency": "USD",
        "balance": Decimal("1000.0000"),
    },
]


async def seed_initial_users_and_wallets():
    session_factory = get_session_factory()
    async with session_factory() as session:
        for item in SEED_USERS:
            # Check if user exists
            u_stmt = select(User).where(User.id == item["id"])
            existing_user = (await session.execute(u_stmt)).scalars().first()
            if not existing_user:
                new_u = User(
                    id=item["id"],
                    email=item["email"],
                    password_hash=hash_password(item["password"]),
                )
                session.add(new_u)
                await session.flush()

            # Check if wallet exists
            w_stmt = select(Wallet).where(Wallet.id == item["wallet_id"])
            existing_wallet = (await session.execute(w_stmt)).scalars().first()
            if not existing_wallet:
                w = Wallet(
                    id=item["wallet_id"],
                    user_id=item["id"],
                    currency=item["currency"],
                    balance=item["balance"],
                )
                session.add(w)
        await session.commit()
    logger.info("Seed users and wallets successfully initialized.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Seed data
    logger.info("Initializing Mutex Ledger Core database engine...")
    await init_db()
    await seed_initial_users_and_wallets()
    
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
app.include_router(auth.router, prefix=settings.API_V1_STR)
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
