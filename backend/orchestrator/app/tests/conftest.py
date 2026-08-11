import collections.abc
import pathlib

import fastapi.testclient
import pytest
import sqlalchemy.ext.asyncio
import sqlalchemy.pool
from fastapi import FastAPI

import app.api.v1.auth as _auth_router_module
import app.core.tenancy
import app.db.models
import app.db.session
import app.main
import app.settings


@pytest.fixture(autouse=True)
def _reset_auth_rate_limiter() -> None:
    _auth_router_module._limiter._storage.reset()  # noqa: SLF001


@pytest.fixture()
async def session_factory() -> collections.abc.AsyncGenerator[
    sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession], None
]:
    engine: sqlalchemy.ext.asyncio.AsyncEngine = sqlalchemy.ext.asyncio.create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=sqlalchemy.pool.StaticPool,
    )
    # SQLite cannot enforce RLS, so the tests run behind the same query guard the
    # application uses as its backstop (ADR-0011 L4).
    async with engine.begin() as connection:
        await connection.run_sync(app.db.models.Base.metadata.create_all)

    factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession] = (
        sqlalchemy.ext.asyncio.async_sessionmaker(engine, expire_on_commit=False)
    )
    yield factory

    async with engine.begin() as connection:
        await connection.run_sync(app.db.models.Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture()
def client(
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: pathlib.Path,
) -> collections.abc.Generator[fastapi.testclient.TestClient, None, None]:
    monkeypatch.setenv("ORCHESTRATOR_OBJECT_STORE_BACKEND", "filesystem")
    monkeypatch.setenv("ORCHESTRATOR_LOCAL_OBJECT_STORE_ROOT", str(tmp_path / "objects"))
    # Sessions are signed, so the suite must not inherit (or require) a developer secret.
    monkeypatch.setenv(
        "ORCHESTRATOR_SERVICE_AUTH_SECRET", "test-session-signing-secret-at-least-32-bytes"
    )
    # The twin model must be opt-in per test, not inherited from a developer's
    # .env. pydantic-settings reads .env directly, so an explicit empty value
    # (not delenv) is what keeps "model unconfigured" tests deterministic.
    monkeypatch.setenv("ORCHESTRATOR_TWIN_API_KEY", "")
    app.settings.get_settings.cache_clear()
    fastapi_app: FastAPI = app.main.create_app()

    async def override_session() -> collections.abc.AsyncGenerator[
        sqlalchemy.ext.asyncio.AsyncSession, None
    ]:
        async with session_factory() as session:
            yield session

    fastapi_app.dependency_overrides[app.db.session.get_session] = override_session
    with fastapi.testclient.TestClient(fastapi_app) as test_client:
        yield test_client
    app.settings.get_settings.cache_clear()
