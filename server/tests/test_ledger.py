import pytest
import uuid
from decimal import Decimal
import httpx
from app.main import app
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
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Create wallet 1 with 1000.0000 USD
        w1_res = await client.post("/api/v1/wallets", json={"currency": "USD", "initial_balance": "1000.0000"})
        assert w1_res.status_code == 201
        w1_data = w1_res.json()
        w1_id = w1_data["id"]

        # Create wallet 2 with 200.0000 USD
        w2_res = await client.post("/api/v1/wallets", json={"currency": "USD", "initial_balance": "200.0000"})
        assert w2_res.status_code == 201
        w2_data = w2_res.json()
        w2_id = w2_data["id"]

        # Transfer 350.5000 USD
        idempotency_key = str(uuid.uuid4())
        transfer_payload = {
            "source_wallet_id": w1_id,
            "destination_wallet_id": w2_id,
            "amount": "350.5000"
        }
        headers = {"X-Idempotency-Key": idempotency_key}

        t_res = await client.post("/api/v1/wallets/transfer", json=transfer_payload, headers=headers)
        assert t_res.status_code == 200
        t_data = t_res.json()
        assert t_data["status"] == "success"
        assert t_data["idempotency_key"] == idempotency_key

        # Re-send same request with same idempotency key (Idempotency test)
        t_res_repeat = await client.post("/api/v1/wallets/transfer", json=transfer_payload, headers=headers)
        assert t_res_repeat.status_code == 200
        assert t_res_repeat.json()["id"] == t_data["id"]

        # Verify Wallet balances: W1 should have 649.5000, W2 should have 550.5000
        w1_check = await client.get(f"/api/v1/wallets/{w1_id}")
        w2_check = await client.get(f"/api/v1/wallets/{w2_id}")
        assert Decimal(str(w1_check.json()["balance"])) == Decimal("649.5000")
        assert Decimal(str(w2_check.json()["balance"])) == Decimal("550.5000")


@pytest.mark.anyio
async def test_insufficient_funds_rollback():
    await init_db()
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Create wallet with 50.0000 USD
        w1_res = await client.post("/api/v1/wallets", json={"currency": "USD", "initial_balance": "50.0000"})
        w1_id = w1_res.json()["id"]

        w2_res = await client.post("/api/v1/wallets", json={"currency": "USD", "initial_balance": "0.0000"})
        w2_id = w2_res.json()["id"]

        # Attempt to transfer 100.0000 USD (should fail with INSUFFICIENT_FUNDS)
        idempotency_key = str(uuid.uuid4())
        transfer_payload = {
            "source_wallet_id": w1_id,
            "destination_wallet_id": w2_id,
            "amount": "100.0000"
        }
        headers = {"X-Idempotency-Key": idempotency_key}

        t_res = await client.post("/api/v1/wallets/transfer", json=transfer_payload, headers=headers)
        assert t_res.status_code == 400
        assert "INSUFFICIENT_FUNDS" in str(t_res.json())

        # Verify balances were strictly rolled back and untouched
        w1_check = await client.get(f"/api/v1/wallets/{w1_id}")
        assert Decimal(str(w1_check.json()["balance"])) == Decimal("50.0000")
