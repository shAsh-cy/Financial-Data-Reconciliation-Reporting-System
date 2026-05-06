"""Reporting list/overview orchestration: repository reads, demo fallback, DB error mapping."""

from __future__ import annotations

import logging
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories import reporting_queries as rq
from app.schemas.reporting import (
    FinancialReportListResponse,
    FinancialReportRead,
    ReconciliationRunListResponse,
    ReconciliationRunRead,
    ReportsOverviewResponse,
    ReportSummaryMetrics,
    ReportTimeSeriesPoint,
)
from app.services.reporting_demo import demo_financial_reports, demo_reconciliation_runs
from app.services.reporting_mappers import financial_report_from_orm, reconciliation_run_from_orm

logger = logging.getLogger(__name__)


def _database_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "Database unavailable. Ensure PostgreSQL is running, DATABASE_URL is correct, "
            "and migrations are applied (alembic upgrade head)."
        ),
    )


def _demo_meta(is_demo: bool) -> dict[str, object]:
    return {"is_demo": True} if is_demo else {}


def _reconciliation_rows_to_read(rows: list) -> list[ReconciliationRunRead]:
    items: list[ReconciliationRunRead] = []
    for r in rows:
        try:
            items.append(reconciliation_run_from_orm(r))
        except Exception:
            logger.exception(
                "Skipping unmappable ReconciliationRun row id=%s",
                getattr(r, "id", None),
            )
    return items


def _financial_report_rows_to_read(rows: list) -> list[FinancialReportRead]:
    items: list[FinancialReportRead] = []
    for r in rows:
        try:
            items.append(financial_report_from_orm(r))
        except Exception:
            logger.exception(
                "Skipping unmappable FinancialReport row id=%s",
                getattr(r, "id", None),
            )
    return items


def _empty_reconciliation_response() -> ReconciliationRunListResponse:
    return ReconciliationRunListResponse(items=[], total=0, meta={})


def _empty_financial_reports_response() -> FinancialReportListResponse:
    return FinancialReportListResponse(items=[], total=0, meta={})


def _reconciliation_list_on_query_failure(
    *,
    limit: int,
    offset: int,
) -> ReconciliationRunListResponse:
    if settings.REPORTING_DEMO_FALLBACK:
        demos = demo_reconciliation_runs()
        return ReconciliationRunListResponse(
            items=demos[offset : offset + limit],
            total=len(demos),
            meta=_demo_meta(True),
        )
    return _empty_reconciliation_response()


def _financial_reports_list_on_query_failure(
    *,
    report_type: str | None,
    limit: int,
    offset: int,
) -> FinancialReportListResponse:
    if settings.REPORTING_DEMO_FALLBACK:
        demos = demo_financial_reports()
        if report_type is not None:
            demos = [r for r in demos if r.report_type == report_type]
        return FinancialReportListResponse(
            items=demos[offset : offset + limit],
            total=len(demos),
            meta=_demo_meta(True),
        )
    return _empty_financial_reports_response()


def _expenses_total(r: FinancialReportRead) -> Decimal:
    cogs = r.cost_of_goods_sold or Decimal(0)
    opex = r.operating_expenses or Decimal(0)
    other = r.other_expenses or Decimal(0)
    return cogs + opex + other


def build_reports_overview(
    reads: list[FinancialReportRead],
    *,
    total_report_count: int,
    is_demo: bool,
) -> ReportsOverviewResponse:
    pnl_ok = [r for r in reads if r.report_type == "pnl" and r.status == "succeeded"]
    pnl_latest_first = sorted(pnl_ok, key=lambda r: r.period_end, reverse=True)
    latest_pnl = pnl_latest_first[0] if pnl_latest_first else None

    liq_ok = [r for r in reads if r.report_type == "liquidity" and r.status == "succeeded"]
    liq_latest_first = sorted(liq_ok, key=lambda r: r.period_end, reverse=True)
    latest_liq = liq_latest_first[0] if liq_latest_first else None

    summary = ReportSummaryMetrics(
        total_revenue=latest_pnl.revenue if latest_pnl else None,
        total_expenses=_expenses_total(latest_pnl) if latest_pnl else None,
        net_profit=latest_pnl.net_income if latest_pnl else None,
        liquidity_ratio=latest_liq.current_ratio if latest_liq else None,
    )

    for_chart = sorted(pnl_ok, key=lambda r: r.period_end)
    time_series = [
        ReportTimeSeriesPoint(
            period_end=r.period_end,
            revenue=r.revenue,
            expenses=_expenses_total(r),
            net_income=r.net_income,
        )
        for r in for_chart
    ]

    table_items = sorted(reads, key=lambda r: (r.period_end, r.report_type), reverse=True)[
        :50
    ]

    return ReportsOverviewResponse(
        summary=summary,
        time_series=time_series,
        items=table_items,
        total_report_count=total_report_count,
        meta=_demo_meta(is_demo),
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
    except SQLAlchemyError as exc:
        logger.warning("Reconciliation list query failed: %s", exc, exc_info=True)
        return _reconciliation_list_on_query_failure(limit=limit, offset=offset)

    if total == 0 and settings.REPORTING_DEMO_FALLBACK:
        demos = demo_reconciliation_runs()
        return ReconciliationRunListResponse(
            items=demos[offset : offset + limit],
            total=len(demos),
            meta=_demo_meta(True),
        )

    if total == 0:
        return _empty_reconciliation_response()

    return ReconciliationRunListResponse(
        items=_reconciliation_rows_to_read(rows),
        total=total,
        meta=_demo_meta(False),
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
    except SQLAlchemyError as exc:
        logger.warning("Financial reports list query failed: %s", exc, exc_info=True)
        return _financial_reports_list_on_query_failure(
            report_type=report_type,
            limit=limit,
            offset=offset,
        )

    if total == 0 and settings.REPORTING_DEMO_FALLBACK:
        demos = demo_financial_reports()
        if report_type is not None:
            demos = [r for r in demos if r.report_type == report_type]
        return FinancialReportListResponse(
            items=demos[offset : offset + limit],
            total=len(demos),
            meta=_demo_meta(True),
        )

    if total == 0:
        return _empty_financial_reports_response()

    return FinancialReportListResponse(
        items=_financial_report_rows_to_read(rows),
        total=total,
        meta=_demo_meta(False),
    )


async def get_reports_overview(session: AsyncSession) -> ReportsOverviewResponse:
    try:
        total = await rq.count_financial_reports(session, None)
        rows = await rq.list_recent_financial_reports(session, limit=120)
    except OperationalError:
        logger.exception("OperationalError loading reports overview")
        raise _database_unavailable() from None
    except SQLAlchemyError as exc:
        logger.warning("Reports overview query failed: %s", exc, exc_info=True)
        if settings.REPORTING_DEMO_FALLBACK:
            demos = demo_financial_reports()
            return build_reports_overview(
                demos,
                total_report_count=len(demos),
                is_demo=True,
            )
        return build_reports_overview([], total_report_count=0, is_demo=False)

    if total == 0 and settings.REPORTING_DEMO_FALLBACK:
        demos = demo_financial_reports()
        return build_reports_overview(
            demos,
            total_report_count=len(demos),
            is_demo=True,
        )

    if total == 0:
        return build_reports_overview([], total_report_count=0, is_demo=False)

    reads = _financial_report_rows_to_read(rows)
    return build_reports_overview(
        reads,
        total_report_count=total,
        is_demo=False,
    )
