"""Application factory and entry point."""

from fastapi import FastAPI

from app.api.routes import api_router
from app.core.config import settings
from app.core.logging import setup_logging


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    setup_logging()

    app = FastAPI(
        title="Financial Data Reconciliation & Reporting System",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    return app


app = create_application()
