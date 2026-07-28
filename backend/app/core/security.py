from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union

import bcrypt
import jwt

from app.core.config import settings

# ── Password hashing (bcrypt) ───────────────────────────────────────────────
# Using bcrypt directly — passlib 1.7.4 is incompatible with bcrypt ≥ 4.x.

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if plain_password matches the stored bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    """Hash a plain-text password with bcrypt (12 rounds)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


# ── JWT helpers ─────────────────────────────────────────────────────────────

def create_verification_token(user_id: Union[str, Any]) -> str:
    """
    Create a signed email-verification JWT.
    Expires in 24 hours.  The DB row is still kept for single-use enforcement.
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    payload = {"sub": str(user_id), "type": "email_verify", "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_verification_token(token: str) -> Optional[dict]:
    """
    Decode and verify an email-verification JWT.
    Returns the payload dict on success, or None if invalid / expired / wrong type.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("type") != "email_verify":
            return None
        return payload
    except jwt.PyJWTError:
        return None


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a short-lived JWT access token."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": str(subject), "type": "access", "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a long-lived JWT refresh token (stored in HttpOnly cookie)."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    payload = {"sub": str(subject), "type": "refresh", "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT.  Returns the payload dict on success,
    or None if the token is invalid / expired.
    """
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.PyJWTError:
        return None
