"""Background job triggers and Celery task status polling."""

import json
from uuid import UUID

from celery.result import AsyncResult

from app.schemas.jobs import JobStatusResponse, JobStatusValue, JobTriggerResponse
from app.workers.celery_app import app as celery_app
from app.workers.tasks import (
    generate_liquidity_report,
    generate_pnl_report,
    run_reconciliation_for_ledgers,
)


def _map_celery_state(state: str) -> JobStatusValue:
    if state == "PENDING":
        return "queued"
    if state in {"STARTED", "RETRY", "RECEIVED"}:
        return "running"
    if state == "SUCCESS":
        return "success"
    if state in {"FAILURE", "REVOKED"}:
        return "failed"
    return "running"


def _pnl_config_json(ledger_id: UUID) -> str:
    config = {
        "revenue_ledgers": [str(ledger_id)],
        "cogs_ledgers": [],
        "operating_expense_ledgers": [],
        "other_income_ledgers": [],
        "other_expense_ledgers": [],
    }
    return json.dumps(config)


def _liquidity_config_json(ledger_id: UUID) -> str:
    ledger_key = str(ledger_id)
    config = {
        "current_asset_ledgers": [ledger_key],
        "quick_asset_ledgers": [ledger_key],
        "cash_ledgers": [ledger_key],
        "current_liability_ledgers": [],
        "short_term_debt_ledgers": [],
    }
    return json.dumps(config)


class JobService:
    """Thin wrappers around Celery task dispatch and AsyncResult polling."""

    @staticmethod
    def trigger_reconciliation(left_ledger_id: UUID, right_ledger_id: UUID) -> JobTriggerResponse:
        task = run_reconciliation_for_ledgers.delay(
            str(left_ledger_id),
            str(right_ledger_id),
        )
        return JobTriggerResponse(task_id=task.id)

    @staticmethod
    def trigger_pnl_report(ledger_id: UUID, period_start, period_end) -> JobTriggerResponse:
        task = generate_pnl_report.delay(
            _pnl_config_json(ledger_id),
            period_start.isoformat(),
            period_end.isoformat(),
        )
        return JobTriggerResponse(task_id=task.id)

    @staticmethod
    def trigger_liquidity_report(ledger_id: UUID, period_start, period_end) -> JobTriggerResponse:
        # Liquidity task uses as-of date; period_end is the balance-sheet date.
        _ = period_start
        task = generate_liquidity_report.delay(
            _liquidity_config_json(ledger_id),
            period_end.isoformat(),
        )
        return JobTriggerResponse(task_id=task.id)

    @staticmethod
    def get_task_status(task_id: str) -> JobStatusResponse:
        async_result = AsyncResult(task_id, app=celery_app)
        status = _map_celery_state(async_result.state)

        if status == "success":
            return JobStatusResponse(task_id=task_id, status=status, result=async_result.result)

        if status == "failed":
            error = str(async_result.result) if async_result.result is not None else "Task failed"
            return JobStatusResponse(task_id=task_id, status=status, error=error)

        return JobStatusResponse(task_id=task_id, status=status)
