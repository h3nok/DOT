from __future__ import annotations

import typing

import fastapi
import pydantic
import sqlalchemy.ext.asyncio

import app.auth.dependencies as auth
import app.db.session
import app.domains.distribution.service as service
import app.settings


def private_response(response: fastapi.Response) -> None:
    response.headers["Cache-Control"] = "no-store"


router = fastapi.APIRouter(
    prefix="/v1/distribution",
    tags=["distribution"],
    dependencies=[fastapi.Depends(private_response)],
)
Owner = typing.Annotated[auth.OwnerContext, fastapi.Depends(auth.require_owner)]
Session = typing.Annotated[
    sqlalchemy.ext.asyncio.AsyncSession, fastapi.Depends(app.db.session.get_session)
]


class CopyInput(pydantic.BaseModel):
    platform: typing.Literal["linkedin", "substack", "medium"]
    url: str = pydantic.Field(min_length=1, max_length=2048)


class Approval(pydantic.BaseModel):
    approved: typing.Literal[True]


@router.get("/linkedin")
async def status(owner: Owner, session: Session) -> dict:
    return await service.connection_status(session, owner)


@router.post("/linkedin/authorize")
async def authorize(payload: Approval, owner: Owner, session: Session) -> dict:
    return {"authorization_url": await service.authorize(session, owner)}


@router.get("/linkedin/callback", include_in_schema=False)
async def callback(
    request: fastapi.Request,
    session: Session,
    state: str = fastapi.Query(default="", max_length=256),
    code: str = fastapi.Query(default="", max_length=4096),
    error: str = fastapi.Query(default="", max_length=128),
) -> fastapi.responses.RedirectResponse:
    result = "failed"
    try:
        owner = await auth.require_owner(
            request,
            x_owner_id=request.headers.get("X-Owner-Id"),
            x_actor_id=request.headers.get("X-Actor-Id"),
        )
        if state and code and not error:
            await service.complete_authorization(session, owner, state=state, code=code)
            result = "linkedin"
    except fastapi.HTTPException:
        pass
    return fastapi.responses.RedirectResponse(
        app.settings.get_settings().FRONTEND_URL.rstrip("/")
        + "/studio/writing?connected="
        + result,
        status_code=303,
        headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer"},
    )


@router.delete("/linkedin", status_code=204)
async def disconnect(owner: Owner, session: Session) -> None:
    await service.disconnect(session, owner)


@router.get("/works/{work_id}/releases/{number}/copies")
async def copies(
    work_id: str, number: typing.Annotated[int, fastapi.Path(ge=1)], owner: Owner, session: Session
) -> list[dict]:
    return await service.copies(session, owner, work_id, number)


@router.post("/works/{work_id}/releases/{number}/linkedin")
async def share(
    work_id: str,
    number: typing.Annotated[int, fastapi.Path(ge=1)],
    payload: Approval,
    owner: Owner,
    session: Session,
) -> dict:
    return await service.share_linkedin(session, owner, work_id, number)


@router.post("/works/{work_id}/releases/{number}/copies")
async def record(
    work_id: str,
    number: typing.Annotated[int, fastapi.Path(ge=1)],
    payload: CopyInput,
    owner: Owner,
    session: Session,
) -> dict:
    return await service.record_copy(
        session, owner, work_id, number, platform=payload.platform, url=payload.url
    )
