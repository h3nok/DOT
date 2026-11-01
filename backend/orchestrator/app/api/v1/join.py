from __future__ import annotations

import fastapi
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.core.contact
import app.core.security
import app.db.session
import app.domains.join.schemas as schemas
import app.domains.join.service as join_service

# Asking to join is public by necessity — the person asking has no account yet —
# so this router carries no tenant binding, the same explicit exception the
# support plane takes (ADR-0011). Rate limits stand in for tenancy.
router = fastapi.APIRouter(prefix="/v1/join", tags=["join"])

_limiter = app.core.security.make_limiter()


def _fail(result: dict) -> None:
    raise fastapi.HTTPException(
        status_code=result.get("status", 400), detail=result.get("error", "Request failed.")
    )


@router.get("/status")
async def get_status() -> dict:
    """Whether the queue is open, so the UI can decline honestly rather than
    collect an address it cannot store safely."""
    return {"available": join_service.join_available()}


@router.post("/requests", response_model=schemas.JoinRequestAccepted, status_code=202)
@_limiter.limit("5/hour")
async def create_request(
    request: fastapi.Request,
    payload: schemas.JoinRequestIn,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.JoinRequestAccepted:
    result = await join_service.request_join(session, payload.email, payload.reason)
    if not result.get("ok"):
        _fail(result)
    return schemas.JoinRequestAccepted(
        expires_in=result["expires_in"], dev_code=result.get("dev_code")
    )


@router.post("/requests/verify", response_model=schemas.JoinVerified)
@_limiter.limit("10/hour")
async def verify_request(
    request: fastapi.Request,
    payload: schemas.JoinVerifyIn,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.JoinVerified:
    result = await join_service.verify_join(session, payload.email, payload.code)
    if not result.get("ok"):
        _fail(result)
    return schemas.JoinVerified()


@router.post("/requests/{request_id}/invite", response_model=schemas.JoinInvited)
@_limiter.limit("30/hour")
async def invite_requester(
    request: fastapi.Request,
    request_id: str,
    steward: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_steward
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.JoinInvited:
    result = await join_service.invite_requester(session, request_id, steward.owner_id)
    if not result["ok"]:
        _fail(result)
    return schemas.JoinInvited(dev_link=result.get("dev_link"))


@router.delete("/requests/{request_id}", status_code=204)
async def decline_request(
    request_id: str,
    _steward: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_steward
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> None:
    if not await join_service.decline_request(session, request_id):
        raise fastapi.HTTPException(status_code=404, detail="That request is no longer open.")


@router.get("/requests", response_model=schemas.JoinQueue)
async def read_queue(
    _steward: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_steward
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.JoinQueue:
    """The queue, for the one person who answers it.

    Unsealing addresses is the single most sensitive read in the service, so it
    requires the owner write scope rather than mere membership.
    """
    rows = await join_service.list_requests(session)
    return schemas.JoinQueue(requests=[schemas.JoinRequestOut(**row) for row in rows])
