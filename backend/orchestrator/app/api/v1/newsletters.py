from __future__ import annotations

from typing import Annotated, Literal

import fastapi
import pydantic
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

import app.auth.dependencies as auth
import app.db.session
from app.domains.readers import mail, models, newsletter, service


def private(response: fastapi.Response) -> None:
    response.headers["Cache-Control"] = "no-store"


router = fastapi.APIRouter(
    prefix="/v1/newsletters", tags=["newsletters"], dependencies=[fastapi.Depends(private)]
)
Owner = Annotated[auth.OwnerContext, fastapi.Depends(auth.require_owner)]
Session = Annotated[AsyncSession, fastapi.Depends(app.db.session.get_session)]


class Selection(pydantic.BaseModel):
    work_id: str = pydantic.Field(min_length=1, max_length=64)
    release_number: int = pydantic.Field(ge=1)


class Approval(pydantic.BaseModel):
    approved: Literal[True]
    payload_hash: str = pydantic.Field(pattern=r"^[a-f0-9]{64}$")


@router.get("/status")
async def status(owner: Owner) -> dict:
    newsletter.require_editor(owner)
    return await mail.readiness()


@router.get("/campaigns")
async def campaigns(owner: Owner, session: Session) -> list[dict]:
    newsletter.require_editor(owner)
    rows = await session.scalars(
        sa.select(models.NewsletterCampaign)
        .order_by(models.NewsletterCampaign.created_at.desc())
        .limit(50)
    )
    return [await newsletter.read_campaign(session, row) for row in rows]


@router.post("/campaigns")
async def prepare(payload: Selection, owner: Owner, session: Session) -> dict:
    return await newsletter.prepare(session, owner, payload.work_id, payload.release_number)


@router.post("/campaigns/{identity}/approve")
async def approve(identity: str, payload: Approval, owner: Owner, session: Session) -> dict:
    return await newsletter.approve(session, owner, identity, payload.payload_hash)


@router.post("/campaigns/{identity}/dispatch")
async def dispatch(identity: str, owner: Owner, session: Session) -> dict:
    return await newsletter.dispatch(session, owner, identity)


@router.post("/campaigns/{identity}/cancel")
async def cancel(identity: str, owner: Owner, session: Session) -> dict:
    return await newsletter.cancel(session, owner, identity)


@router.post("/campaigns/{identity}/retry-rejected")
async def retry_rejected(identity: str, owner: Owner, session: Session) -> dict:
    return await newsletter.retry_rejected(session, owner, identity)


@router.post("/one-click", include_in_schema=False)
async def one_click(
    session: Session, token: str = fastapi.Query(min_length=16, max_length=128)
) -> dict:
    # RFC 8058: a provider POST without cookies, JS, or a confirmation prompt.
    # GET is deliberately absent: link-prefetching cannot remove a reader.
    await service.unsubscribe(session, token)
    return {"status": "unsubscribed"}


@router.post("/webhook", include_in_schema=False)
async def webhook(request: fastapi.Request, session: Session) -> dict:
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > 65_536:
            raise fastapi.HTTPException(413, "Delivery callback is too large.")
    identity, event = mail.verify_event(bytes(body), dict(request.headers))
    await newsletter.callback(session, identity, event)
    return {"received": True}
