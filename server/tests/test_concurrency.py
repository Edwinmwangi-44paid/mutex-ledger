import pytest
import asyncio
import uuid
from decimal import Decimal
import httpx
from app.main import app, seed_initial_users_and_wallets
from app.core.database import init_db


@pytest.fixture
def anyio_backend():
    return 'asyncio'


@pytest.mark.anyio
async def test_auth_and_concurrency_stress():
    """
    Stress test verifying:
    1. User registration automatically seeds wallet with $1,000.00
    2. JWT authentication works
    3. Concurrency blast of 10 simultaneous transfers
    4. If total attempted exceeds balance, requests exceeding funds are gracefully rejected with HTTP 422
    5. Balance boundaries strictly maintained (balance never negative)
    """
    await init_db()
    await seed_initial_users_and_wallets()

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. Register User A (Sender)
        user_a_email = f"sender_{uuid.uuid4().hex[:8]}@mutex.core"
        reg_a = await client.post(
            "/api/v1/auth/register",
            json={"email": user_a_email, "password": "Password123!"},
        )
        assert reg_a.status_code == 201
        data_a = reg_a.json()
        token_a = data_a["access_token"]
        wallet_a = data_a["wallet"]
        assert Decimal(str(wallet_a["balance"])) == Decimal("1000.0000")
        w_a_id = wallet_a["id"]

        # 2. Register User B (Receiver)
        user_b_email = f"receiver_{uuid.uuid4().hex[:8]}@mutex.core"
        reg_b = await client.post(
            "/api/v1/auth/register",
            json={"email": user_b_email, "password": "Password123!"},
        )
        assert reg_b.status_code == 201
        w_b_id = reg_b.json()["wallet"]["id"]

        # 3. Fire 10 parallel transfer requests of $200.00 each
        # Sender has $1000.00. 10 * 200 = $2000. Exactly 5 must succeed, and 5 must fail with 422!
        async def send_transfer():
            key = str(uuid.uuid4())
            return await client.post(
                "/api/v1/wallets/transfer",
                json={
                    "source_wallet_id": w_a_id,
                    "destination_wallet_id": w_b_id,
                    "amount": "200.0000",
                },
                headers={
                    "X-Idempotency-Key": key,
                    "Authorization": f"Bearer {token_a}",
                },
            )

        tasks = [send_transfer() for _ in range(10)]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

        success_count = sum(1 for r in responses if hasattr(r, "status_code") and r.status_code == 200)
        rejected_count = sum(1 for r in responses if hasattr(r, "status_code") and r.status_code == 422)

        assert success_count == 5
        assert rejected_count == 5

        # 4. Verify balances
        w_a_check = await client.get(f"/api/v1/wallets/{w_a_id}")
        w_b_check = await client.get(f"/api/v1/wallets/{w_b_id}")

        assert Decimal(str(w_a_check.json()["balance"])) == Decimal("0.0000")
        assert Decimal(str(w_b_check.json()["balance"])) == Decimal("2000.0000")

        # 5. Verify /api/v1/ledger/my-transactions
        my_txs = await client.get(
            "/api/v1/ledger/my-transactions",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert my_txs.status_code == 200
        tx_list = my_txs.json()
        assert len(tx_list) >= 5
