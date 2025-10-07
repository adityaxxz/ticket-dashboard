from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set, Optional
import jwt
from .config import Config
from .db import get_db, utc_now
import logging

router = APIRouter()

logger = logging.getLogger(__name__)

# Presence: map user_id -> websocket
user_id_to_ws: Dict[int, WebSocket] = {}


def decode_user_id_from_token(token: str) -> Optional[int]:
    try:
        data = jwt.decode(token, Config.JWT_SECRET, algorithms=[Config.JWT_ALG])
        return int(data.get("sub"))
    except Exception:
        return None


def log_user_visit(user_id: int, project_id_param: Optional[str], source: str) -> None:
    """Insert a visit record"""
    try:
        db = get_db()
        db["user_visits"].insert_one({
            "user_id": int(user_id),
            "project_id": int(project_id_param) if project_id_param is not None else None,
            "source": source,
            "visited_at": utc_now(),
        })
    except Exception as e:
        # Keep API resilient to logging failures; record at debug level
        logger.debug("log_user_visit failed: %s", e)


@router.websocket("/ws/activity")
async def activity_websocket(websocket: WebSocket):
    # Expect token (Bearer or raw) and optional project_id in query
    # TODO remove bearer
    raw: str = (websocket.query_params.get("token") or "").strip()
    token = raw.split(" ", 1)[1] if raw.lower().startswith("bearer ") else raw

    project_id_param = websocket.query_params.get("project_id")

    user_id = decode_user_id_from_token(token)

    await websocket.accept()

    if not user_id:
        await websocket.close(code=4401)  # unauthorized
        return

    user_id_to_ws[user_id] = websocket

    # Log visit on WS connect
    log_user_visit(int(user_id), project_id_param, "ws_connect")

    try:
        while True:
            # Keep the connection alive; any message from client updates last seen
            _ = await websocket.receive_text()
            log_user_visit(int(user_id), project_id_param, "ws_message")
    except WebSocketDisconnect:
        pass
    finally:
        # Clean up presence
        if user_id in user_id_to_ws and user_id_to_ws[user_id] is websocket:
            user_id_to_ws.pop(user_id, None)


async def broadcast(message: str) -> None:
    stale_user_ids = []
    for uid, client in user_id_to_ws.items():
        try:
            await client.send_text(message)
        except Exception:
            stale_user_ids.append(uid)

    for uid in stale_user_ids:
        user_id_to_ws.pop(uid, None)


def get_online_user_ids() -> Set[int]:
    return set(user_id_to_ws.keys())


async def send_to_user(user_id: int, message: str) -> None:
    ws = user_id_to_ws.get(int(user_id))

    if ws is not None:
        try:
            await ws.send_text(message)
        except Exception:
            
            user_id_to_ws.pop(int(user_id), None)


