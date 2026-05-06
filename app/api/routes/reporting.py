"""Reporting and reconciliation read APIs."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import DbSession, require_roles
from app.models.user import UserRole
from app.schemas import (
    FinancialReportDetailEnvelope,
    FinancialReportListResponse,
    ReconciliationItemListResponse,
    ReconciliationRunDetailEnvelope,
    ReconciliationRunListResponse,
    ReportsOverviewResponse,
)
from app.services.reconciliation_service import ReconciliationService
from app.services.report_service import ReportService
from app.services import reporting_read_service

router = APIRouter(prefix="/reporting", tags=["reporting"])

# Top-level aliases: /api/v1/reconciliations, /api/v1/reports, /api/v1/reports/overview, etc.
top_level_reporting_router = APIRouter(tags=["reporting"])


@router.get(
    "/reconciliations",
    response_model=ReconciliationRunListResponse,
)
async def list_reconciliation_runs_reporting(
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


@top_level_reporting_router.get(
    "/reconciliations",
    response_model=ReconciliationRunListResponse,
)
async def list_reconciliation_runs_root(
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> ReconciliationRunListResponse:
    """List reconciliation runs (top-level alias)."""
    return await reporting_read_service.list_reconciliation_runs(
        session,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/reports",
    response_model=FinancialReportListResponse,
)
async def list_financial_reports_reporting(
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


@top_level_reporting_router.get(
    "/reports",
    response_model=FinancialReportListResponse,
)
async def list_financial_reports_root(
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
    report_type: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> FinancialReportListResponse:
    """List financial reports (top-level alias)."""
    return await reporting_read_service.list_financial_reports(
        session,
        report_type=report_type,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/reports/overview",
    response_model=ReportsOverviewResponse,
)
async def reports_overview_reporting(
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
) -> ReportsOverviewResponse:
    """Summary metrics, PnL time series, and recent report jobs."""
    return await reporting_read_service.get_reports_overview(session)


@top_level_reporting_router.get(
    "/reports/overview",
    response_model=ReportsOverviewResponse,
)
async def reports_overview_root(
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
) -> ReportsOverviewResponse:
    """Reports overview (top-level alias)."""
    return await reporting_read_service.get_reports_overview(session)


@router.get(
    "/reconciliations/{run_id}",
    response_model=ReconciliationRunDetailEnvelope,
)
async def get_reconciliation_run_reporting(
    run_id: UUID,
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
) -> ReconciliationRunDetailEnvelope:
    """Get a single reconciliation run by ID."""
    payload = await ReconciliationService.get_run_detail(session, run_id)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return payload


@top_level_reporting_router.get(
    "/reconciliations/{run_id}",
    response_model=ReconciliationRunDetailEnvelope,
)
async def get_reconciliation_run_root(
    run_id: UUID,
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
) -> ReconciliationRunDetailEnvelope:
    """Get a single reconciliation run (top-level alias)."""
    payload = await ReconciliationService.get_run_detail(session, run_id)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return payload


@router.get(
    "/reconciliations/{run_id}/items",
    response_model=ReconciliationItemListResponse,
)
async def list_reconciliation_items_reporting(
    run_id: UUID,
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> ReconciliationItemListResponse:
    """List reconciliation items for a run with pagination."""
    payload = await ReconciliationService.list_items(
        session,
        run_id=run_id,
        limit=limit,
        offset=offset,
    )
    if payload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return payload


@top_level_reporting_router.get(
    "/reconciliations/{run_id}/items",
    response_model=ReconciliationItemListResponse,
)
async def list_reconciliation_items_root(
    run_id: UUID,
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
) -> ReconciliationItemListResponse:
    """List reconciliation items (top-level alias)."""
    payload = await ReconciliationService.list_items(
        session,
        run_id=run_id,
        limit=limit,
        offset=offset,
    )
    if payload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return payload


@router.get(
    "/reports/{report_id}",
    response_model=FinancialReportDetailEnvelope,
)
async def get_financial_report_reporting(
    report_id: UUID,
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
) -> FinancialReportDetailEnvelope:
    """Get a single financial report by ID."""
    payload = await ReportService.get_report_detail(session, report_id)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return payload


@top_level_reporting_router.get(
    "/reports/{report_id}",
    response_model=FinancialReportDetailEnvelope,
)
async def get_financial_report_root(
    report_id: UUID,
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
) -> FinancialReportDetailEnvelope:
    """Get a single financial report (top-level alias)."""
    payload = await ReportService.get_report_detail(session, report_id)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return payload
