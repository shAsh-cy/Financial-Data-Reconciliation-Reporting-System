"""Financial report result models."""

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class ReportType(str, enum.Enum):
    """Type of financial report."""

    PNL = "pnl"
    LIQUIDITY = "liquidity"


class ReportStatus(str, enum.Enum):
    """Status of a report generation run."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class FinancialReport(Base, TimestampMixin):
    """A generated financial report persisted for dashboard consumption."""

    __tablename__ = "financial_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    report_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ReportStatus.PENDING.value,
    )
    period_start: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )
    period_end: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    # P&L fields
    revenue: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    cost_of_goods_sold: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    gross_profit: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    operating_expenses: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    operating_income: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    other_income: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    other_expenses: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    net_income: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    net_margin: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    # Liquidity fields
    current_assets: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    quick_assets: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    cash_and_equivalents: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    current_liabilities: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    short_term_debt: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    current_ratio: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    quick_ratio: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    cash_ratio: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
    working_capital: Mapped[Decimal | None] = mapped_column(
        Numeric(19, 4),
        nullable=True,
    )
