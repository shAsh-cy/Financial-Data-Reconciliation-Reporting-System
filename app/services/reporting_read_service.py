"""Reporting list orchestration: repository reads, demo fallback, DB error mapping."""

from __future__ import annotations

import logging
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories import reporting_queries as rq
from app.schemas.reporting import (
    FinancialReportListResponse,
    FinancialReportRead,
    ReconciliationRunListResponse,
    ReconciliationRunRead,
)

logger = logging.getLogger(__name__)

_DEMO_NS = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


def _demo_reconciliation_runs() -> list[ReconciliationRunRead]:
    rid = uuid.uuid5(_DEMO_NS, "reconciliation-run-demo-1")
    return [
        ReconciliationRunRead(
            id=rid,
            left_ledger_id=uuid.uuid5(_DEMO_NS, "ledger-left"),
            right_ledger_id=uuid.uuid5(_DEMO_NS, "ledger-right"),
            status="succeeded",
            started_at=datetime(2026, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
            finished_at=datetime(2026, 1, 15, 10, 2, 30, tzinfo=timezone.utc),
            matched_count=128,
            unmatched_left_count=3,
            unmatched_right_count=2,
            error_message=None,
        ),
    ]


def _demo_financial_reports() -> list[FinancialReportRead]:
    pnl_id = uuid.uuid5(_DEMO_NS, "report-pnl-demo")
    liq_id = uuid.uuid5(_DEMO_NS, "report-liquidity-demo")
    return [
        FinancialReportRead(
            id=pnl_id,
            report_type="pnl",
            status="succeeded",
            period_start=date(2026, 1, 1),
            period_end=date(2026, 1, 31),
            started_at=datetime(2026, 2, 1, 9, 0, 0, tzinfo=timezone.utc),
            finished_at=datetime(2026, 2, 1, 9, 0, 5, tzinfo=timezone.utc),
            error_message=None,
            revenue=Decimal("485000.0000"),
            cost_of_goods_sold=Decimal("192000.0000"),
            gross_profit=Decimal("293000.0000"),
            operating_expenses=Decimal("118500.0000"),
            operating_income=Decimal("174500.0000"),
            other_income=Decimal("2500.0000"),
            other_expenses=Decimal("8200.0000"),
            net_income=Decimal("168800.0000"),
            net_margin=Decimal("0.3480"),
            current_assets=None,
            quick_assets=None,
            cash_and_equivalents=None,
            current_liabilities=None,
            short_term_debt=None,
            current_ratio=None,
            quick_ratio=None,
            cash_ratio=None,
            working_capital=None,
        ),
        FinancialReportRead(
            id=liq_id,
            report_type="liquidity",
            status="succeeded",
            period_start=None,
            period_end=date(2026, 1, 31),
            started_at=datetime(2026, 2, 1, 9, 5, 0, tzinfo=timezone.utc),
            finished_at=datetime(2026, 2, 1, 9, 5, 4, tzinfo=timezone.utc),
            error_message=None,
            revenue=None,
            cost_of_goods_sold=None,
            gross_profit=None,
            operating_expenses=None,
            operating_income=None,
            other_income=None,
            other_expenses=None,
            net_income=None,
            net_margin=None,
            current_assets=Decimal("210000.0000"),
            quick_assets=Decimal("165000.0000"),
            cash_and_equivalents=Decimal("72000.0000"),
            current_liabilities=Decimal("95000.0000"),
            short_term_debt=Decimal("12000.0000"),
            current_ratio=Decimal("2.2105"),
            quick_ratio=Decimal("1.7368"),
            cash_ratio=Decimal("0.7579"),
            working_capital=Decimal("115000.0000"),
        ),
    ]


def _database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "Database unavailable. Ensure PostgreSQL is running, DATABASE_URL is correct, "
            "and migrations are applied (alembic upgrade head)."
        ),
    )


async def list_reconciliation_runs(
    session: AsyncSession,
    *,
    limit: int,
    offset: int,
) -> ReconciliationRunListResponse:
    try:
        total = await rq.count_reconciliation_runs(session)
        rows = await rq.list_reconciliation_runs(session, limit=limit, offset=offset)
    except OperationalError:
        logger.exception("OperationalError listing reconciliation runs")
        raise _database_unavailable() from None

    if total == 0 and settings.REPORTING_DEMO_FALLBACK:
        demos = _demo_reconciliation_runs()
        return ReconciliationRunListResponse(
            items=demos[offset : offset + limit],
            total=len(demos),
            is_demo=True,
        )

    return ReconciliationRunListResponse(
        items=[ReconciliationRunRead.model_validate(r) for r in rows],
        total=total,
        is_demo=False,
    )


async def list_financial_reports(
    session: AsyncSession,
    *,
    report_type: str | None,
    limit: int,
    offset: int,
) -> FinancialReportListResponse:
    try:
        total = await rq.count_financial_reports(session, report_type)
        rows = await rq.list_financial_reports(
            session,
            report_type=report_type,
            limit=limit,
            offset=offset,
        )
    except OperationalError:
        logger.exception("OperationalError listing financial reports")
        raise _database_unavailable() from None

    if total == 0 and settings.REPORTING_DEMO_FALLBACK:
        demos = _demo_financial_reports()
        if report_type is not None:
            demos = [r for r in demos if r.report_type == report_type]
        return FinancialReportListResponse(
            items=demos[offset : offset + limit],
            total=len(demos),
            is_demo=True,
        )

    return FinancialReportListResponse(
        items=[FinancialReportRead.model_validate(r) for r in rows],
        total=total,
        is_demo=False,
    )
