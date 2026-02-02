"""API route modules."""

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router

api_router = APIRouter()


@api_router.get("/health")
def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


api_router.include_router(auth_router)
