import fastapi
import slowapi
import slowapi.util
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.db.session
import app.domains.twin.schemas
import app.domains.twin.service

router = fastapi.APIRouter(
    prefix="/v1/twin",
    tags=["twin"],
    # Binds every request in this router to the caller's tenant (ADR-0011).
    dependencies=[fastapi.Depends(app.db.session.get_tenant_session)],
)

_limiter = slowapi.Limiter(key_func=slowapi.util.get_remote_address)


@router.post("/ask", response_model=app.domains.twin.schemas.TwinAskResponse)
@_limiter.limit("20/minute")
async def ask(
    request: fastapi.Request,
    payload: app.domains.twin.schemas.TwinAskRequest,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> app.domains.twin.schemas.TwinAskResponse:
    """Ask a twin. Answers are grounded in graph nodes or they are refused."""

    return await app.domains.twin.service.ask(session, owner, payload)
