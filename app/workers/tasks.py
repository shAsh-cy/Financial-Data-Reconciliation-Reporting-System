"""Celery task definitions. No business logic yet."""

from app.workers.celery_app import app


@app.task
def health_check() -> str:
    """Placeholder task to verify base infrastructure. No business logic."""
    return "ok"
