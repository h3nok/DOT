"""Writing desk adapters over the existing Academy revision/release kernel."""

from __future__ import annotations

import hashlib
import pathlib

import fastapi
import sqlalchemy.ext.asyncio

import app.api.v1.academy
import app.auth.dependencies
import app.core.security
import app.db.session
import app.domains.academy.policy as policy
import app.domains.academy.schemas as schemas
import app.domains.academy.service as service
import app.domains.academy.writing_drafts as drafts
import app.domains.academy.writing_schemas as writing
import app.integrations.object_store as storage

router = fastapi.APIRouter(prefix="/v1/academy", tags=["academy"])
_limiter = app.core.security.make_limiter()


@router.post("/works/{work_id}/drafts", status_code=201)
@_limiter.limit("60/minute")
async def save_draft(
    request: fastapi.Request,
    work_id: str,
    payload: writing.DraftSave,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.RevisionRead:
    revision = await drafts.save_draft(
        session, work_id=work_id, actor_id=owner.actor_id, payload=payload
    )
    return app.api.v1.academy._revision_read(revision)  # noqa: SLF001


async def _image_response(asset: dict, key: str, *, private: bool) -> fastapi.Response:
    try:
        data = await storage.get_object_store().get_bytes(key)
    except storage.ObjectNotFoundError:
        raise fastapi.HTTPException(status_code=404, detail="Image not found.") from None
    except storage.ObjectStoreError as exc:
        raise fastapi.HTTPException(status_code=503, detail="Image unavailable.") from exc
    if hashlib.sha256(data).hexdigest() != asset["sha256"]:
        raise fastapi.HTTPException(status_code=503, detail="Image integrity check failed.")
    return fastapi.Response(
        content=data,
        media_type=asset["media_type"],
        headers={
            "Cache-Control": "private, no-store" if private else "public, max-age=300",
            "X-Content-Type-Options": "nosniff",
            "ETag": f'"{asset["sha256"]}"',
        },
    )


@router.get("/revisions/{revision_id}/media/{asset_id}")
async def private_media(
    revision_id: str,
    asset_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> fastapi.Response:
    revision, work = await service._get_revision_scoped(session, revision_id, owner.actor_id)  # noqa: SLF001
    await policy.require_authority(
        session,
        space_id=work.academy_space_id,
        actor_id=owner.actor_id,
        action="read_private",
        program_id=work.program_id,
    )
    asset = next(
        (
            item
            for item in (revision.editor_metadata or {}).get("assets", [])
            if item["id"] == asset_id
        ),
        None,
    )
    if asset is None:
        raise fastapi.HTTPException(status_code=404, detail="Image not found.")
    return await _image_response(asset, asset["object_key"], private=True)


@router.get("/delivery/works/{work_id}/releases/{number}/media/{asset_id}")
@_limiter.limit("240/minute")
async def public_media(
    request: fastapi.Request,
    work_id: str,
    number: int,
    asset_id: str,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> fastapi.Response:
    row = await service.delivery_release(session, work_id=work_id, number=number)
    if (
        row.withdrawn_at is not None
        or row.manifest.get("release", {}).get("visibility") != "public"
    ):
        raise fastapi.HTTPException(status_code=404, detail="Image not found.")
    asset = next((item for item in row.manifest.get("assets", []) if item["id"] == asset_id), None)
    if asset is None:
        raise fastapi.HTTPException(status_code=404, detail="Image not found.")
    prefix = row.body_ref.removesuffix("body.md")
    key = f"{prefix}media/{asset['id']}{pathlib.PurePosixPath(asset['path']).suffix}"
    return await _image_response(asset, key, private=False)
