"""Read queries for reporting list endpoints (no business rules)."""

from uuid import UUID

from sqlalchemy import asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FinancialReport, ReconciliationItem, ReconciliationRun


async def count_reconciliation_runs(session: AsyncSession) -> int:
    stmt = select(func.count()).select_from(ReconciliationRun)
    result = await session.execute(stmt)
    return int(result.scalar_one())


async def list_reconciliation_runs(
    session: AsyncSession,
    *,
    limit: int,
    offset: int,
) -> list[ReconciliationRun]:
    stmt = (
        select(ReconciliationRun)
        .order_by(desc(ReconciliationRun.started_at.nullslast()))
        .limit(limit)
        .offset(offset)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def count_financial_reports(
    session: AsyncSession,
    report_type: str | None,
) -> int:
    stmt = select(func.count()).select_from(FinancialReport)
    if report_type is not None:
        stmt = stmt.where(FinancialReport.report_type == report_type)
    result = await session.execute(stmt)
    return int(result.scalar_one())


async def list_financial_reports(
    session: AsyncSession,
    *,
    report_type: str | None,
    limit: int,
    offset: int,
) -> list[FinancialReport]:
    stmt = select(FinancialReport)
    if report_type is not None:
        stmt = stmt.where(FinancialReport.report_type == report_type)
    stmt = stmt.order_by(desc(FinancialReport.period_end)).limit(limit).offset(offset)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def list_recent_financial_reports(
    session: AsyncSession,
    *,
    limit: int,
) -> list[FinancialReport]:
    """Recent reports by period_end (for overview aggregation)."""
    stmt = (
        select(FinancialReport)
        .order_by(desc(FinancialReport.period_end))
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_reconciliation_run(
    session: AsyncSession,
    run_id: UUID,
) -> ReconciliationRun | None:
    stmt = select(ReconciliationRun).where(ReconciliationRun.id == run_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_financial_report(
    session: AsyncSession,
    report_id: UUID,
) -> FinancialReport | None:
    stmt = select(FinancialReport).where(FinancialReport.id == report_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_reconciliation_items(
    session: AsyncSession,
    *,
    run_id: UUID,
    limit: int,
    offset: int,
) -> list[ReconciliationItem]:
    stmt = (
        select(ReconciliationItem)
        .where(ReconciliationItem.run_id == run_id)
        .order_by(ReconciliationItem.id)
        .limit(limit)
        .offset(offset)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def count_reconciliation_items(session: AsyncSession, run_id: UUID) -> int:
    stmt = (
        select(func.count())
        .select_from(ReconciliationItem)
        .where(ReconciliationItem.run_id == run_id)
    )
    result = await session.execute(stmt)
    return int(result.scalar_one())


async def count_reconciliation_items_by_match_type(
    session: AsyncSession,
    run_id: UUID,
) -> dict[str, int]:
    stmt = (
        select(ReconciliationItem.match_type, func.count())
        .where(ReconciliationItem.run_id == run_id)
        .group_by(ReconciliationItem.match_type)
    )
    result = await session.execute(stmt)
    return {str(match): int(cnt) for match, cnt in result.all()}


async def list_succeeded_pnl_reports_asc(
    session: AsyncSession,
    *,
    limit: int,
) -> list[FinancialReport]:
    stmt = (
        select(FinancialReport)
        .where(
            FinancialReport.report_type == "pnl",
            FinancialReport.status == "succeeded",
        )
        .order_by(asc(FinancialReport.period_end))
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def list_reconciliation_runs_chronological(
    session: AsyncSession,
    *,
    limit: int,
) -> list[ReconciliationRun]:
    stmt = (
        select(ReconciliationRun)
        .order_by(
            asc(ReconciliationRun.finished_at).nullsfirst(),
            asc(ReconciliationRun.created_at),
        )
        .limit(limit)
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())
