import logging
import uuid
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.ws_manager import ws_manager
from app.models.ledger import Transaction
from app.schemas.ledger import TransferResponse

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
            # Keep socket alive and receive client heartbeats/pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"WebSocket client error: {e}")
        await ws_manager.disconnect(websocket)


@router.get("/transactions", response_model=List[TransferResponse], summary="List recent ledger transactions")
async def get_recent_transactions(
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_db_session),
):
    stmt = select(Transaction).order_by(desc(Transaction.created_at)).limit(limit)
    res = await session.execute(stmt)
    records = res.scalars().all()
    return records
