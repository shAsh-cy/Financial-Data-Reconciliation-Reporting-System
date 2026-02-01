"""User ORM model with role-based access control."""

import enum
import uuid

from sqlalchemy import Boolean, CheckConstraint, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    """User roles for RBAC."""

    ADMIN = "admin"
    ACCOUNTANT = "accountant"
    VIEWER = "viewer"


class User(Base, TimestampMixin):
    """User model with role-based access control."""

    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'accountant', 'viewer')",
            name="ck_users_role_valid",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    full_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
