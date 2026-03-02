"""Reporting and reconciliation read APIs."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select

from app.api.deps import DbSession, require_roles
from app.models import FinancialReport, ReconciliationItem, ReconciliationRun, ReportType
from app.models.user import UserRole
from app.schemas import (
    FinancialReportRead,
    ReconciliationItemRead,
    ReconciliationRunRead,
)


router = APIRouter(prefix="/reporting", tags=["reporting"])


@router.get(
    "/reconciliations",
    response_model=list[ReconciliationRunRead],
)
async def list_reconciliation_runs(
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[ReconciliationRunRead]:
    """List reconciliation runs with basic pagination."""
    stmt = (
        select(ReconciliationRun)
        .order_by(desc(ReconciliationRun.started_at.nullslast()))
        .limit(limit)
        .offset(offset)
    )
    result = await session.execute(stmt)
    runs = result.scalars().all()
    return [ReconciliationRunRead.model_validate(run) for run in runs]


@router.get(
    "/reconciliations/{run_id}",
    response_model=ReconciliationRunRead,
)
async def get_reconciliation_run(
    run_id: UUID,
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
) -> ReconciliationRunRead:
    """Get a single reconciliation run by ID."""
    stmt = select(ReconciliationRun).where(ReconciliationRun.id == run_id)
    result = await session.execute(stmt)
    run = result.scalar_one_or_none()
    if run is None:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return ReconciliationRunRead.model_validate(run)


@router.get(
    "/reconciliations/{run_id}/items",
    response_model=list[ReconciliationItemRead],
)
async def list_reconciliation_items(
    run_id: UUID,
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> list[ReconciliationItemRead]:
    """List reconciliation items for a run with pagination."""
    stmt = (
        select(ReconciliationItem)
        .where(ReconciliationItem.run_id == run_id)
        .order_by(ReconciliationItem.id)
        .limit(limit)
        .offset(offset)
    )
    result = await session.execute(stmt)
    items = result.scalars().all()
    return [ReconciliationItemRead.model_validate(item) for item in items]


@router.get(
    "/reports",
    response_model=list[FinancialReportRead],
)
async def list_financial_reports(
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
    report_type: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[FinancialReportRead]:
    """List financial reports (P&L and liquidity)."""
    stmt = select(FinancialReport)
    if report_type is not None:
        stmt = stmt.where(FinancialReport.report_type == report_type)
    stmt = stmt.order_by(desc(FinancialReport.period_end)).limit(limit).offset(offset)
    result = await session.execute(stmt)
    reports = result.scalars().all()
    return [FinancialReportRead.model_validate(r) for r in reports]


@router.get(
    "/reports/{report_id}",
    response_model=FinancialReportRead,
)
async def get_financial_report(
    report_id: UUID,
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
) -> FinancialReportRead:
    """Get a single financial report by ID."""
    stmt = select(FinancialReport).where(FinancialReport.id == report_id)
    result = await session.execute(stmt)
    report = result.scalar_one_or_none()
    if report is None:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return FinancialReportRead.model_validate(report)

