import uuid
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db_session
from app.core.auth import get_current_user
from app.core.exceptions import (
    WalletNotFoundError,
    InsufficientFundsError,
    CurrencyMismatchError,
    ConcurrencyLockError,
    IdempotencyInProgressError,
)
from app.models.ledger import Wallet, Transaction, LedgerEntry, User
from app.schemas.ledger import (
    TransferRequest,
    TransferResponse,
    WalletResponse,
    WalletCreateRequest,
    LedgerEntryResponse,
    DepositRequest,
    WithdrawRequest,
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
    current_user: User = Depends(get_current_user),
):
    """
    Execute an atomic double-entry ledger transfer between source and destination wallets.
    
    Protected by JWT verification middleware layer:
    - Extracted current_user.id must own payload.source_wallet_id.
    - Idempotency filter via Redis X-Idempotency-Key.
    - Deterministic alphanumeric sorting of sender and receiver wallet IDs (deadlock prevention).
    - Row-level pessimistic locking (`SELECT ... FOR UPDATE`).
    - Validates balance boundaries: If multiple concurrent requests exceed available cash,
      gracefully rejects exceeding requests with HTTP 422 while processing valid requests successfully.
    """
    try:
        response = await LedgerService.execute_transfer(
            payload=payload,
            idempotency_key=idempotency_key,
            user_id=current_user.id,
        )
        return response
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except WalletNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except InsufficientFundsError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "BLOCKED_BY_MUTEX", "message": e.message},
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
            detail={"error_code": "BLOCKED_BY_MUTEX", "message": e.message},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal database execution failure: {str(e)}",
        )


@router.post(
    "/deposit",
    response_model=TransferResponse,
    status_code=status.HTTP_200_OK,
    summary="Deposit funds into wallet",
)
async def deposit_funds(
    payload: DepositRequest,
    idempotency_key: str = Depends(validate_uuid4_header),
):
    """Credit funds directly to user's wallet with atomic double-entry ledger entry."""
    try:
        response = await LedgerService.execute_deposit(
            wallet_id=payload.wallet_id,
            amount=payload.amount,
            idempotency_key=idempotency_key,
            currency=payload.currency or "USD",
        )
        return response
    except WalletNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Deposit failure: {str(e)}",
        )


@router.post(
    "/withdraw",
    response_model=TransferResponse,
    status_code=status.HTTP_200_OK,
    summary="Withdraw funds from wallet to external destination",
)
async def withdraw_funds(
    payload: WithdrawRequest,
    idempotency_key: str = Depends(validate_uuid4_header),
    current_user: User = Depends(get_current_user),
):
    """Debit funds from user's wallet to external crypto address with atomic double-entry ledger entry."""
    try:
        response = await LedgerService.execute_withdraw(
            wallet_id=payload.wallet_id,
            amount=payload.amount,
            idempotency_key=idempotency_key,
            destination_address=payload.destination_address,
            user_id=current_user.id,
            currency=payload.currency or "USD",
        )
        return response
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except WalletNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except InsufficientFundsError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "INSUFFICIENT_FUNDS", "message": e.message},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Withdrawal failure: {str(e)}",
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
