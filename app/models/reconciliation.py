"""Reconciliation result models."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class ReconciliationStatus(str, enum.Enum):
    """Status of a reconciliation run."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class ReconciliationMatchType(str, enum.Enum):
    """Type of reconciliation match for an individual item."""

    MATCHED = "matched"
    ONLY_LEFT = "only_left"
    ONLY_RIGHT = "only_right"


class ReconciliationRun(Base, TimestampMixin):
    """A single reconciliation execution between two ledgers."""

    __tablename__ = "reconciliation_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    left_ledger_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ledgers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    right_ledger_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ledgers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ReconciliationStatus.PENDING.value,
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    matched_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    unmatched_left_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    unmatched_right_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    items: Mapped[list["ReconciliationItem"]] = relationship(
        "ReconciliationItem",
        back_populates="run",
        cascade="all, delete-orphan",
    )


class ReconciliationItem(Base):
    """Individual reconciliation result item for auditability."""

    __tablename__ = "reconciliation_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reconciliation_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    left_transaction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    right_transaction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    match_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ReconciliationMatchType.MATCHED.value,
    )

    run: Mapped[ReconciliationRun] = relationship(
        "ReconciliationRun",
        back_populates="items",
    )

