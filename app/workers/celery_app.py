"""Celery application configured from environment variables."""

from celery import Celery
from celery.signals import worker_process_init

from app.core.config import settings
from app.core.logging import setup_logging
from app.workers.base import BaseTask

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

app.Task = BaseTask


@worker_process_init.connect
def _init_worker_logging(**kwargs: object) -> None:
    """Configure structured logging when worker process starts."""
    setup_logging()
