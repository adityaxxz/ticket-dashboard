from .ws import broadcast, get_online_user_ids
from typing import Optional, List
from .mail import send_activity_email
import json
import anyio


async def send_websocket_notification(project_id: int, message: str, ticket_id: Optional[int] = None):
    #WebSocket notification to all connected users
    data = {"project_id": int(project_id), "message": message}
    
    if ticket_id is not None:
        data["ticket_id"] = int(ticket_id)

    ws_message = json.dumps({"event": "activity", "data": data})
    await broadcast(ws_message)


def find_recent_project_users(db, project_id: int) -> List[int]:
    
    pipeline = [
        {"$match": {"project_id": int(project_id)}},
        {"$sort": {"visited_at": -1}},
        {"$group": {"_id": "$user_id", "last": {"$first": "$visited_at"}}},
        {"$limit": 100},
    ]
    return [int(doc["_id"]) for doc in db["user_visits"].aggregate(pipeline)]


async def send_email_notification(db, project_id: int, message: str, actor_email: str):
    #Send email to offline users who recently visited this project#
    try:
        user_ids = find_recent_project_users(db, int(project_id))
        if not user_ids:
            return

        users = list(db["users"].find({"id": {"$in": user_ids}}, {"_id": 0}))
        online_user_ids = get_online_user_ids()
        recipients = []

        for user in users:
            user_id = user.get("id")
            user_email = user.get("email")
            # Send email if: user exists, is offline, has email not same as the actor
            if (user_id is not None and 
                int(user_id) not in online_user_ids and 
                user_email and 
                user_email != actor_email):
                recipients.append(user_email)

        if recipients:
            subject = f"Activity on Project #{int(project_id)}"
            body = f"<p>{message}</p>"
            await send_activity_email(recipients, subject, body)

    except Exception:
        pass


def notify_activity(db, project_id: int, message: str, actor_email: str, ticket_id: Optional[int] = None):
    #sends both WebSocket and Email notifications
    try:
        anyio.from_thread.run(send_websocket_notification, int(project_id), message, ticket_id)
    except Exception:
        pass

    try:
        anyio.from_thread.run(send_email_notification, db, int(project_id), message, actor_email)
    except Exception:
        pass