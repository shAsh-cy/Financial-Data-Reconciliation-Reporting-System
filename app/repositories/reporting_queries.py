"""Read queries for reporting list endpoints (no business rules)."""

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FinancialReport, ReconciliationRun


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
