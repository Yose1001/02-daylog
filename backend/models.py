"""Pydantic request/response models."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ----- Auth -----
class UserCredentials(BaseModel):
    """Used for registration — enforces sign-up rules."""

    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=72)  # bcrypt limit is 72 bytes


class LoginRequest(BaseModel):
    """Used for login — no length rules so a bad attempt returns 401, not 422."""

    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=72)


class UserPublic(BaseModel):
    id: str
    username: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ----- Records (the "general notes" the user keys in) -----
class RecordCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    detail: str = Field(default="", max_length=5000)
    date: Optional[str] = None  # e.g. "2026-06-03", chosen by the user


class RecordPublic(BaseModel):
    id: str
    title: str
    detail: str
    date: Optional[str] = None
    created_at: datetime
