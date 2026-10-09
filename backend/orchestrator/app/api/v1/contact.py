from __future__ import annotations

import typing

import fastapi
import sqlalchemy.ext.asyncio as sqlasync

import app.auth.dependencies as auth
import app.core.security
import app.db.session
import app.domains.contact.schemas as schemas
import app.domains.contact.service as service

public_router = fastapi.APIRouter(prefix="/v1/contact", tags=["contact"])
router = fastapi.APIRouter(prefix="/v1/contact/inbox", tags=["contact"])
_limiter = app.core.security.make_limiter()
Key = typing.Annotated[
    str,
    fastapi.Header(
        alias="Idempotency-Key", min_length=16, max_length=128, pattern=r"^[A-Za-z0-9_-]+$"
    ),
]
Session = typing.Annotated[sqlasync.AsyncSession, fastapi.Depends(app.db.session.get_session)]


async def no_store(response: fastapi.Response) -> None:
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"


public_router.dependencies.append(fastapi.Depends(no_store))
router.dependencies.append(fastapi.Depends(no_store))


async def require_steward(owner: auth.OwnerContext = fastapi.Depends(auth.require_owner)) -> None:
    service.require_steward(owner)


router.dependencies.append(fastapi.Depends(require_steward))


@public_router.get("/status")
async def status() -> dict:
    return {"available": service.available()}


@public_router.post("/messages", status_code=201)
@_limiter.limit("5/hour")
async def receive(
    request: fastapi.Request, payload: schemas.InquiryIn, key: Key, session: Session
) -> dict:
    reference = await service.receive(session, payload, key)
    return {"status": "received", "reference": reference}


@router.get("")
async def inbox(
    session: Session,
    page: int = fastapi.Query(default=1, ge=1, le=10000),
    status: schemas.InquiryStatus | None = None,
) -> dict:
    return await service.list_inquiries(session, page, status)


@router.get("/{inquiry_id}")
async def detail(inquiry_id: str, session: Session) -> dict:
    return await service.detail(session, inquiry_id)


@router.patch("/{inquiry_id}")
async def update(inquiry_id: str, payload: schemas.StatusIn, session: Session) -> dict:
    row = await service.inquiry(session, inquiry_id)
    row.status = payload.status
    await session.commit()
    return {"status": row.status}


@router.post("/{inquiry_id}/replies")
@_limiter.limit("20/hour")
async def reply(
    request: fastapi.Request, inquiry_id: str, payload: schemas.ReplyIn, key: Key, session: Session
) -> dict:
    return await service.reply(session, inquiry_id, payload.message, key)


@router.delete("/{inquiry_id}", status_code=204)
async def remove(inquiry_id: str, session: Session) -> None:
    await service.remove(session, inquiry_id)
