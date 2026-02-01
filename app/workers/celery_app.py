"""Celery application configured from environment variables."""

from celery import Celery

from app.core.config import settings

celery_config = settings.celery

app = Celery(
    "financial_reconciliation",
    broker=celery_config.BROKER_URL,
    backend=celery_config.RESULT_BACKEND,
    include=["app.workers.tasks"],
)

app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)
