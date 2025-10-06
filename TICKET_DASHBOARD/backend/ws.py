from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set

router = APIRouter()
active_clients: Set[WebSocket] = set()


@router.websocket("/ws/activity")
async def activity_websocket(websocket: WebSocket):
    await websocket.accept()
    active_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        active_clients.discard(websocket)


async def broadcast(message: str) -> None:
    stale_clients = []
    for client in active_clients:
        try:
            await client.send_text(message)
        except Exception:
            stale_clients.append(client)
    
    for client in stale_clients:
        active_clients.discard(client)


