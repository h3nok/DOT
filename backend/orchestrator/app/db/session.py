import collections.abc
import contextlib

import fastapi
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.core.tenancy
import app.db.models
import app.settings

settings: app.settings.Settings = app.settings.get_settings()

engine: sqlalchemy.ext.asyncio.AsyncEngine = sqlalchemy.ext.asyncio.create_async_engine(
    settings.database_url, pool_pre_ping=True
)
AsyncSessionLocal: sqlalchemy.ext.asyncio.async_sessionmaker[
    sqlalchemy.ext.asyncio.AsyncSession
] = sqlalchemy.ext.asyncio.async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> collections.abc.AsyncGenerator[
    sqlalchemy.ext.asyncio.AsyncSession, None
]:
    async with AsyncSessionLocal() as session:
        yield session


async def flag_suspended_session(
    request: fastapi.Request,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(get_session),
) -> None:
    """Make suspension reach sessions already issued, which last seven days.

    Runs before every route. Requests with no session, and the steward's own, do
    not touch the database. The read transaction ends here so a route that binds a
    tenant starts clean.
    """

    context = app.auth.dependencies.resolve_session_optional(request)
    if context is None or context.role != "member":
        return
    status = await session.scalar(
        sqlalchemy.select(app.db.models.Member.status).where(
            app.db.models.Member.id == context.owner_id
        )
    )
    await session.rollback()
    if status == "suspended":
        request.state.session_suspended = True


async def get_tenant_session(
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(get_session),
) -> sqlalchemy.ext.asyncio.AsyncSession:
    """Session bound to the caller's tenant for the life of the transaction."""

    await app.core.tenancy.bind_tenant(session, owner.owner_id)
    return session


@contextlib.asynccontextmanager
async def tenant_session(
    owner_id: str,
) -> collections.abc.AsyncGenerator[sqlalchemy.ext.asyncio.AsyncSession, None]:
    """Tenant-bound session for workers and scripts, which have no request."""

    async with AsyncSessionLocal() as session:
        await app.core.tenancy.bind_tenant(session, owner_id)
        yield session


async def check_database() -> None:
    async with engine.connect() as connection:
        await connection.execute(sqlalchemy.text("select 1"))
