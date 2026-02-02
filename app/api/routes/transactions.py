"""Transaction ingestion API routes."""

from fastapi import APIRouter, Depends, status

from app.api.deps import require_roles
from app.models.user import UserRole
from app.schemas import TransactionIngestRequest
from app.workers.tasks import ingest_transactions_batch


router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post(
    "/ingest",
    status_code=status.HTTP_202_ACCEPTED,
)
async def ingest_transactions(
    payload: TransactionIngestRequest,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT)),
) -> dict[str, str]:
    """
    Enqueue background ingestion of financial transactions for a ledger.

    - Input is validated by Pydantic schemas.
    - Background work is handled by a Celery task; this route only submits the job.
    - No reconciliation logic is performed here.
    """
    task = ingest_transactions_batch.delay(payload.model_dump(mode="json"))
    return {"task_id": task.id}

