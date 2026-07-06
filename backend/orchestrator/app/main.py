from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import graph, health, publications, runs, vault
from app.core.errors import install_error_handlers
from app.core.logging import setup_logging
from app.core.middleware import RequestIdMiddleware
from app.settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    logger = setup_logging(settings.SERVICE_NAME, settings.LOG_LEVEL)
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


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
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
            {"name": "vault", "description": "Knowledge vault file uploads."},
        ],
    )
    install_error_handlers(app)
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(graph.router)
    app.include_router(publications.router)
    app.include_router(runs.router)
    app.include_router(vault.router)
    return app


app = create_app()
