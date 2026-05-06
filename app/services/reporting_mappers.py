"""ORM → read-model mapping with safe coercion (avoids silent validation failures)."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from app.models import FinancialReport, ReconciliationItem, ReconciliationRun
from app.schemas.reporting import (
    FinancialReportRead,
    ReconciliationItemRead,
    ReconciliationRunRead,
)


def _dec(value: object | None) -> Decimal | None:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _dt(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def reconciliation_run_from_orm(row: ReconciliationRun) -> ReconciliationRunRead:
    return ReconciliationRunRead(
        id=row.id,
        left_ledger_id=row.left_ledger_id,
        right_ledger_id=row.right_ledger_id,
        status=str(row.status),
        created_at=_dt(row.created_at),  # type: ignore[arg-type]
        updated_at=_dt(row.updated_at),  # type: ignore[arg-type]
        started_at=_dt(row.started_at),
        finished_at=_dt(row.finished_at),
        matched_count=int(row.matched_count),
        unmatched_left_count=int(row.unmatched_left_count),
        unmatched_right_count=int(row.unmatched_right_count),
        error_message=row.error_message,
    )


def reconciliation_item_from_orm(row: ReconciliationItem) -> ReconciliationItemRead:
    return ReconciliationItemRead(
        id=row.id,
        run_id=row.run_id,
        left_transaction_id=row.left_transaction_id,
        right_transaction_id=row.right_transaction_id,
        match_type=str(row.match_type),
        amount=None,
    )


def financial_report_from_orm(row: FinancialReport) -> FinancialReportRead:
    return FinancialReportRead(
        id=row.id,
        report_type=str(row.report_type),
        status=str(row.status),
        period_start=row.period_start,
        period_end=row.period_end,
        started_at=_dt(row.started_at),
        finished_at=_dt(row.finished_at),
        error_message=row.error_message,
        revenue=_dec(row.revenue),
        cost_of_goods_sold=_dec(row.cost_of_goods_sold),
        gross_profit=_dec(row.gross_profit),
        operating_expenses=_dec(row.operating_expenses),
        operating_income=_dec(row.operating_income),
        other_income=_dec(row.other_income),
        other_expenses=_dec(row.other_expenses),
        net_income=_dec(row.net_income),
        net_margin=_dec(row.net_margin),
        current_assets=_dec(row.current_assets),
        quick_assets=_dec(row.quick_assets),
        cash_and_equivalents=_dec(row.cash_and_equivalents),
        current_liabilities=_dec(row.current_liabilities),
        short_term_debt=_dec(row.short_term_debt),
        current_ratio=_dec(row.current_ratio),
        quick_ratio=_dec(row.quick_ratio),
        cash_ratio=_dec(row.cash_ratio),
        working_capital=_dec(row.working_capital),
    )
