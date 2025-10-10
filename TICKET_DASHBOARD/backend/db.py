from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo import ReturnDocument
from datetime import datetime, timezone
from .config import Config


mongodb_client: MongoClient | None = None


def get_mongo_client() -> MongoClient:
    global mongodb_client

    if mongodb_client is None:
        # Base MongoDB client options
        client_options = {
            "server_api": ServerApi("1"),
            "serverSelectionTimeoutMS": 30000,
            "connectTimeoutMS": 30000,
            "socketTimeoutMS": 30000,
        }
        
        # Add SSL configuration if enabled (default for production)
        if Config.MONGO_SSL_ENABLED:
            client_options.update({
                "tls": True,
                "tlsAllowInvalidCertificates": Config.MONGO_TLS_ALLOW_INVALID_CERTIFICATES,
                "tlsInsecure": True,  # This disables certificate validation
            })
        
        # MongoDB client with configurable SSL settings
        mongodb_client = MongoClient(Config.DATABASE_URL, **client_options)
        
    return mongodb_client


def get_db():
    client = get_mongo_client()
    return client[Config.MONGO_DB_NAME]


def init_db() -> None:
    client = get_mongo_client()
    client.admin.command("ping")


def get_database():
    return get_db()


def get_next_sequence(db, name: str) -> int:
    doc = db["counters"].find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    
    return int((doc or {}).get("seq", 1))


def utc_now() -> datetime:
    #return a timezone-aware UTC datetime for BSON Date storage in mongodb
    return datetime.now(timezone.utc)

