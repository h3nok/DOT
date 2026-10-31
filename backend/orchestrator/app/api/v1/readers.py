from __future__ import annotations

import fastapi
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.core.security
import app.db.session
import app.domains.readers.schemas as schemas
import app.domains.readers.service as readers_service

# The reader list is public by definition (ADR-0025) — someone who just finished
# Book One has no account and is not asking for one — so this router carries no
# tenant binding, the same explicit exception the join and support planes take
# (ADR-0011). Rate limits stand in for tenancy.
router = fastapi.APIRouter(prefix="/v1/readers", tags=["readers"])

_limiter = app.core.security.make_limiter()


def _fail(result: dict) -> None:
    raise fastapi.HTTPException(
        status_code=result.get("status", 400), detail=result.get("error", "Request failed.")
    )


@router.get("/status")
async def get_status() -> dict:
    """Whether the list is open, so the UI can decline honestly rather than
    collect an address it cannot store safely."""
    return {"available": readers_service.readers_available(), "publications": ["all", "amm"]}


@router.post("/subscribe", response_model=schemas.ReaderSubscribeAccepted, status_code=202)
@_limiter.limit("5/hour")
async def subscribe(
    request: fastapi.Request,
    payload: schemas.ReaderSubscribeIn,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.ReaderSubscribeAccepted:
    result = await readers_service.subscribe(
        session,
        payload.email,
        payload.source,
        publication=payload.publication,
        include_all=payload.include_all,
    )
    if not result.get("ok"):
        _fail(result)
    return schemas.ReaderSubscribeAccepted(
        expires_in=result["expires_in"], dev_code=result.get("dev_code")
    )


@router.post("/confirm", response_model=schemas.ReaderConfirmed)
@_limiter.limit("10/hour")
async def confirm(
    request: fastapi.Request,
    payload: schemas.ReaderConfirmIn,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.ReaderConfirmed:
    result = await readers_service.confirm(
        session,
        payload.email,
        payload.code,
        publication=payload.publication,
        include_all=payload.include_all,
    )
    if not result.get("ok"):
        _fail(result)
    return schemas.ReaderConfirmed(unsubscribe_token=result["unsubscribe_token"])


@router.post("/unsubscribe", response_model=schemas.ReaderUnsubscribed)
@_limiter.limit("30/hour")
async def unsubscribe(
    request: fastapi.Request,
    token: str = fastapi.Body(..., embed=True, min_length=16, max_length=128),
    all_publications: bool = fastapi.Body(default=False),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.ReaderUnsubscribed:
    """Leaving is a POST so that no mail scanner prefetching a link can remove a
    reader who never clicked. The link in a message points at a page that posts
    this on arrival — one click for the reader, and nothing for a crawler."""
    await readers_service.unsubscribe(session, token, all_publications=all_publications)
    # Never _fail: the response is identical whether or not the token matched.
    return schemas.ReaderUnsubscribed()


@router.delete("/{reader_id}", status_code=204)
async def remove_reader(
    reader_id: str,
    _steward: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_steward
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> None:
    if not await readers_service.remove_reader(session, reader_id):
        raise fastapi.HTTPException(status_code=404, detail="That subscription no longer exists.")


@router.get("", response_model=schemas.ReaderList)
async def read_list(
    _steward: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_steward
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.ReaderList:
    """The list, for the one person who writes to it.

    Unsealing addresses is the most sensitive read in the service, so it takes
    the owner write scope rather than mere membership — the same bar the join
    queue sets.
    """
    rows = await readers_service.list_readers(session)
    return schemas.ReaderList(readers=[schemas.ReaderOut(**row) for row in rows])
