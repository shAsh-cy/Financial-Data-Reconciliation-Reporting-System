"""Transaction ORM model - immutable financial records."""

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.ledger import Ledger


class TransactionType(str, enum.Enum):
    """Transaction type: debit or credit."""

    DEBIT = "debit"
    CREDIT = "credit"


class TransactionStatus(str, enum.Enum):
    """Transaction lifecycle status."""

    PENDING = "pending"
    POSTED = "posted"
    VOID = "void"


class Transaction(Base):
    """
    Immutable financial transaction record. Append-only; no updates or deletes.
    Audit-friendly schema with created_at and created_by.
    """

    __tablename__ = "transactions"

    __table_args__ = (
        UniqueConstraint("ledger_id", "external_id", name="uq_transactions_ledger_external"),
        CheckConstraint(
            "type IN ('debit', 'credit')",
            name="ck_transactions_type_valid",
        ),
        CheckConstraint(
            "status IN ('pending', 'posted', 'void')",
            name="ck_transactions_status_valid",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    ledger_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ledgers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    external_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    transaction_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )
    posted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(19, 4),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
    )
    type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    reference: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    ledger: Mapped["Ledger"] = relationship(
        "Ledger",
        back_populates="transactions",
    )
