import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """CRUD operations for the User model."""

    # ── Reads ────────────────────────────────────────────────────────────────

    @staticmethod
    def get_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
        return db.get(User, user_id)

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email.lower().strip())
        return db.execute(stmt).scalar_one_or_none()

    # ── Writes ───────────────────────────────────────────────────────────────

    @classmethod
    def create(cls, db: Session, user_in: UserCreate) -> User:
        """
        Create a new User.  The plain-text password is hashed here;
        it is NEVER written to the database.
        """
        db_user = User(
            name=user_in.name,
            email=user_in.email.lower().strip(),
            password_hash=get_password_hash(user_in.password),
            is_active=True,
            is_verified=False,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @classmethod
    def update(cls, db: Session, db_user: User, user_in: UserUpdate) -> User:
        """Partial-update a User.  Only non-None fields are modified."""
        if user_in.name is not None:
            db_user.name = user_in.name
        if user_in.password is not None:
            db_user.password_hash = get_password_hash(user_in.password)
        db.commit()
        db.refresh(db_user)
        return db_user
