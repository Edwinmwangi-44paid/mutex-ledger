import asyncio
import hashlib
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any, Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.database import get_session_factory
from app.core.exceptions import (
    WalletNotFoundError,
    InsufficientFundsError,
    CurrencyMismatchError,
    ConcurrencyLockError,
    IdempotencyInProgressError,
)
from app.core.redis import RedisClient
from app.core.ws_manager import ws_manager
from app.models.ledger import Wallet, Transaction, LedgerEntry, TransactionStatus, LedgerEntryType
from app.schemas.ledger import TransferRequest, TransferResponse, StreamMetricEvent

logger = logging.getLogger("mutex_ledger.service")
settings = get_settings()


def compute_tx_hash(
    tx_id: str,
    idempotency_key: str,
    src_id: str,
    dst_id: str,
    amount: Decimal,
    timestamp: str,
) -> str:
    """Generate deterministic SHA256 transaction hash for Merkle audit verification."""
    raw = f"{tx_id}:{idempotency_key}:{src_id}:{dst_id}:{amount}:{timestamp}"
    return "0x" + hashlib.sha256(raw.encode("utf-8")).hexdigest()


class LedgerService:
    _wallet_locks: dict[str, asyncio.Lock] = {}
    _global_meta_lock = asyncio.Lock()

    @classmethod
    async def _acquire_wallet_lock(cls, wallet_id: str) -> asyncio.Lock:
        async with cls._global_meta_lock:
            if wallet_id not in cls._wallet_locks:
                cls._wallet_locks[wallet_id] = asyncio.Lock()
            return cls._wallet_locks[wallet_id]

    @staticmethod
    async def get_or_lease_idempotency(idempotency_key: str) -> Optional[Dict[str, Any]]:
        """
        Check if idempotency key exists in Redis or transactions table.
        If found in Redis/DB, returns the cached result.
        If not found, attempts atomic SETNX with 5-minute expiry.
        """
        redis_key = f"idempotency:{idempotency_key}"
        cached = await RedisClient.get(redis_key)
        if cached:
            if cached == "LEASED_IN_PROGRESS":
                raise IdempotencyInProgressError(idempotency_key)
            try:
                data = json.loads(cached)
                return data
            except Exception:
                pass

        # Check in DB transactions table
        session_factory = get_session_factory()
        async with session_factory() as session:
            stmt = select(Transaction).where(Transaction.idempotency_key == idempotency_key).options(
                selectinload(Transaction.entries)
            )
            result = await session.execute(stmt)
            existing_tx = result.scalars().first()
            if existing_tx:
                data = {
                    "id": str(existing_tx.id),
                    "idempotency_key": existing_tx.idempotency_key,
                    "source_wallet_id": str(existing_tx.source_wallet_id),
                    "destination_wallet_id": str(existing_tx.destination_wallet_id),
                    "amount": str(existing_tx.amount),
                    "status": existing_tx.status.value,
                    "error_reason": existing_tx.error_reason,
                    "created_at": existing_tx.created_at.isoformat(),
                    "cached": True,
                }
                # Store in Redis for future hits
                await RedisClient.set(redis_key, json.dumps(data), ex=settings.IDEMPOTENCY_LEASE_SECONDS)
                return data

        # Lease the key in Redis with 5-minute expiry
        acquired = await RedisClient.setnx(
            redis_key, "LEASED_IN_PROGRESS", ex=settings.IDEMPOTENCY_LEASE_SECONDS
        )
        if not acquired:
            # Another concurrent request grabbed the lease in the exact millisecond
            raise IdempotencyInProgressError(idempotency_key)

        return None

    @staticmethod
    async def release_or_store_idempotency(
        idempotency_key: str, data: Optional[Dict[str, Any]] = None
    ):
        redis_key = f"idempotency:{idempotency_key}"
        if data:
            await RedisClient.set(redis_key, json.dumps(data, default=str), ex=settings.IDEMPOTENCY_LEASE_SECONDS)
        else:
            await RedisClient.delete(redis_key)

    @classmethod
    async def execute_transfer(
        cls,
        payload: TransferRequest,
        idempotency_key: str,
        user_id: Optional[uuid.UUID] = None,
    ) -> TransferResponse:
        """
        Executes strict ACID transfer with:
        1. User ownership check (if authenticated, user must own source_wallet_id)
        2. Idempotency filter via Redis
        3. Deterministic alphanumeric sorting of sender & receiver wallet IDs to eliminate deadlocks
        4. Strict database transaction block (BEGIN TX)
        5. Row-level pessimistic locking (SELECT ... FOR UPDATE) on target wallets
        6. Balance boundary validation. If concurrent requests exceed available cash, raises InsufficientFundsError (HTTP 422)
        7. Atomic double-entry ledger append
        8. Real-time WebSocket metric broadcasting
        """
        start_time = time.perf_counter()
        now_dt = datetime.now(timezone.utc)
        iso_str = now_dt.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

        # Step 1: Check Idempotency via Redis / DB
        cached_result = await cls.get_or_lease_idempotency(idempotency_key)
        if cached_result:
            tx_hash = compute_tx_hash(
                cached_result["id"],
                idempotency_key,
                str(payload.source_wallet_id),
                str(payload.destination_wallet_id),
                payload.amount,
                cached_result.get("created_at", iso_str),
            )
            return TransferResponse(
                id=uuid.UUID(cached_result["id"]),
                idempotency_key=idempotency_key,
                source_wallet_id=payload.source_wallet_id,
                destination_wallet_id=payload.destination_wallet_id,
                amount=payload.amount,
                status=TransactionStatus(cached_result["status"]),
                error_reason=cached_result.get("error_reason"),
                created_at=datetime.fromisoformat(cached_result["created_at"]),
                execution_time_ms=0.1,
                tx_hash=tx_hash,
                ledger_entries=[],
            )

        # Step 2: Concurrency Rule: Sort sender and receiver wallet IDs alphanumerically to eliminate deadlocks
        src_id_str = str(payload.source_wallet_id)
        dst_id_str = str(payload.destination_wallet_id)
        
        # Alphanumerically sorted IDs
        ordered_wallet_ids = sorted([payload.source_wallet_id, payload.destination_wallet_id], key=lambda u: str(u))

        session_factory = get_session_factory()
        tx_id = uuid.uuid4()
        tx_hash = compute_tx_hash(
            str(tx_id),
            idempotency_key,
            src_id_str,
            dst_id_str,
            payload.amount,
            iso_str,
        )

        # Acquire in-memory locks in sorted order
        acquired_locks = []
        for w_id in ordered_wallet_ids:
            lk = await cls._acquire_wallet_lock(str(w_id))
            await lk.acquire()
            acquired_locks.append(lk)

        try:
            # Step 3: Strict database transaction block (BEGIN TX)
            async with session_factory() as session:
                async with session.begin():
                    # Step 4: Row-level pessimistic locking (SELECT ... FOR UPDATE) on target wallets
                    wallets_by_id: dict[uuid.UUID, Wallet] = {}
                    is_sqlite = session.bind.dialect.name == "sqlite"

                    for w_id in ordered_wallet_ids:
                        query = select(Wallet).where(Wallet.id == w_id)
                        if not is_sqlite:
                            query = query.with_for_update()
                        
                        wallet_res = await session.execute(query)
                        wallet = wallet_res.scalars().first()
                        if not wallet:
                            raise WalletNotFoundError(str(w_id))
                        wallets_by_id[w_id] = wallet

                    source_wallet = wallets_by_id[payload.source_wallet_id]
                    dest_wallet = wallets_by_id[payload.destination_wallet_id]

                    # Verify ownership if user_id is provided
                    if user_id is not None and source_wallet.user_id != user_id:
                        raise PermissionError(
                            f"User '{user_id}' does not own source wallet '{source_wallet.id}'"
                        )

                    # Validate currency match
                    if source_wallet.currency != dest_wallet.currency:
                        raise CurrencyMismatchError(source_wallet.currency, dest_wallet.currency)

                    # Step 5: Validate balance boundaries
                    if source_wallet.balance < payload.amount:
                        raise InsufficientFundsError(
                            required=f"{payload.amount:.4f}",
                            available=f"{source_wallet.balance:.4f}",
                        )

                    # Step 6: Mutate balances accurately
                    source_wallet.balance = (source_wallet.balance - payload.amount).quantize(Decimal("0.0001"))
                    dest_wallet.balance = (dest_wallet.balance + payload.amount).quantize(Decimal("0.0001"))

                    # Create Transaction record
                    tx_record = Transaction(
                        id=tx_id,
                        idempotency_key=idempotency_key,
                        source_wallet_id=payload.source_wallet_id,
                        destination_wallet_id=payload.destination_wallet_id,
                        amount=payload.amount,
                        status=TransactionStatus.SUCCESS,
                        error_reason=None,
                        created_at=now_dt,
                    )
                    session.add(tx_record)
                    await session.flush()

                    # Step 7: Atomic Double-Entry Ledger Append
                    debit_entry = LedgerEntry(
                        transaction_id=tx_id,
                        wallet_id=payload.source_wallet_id,
                        entry_type=LedgerEntryType.DEBIT,
                        amount=payload.amount,
                        balance_after=source_wallet.balance,
                        created_at=now_dt,
                    )
                    credit_entry = LedgerEntry(
                        transaction_id=tx_id,
                        wallet_id=payload.destination_wallet_id,
                        entry_type=LedgerEntryType.CREDIT,
                        amount=payload.amount,
                        balance_after=dest_wallet.balance,
                        created_at=now_dt,
                    )
                    session.add_all([debit_entry, credit_entry])
                    await session.flush()

            # Transaction committed successfully
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            
            # Cache success in Redis
            cached_data = {
                "id": str(tx_id),
                "idempotency_key": idempotency_key,
                "source_wallet_id": src_id_str,
                "destination_wallet_id": dst_id_str,
                "amount": str(payload.amount),
                "status": TransactionStatus.SUCCESS.value,
                "error_reason": None,
                "created_at": now_dt.isoformat(),
            }
            await cls.release_or_store_idempotency(idempotency_key, cached_data)

            # Broadcast WebSocket Event
            event = StreamMetricEvent(
                timestamp=iso_str,
                tx_hash=tx_hash,
                idempotency_key=idempotency_key,
                status="SUCCESS",
                amount=float(payload.amount),
                source_wallet_id=src_id_str,
                destination_wallet_id=dst_id_str,
                execution_time_ms=elapsed_ms,
            )
            asyncio.create_task(ws_manager.broadcast(event.model_dump()))

            return TransferResponse(
                id=tx_id,
                idempotency_key=idempotency_key,
                source_wallet_id=payload.source_wallet_id,
                destination_wallet_id=payload.destination_wallet_id,
                amount=payload.amount,
                status=TransactionStatus.SUCCESS,
                error_reason=None,
                created_at=now_dt,
                execution_time_ms=elapsed_ms,
                tx_hash=tx_hash,
            )

        except InsufficientFundsError as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            # Record failed transaction in database
            await cls._record_failed_transaction(
                tx_id=tx_id,
                idempotency_key=idempotency_key,
                source_id=payload.source_wallet_id,
                dest_id=payload.destination_wallet_id,
                amount=payload.amount,
                error_reason="BLOCKED_BY_MUTEX: INSUFFICIENT_FUNDS",
                created_at=now_dt,
            )

            # Broadcast failed metric
            event = StreamMetricEvent(
                timestamp=iso_str,
                tx_hash=tx_hash,
                idempotency_key=idempotency_key,
                status="BLOCKED_BY_MUTEX",
                amount=float(payload.amount),
                source_wallet_id=src_id_str,
                destination_wallet_id=dst_id_str,
                execution_time_ms=elapsed_ms,
                error_reason="INSUFFICIENT_FUNDS",
            )
            asyncio.create_task(ws_manager.broadcast(event.model_dump()))
            raise e

        except (ConcurrencyLockError, Exception) as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            # Release lease on unexpected or concurrency error so it can be re-attempted
            await cls.release_or_store_idempotency(idempotency_key, None)

            is_race = isinstance(e, ConcurrencyLockError) or "deadlock" in str(e).lower() or "lock" in str(e).lower()
            status_tag = "BLOCKED_BY_MUTEX" if is_race else "FAILED"
            
            event = StreamMetricEvent(
                timestamp=iso_str,
                tx_hash=tx_hash,
                idempotency_key=idempotency_key,
                status=status_tag,
                amount=float(payload.amount),
                source_wallet_id=src_id_str,
                destination_wallet_id=dst_id_str,
                execution_time_ms=elapsed_ms,
                error_reason=str(e),
            )
            asyncio.create_task(ws_manager.broadcast(event.model_dump()))
            raise e
        finally:
            for lk in reversed(acquired_locks):
                lk.release()

    @classmethod
    async def _record_failed_transaction(
        cls,
        tx_id: uuid.UUID,
        idempotency_key: str,
        source_id: uuid.UUID,
        dest_id: uuid.UUID,
        amount: Decimal,
        error_reason: str,
        created_at: datetime,
    ):
        """Record an explicit failed transaction after rolling back the balance mutation."""
        session_factory = get_session_factory()
        try:
            async with session_factory() as session:
                async with session.begin():
                    tx_record = Transaction(
                        id=tx_id,
                        idempotency_key=idempotency_key,
                        source_wallet_id=source_id,
                        destination_wallet_id=dest_id,
                        amount=amount,
                        status=TransactionStatus.FAILED,
                        error_reason=error_reason,
                        created_at=created_at,
                    )
                    session.add(tx_record)
            
            # Store in Redis
            cached = {
                "id": str(tx_id),
                "idempotency_key": idempotency_key,
                "source_wallet_id": str(source_id),
                "destination_wallet_id": str(dest_id),
                "amount": str(amount),
                "status": TransactionStatus.FAILED.value,
                "error_reason": error_reason,
                "created_at": created_at.isoformat(),
            }
            await cls.release_or_store_idempotency(idempotency_key, cached)
        except Exception as ex:
            logger.error(f"Failed to record failed transaction: {ex}")

    @classmethod
    async def execute_deposit(
        cls,
        wallet_id: uuid.UUID,
        amount: Decimal,
        idempotency_key: str,
        currency: str = "USD",
    ) -> TransferResponse:
        """Atomic deposit to wallet with double-entry credit record."""
        start_time = time.perf_counter()
        now_dt = datetime.now(timezone.utc)
        iso_str = now_dt.isoformat()
        tx_id = uuid.uuid4()
        session_factory = get_session_factory()

        lk = await cls._acquire_wallet_lock(str(wallet_id))
        await lk.acquire()
        try:
            async with session_factory() as session:
                async with session.begin():
                    is_sqlite = session.bind.dialect.name == "sqlite"
                    query = select(Wallet).where(Wallet.id == wallet_id)
                    if not is_sqlite:
                        query = query.with_for_update()
                    res = await session.execute(query)
                    wallet = res.scalars().first()
                    if not wallet:
                        raise WalletNotFoundError(str(wallet_id))

                    wallet.balance = (wallet.balance + amount).quantize(Decimal("0.0001"))

                    tx_record = Transaction(
                        id=tx_id,
                        idempotency_key=idempotency_key,
                        source_wallet_id=wallet_id,
                        destination_wallet_id=wallet_id,
                        amount=amount,
                        status=TransactionStatus.SUCCESS,
                        error_reason=None,
                        created_at=now_dt,
                    )
                    session.add(tx_record)
                    await session.flush()

                    credit_entry = LedgerEntry(
                        transaction_id=tx_id,
                        wallet_id=wallet_id,
                        entry_type=LedgerEntryType.CREDIT,
                        amount=amount,
                        balance_after=wallet.balance,
                        created_at=now_dt,
                    )
                    session.add(credit_entry)
                    await session.flush()

            tx_hash = compute_tx_hash(str(tx_id), idempotency_key, "EXTERNAL_DEPOSIT", str(wallet_id), amount, iso_str)
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # Broadcast WebSocket Event
            event = StreamMetricEvent(
                timestamp=iso_str,
                tx_hash=tx_hash,
                idempotency_key=idempotency_key,
                status=TransactionStatus.SUCCESS.value,
                amount=float(amount),
                source_wallet_id="EXTERNAL_DEPOSIT",
                destination_wallet_id=str(wallet_id),
                execution_time_ms=elapsed_ms,
            )
            await ws_manager.broadcast_event(event)

            return TransferResponse(
                id=tx_id,
                idempotency_key=idempotency_key,
                source_wallet_id=wallet_id,
                destination_wallet_id=wallet_id,
                amount=amount,
                status=TransactionStatus.SUCCESS,
                error_reason=None,
                created_at=now_dt,
                execution_time_ms=elapsed_ms,
                tx_hash=tx_hash,
            )
        finally:
            lk.release()

    @classmethod
    async def execute_withdraw(
        cls,
        wallet_id: uuid.UUID,
        amount: Decimal,
        idempotency_key: str,
        destination_address: str,
        user_id: Optional[uuid.UUID] = None,
        currency: str = "USD",
    ) -> TransferResponse:
        """Atomic withdrawal from wallet with double-entry debit record."""
        start_time = time.perf_counter()
        now_dt = datetime.now(timezone.utc)
        iso_str = now_dt.isoformat()
        tx_id = uuid.uuid4()
        session_factory = get_session_factory()

        lk = await cls._acquire_wallet_lock(str(wallet_id))
        await lk.acquire()
        try:
            async with session_factory() as session:
                async with session.begin():
                    is_sqlite = session.bind.dialect.name == "sqlite"
                    query = select(Wallet).where(Wallet.id == wallet_id)
                    if not is_sqlite:
                        query = query.with_for_update()
                    res = await session.execute(query)
                    wallet = res.scalars().first()
                    if not wallet:
                        raise WalletNotFoundError(str(wallet_id))

                    if user_id is not None and wallet.user_id != user_id:
                        raise PermissionError(f"User does not own wallet {wallet_id}")

                    if wallet.balance < amount:
                        raise InsufficientFundsError(required=f"{amount:.4f}", available=f"{wallet.balance:.4f}")

                    wallet.balance = (wallet.balance - amount).quantize(Decimal("0.0001"))

                    tx_record = Transaction(
                        id=tx_id,
                        idempotency_key=idempotency_key,
                        source_wallet_id=wallet_id,
                        destination_wallet_id=wallet_id,
                        amount=amount,
                        status=TransactionStatus.SUCCESS,
                        error_reason=None,
                        created_at=now_dt,
                    )
                    session.add(tx_record)
                    await session.flush()

                    debit_entry = LedgerEntry(
                        transaction_id=tx_id,
                        wallet_id=wallet_id,
                        entry_type=LedgerEntryType.DEBIT,
                        amount=amount,
                        balance_after=wallet.balance,
                        created_at=now_dt,
                    )
                    session.add(debit_entry)
                    await session.flush()

            tx_hash = compute_tx_hash(str(tx_id), idempotency_key, str(wallet_id), destination_address, amount, iso_str)
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

            event = StreamMetricEvent(
                timestamp=iso_str,
                tx_hash=tx_hash,
                idempotency_key=idempotency_key,
                status=TransactionStatus.SUCCESS.value,
                amount=float(amount),
                source_wallet_id=str(wallet_id),
                destination_wallet_id=destination_address,
                execution_time_ms=elapsed_ms,
            )
            await ws_manager.broadcast_event(event)

            return TransferResponse(
                id=tx_id,
                idempotency_key=idempotency_key,
                source_wallet_id=wallet_id,
                destination_wallet_id=wallet_id,
                amount=amount,
                status=TransactionStatus.SUCCESS,
                error_reason=None,
                created_at=now_dt,
                execution_time_ms=elapsed_ms,
                tx_hash=tx_hash,
            )
        finally:
            lk.release()

