"""FastAPI application: auth + CRUD for personal records, backed by MongoDB."""
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo import ReturnDocument

from config import settings
from database import ensure_indexes, records_collection, users_collection
from models import LoginRequest, RecordCreate, RecordPublic, Token, UserCredentials, UserPublic
from security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await ensure_indexes()
    except Exception as exc:  # noqa: BLE001 - we want the API to start regardless
        print(f"[warning] Could not reach MongoDB at startup: {exc}")
        print("[warning] API is up, but DB operations will fail until MongoDB is reachable.")
    yield


app = FastAPI(title="DayLog API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Resolve the logged-in user from the Bearer token, or raise 401."""
    username = decode_access_token(credentials.credentials)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user = await users_collection.find_one({"username": username})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


def record_to_public(doc: dict) -> RecordPublic:
    return RecordPublic(
        id=str(doc["_id"]),
        title=doc["title"],
        detail=doc.get("detail", ""),
        date=doc.get("date"),
        created_at=doc["created_at"],
    )


# ---------------------------------------------------------------- health
@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------- auth
@app.post("/api/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCredentials):
    if await users_collection.find_one({"username": payload.username}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
    await users_collection.insert_one(
        {
            "username": payload.username,
            "password_hash": hash_password(payload.password),
            "created_at": datetime.now(timezone.utc),
        }
    )
    return Token(access_token=create_access_token(payload.username))


@app.post("/api/auth/login", response_model=Token)
async def login(payload: LoginRequest):
    user = await users_collection.find_one({"username": payload.username})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    return Token(access_token=create_access_token(payload.username))


@app.get("/api/auth/me", response_model=UserPublic)
async def me(current_user: dict = Depends(get_current_user)):
    return UserPublic(id=str(current_user["_id"]), username=current_user["username"])


# ---------------------------------------------------------------- records
@app.post("/api/records", response_model=RecordPublic, status_code=status.HTTP_201_CREATED)
async def create_record(payload: RecordCreate, current_user: dict = Depends(get_current_user)):
    doc = {
        "owner": current_user["username"],
        "title": payload.title.strip(),
        "detail": payload.detail.strip(),
        "date": payload.date,
        "created_at": datetime.now(timezone.utc),
    }
    result = await records_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return record_to_public(doc)


@app.get("/api/records", response_model=list[RecordPublic])
async def list_records(current_user: dict = Depends(get_current_user)):
    """Return the current user's records, newest first (history view)."""
    cursor = records_collection.find({"owner": current_user["username"]}).sort("created_at", -1)
    docs = await cursor.to_list(length=1000)
    return [record_to_public(doc) for doc in docs]


@app.put("/api/records/{record_id}", response_model=RecordPublic)
async def update_record(
    record_id: str,
    payload: RecordCreate,
    current_user: dict = Depends(get_current_user),
):
    """Edit an existing record. Only the owner may update it."""
    try:
        oid = ObjectId(record_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid record id")
    updated = await records_collection.find_one_and_update(
        {"_id": oid, "owner": current_user["username"]},
        {
            "$set": {
                "title": payload.title.strip(),
                "detail": payload.detail.strip(),
                "date": payload.date,
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record_to_public(updated)


@app.delete("/api/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(record_id: str, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(record_id)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid record id")
    result = await records_collection.delete_one(
        {"_id": oid, "owner": current_user["username"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return None
