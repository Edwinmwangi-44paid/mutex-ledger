import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.auth import get_current_user
from app.core.ws_manager import ws_manager
from app.models.ledger import Transaction, LedgerEntry, Wallet, User
from app.schemas.ledger import TransferResponse, LedgerEntryResponse

logger = logging.getLogger("mutex_ledger.ledger_api")
router = APIRouter(prefix="/ledger", tags=["Ledger & Stream"])


@router.websocket("/stream")
async def ledger_stream_endpoint(websocket: WebSocket):
    """
    Real-Time WebSocket event distribution endpoint: /api/v1/ledger/stream
    Broadcasts execution metrics (Timestamp, Tx Hash, Idempotency Key, status, amount)
    to all active client sessions immediately upon transaction completion or race condition rejection.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"WebSocket client error: {e}")
        await ws_manager.disconnect(websocket)


@router.get("/my-transactions", response_model=List[TransferResponse], summary="List active user's transaction ledger history")
async def get_my_transactions(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """
    Double-entry accounting ledger table showing only the active user's transaction history.
    Finds all transactions where source or destination belongs to the authenticated user.
    """
    # Find user's wallets
    w_stmt = select(Wallet.id).where(Wallet.user_id == current_user.id)
    w_res = await session.execute(w_stmt)
    user_wallet_ids = [w[0] for w in w_res.fetchall()]

    if not user_wallet_ids:
        return []

    stmt = (
        select(Transaction)
        .where(
            (Transaction.source_wallet_id.in_(user_wallet_ids))
            | (Transaction.destination_wallet_id.in_(user_wallet_ids))
        )
        .order_by(desc(Transaction.created_at))
        .limit(limit)
    )
    res = await session.execute(stmt)
    return res.scalars().all()


@router.get("/transactions", response_model=List[TransferResponse], summary="List recent global ledger transactions")
async def get_recent_transactions(
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_db_session),
):
    stmt = select(Transaction).order_by(desc(Transaction.created_at)).limit(limit)
    res = await session.execute(stmt)
    return res.scalars().all()


@router.get("/entries", response_model=List[LedgerEntryResponse], summary="List recent ledger double entries")
async def get_recent_ledger_entries(
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_db_session),
):
    stmt = select(LedgerEntry).order_by(desc(LedgerEntry.id)).limit(limit)
    res = await session.execute(stmt)
    return res.scalars().all()
