"""API route modules."""

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.reporting import router as reporting_router
from app.api.routes.transactions import router as transactions_router

api_router = APIRouter()


@api_router.get("/health")
def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(transactions_router)
api_router.include_router(reporting_router)
