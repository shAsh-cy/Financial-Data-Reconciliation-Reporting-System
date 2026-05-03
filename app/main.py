"""Application factory and entry point."""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes import api_router
from app.core.config import settings
from app.core.logging import setup_logging

logger = logging.getLogger(__name__)


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    setup_logging()

    app = FastAPI(
        title="Financial Data Reconciliation & Reporting System",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(
        request: Request,
        exc: SQLAlchemyError,
    ) -> JSONResponse:
        """Return JSON (not plain text) so clients can show a useful message."""
        logger.exception(
            "Database error on %s %s",
            request.method,
            request.url.path,
        )
        return JSONResponse(
            status_code=503,
            content={
                "detail": (
                    "Database error. Ensure PostgreSQL is running, DATABASE_URL in .env matches your DB, "
                    "and migrations are applied (alembic upgrade head). "
                    "Then create a login user: python scripts/create_user.py --email you@example.com --password ... --role admin"
                ),
            },
        )

    @app.get("/")
    def root() -> dict[str, str]:
        """Root URL: API only. Use the frontend app for the web UI."""
        return {
            "service": app.title,
            "version": app.version,
            "docs": "/docs",
            "health": f"{settings.API_V1_PREFIX}/health",
            "note": "This is the JSON API. Run `npm run dev` in /frontend for the dashboard UI.",
        }

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    return app


app = create_application()
