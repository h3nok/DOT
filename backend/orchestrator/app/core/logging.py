from __future__ import annotations

import logging
import os
import re
import sys
from typing import Any

from pythonjsonlogger import jsonlogger

from app.core.middleware import request_id_var

_SENSITIVE_KEYS = {
    "authorization",
    "body",
    "body_ref",
    "content",
    "context",
    "draft",
    "email",
    "password",
    "prompt",
    "question",
    "retrieved_context",
    "secret",
    "source_text",
    "text",
    "token",
}
_EMAIL_RE = re.compile(r"[\w.\-+]+@[\w.\-]+\.\w+")


def _redact_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: "[REDACTED]" if str(key).lower() in _SENSITIVE_KEYS else _redact_value(val)
            for key, val in value.items()
        }
    if isinstance(value, list):
        return [_redact_value(item) for item in value]
    if isinstance(value, str):
        return _EMAIL_RE.sub("[REDACTED_EMAIL]", value)
    return value


class RedactingJsonFormatter(jsonlogger.JsonFormatter):
    """JSON formatter with request IDs and conservative content redaction."""

    def __init__(self, *args, service_name: str = "", **kwargs):
        super().__init__(*args, **kwargs)
        self._service_name = service_name

    def add_fields(
        self,
        log_record: dict[str, Any],
        record: logging.LogRecord,
        message_dict: dict[str, Any],
    ) -> None:
        super().add_fields(log_record, record, message_dict)
        log_record["severity"] = record.levelname
        log_record.pop("levelname", None)
        log_record["timestamp"] = self.formatTime(record)
        log_record.pop("asctime", None)
        log_record.setdefault(
            "serviceContext",
            {
                "service": self._service_name,
                "version": os.environ.get("K_REVISION", "local"),
            },
        )
        request_id = request_id_var.get("")
        if request_id:
            log_record["requestId"] = request_id

        redacted = _redact_value(dict(log_record))
        log_record.clear()
        log_record.update(redacted)


def setup_logging(service_name: str, log_level: str = "INFO") -> logging.Logger:
    root = logging.getLogger()
    root.setLevel(log_level.upper())

    if any(isinstance(handler.formatter, RedactingJsonFormatter) for handler in root.handlers):
        return logging.getLogger(service_name)

    root.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        RedactingJsonFormatter(
            fmt="%(message)s %(name)s",
            service_name=service_name,
        )
    )
    root.addHandler(handler)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    return logging.getLogger(service_name)
