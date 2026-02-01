"""Centralized structured logging configuration."""

import json
import logging
import re
from typing import Any

from app.core.config import settings


_REDACT_PATTERN = re.compile(
    r"(password|passwd|pwd|secret|token|api_key|apikey|authorization)\s*[=:]\s*[\"']?([^\"'\s&]+)",
    re.IGNORECASE,
)
_URL_CREDENTIALS_PATTERN = re.compile(
    r"([a-z]+://[^:]+:)([^@]+)(@)",
    re.IGNORECASE,
)


def _redact_sensitive(msg: str) -> str:
    """Redact sensitive values from log messages."""
    msg = _REDACT_PATTERN.sub(r'\1=***REDACTED***', str(msg))
    msg = _URL_CREDENTIALS_PATTERN.sub(r'\1***REDACTED***\3', msg)
    return msg


class SensitiveDataFilter(logging.Filter):
    """Filter that redacts sensitive data from log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = _redact_sensitive(str(record.msg))
        if record.args:
            record.args = tuple(_redact_sensitive(str(a)) for a in record.args)
        return True


class JsonFormatter(logging.Formatter):
    """JSON formatter for structured log output."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj: dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": _redact_sensitive(record.getMessage()),
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj, default=str)


def setup_logging() -> None:
    """Configure application logging. Call once at startup."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    handler = logging.StreamHandler()
    handler.setLevel(log_level)
    handler.addFilter(SensitiveDataFilter())

    if settings.APP_ENV == "production":
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
            )
        )

    root_logger.addHandler(handler)

    logging.getLogger("uvicorn").setLevel(log_level)
    logging.getLogger("uvicorn.access").setLevel(
        logging.WARNING
    )  # Reduce access log noise; configure separately if needed
