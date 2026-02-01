"""Base Celery task with shared error handling, logging, and retry strategy."""

import logging
from typing import Any

from celery import Task

from app.core.config import settings

logger = logging.getLogger(__name__)

_celery_config = settings.celery


class BaseTask(Task):
    """Base task with centralized error handling, structured logging, and retry."""

    autoretry_for = (Exception,)
    retry_backoff = _celery_config.TASK_RETRY_BACKOFF
    retry_backoff_max = _celery_config.TASK_RETRY_BACKOFF_MAX
    retry_jitter = True
    max_retries = _celery_config.TASK_MAX_RETRIES
    default_retry_delay = _celery_config.TASK_DEFAULT_RETRY_DELAY

    def before_start(self, task_id: str, args: tuple, kwargs: dict[str, Any]) -> None:
        """Log task start."""
        logger.info(
            "Task started",
            extra={
                "task_id": task_id,
                "task_name": self.name,
                "args_count": len(args),
                "kwargs_keys": list(kwargs.keys()),
            },
        )

    def on_success(
        self,
        retval: Any,
        task_id: str,
        args: tuple,
        kwargs: dict[str, Any],
    ) -> None:
        """Log task success."""
        logger.info(
            "Task succeeded",
            extra={
                "task_id": task_id,
                "task_name": self.name,
            },
        )

    def on_failure(
        self,
        exc: Exception,
        task_id: str,
        args: tuple,
        kwargs: dict[str, Any],
        einfo: Any,
    ) -> None:
        """Log task failure. Retries are logged in on_retry."""
        logger.exception(
            "Task failed",
            extra={
                "task_id": task_id,
                "task_name": self.name,
                "exception": str(exc),
            },
            exc_info=exc,
        )

    def on_retry(
        self,
        exc: Exception,
        task_id: str,
        args: tuple,
        kwargs: dict[str, Any],
        einfo: Any,
    ) -> None:
        """Log task retry."""
        logger.warning(
            "Task retrying",
            extra={
                "task_id": task_id,
                "task_name": self.name,
                "retries": self.request.retries,
                "max_retries": self.max_retries,
                "exception": str(exc),
            },
        )
