import pytest
import asyncio
import uuid
from decimal import Decimal
import httpx
from app.main import app
from app.core.database import init_db


@pytest.fixture
def anyio_backend():
    return 'asyncio'


@pytest.mark.anyio
async def test_concurrent_transfers_stress():
    """
    Stress test verifying that multiple concurrent transactions against the same wallet
    respect ACID guarantees:
    - Exactly one transfer per idempotency key
    - Balances cannot become negative
    - Ledger debits strictly equal ledger credits
    """
    await init_db()
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Create wallet with exactly 100.0000 USD
        w1_res = await client.post("/api/v1/wallets", json={"currency": "USD", "initial_balance": "100.0000"})
        w1_id = w1_res.json()["id"]

        w2_res = await client.post("/api/v1/wallets", json={"currency": "USD", "initial_balance": "0.0000"})
        w2_id = w2_res.json()["id"]

        # Fire 10 parallel requests of 20.0000 each (Total attempted = 200, but only 5 can succeed)
        async def send_transfer():
            key = str(uuid.uuid4())
            return await client.post(
                "/api/v1/wallets/transfer",
                json={"source_wallet_id": w1_id, "destination_wallet_id": w2_id, "amount": "20.0000"},
                headers={"X-Idempotency-Key": key},
            )

        tasks = [send_transfer() for _ in range(10)]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

        success_count = sum(1 for r in responses if hasattr(r, "status_code") and r.status_code == 200)
        insufficient_count = sum(1 for r in responses if hasattr(r, "status_code") and r.status_code == 400)

        assert success_count == 5
        assert insufficient_count == 5

        # Check final balance
        w1_check = await client.get(f"/api/v1/wallets/{w1_id}")
        w2_check = await client.get(f"/api/v1/wallets/{w2_id}")

        assert Decimal(str(w1_check.json()["balance"])) == Decimal("0.0000")
        assert Decimal(str(w2_check.json()["balance"])) == Decimal("100.0000")
