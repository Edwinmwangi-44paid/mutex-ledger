import asyncio
import json
import logging
from typing import Set, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("mutex_ledger.ws")


class ConnectionManager:
    """Manages active WebSocket connections and broadcasts ledger events."""
    def __init__(self):
        self._active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self._active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Active connections: {len(self._active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            self._active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Active connections: {len(self._active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast an event message to all connected clients."""
        if not self._active_connections:
            return

        payload = json.dumps(message, default=str)
        disconnected = set()

        async with self._lock:
            for connection in list(self._active_connections):
                try:
                    await connection.send_text(payload)
                except Exception as e:
                    logger.debug(f"Failed to send to client: {e}")
                    disconnected.add(connection)

            for dead in disconnected:
                self._active_connections.discard(dead)


# Global singleton instance
ws_manager = ConnectionManager()
