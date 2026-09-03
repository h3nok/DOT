"""Academy kernel routes (doc 14 §10).

Authoring is private and authority-checked per space; delivery is public and
reads only the release projection (P9). The space in a URL is a route argument,
never an authority claim — every operation re-resolves membership server-side.
"""

from __future__ import annotations

import fastapi
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.core.security
import app.db.session
import app.domains.academy.models
import app.domains.academy.schemas as schemas
import app.domains.academy.service as service
import app.integrations.object_store

router = fastapi.APIRouter(prefix="/v1/academy", tags=["academy"])
public_router = fastapi.APIRouter(prefix="/v1/academy", tags=["academy"])

_limiter = app.core.security.make_limiter()


def _work_read(work: app.domains.academy.models.AcademyWork) -> schemas.WorkRead:
    return schemas.WorkRead(
        id=work.id,
        academy_space_id=work.academy_space_id,
        kind=work.kind,
        canonical_slug=work.canonical_slug,
        program_id=work.program_id,
        visibility=work.visibility,
        lifecycle_state=work.lifecycle_state,
        created_by=work.created_by,
        created_at=work.created_at,
    )


def _revision_read(revision: app.domains.academy.models.AcademyRevision) -> schemas.RevisionRead:
    return schemas.RevisionRead(
        id=revision.id,
        work_id=revision.work_id,
        revision_number=revision.revision_number,
        title=revision.title,
        summary=revision.summary,
        body_ref=revision.body_ref,
        body_media_type=revision.body_media_type,
        content_hash=revision.content_hash,
        language=revision.language,
        change_note=revision.change_note,
        created_by=revision.created_by,
        created_at=revision.created_at,
    )


def _release_read(release: app.domains.academy.models.AcademyRelease) -> schemas.ReleaseRead:
    return schemas.ReleaseRead(
        id=release.id,
        work_id=release.work_id,
        revision_id=release.revision_id,
        release_number=release.release_number,
        release_status=release.release_status,
        visibility=release.visibility,
        manifest_hash=release.manifest_hash,
        policy_revision_id=release.policy_revision_id,
        released_at=release.released_at,
        withdrawn_at=release.withdrawn_at,
        withdrawal_reason=release.withdrawal_reason,
    )


def _delivery_item(
    row: app.domains.academy.models.AcademyReleaseProjection,
) -> schemas.DeliveryItem:
    return schemas.DeliveryItem(
        release_id=row.release_id,
        work_id=row.work_id,
        work_slug=row.work_slug,
        kind=row.kind,
        program_slug=row.program_slug,
        release_number=row.release_number,
        title=row.title,
        summary=row.summary,
        manifest_hash=row.manifest_hash,
        released_at=row.released_at,
        withdrawn_at=row.withdrawn_at,
        withdrawal_reason=row.withdrawal_reason,
    )


# ── Authoring ─────────────────────────────────────────────────────────────────


@router.post("/spaces/{space_id}/works", status_code=201)
async def create_work(
    space_id: str,
    payload: schemas.WorkCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.WorkRead:
    work = await service.create_work(
        session, space_id=space_id, actor_id=owner.actor_id, payload=payload
    )
    return _work_read(work)


@router.get("/spaces/{space_id}/works")
async def list_works(
    space_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> list[schemas.WorkRead]:
    works = await service.list_works(session, space_id=space_id, actor_id=owner.actor_id)
    return [_work_read(work) for work in works]


@router.get("/works/{work_id}")
async def get_work(
    work_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.WorkRead:
    work = await service.get_work(session, work_id=work_id, actor_id=owner.actor_id)
    return _work_read(work)


@router.patch("/works/{work_id}")
async def update_work(
    work_id: str,
    payload: schemas.WorkUpdate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.WorkRead:
    work = await service.update_work(
        session, work_id=work_id, actor_id=owner.actor_id, payload=payload
    )
    return _work_read(work)


@router.post("/works/{work_id}/revisions", status_code=201)
async def create_revision(
    work_id: str,
    payload: schemas.RevisionCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.RevisionRead:
    revision = await service.create_revision(
        session, work_id=work_id, actor_id=owner.actor_id, payload=payload
    )
    return _revision_read(revision)


@router.get("/works/{work_id}/revisions")
async def list_revisions(
    work_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> list[schemas.RevisionRead]:
    revisions = await service.list_revisions(session, work_id=work_id, actor_id=owner.actor_id)
    return [_revision_read(revision) for revision in revisions]


@router.post("/revisions/{revision_id}/claims", status_code=201)
async def add_claim(
    revision_id: str,
    payload: schemas.ClaimCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.ClaimRead:
    claim_revision = await service.add_claim(
        session, revision_id=revision_id, actor_id=owner.actor_id, payload=payload
    )
    return schemas.ClaimRead(
        claim_id=claim_revision.claim_id,
        claim_revision_id=claim_revision.id,
        canonical_key=payload.canonical_key,
        statement=claim_revision.statement,
        epistemic_level=claim_revision.epistemic_level,
        claim_state=claim_revision.claim_state,
        context_role=claim_revision.context_role,
        origin=claim_revision.origin,
    )


@router.post("/revisions/{revision_id}/relations", status_code=201)
async def add_relation(
    revision_id: str,
    payload: schemas.RelationCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> dict[str, str]:
    relation = await service.add_relation(
        session, revision_id=revision_id, actor_id=owner.actor_id, payload=payload
    )
    return {"id": relation.id, "predicate": relation.predicate}


@router.post("/revisions/{revision_id}/sources", status_code=201)
async def add_source_link(
    revision_id: str,
    payload: schemas.SourceLinkCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> dict[str, str]:
    link = await service.add_source_link(
        session, revision_id=revision_id, actor_id=owner.actor_id, payload=payload
    )
    return {"id": link.id}


@router.post("/revisions/{revision_id}/contributors", status_code=201)
async def add_contribution(
    revision_id: str,
    payload: schemas.ContributionCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> dict[str, str]:
    contribution = await service.add_contribution(
        session, revision_id=revision_id, actor_id=owner.actor_id, payload=payload
    )
    return {"id": contribution.id}


@router.post("/works/{work_id}/releases", status_code=201)
async def create_release(
    work_id: str,
    payload: schemas.ReleaseCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.ReleaseRead:
    release = await service.create_release(
        session, work_id=work_id, actor_id=owner.actor_id, payload=payload
    )
    return _release_read(release)


@router.post("/releases/{release_id}/withdraw")
async def withdraw_release(
    release_id: str,
    payload: schemas.WithdrawRequest,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.ReleaseRead:
    release = await service.withdraw_release(
        session, release_id=release_id, actor_id=owner.actor_id, reason=payload.reason
    )
    return _release_read(release)


# ── Public delivery (projection only) ────────────────────────────────────────


@public_router.get("/delivery/catalog")
@_limiter.limit("60/minute")
async def delivery_catalog(
    request: fastapi.Request,
    space: str = "dot-academy",
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> list[schemas.DeliveryItem]:
    rows = await service.delivery_catalog(session, space_slug=space)
    return [_delivery_item(row) for row in rows]


@public_router.get("/delivery/works/{work_id}")
@_limiter.limit("120/minute")
async def delivery_latest(
    request: fastapi.Request,
    work_id: str,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> fastapi.Response:
    row = await service.delivery_latest(session, work_id=work_id)
    return _delivery_response(row, alias=True)


@public_router.get("/delivery/works/{work_id}/releases/{number}")
@_limiter.limit("120/minute")
async def delivery_release(
    request: fastapi.Request,
    work_id: str,
    number: int,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> fastapi.Response:
    row = await service.delivery_release(session, work_id=work_id, number=number)
    return _delivery_response(row, alias=False)


@public_router.get("/delivery/body/{body_key:path}", include_in_schema=False)
@_limiter.limit("120/minute")
async def delivery_body(request: fastapi.Request, body_key: str) -> fastapi.Response:
    # Only released bodies live under releases/; drafts are structurally out of reach.
    if not body_key.startswith("academy/") or "/releases/" not in body_key or ".." in body_key:
        raise fastapi.HTTPException(status_code=404, detail="Not found.")
    try:
        text = await app.integrations.object_store.get_object_store().get_text(body_key)
    except app.integrations.object_store.ObjectNotFoundError:
        raise fastapi.HTTPException(status_code=404, detail="Body not found.") from None
    except app.integrations.object_store.ObjectStoreError as exc:
        raise fastapi.HTTPException(status_code=503, detail="Body could not be read.") from exc
    return fastapi.Response(
        content=text,
        media_type="text/markdown; charset=utf-8",
        headers={"Cache-Control": "public, max-age=86400, immutable"},
    )


def _delivery_response(
    row: app.domains.academy.models.AcademyReleaseProjection, *, alias: bool
) -> fastapi.responses.JSONResponse:
    import json

    if row.withdrawn_at is not None:
        # A tombstone, not a disappearance (P7).
        body = {
            "withdrawn": True,
            "title": row.title,
            "work_id": row.work_id,
            "release_number": row.release_number,
            "withdrawn_at": row.withdrawn_at.isoformat(),
            "reason": row.withdrawal_reason,
        }
        return fastapi.responses.JSONResponse(
            content=body, headers={"Cache-Control": "public, max-age=300"}
        )

    payload = {
        "manifest": json.loads(json.dumps(row.manifest, default=str)),
        "body_ref": row.body_ref,
        "resolved_release_number": row.release_number,
        "is_latest_alias": alias,
    }
    # Versioned releases are immutable; the alias stays short-lived (doc 14 §10).
    cache = (
        "public, max-age=300, stale-while-revalidate=600"
        if alias
        else "public, max-age=86400, immutable"
    )
    return fastapi.responses.JSONResponse(
        content=payload, headers={"Cache-Control": cache, "ETag": f'"{row.manifest_hash}"'}
    )
