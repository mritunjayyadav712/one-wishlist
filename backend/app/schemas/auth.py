from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

from app.schemas.user import UserRead


# ── Auth request bodies ──────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters long")
        return v


# ── Auth response bodies ─────────────────────────────────────────────────────

class AuthResponse(BaseModel):
    """Returned after a successful login."""
    message: str
    user: UserRead
