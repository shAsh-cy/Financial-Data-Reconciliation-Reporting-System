"""API route modules."""

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.ledgers import router as ledgers_router
from app.api.routes.reporting import router as reporting_router, top_level_reporting_router
from app.api.routes.transactions import router as transactions_router

api_router = APIRouter()


@api_router.get("/health")
def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(ledgers_router)
api_router.include_router(jobs_router)
api_router.include_router(transactions_router)
api_router.include_router(reporting_router)
api_router.include_router(top_level_reporting_router)
