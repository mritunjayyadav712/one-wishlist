import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_verification_token,
    decode_verification_token,
    verify_password,
)
from app.models.token import PasswordResetToken, VerificationToken
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.email_service import EmailService
from app.services.user_service import UserService


class AuthService:
    """
    Business logic for authentication flows:
      - register + send verification email
      - login (credential check)
      - email verification
      - forgot / reset password
      - JWT pair generation
    """

    # ── Registration ─────────────────────────────────────────────────────────

    @classmethod
    async def register_user(
        cls,
        db: Session,
        email: str,
        password: str,
        name: Optional[str] = None,
    ) -> User:
        """
        Create a new User and dispatch the email-verification email.
        The plain-text password is never stored; UserService hashes it.
        """
        user_in = UserCreate(email=email, password=password, name=name)
        user = UserService.create(db, user_in)

        # Create a signed 24-hour verification JWT and persist for single-use enforcement
        signed_token = create_verification_token(user.id)
        db.add(
            VerificationToken(
                user_id=user.id,
                token=signed_token,
                expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
            )
        )
        db.commit()

        await EmailService.send_verification_email(user.email, signed_token)
        return user

    # ── Login ────────────────────────────────────────────────────────────────

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """
        Verify credentials.  Returns the User on success, None otherwise.
        Timing-safe: bcrypt verify runs even when the user is not found
        to prevent user-enumeration via response time.
        """
        user = UserService.get_by_email(db, email)
        # Always verify — prevents timing oracle even if user doesn't exist
        dummy_hash = "$2b$12$KIXGGUkBr6TrCi6BtlXGaOo5bFMr5bFMr5bFMr5bFMr5bFMr5bFMr"
        stored_hash = user.password_hash if user else dummy_hash
        if not verify_password(password, stored_hash):
            return None
        return user

    # ── Email verification ───────────────────────────────────────────────────

    @staticmethod
    def verify_email(db: Session, token: str) -> bool:
        """
        Consume a signed verification token and mark the user as verified.

        Two-layer check:
        1. JWT signature + type + expiry verified cryptographically (fast-fail).
        2. DB row looked up by token string — deleted on success to prevent reuse.
        """
        # ── Layer 1: cryptographic validation ────────────────────────────────
        payload = decode_verification_token(token)
        if payload is None:
            # Signature invalid, wrong type, or JWT expired
            return False

        # ── Layer 2: single-use enforcement via DB ────────────────────────────
        stmt = select(VerificationToken).where(VerificationToken.token == token)
        tok = db.execute(stmt).scalar_one_or_none()
        if tok is None:
            # Token already consumed or never issued
            return False

        # Belt-and-suspenders: also honour the DB expiry (should match JWT exp)
        expires_at = tok.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            db.delete(tok)
            db.commit()
            return False

        user = db.get(User, tok.user_id)
        if user is None:
            db.delete(tok)
            db.commit()
            return False

        user.is_verified = True
        db.delete(tok)   # ← single-use: token is consumed here
        db.commit()
        return True

    # ── Forgot / reset password ──────────────────────────────────────────────

    @classmethod
    async def request_password_reset(cls, db: Session, email: str) -> None:
        """
        Issue a 1-hour password-reset token and email it to the user.
        Silently no-ops when the email is not registered (prevents enumeration).
        """
        user = UserService.get_by_email(db, email)
        if user is None:
            return

        # Invalidate any existing reset tokens for this user
        db.execute(
            delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
        )

        raw_token = secrets.token_urlsafe(32)
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token=raw_token,
                expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            )
        )
        db.commit()

        await EmailService.send_password_reset_email(user.email, raw_token)

    @classmethod
    def reset_password(cls, db: Session, token: str, new_password: str) -> bool:
        """Consume a reset token and update the user's password hash."""
        stmt = select(PasswordResetToken).where(PasswordResetToken.token == token)
        tok = db.execute(stmt).scalar_one_or_none()
        if tok is None:
            return False

        expires_at = tok.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > expires_at:
            db.delete(tok)
            db.commit()
            return False

        user = db.get(User, tok.user_id)
        if user is None:
            return False

        UserService.update(db, user, UserUpdate(password=new_password))
        db.delete(tok)
        db.commit()
        return True

    # ── Token generation ─────────────────────────────────────────────────────

    @staticmethod
    def generate_tokens(user_id: uuid.UUID) -> Tuple[str, str]:
        """Return (access_token, refresh_token) for the given user."""
        return (
            create_access_token(subject=str(user_id)),
            create_refresh_token(subject=str(user_id)),
        )
