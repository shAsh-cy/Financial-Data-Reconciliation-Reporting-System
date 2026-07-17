"""Background job trigger and status API routes."""

from fastapi import APIRouter, Depends, status

from app.api.deps import require_roles
from app.models.user import UserRole
from app.schemas.jobs import (
    JobStatusResponse,
    JobTriggerResponse,
    LiquidityReportJobRequest,
    PnlReportJobRequest,
    ReconciliationJobRequest,
)
from app.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post(
    "/reconciliation",
    response_model=JobTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_reconciliation_job(
    payload: ReconciliationJobRequest,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT)),
) -> JobTriggerResponse:
    """Queue a reconciliation run between two ledgers."""
    return JobService.trigger_reconciliation(payload.left_ledger_id, payload.right_ledger_id)


@router.post(
    "/reports/pnl",
    response_model=JobTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_pnl_report_job(
    payload: PnlReportJobRequest,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT)),
) -> JobTriggerResponse:
    """Queue P&L report generation for a ledger and period."""
    return JobService.trigger_pnl_report(
        payload.ledger_id,
        payload.period_start,
        payload.period_end,
    )


@router.post(
    "/reports/liquidity",
    response_model=JobTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_liquidity_report_job(
    payload: LiquidityReportJobRequest,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT)),
) -> JobTriggerResponse:
    """Queue liquidity report generation for a ledger."""
    return JobService.trigger_liquidity_report(
        payload.ledger_id,
        payload.period_start,
        payload.period_end,
    )


@router.get("/{task_id}", response_model=JobStatusResponse)
async def get_job_status(
    task_id: str,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
) -> JobStatusResponse:
    """Poll Celery task status by task id."""
    return JobService.get_task_status(task_id)
