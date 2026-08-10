import collections.abc
import contextlib
import logging

import fastapi
import fastapi.middleware.cors
import sentry_sdk
import slowapi
import slowapi.errors

import app.api.v1.auth as _auth_router
import app.api.v1.book_sales as _book_sales_router
import app.api.v1.graph as _graph_router
import app.api.v1.health as _health_router
import app.api.v1.publications as _publications_router
import app.api.v1.runs as _runs_router
import app.api.v1.support as _support_router
import app.api.v1.twin as _twin_router
import app.api.v1.vault as _vault_router
import app.core.errors as _errors
import app.core.logging as _logging
import app.core.middleware as _middleware
import app.core.security as _security
import app.settings as _settings


@contextlib.asynccontextmanager
async def lifespan(app: fastapi.FastAPI) -> collections.abc.AsyncGenerator[None, None]:
    settings: _settings.Settings = _settings.get_settings()
    logger: logging.Logger = _logging.setup_logging(settings.SERVICE_NAME, settings.LOG_LEVEL)
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            traces_sample_rate=0.1,
            # Never send request bodies — private content must not reach Sentry.
            send_default_pii=False,
        )
    logger.info(
        "Starting DOT orchestrator",
        extra={
            "service": settings.SERVICE_NAME,
            "environment": settings.ENVIRONMENT,
            "auth_mode": settings.AUTH_MODE,
        },
    )
    yield
    logger.info("DOT orchestrator stopped")


def create_app() -> fastapi.FastAPI:
    settings: _settings.Settings = _settings.get_settings()
    limiter = _security.make_limiter(settings.REDIS_URL)
    fapp = fastapi.FastAPI(
        title=settings.SERVICE_NAME,
        summary="Knowledge and Publication OS orchestrator",
        description=(
            "Coordinates publication releases, source ingestion, source-backed AI, "
            "exports, deletions, and durable workflow state for DOT/Stay."
        ),
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
        openapi_tags=[
            {"name": "health", "description": "Liveness and readiness probes."},
            {"name": "publications", "description": "Publication Studio workflows."},
            {
                "name": "graph",
                "description": "Digital footprint graph and connector import workflows.",
            },
            {"name": "runs", "description": "Durable workflow run status."},
            {
                "name": "twin",
                "description": "Grounded, tenant-bound digital twin under HKI conformance.",
            },
            {"name": "vault", "description": "Knowledge vault file uploads."},
            {"name": "auth", "description": "OTP sign-in, session, and invite management."},
            {
                "name": "support",
                "description": "Member funding for the movement. Amounts are set server-side.",
            },
        ],
    )
    _errors.install_error_handlers(fapp)
    fapp.state.limiter = limiter
    fapp.add_exception_handler(
        slowapi.errors.RateLimitExceeded, slowapi._rate_limit_exceeded_handler
    )
    fapp.add_middleware(_security.SecurityHeadersMiddleware)
    fapp.add_middleware(_middleware.RequestIdMiddleware)
    fapp.add_middleware(
        fastapi.middleware.cors.CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Request-ID",
            "Idempotency-Key",
            "Cookie",
            # local_header auth mode identifies the tenant with these.
            "X-Owner-Id",
            "X-Actor-Id",
        ],
        expose_headers=["X-Request-ID"],
    )
    fapp.include_router(_health_router.router)
    fapp.include_router(_auth_router.router)
    fapp.include_router(_book_sales_router.router)
    fapp.include_router(_graph_router.public_router)
    fapp.include_router(_graph_router.router)
    fapp.include_router(_publications_router.public_router)
    fapp.include_router(_publications_router.router)
    fapp.include_router(_runs_router.router)
    fapp.include_router(_support_router.router)
    fapp.include_router(_twin_router.public_router)
    fapp.include_router(_twin_router.router)
    fapp.include_router(_vault_router.router)
    return fapp


app: fastapi.FastAPI = create_app()
