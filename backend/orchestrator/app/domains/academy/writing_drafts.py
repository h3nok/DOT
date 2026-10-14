"""Atomic writing saves, conflict protection, and retry-safe private revisions."""

from __future__ import annotations

import hashlib
import json

import fastapi
import pydantic
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.domains.academy.models as models
import app.domains.academy.policy as policy
import app.domains.academy.schemas as schemas
import app.domains.academy.service as service
import app.domains.academy.writing_media as media
import app.domains.academy.writing_schemas as writing
import app.integrations.object_store


def claim_ready(claim: dict) -> bool:
    try:
        source = pydantic.HttpUrl(claim.get("source", "").strip())
        source_valid = bool(source.host)
    except ValueError:
        source_valid = False
    return bool(
        claim.get("statement", "").strip()
        and claim.get("level")
        and (claim.get("origin") != "sourced" or source_valid)
    )


def validate_release(body: str, metadata: dict) -> None:
    if not metadata:
        return  # Older revisions use the existing kernel's claim validation.
    claims = [
        claim
        for claim in metadata.get("claims", [])
        if any(claim.get(key) for key in ("statement", "level", "source"))
    ]
    if not claims or not all(claim_ready(claim) for claim in claims):
        raise fastapi.HTTPException(
            status_code=409,
            detail=(
                "Finish the material claim declarations and save a new revision before publishing."
            ),
        )
    media.release_assets(body, metadata)


async def _uploaded_bytes(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    work: models.AcademyWork,
    assets: list[writing.DraftAsset],
    actor_id: str,
) -> list[tuple[str, bytes]]:
    result = []
    store = app.integrations.object_store.get_object_store()
    for asset in assets:
        if asset.data_base64 is not None:
            data = media.decode_upload(asset)
        else:
            source, source_work = await service._get_revision_scoped(  # noqa: SLF001
                session,
                asset.source_revision_id or "",
                actor_id,
            )
            if source_work.id != work.id:
                raise fastapi.HTTPException(
                    status_code=404, detail="Saved artwork not found in this work."
                )
            saved = next(
                (
                    item
                    for item in (source.editor_metadata or {}).get("assets", [])
                    if item["path"] == asset.path
                ),
                None,
            )
            if saved is None:
                raise fastapi.HTTPException(status_code=404, detail="Saved artwork not found.")
            data = await store.get_bytes(saved["object_key"])
            if hashlib.sha256(data).hexdigest() != saved["sha256"]:
                raise fastapi.HTTPException(
                    status_code=503, detail="Saved artwork could not be verified."
                )
        result.append((asset.path, data))
    return result


async def save_draft(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    work_id: str,
    actor_id: str,
    payload: writing.DraftSave,
) -> models.AcademyRevision:
    work = await service._get_work_scoped(session, work_id, actor_id)  # noqa: SLF001
    await policy.require_authority(
        session,
        space_id=work.academy_space_id,
        actor_id=actor_id,
        action="create_revision",
        program_id=work.program_id,
    )
    # Serialize saves for this work. SQLite tests exercise conflict/retry behavior;
    # PostgreSQL additionally enforces this lock across API instances.
    await session.execute(
        sqlalchemy.select(models.AcademyWork.id)
        .where(models.AcademyWork.id == work.id)
        .with_for_update()
    )
    revisions = await service.list_revisions(session, work_id=work.id, actor_id=actor_id)
    request_hash = hashlib.sha256(
        json.dumps(payload.model_dump(mode="json"), sort_keys=True).encode()
    ).hexdigest()
    for revision in revisions:
        metadata = revision.editor_metadata or {}
        if metadata.get("request_id") == str(payload.request_id):
            if metadata.get("request_hash") != request_hash:
                raise fastapi.HTTPException(
                    status_code=409,
                    detail="This save identity was already used for different content.",
                )
            return revision
    latest = max(revisions, key=lambda revision: revision.revision_number, default=None)
    if (latest.id if latest else None) != payload.base_revision_id:
        raise fastapi.HTTPException(
            status_code=409,
            detail=(
                "A newer draft has been saved. Download your unsaved Markdown, "
                "then reopen the work before saving again."
            ),
        )
    uploads = await _uploaded_bytes(session, work, payload.assets, actor_id)
    assets = await media.store_assets(work, uploads)
    claims = [claim.model_dump() for claim in payload.claims]
    revision = await service.create_revision(
        session,
        work_id=work.id,
        actor_id=actor_id,
        payload=schemas.RevisionCreate(
            title=payload.title, summary=payload.summary or None, body_markdown=payload.body
        ),
        editor_metadata={
            "schema": "dot.writing-draft.v2",
            "request_id": str(payload.request_id),
            "request_hash": request_hash,
            "claims": claims,
            "presentation": payload.presentation.model_dump(mode="json"),
            "assets": assets,
        },
        commit=False,
    )
    for index, claim in enumerate(claims):
        if not claim_ready(claim):
            continue  # The incomplete declaration remains in private metadata.
        key = f"claim-{index + 1}"
        await service.add_claim(
            session,
            revision_id=revision.id,
            actor_id=actor_id,
            payload=schemas.ClaimCreate(
                canonical_key=key,
                statement=claim["statement"],
                epistemic_level=claim["level"],
                origin=claim["origin"],
            ),
            commit=False,
        )
        if claim["origin"] == "sourced":
            await service.add_source_link(
                session,
                revision_id=revision.id,
                actor_id=actor_id,
                payload=schemas.SourceLinkCreate(
                    claim_key=key,
                    external_uri=claim["source"].strip(),
                ),
                commit=False,
            )
    await session.commit()
    return revision
