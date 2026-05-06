"""Schemas for reporting and reconciliation APIs."""

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field


class ReconciliationRunRead(BaseModel):
    id: UUID
    left_ledger_id: UUID
    right_ledger_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None
    finished_at: datetime | None
    matched_count: int
    unmatched_left_count: int
    unmatched_right_count: int
    error_message: str | None

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    def unmatched_count(self) -> int:
        return self.unmatched_left_count + self.unmatched_right_count


class ReconciliationItemRead(BaseModel):
    id: UUID
    run_id: UUID
    left_transaction_id: UUID | None
    right_transaction_id: UUID | None
    match_type: str
    #: Present for demo/synthetic rows; optional when not stored in DB.
    amount: Decimal | None = None

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    def match_status(self) -> Literal["matched", "unmatched"]:
        return "matched" if self.match_type == "matched" else "unmatched"


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
    meta: dict[str, Any] = Field(default_factory=dict)


class FinancialReportListResponse(BaseModel):
    """Paginated financial reports (empty DB is items=[], total=0)."""

    model_config = ConfigDict(extra="forbid")

    items: list[FinancialReportRead]
    total: int
    meta: dict[str, Any] = Field(default_factory=dict)


class ReportStatementLine(BaseModel):
    """Structured P&L / liquidity line (no plaintext blob)."""

    model_config = ConfigDict(extra="forbid")

    label: str
    amount: Decimal | None = None
    line_kind: Literal["revenue", "expense", "subtotal", "metric", "ratio"] = "metric"


class ReportDetailSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    snapshot: FinancialReportRead
    total_expenses: Decimal | None = None
    gross_margin_pct: Decimal | None = None
    net_margin_pct: Decimal | None = None
    statement_lines: list[ReportStatementLine] = Field(default_factory=list)
    quick_insights: list[str] = Field(default_factory=list)


class ReportDetailTimeseriesPoint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    period_end: date
    revenue: Decimal | None = None
    expenses: Decimal | None = None
    net_income: Decimal | None = None
    cashflow: Decimal | None = None


class ReportBreakdownSlice(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    amount: Decimal | None = None
    segment: Literal["revenue", "expense", "liquidity"] = "expense"


class ReportDetailPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: ReportDetailSummary
    timeseries: list[ReportDetailTimeseriesPoint] = Field(default_factory=list)
    breakdown: list[ReportBreakdownSlice] = Field(default_factory=list)


class ReconciliationDetailSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    run: ReconciliationRunRead
    matched_lines: int
    unmatched_lines: int
    mismatch_rate_pct: Decimal | None = None
    by_match_type: dict[str, int] = Field(default_factory=dict)
    quick_insights: list[str] = Field(default_factory=list)


class ReconciliationDetailTimeseriesPoint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    run_id: UUID
    period_label: str
    matched_count: int
    unmatched_count: int
    status: str


class ReconciliationBreakdownSlice(BaseModel):
    model_config = ConfigDict(extra="forbid")

    match_type: str
    count: int


class ReconciliationDetailPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: ReconciliationDetailSummary
    timeseries: list[ReconciliationDetailTimeseriesPoint] = Field(default_factory=list)
    breakdown: list[ReconciliationBreakdownSlice] = Field(default_factory=list)


class ReconciliationRunDetailEnvelope(BaseModel):
    """Single reconciliation run (detail contract: nested summary/timeseries/breakdown)."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    data: ReconciliationDetailPayload
    meta: dict[str, Any] = Field(default_factory=dict)


class FinancialReportDetailEnvelope(BaseModel):
    """Single financial report (detail contract: nested summary/timeseries/breakdown)."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    data: ReportDetailPayload
    meta: dict[str, Any] = Field(default_factory=dict)


class ReconciliationItemListResponse(BaseModel):
    """Paginated reconciliation items for a run."""

    model_config = ConfigDict(extra="forbid")

    items: list[ReconciliationItemRead]
    total: int
    meta: dict[str, Any] = Field(default_factory=dict)


class ReportSummaryMetrics(BaseModel):
    """Latest-period headline figures derived from stored reports."""

    model_config = ConfigDict(extra="forbid")

    total_revenue: Decimal | None = None
    total_expenses: Decimal | None = None
    net_profit: Decimal | None = None
    liquidity_ratio: Decimal | None = None


class ReportTimeSeriesPoint(BaseModel):
    """One period for PnL trend charts."""

    model_config = ConfigDict(extra="forbid")

    period_end: date
    revenue: Decimal | None = None
    expenses: Decimal | None = None
    net_income: Decimal | None = None


class ReportsOverviewResponse(BaseModel):
    """Dashboard-oriented bundle: summary, trend series, and recent report jobs."""

    model_config = ConfigDict(extra="forbid")

    summary: ReportSummaryMetrics
    time_series: list[ReportTimeSeriesPoint]
    items: list[FinancialReportRead]
    total_report_count: int
    meta: dict[str, Any] = Field(default_factory=dict)

