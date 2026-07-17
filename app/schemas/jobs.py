"""Pydantic schemas for background job triggers and status polling."""

from datetime import date
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


JobStatusValue = Literal["queued", "running", "success", "failed"]


class ReconciliationJobRequest(BaseModel):
    """Trigger reconciliation between two ledgers."""

    left_ledger_id: UUID
    right_ledger_id: UUID


class PnlReportJobRequest(BaseModel):
    """Trigger P&L report generation for a ledger and period."""

    ledger_id: UUID
    period_start: date
    period_end: date


class LiquidityReportJobRequest(BaseModel):
    """Trigger liquidity report generation for a ledger as of period end."""

    ledger_id: UUID
    period_start: date
    period_end: date


class JobTriggerResponse(BaseModel):
    """Response when a background job is queued."""

    task_id: str
    status: Literal["queued"] = "queued"


class JobStatusResponse(BaseModel):
    """Celery task status polled by task id."""

    task_id: str
    status: JobStatusValue
    result: Any | None = None
    error: str | None = None
