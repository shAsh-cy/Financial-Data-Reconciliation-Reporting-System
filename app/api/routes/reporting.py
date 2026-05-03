"""Reporting and reconciliation read APIs."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import DbSession, require_roles
from app.models import FinancialReport, ReconciliationItem, ReconciliationRun
from app.models.user import UserRole
from app.schemas import (
    FinancialReportListResponse,
    FinancialReportRead,
    ReconciliationItemRead,
    ReconciliationRunListResponse,
    ReconciliationRunRead,
)
from app.services import reporting_read_service

router = APIRouter(prefix="/reporting", tags=["reporting"])

# Top-level aliases: GET /api/v1/reconciliations, GET /api/v1/reports
top_level_list_router = APIRouter(tags=["reporting"])


@router.get(
    "/reconciliations",
    response_model=ReconciliationRunListResponse,
)
@top_level_list_router.get(
    "/reconciliations",
    response_model=ReconciliationRunListResponse,
)
async def list_reconciliation_runs(
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> ReconciliationRunListResponse:
    """List reconciliation runs with pagination metadata."""
    return await reporting_read_service.list_reconciliation_runs(
        session,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/reports",
    response_model=FinancialReportListResponse,
)
@top_level_list_router.get(
    "/reports",
    response_model=FinancialReportListResponse,
)
async def list_financial_reports(
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
    report_type: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> FinancialReportListResponse:
    """List financial reports with pagination metadata."""
    return await reporting_read_service.list_financial_reports(
        session,
        report_type=report_type,
        limit=limit,
        offset=offset,
    )


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return FinancialReportRead.model_validate(report)
