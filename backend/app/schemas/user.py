import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# ── Shared base ─────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


# ── Inbound (write) schemas ─────────────────────────────────────────────────

class UserCreate(UserBase):
    """Used internally by UserService.create()."""
    password: str


class UserUpdate(BaseModel):
    """Patch schema — all fields optional."""
    name: Optional[str] = None
    password: Optional[str] = None


# ── Outbound (read) schema ──────────────────────────────────────────────────

class UserRead(BaseModel):
    """
    Public representation of a User.
    password_hash is NEVER included here.
    """

    id: uuid.UUID
    name: Optional[str]
    email: EmailStr
    is_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
