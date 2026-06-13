"""MongoDB connection and collection handles (async, via Motor)."""
from motor.motor_asyncio import AsyncIOMotorClient

from config import settings

# serverSelectionTimeoutMS keeps startup fast if MongoDB isn't reachable yet.
client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=5000)
db = client[settings.db_name]

users_collection = db["users"]
records_collection = db["records"]


async def ensure_indexes() -> None:
    """Create indexes once on startup."""
    # Usernames must be unique.
    await users_collection.create_index("username", unique=True)
    # Speed up "history" queries (a user's records, newest first).
    await records_collection.create_index([("owner", 1), ("created_at", -1)])
