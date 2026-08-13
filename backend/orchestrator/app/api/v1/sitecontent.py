from __future__ import annotations

import fastapi
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.core.security
import app.db.session
import app.domains.sitecontent.schemas as schemas
import app.domains.sitecontent.service as sitecontent_service

# Published copy is read by every visitor before they have any session, so the
# read path is unauthenticated and carries no tenant binding (ADR-0011).
public_router = fastapi.APIRouter(prefix="/v1/site-content", tags=["site-content"])

# Writes are the steward's alone. This is the author's own voice on the public
# surfaces; member role is not sufficient (ADR-0021).
router = fastapi.APIRouter(prefix="/v1/site-content", tags=["site-content"])

_limiter = app.core.security.make_limiter()


async def require_steward(
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
) -> app.auth.dependencies.OwnerContext:
    """Only the site steward may change public copy."""

    if owner.role not in {"owner", "admin"}:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_403_FORBIDDEN,
            detail="Only the site steward may edit public copy.",
        )
    return owner


@public_router.get("", response_model=schemas.SiteContentPublic)
@_limiter.limit("120/minute")
async def get_published_content(
    request: fastapi.Request,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.SiteContentPublic:
    return schemas.SiteContentPublic(blocks=await sitecontent_service.published_blocks(session))


@router.get("/drafts", response_model=schemas.SiteContentDrafts)
async def get_drafts(
    steward: app.auth.dependencies.OwnerContext = fastapi.Depends(require_steward),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.SiteContentDrafts:
    return schemas.SiteContentDrafts(blocks=await sitecontent_service.all_blocks(session))


@router.put("/{key}", response_model=schemas.SiteContentValue)
@_limiter.limit("60/minute")
async def put_block(
    request: fastapi.Request,
    key: str,
    payload: schemas.SiteContentWrite,
    steward: app.auth.dependencies.OwnerContext = fastapi.Depends(require_steward),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.SiteContentValue:
    try:
        return await sitecontent_service.write_block(
            session,
            key=key,
            value=payload.value,
            publish=payload.publish,
            actor_id=steward.actor_id,
        )
    except sitecontent_service.InvalidContentKeyError as exc:
        raise fastapi.HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{key}/publish", response_model=schemas.SiteContentValue)
@_limiter.limit("60/minute")
async def publish_block(
    request: fastapi.Request,
    key: str,
    steward: app.auth.dependencies.OwnerContext = fastapi.Depends(require_steward),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.SiteContentValue:
    try:
        result = await sitecontent_service.publish_block(
            session,
            key=key,
            actor_id=steward.actor_id,
        )
    except sitecontent_service.InvalidContentKeyError as exc:
        raise fastapi.HTTPException(status_code=400, detail=str(exc)) from exc
    if result is None:
        raise fastapi.HTTPException(status_code=404, detail="No such content block.")
    return result


@router.delete("/{key}", status_code=fastapi.status.HTTP_204_NO_CONTENT)
@_limiter.limit("60/minute")
async def revert_block(
    request: fastapi.Request,
    key: str,
    steward: app.auth.dependencies.OwnerContext = fastapi.Depends(require_steward),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> fastapi.Response:
    """Restore the released wording by removing the override."""

    try:
        await sitecontent_service.revert_block(session, key=key)
    except sitecontent_service.InvalidContentKeyError as exc:
        raise fastapi.HTTPException(status_code=400, detail=str(exc)) from exc
    return fastapi.Response(status_code=fastapi.status.HTTP_204_NO_CONTENT)
