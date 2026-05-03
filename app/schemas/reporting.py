"""Schemas for reporting and reconciliation APIs."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ReconciliationRunRead(BaseModel):
    id: UUID
    left_ledger_id: UUID
    right_ledger_id: UUID
    status: str
    started_at: datetime | None
    finished_at: datetime | None
    matched_count: int
    unmatched_left_count: int
    unmatched_right_count: int
    error_message: str | None

    model_config = ConfigDict(from_attributes=True)


class ReconciliationItemRead(BaseModel):
    id: UUID
    run_id: UUID
    left_transaction_id: UUID | None
    right_transaction_id: UUID | None
    match_type: str

    model_config = ConfigDict(from_attributes=True)


class FinancialReportRead(BaseModel):
    id: UUID
    report_type: str
    status: str
    period_start: date | None
    period_end: date
    started_at: datetime | None
    finished_at: datetime | None
    error_message: str | None
    revenue: Decimal | None
    cost_of_goods_sold: Decimal | None
    gross_profit: Decimal | None
    operating_expenses: Decimal | None
    operating_income: Decimal | None
    other_income: Decimal | None
    other_expenses: Decimal | None
    net_income: Decimal | None
    net_margin: Decimal | None
    current_assets: Decimal | None
    quick_assets: Decimal | None
    cash_and_equivalents: Decimal | None
    current_liabilities: Decimal | None
    short_term_debt: Decimal | None
    current_ratio: Decimal | None
    quick_ratio: Decimal | None
    cash_ratio: Decimal | None
    working_capital: Decimal | None

    model_config = ConfigDict(from_attributes=True)


class ReconciliationRunListResponse(BaseModel):
    """Paginated reconciliation runs (empty DB is items=[], total=0)."""

    model_config = ConfigDict(extra="forbid")

    items: list[ReconciliationRunRead]
    total: int
    is_demo: bool = False


class FinancialReportListResponse(BaseModel):
    """Paginated financial reports (empty DB is items=[], total=0)."""

    model_config = ConfigDict(extra="forbid")

    items: list[FinancialReportRead]
    total: int
    is_demo: bool = False

