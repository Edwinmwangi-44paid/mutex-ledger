import uuid
import re
from typing import List
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db_session
from app.core.exceptions import (
    WalletNotFoundError,
    InsufficientFundsError,
    CurrencyMismatchError,
    ConcurrencyLockError,
    IdempotencyInProgressError,
)
from app.models.ledger import Wallet, Transaction, LedgerEntry
from app.schemas.ledger import (
    TransferRequest,
    TransferResponse,
    WalletResponse,
    WalletCreateRequest,
    LedgerEntryResponse,
)
from app.services.ledger_service import LedgerService

router = APIRouter(prefix="/wallets", tags=["Wallets & Transfers"])

UUID4_REGEX = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def validate_uuid4_header(x_idempotency_key: str = Header(..., alias="X-Idempotency-Key")) -> str:
    """Ensure X-Idempotency-Key is provided and conforms to UUIDv4 format."""
    clean_key = x_idempotency_key.strip()
    if not UUID4_REGEX.match(clean_key):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Header 'X-Idempotency-Key' must be a valid UUIDv4 string.",
        )
    return clean_key


@router.post(
    "/transfer",
    response_model=TransferResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute ACID atomic double-entry transfer between wallets",
)
async def transfer_funds(
    payload: TransferRequest,
    idempotency_key: str = Depends(validate_uuid4_header),
):
    """
    Execute an atomic double-entry ledger transfer between source and destination wallets.
    
    Guarantees:
    - Zero floating-point drift (NUMERIC(20,4) precision)
    - Row-level pessimistic locking (SELECT FOR UPDATE) in deterministic sorted order
    - Idempotent request protection with 5-minute leasing
    - Real-time WebSocket metric stream update
    """
    try:
        response = await LedgerService.execute_transfer(payload, idempotency_key)
        return response
    except WalletNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except InsufficientFundsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": e.error_code, "message": e.message},
        )
    except CurrencyMismatchError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": e.error_code, "message": e.message},
        )
    except IdempotencyInProgressError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": e.error_code, "message": e.message},
        )
    except ConcurrencyLockError as e:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail={"error_code": e.error_code, "message": e.message},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal database execution failure: {str(e)}",
        )


@router.get("", response_model=List[WalletResponse], summary="List all wallets")
async def list_wallets(
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_db_session),
):
    stmt = select(Wallet).order_by(Wallet.created_at.asc()).limit(limit)
    res = await session.execute(stmt)
    return res.scalars().all()


@router.get("/{wallet_id}", response_model=WalletResponse, summary="Get wallet by ID")
async def get_wallet(
    wallet_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
):
    stmt = select(Wallet).where(Wallet.id == wallet_id)
    res = await session.execute(stmt)
    wallet = res.scalars().first()
    if not wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found")
    return wallet


@router.post("", response_model=WalletResponse, status_code=status.HTTP_201_CREATED, summary="Create new wallet")
async def create_wallet(
    req: WalletCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    wallet = Wallet(
        id=uuid.uuid4(),
        user_id=req.user_id or uuid.uuid4(),
        currency=req.currency.upper(),
        balance=req.initial_balance,
    )
    session.add(wallet)
    await session.commit()
    await session.refresh(wallet)
    return wallet


@router.get("/{wallet_id}/entries", response_model=List[LedgerEntryResponse], summary="Get double-entry audit records")
async def get_wallet_entries(
    wallet_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(LedgerEntry)
        .where(LedgerEntry.wallet_id == wallet_id)
        .order_by(desc(LedgerEntry.id))
        .limit(limit)
    )
    res = await session.execute(stmt)
    return res.scalars().all()
