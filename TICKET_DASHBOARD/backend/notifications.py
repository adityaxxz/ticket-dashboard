from .ws import broadcast, get_online_user_ids
from typing import Optional, List
from .mail import send_activity_email
import json
import anyio



class NotificationStrategy:
    def send(self, db, project_id: int, message: str, actor_email: str, ticket_id: Optional[int] = None) -> None:
        raise NotImplementedError


class WebSocketNotification(NotificationStrategy):
    async def async_broadcast_fn(self, data: dict) -> None:
        message = json.dumps({"event": "activity", "data": data})
        await broadcast(message)

    def send(self, db, project_id: int, message: str, actor_email: str, ticket_id: Optional[int] = None) -> None:
        data: dict = {"project_id": int(project_id), "message": message}
        if ticket_id is not None:
            data["ticket_id"] = int(ticket_id)

        try:
            anyio.from_thread.run(self.async_broadcast_fn, data)
        except Exception:
            pass


class EmailNotification(NotificationStrategy):
    def find_recent_user_ids(self, db, project_id: int) -> List[int]:
        pipeline = [
            {"$match": {"project_id": int(project_id)}},
            {"$sort": {"visited_at": -1}},
            {"$group": {"_id": "$user_id", "last": {"$first": "$visited_at"}}},
            {"$limit": 100},
        ]
        return [int(doc["_id"]) for doc in db["user_visits"].aggregate(pipeline)]

    def send(self, db, project_id: int, message: str, actor_email: str, ticket_id: Optional[int] = None) -> None:
        try:
            user_ids = self.find_recent_user_ids(db, int(project_id))
            if not user_ids:
                return

            users = list(db["users"].find({"id": {"$in": user_ids}}, {"_id": 0}))
            online = get_online_user_ids()
            recipients = [
                u["email"]
                for u in users
                if int(u.get("id")) not in online and u.get("email") and u.get("email") != actor_email
            ]

            if recipients:
                subject = f"Activity on Project #{int(project_id)}"
                body = f"<p>{message}</p>"
                try:
                    anyio.from_thread.run(send_activity_email, recipients, subject, body)
                except Exception:
                    pass
        except Exception:
            pass

# if websocket fails, continue with email
class CompositeNotification(NotificationStrategy):
    def __init__(self, strategies: List[NotificationStrategy]):
        self.strategies = strategies

    def send(self, db, project_id: int, message: str, actor_email: str, ticket_id: Optional[int] = None) -> None:
        for s in self.strategies:
            try:
                s.send(db, project_id, message, actor_email, ticket_id)
            except Exception:
                pass


