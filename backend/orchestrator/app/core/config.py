from __future__ import annotations

import functools
import logging

import pydantic
import pydantic_settings

logger: logging.Logger = logging.getLogger("dot_orchestrator.config")


class ServiceSettings(pydantic_settings.BaseSettings):
    """Shared service settings adapted from the existing AI Platform services."""

    SERVICE_NAME: str = "dot-orchestrator"
    SERVICE_PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"
    # Vite walks forward from 5173 when a port is taken, so allow its usual range.
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ]

    AUTH_ENABLED: bool = True
    AUTH_MODE: str = pydantic.Field(default="local_header", pattern="^(local_header|gateway|jwt)$")
    SERVICE_AUTH_SECRET: str = ""
    JWT_ISSUER: str = "dot-bff"
    JWT_AUDIENCE: str = "dot-orchestrator"

    OTEL_ENABLED: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://dot:dot@localhost:5432/dot_orchestrator"
    REDIS_URL: str = "redis://localhost:6379/0"

    OBJECT_STORE_BACKEND: str = pydantic.Field(default="filesystem", pattern="^(filesystem|s3)$")
    OBJECT_STORE_ENDPOINT: str = "http://localhost:9000"
    OBJECT_STORE_BUCKET: str = "dot-orchestrator-local"
    LOCAL_OBJECT_STORE_ROOT: str = ".data/orchestrator-objects"

    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str = "us-east-1"

    SENTRY_DSN: str = ""
    FRONTEND_URL: str = "https://dotheory.org"

    # Twin plane (ADR-0010). TOOL_RUNTIME_SECRET signs tool manifests; without it
    # the registry refuses to dispatch anything.
    TWIN_ENABLED: bool = True
    TWIN_MODEL: str = "gemini-3.5-flash-lite"
    TWIN_API_KEY: str = ""
    TWIN_TIMEOUT_SECONDS: float = 30.0
    TOOL_RUNTIME_SECRET: str = ""

    # Retrieval. Without an embedding key the twin still answers, using keyword
    # scoring only; it never silently returns nothing.
    EMBEDDING_MODEL: str = "gemini-embedding-001"
    EMBEDDING_DIMENSIONS: int = 768
    EMBEDDING_BATCH_SIZE: int = 32

    # Support plane (ADR-0001, ADR-0012). Absent keys disable the surface rather
    # than falling back to a placeholder.
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    model_config = pydantic_settings.SettingsConfigDict(
        env_file=".env",
        env_prefix="ORCHESTRATOR_",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def app_name(self) -> str:
        return self.SERVICE_NAME

    @property
    def env(self) -> str:
        return self.ENVIRONMENT

    @property
    def database_url(self) -> str:
        return self.DATABASE_URL

    @property
    def redis_url(self) -> str:
        return self.REDIS_URL

    @property
    def object_store_endpoint(self) -> str:
        return self.OBJECT_STORE_ENDPOINT

    @property
    def object_store_bucket(self) -> str:
        return self.OBJECT_STORE_BUCKET

    @property
    def object_store_backend(self) -> str:
        return self.OBJECT_STORE_BACKEND

    @property
    def local_object_store_root(self) -> str:
        return self.LOCAL_OBJECT_STORE_ROOT

    @property
    def auth_mode(self) -> str:
        return self.AUTH_MODE

    @pydantic.model_validator(mode="after")
    def validate_production(self) -> ServiceSettings:
        if self.ENVIRONMENT not in {"production", "staging"}:
            return self

        errors: list[str] = []
        if not self.AUTH_ENABLED:
            errors.append("AUTH_ENABLED=false is not allowed in production/staging")
        if self.AUTH_MODE == "local_header":
            errors.append("AUTH_MODE=local_header is not allowed in production/staging")
        if self.AUTH_MODE == "jwt" and not self.SERVICE_AUTH_SECRET:
            errors.append("SERVICE_AUTH_SECRET is required for AUTH_MODE=jwt")

        if errors:
            msg: str = f"{self.SERVICE_NAME} config validation failed:\n  - " + "\n  - ".join(
                errors
            )
            logger.critical(msg)
            raise ValueError(msg)

        return self


class Settings(ServiceSettings):
    """DOT orchestrator settings."""


@functools.lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
