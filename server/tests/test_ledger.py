import pytest
import uuid
from decimal import Decimal
import httpx
from app.main import app, seed_initial_users_and_wallets
from app.core.database import init_db


@pytest.fixture
def anyio_backend():
    return 'asyncio'


@pytest.mark.anyio
async def test_health():
    await init_db()
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "HEALTHY"


@pytest.mark.anyio
async def test_create_and_transfer_wallets():
    await init_db()
    await seed_initial_users_and_wallets()
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Register user 1
        u1_email = f"u1_{uuid.uuid4().hex[:6]}@mutex.core"
        reg1 = await client.post("/api/v1/auth/register", json={"email": u1_email, "password": "Password123!"})
        assert reg1.status_code == 201
        token1 = reg1.json()["access_token"]
        w1_id = reg1.json()["wallet"]["id"]

        # Register user 2
        u2_email = f"u2_{uuid.uuid4().hex[:6]}@mutex.core"
        reg2 = await client.post("/api/v1/auth/register", json={"email": u2_email, "password": "Password123!"})
        assert reg2.status_code == 201
        w2_id = reg2.json()["wallet"]["id"]

        # Transfer 350.5000 USD
        idempotency_key = str(uuid.uuid4())
        transfer_payload = {
            "source_wallet_id": w1_id,
            "destination_wallet_id": w2_id,
            "amount": "350.5000"
        }
        headers = {
            "X-Idempotency-Key": idempotency_key,
            "Authorization": f"Bearer {token1}",
        }

        t_res = await client.post("/api/v1/wallets/transfer", json=transfer_payload, headers=headers)
        assert t_res.status_code == 200
        t_data = t_res.json()
        assert t_data["status"] == "success"
        assert t_data["idempotency_key"] == idempotency_key

        # Re-send same request with same idempotency key (Idempotency test)
        t_res_repeat = await client.post("/api/v1/wallets/transfer", json=transfer_payload, headers=headers)
        assert t_res_repeat.status_code == 200
        assert t_res_repeat.json()["id"] == t_data["id"]

        # Verify Wallet balances: W1 (1000 - 350.5 = 649.5000), W2 (1000 + 350.5 = 1350.5000)
        w1_check = await client.get(f"/api/v1/wallets/{w1_id}")
        w2_check = await client.get(f"/api/v1/wallets/{w2_id}")
        assert Decimal(str(w1_check.json()["balance"])) == Decimal("649.5000")
        assert Decimal(str(w2_check.json()["balance"])) == Decimal("1350.5000")


@pytest.mark.anyio
async def test_insufficient_funds_rollback():
    await init_db()
    await seed_initial_users_and_wallets()
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Register user 1
        u1_email = f"u_insuf_{uuid.uuid4().hex[:6]}@mutex.core"
        reg1 = await client.post("/api/v1/auth/register", json={"email": u1_email, "password": "Password123!"})
        token1 = reg1.json()["access_token"]
        w1_id = reg1.json()["wallet"]["id"]

        u2_email = f"u_rec_{uuid.uuid4().hex[:6]}@mutex.core"
        reg2 = await client.post("/api/v1/auth/register", json={"email": u2_email, "password": "Password123!"})
        w2_id = reg2.json()["wallet"]["id"]

        # Attempt to transfer 2000.0000 USD (user only has 1000.0000, should return 422 BLOCKED_BY_MUTEX)
        idempotency_key = str(uuid.uuid4())
        transfer_payload = {
            "source_wallet_id": w1_id,
            "destination_wallet_id": w2_id,
            "amount": "2000.0000"
        }
        headers = {
            "X-Idempotency-Key": idempotency_key,
            "Authorization": f"Bearer {token1}",
        }

        t_res = await client.post("/api/v1/wallets/transfer", json=transfer_payload, headers=headers)
        assert t_res.status_code == 422
        assert "BLOCKED_BY_MUTEX" in str(t_res.json())

        # Verify balances were strictly rolled back and untouched
        w1_check = await client.get(f"/api/v1/wallets/{w1_id}")
        assert Decimal(str(w1_check.json()["balance"])) == Decimal("1000.0000")
