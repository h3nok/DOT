from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

logger = logging.getLogger("dot_orchestrator.errors")


class ServiceError(Exception):
    """Structured service-level error."""

    def __init__(
        self,
        message: str = "An unexpected error occurred",
        *,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        detail: Any = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.detail = detail


class BadRequestError(ServiceError):
    def __init__(self, message: str = "Bad request", *, detail: Any = None) -> None:
        super().__init__(
            message,
            code="BAD_REQUEST",
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )


class NotFoundError(ServiceError):
    def __init__(self, message: str = "Not found", *, detail: Any = None) -> None:
        super().__init__(
            message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )


class ConflictError(ServiceError):
    def __init__(self, message: str = "Conflict", *, detail: Any = None) -> None:
        super().__init__(
            message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )


def _error_json(
    status_code: int,
    code: str,
    message: str,
    detail: Any = None,
) -> JSONResponse:
    body: dict[str, Any] = {"error": {"code": code, "message": message}}
    if detail is not None:
        body["error"]["detail"] = detail
    return JSONResponse(status_code=status_code, content=body)


def _serialisable_errors(errors: list[Any]) -> list[dict[str, Any]]:
    """A validator raising ValueError puts the exception itself in `ctx`, which
    JSONResponse cannot encode. Stringify it rather than crash the handler."""

    cleaned: list[dict[str, Any]] = []
    for error in errors:
        item: dict[str, Any] = {key: value for key, value in error.items() if key != "ctx"}
        context = error.get("ctx")
        if context:
            item["ctx"] = {key: str(value) for key, value in context.items()}
        cleaned.append(item)
    return cleaned


class UnhandledExceptionMiddleware(BaseHTTPMiddleware):
    """Return a stable response before outer CORS and header middleware run."""

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        try:
            return await call_next(request)
        except Exception:
            logger.exception("Unhandled request error", extra={"path": request.url.path})
            return _error_json(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "An unexpected error occurred",
            )


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ServiceError)
    async def service_error(request: Request, exc: ServiceError) -> JSONResponse:
        logger.warning(
            "Service error",
            extra={"code": exc.code, "path": request.url.path},
        )
        return _error_json(exc.status_code, exc.code, exc.message, exc.detail)

    @app.exception_handler(RequestValidationError)
    async def validation_error(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        logger.warning(
            "Validation error",
            extra={"path": request.url.path, "errors": str(exc.errors()[:3])},
        )
        return _error_json(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "VALIDATION_ERROR",
            "Request validation failed",
            detail=_serialisable_errors(exc.errors()),
        )
