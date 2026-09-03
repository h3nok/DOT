"""Academy kernel service: works, revisions, claims, releases (doc 15 Phase 1).

Every state change: authority check → transition → audit event → outbox row,
in one transaction. Public delivery reads only the release projection table.
"""

from __future__ import annotations

import datetime
import hashlib
import typing

import fastapi
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.domains.academy.context as context
import app.domains.academy.models as models
import app.domains.academy.policy as policy
import app.domains.academy.schemas as schemas
import app.integrations.object_store

MANIFEST_SCHEMA_VERSION = 1

#: Reserved until released experiment results exist (doc 15 Phase 5).
_EXPERIMENT_PREDICATES = frozenset({"supports", "does_not_support"})


def _not_found(what: str) -> fastapi.HTTPException:
    return fastapi.HTTPException(status_code=404, detail=f"{what} not found.")


def _conflict(detail: str) -> fastapi.HTTPException:
    return fastapi.HTTPException(status_code=409, detail=detail)


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


async def _record(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    space_id: str,
    aggregate_type: str,
    aggregate_id: str,
    event_type: str,
    actor_id: str,
    policy_revision_id: str | None,
    payload: dict | None = None,
    request_id: str | None = None,
) -> None:
    """Audit event + outbox row in the caller's transaction."""

    session.add(
        models.AcademyEvent(
            academy_space_id=space_id,
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            event_type=event_type,
            actor_id=actor_id,
            policy_revision_id=policy_revision_id,
            payload=payload,
            request_id=request_id,
        )
    )
    session.add(
        models.AcademyOutbox(
            academy_space_id=space_id,
            topic=event_type,
            payload={"aggregate_type": aggregate_type, "aggregate_id": aggregate_id},
        )
    )


# ── Space + work resolution ──────────────────────────────────────────────────


async def _get_space(
    session: sqlalchemy.ext.asyncio.AsyncSession, space_id: str
) -> models.AcademySpace:
    space = await session.get(models.AcademySpace, space_id)
    if space is None or space.status != "active":
        raise _not_found("Academy space")
    return space


async def _get_work_scoped(
    session: sqlalchemy.ext.asyncio.AsyncSession, work_id: str, actor_id: str
) -> models.AcademyWork:
    """PK fetch, then bind the transaction to the work's own space.

    The space is derived from the row, never from client input; a caller
    outside that space fails the subsequent authority check. On Postgres the
    actor binding means RLS already hides works outside the actor's spaces.
    """

    await context.bind_actor(session, actor_id)
    work = await session.get(models.AcademyWork, work_id)
    if work is None:
        raise _not_found("Work")
    await context.bind_space(session, work.academy_space_id, actor_id)
    return work


# ── Works ─────────────────────────────────────────────────────────────────────


async def create_work(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    space_id: str,
    actor_id: str,
    payload: schemas.WorkCreate,
) -> models.AcademyWork:
    await _get_space(session, space_id)
    await context.bind_space(session, space_id, actor_id)

    program: models.AcademyProgram | None = None
    if payload.program_slug is not None:
        program = (
            await session.execute(
                sqlalchemy.select(models.AcademyProgram).where(
                    models.AcademyProgram.academy_space_id == space_id,
                    models.AcademyProgram.slug == payload.program_slug,
                )
            )
        ).scalar_one_or_none()
        if program is None:
            raise _not_found("Program")

    authority = await policy.require_authority(
        session,
        space_id=space_id,
        actor_id=actor_id,
        action="create_work",
        program_id=program.id if program else None,
    )

    existing = (
        await session.execute(
            sqlalchemy.select(models.AcademyWork.id).where(
                models.AcademyWork.academy_space_id == space_id,
                models.AcademyWork.canonical_slug == payload.canonical_slug,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise _conflict("Slug already used in this space; slugs are never recycled.")

    work = models.AcademyWork(
        academy_space_id=space_id,
        kind=payload.kind,
        canonical_slug=payload.canonical_slug,
        program_id=program.id if program else None,
        created_by=actor_id,
    )
    session.add(work)
    await session.flush()
    await _record(
        session,
        space_id=space_id,
        aggregate_type="work",
        aggregate_id=work.id,
        event_type="academy.work.created",
        actor_id=actor_id,
        policy_revision_id=authority.policy_revision_id,
        payload={"kind": work.kind, "slug": work.canonical_slug},
    )
    await session.commit()
    return work


async def list_works(
    session: sqlalchemy.ext.asyncio.AsyncSession, *, space_id: str, actor_id: str
) -> list[models.AcademyWork]:
    await _get_space(session, space_id)
    await context.bind_space(session, space_id, actor_id)
    await policy.require_authority(
        session, space_id=space_id, actor_id=actor_id, action="read_private"
    )
    rows = (
        await session.execute(
            sqlalchemy.select(models.AcademyWork)
            .where(models.AcademyWork.academy_space_id == space_id)
            .order_by(models.AcademyWork.created_at)
        )
    ).scalars()
    return list(rows)


async def get_work(
    session: sqlalchemy.ext.asyncio.AsyncSession, *, work_id: str, actor_id: str
) -> models.AcademyWork:
    work = await _get_work_scoped(session, work_id, actor_id)
    await policy.require_authority(
        session, space_id=work.academy_space_id, actor_id=actor_id, action="read_private"
    )
    return work


async def update_work(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    work_id: str,
    actor_id: str,
    payload: schemas.WorkUpdate,
) -> models.AcademyWork:
    work = await _get_work_scoped(session, work_id, actor_id)
    authority = await policy.require_authority(
        session,
        space_id=work.academy_space_id,
        actor_id=actor_id,
        action="update_work",
        program_id=work.program_id,
    )
    if work.lifecycle_state in {"released", "withdrawn", "retired"} and payload.canonical_slug:
        raise _conflict("A released work's slug is permanent (P2: citations never break).")
    if payload.canonical_slug is not None:
        work.canonical_slug = payload.canonical_slug
    if payload.program_slug is not None:
        program = (
            await session.execute(
                sqlalchemy.select(models.AcademyProgram).where(
                    models.AcademyProgram.academy_space_id == work.academy_space_id,
                    models.AcademyProgram.slug == payload.program_slug,
                )
            )
        ).scalar_one_or_none()
        if program is None:
            raise _not_found("Program")
        work.program_id = program.id
    await _record(
        session,
        space_id=work.academy_space_id,
        aggregate_type="work",
        aggregate_id=work.id,
        event_type="academy.work.updated",
        actor_id=actor_id,
        policy_revision_id=authority.policy_revision_id,
    )
    await session.commit()
    return work


# ── Revisions ─────────────────────────────────────────────────────────────────


async def create_revision(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    work_id: str,
    actor_id: str,
    payload: schemas.RevisionCreate,
) -> models.AcademyRevision:
    """Freeze an immutable revision: body to write-once storage, hash recorded."""

    work = await _get_work_scoped(session, work_id, actor_id)
    authority = await policy.require_authority(
        session,
        space_id=work.academy_space_id,
        actor_id=actor_id,
        action="create_revision",
        program_id=work.program_id,
    )

    next_number = (
        (
            await session.execute(
                sqlalchemy.select(
                    sqlalchemy.func.max(models.AcademyRevision.revision_number)
                ).where(
                    models.AcademyRevision.work_id == work.id,
                    models.AcademyRevision.academy_space_id == work.academy_space_id,
                )
            )
        ).scalar_one()
        or 0
    ) + 1

    content_hash = _sha256(payload.body_markdown)
    # Id and body key are fixed before insert: a frozen revision row is never
    # modified afterwards (the ORM immutability guard enforces this).
    revision_id = app.db.models.make_id("arev")
    body_key = f"academy/{work.academy_space_id}/revisions/{revision_id}/{content_hash}/body.md"
    revision = models.AcademyRevision(
        id=revision_id,
        academy_space_id=work.academy_space_id,
        work_id=work.id,
        revision_number=next_number,
        schema_version=payload.schema_version,
        title=payload.title,
        summary=payload.summary,
        body_ref=body_key,
        content_hash=content_hash,
        language=payload.language,
        change_note=payload.change_note,
        created_by=actor_id,
    )
    session.add(revision)
    await session.flush()

    store = app.integrations.object_store.get_object_store()
    await store.put_bytes(body_key, payload.body_markdown.encode("utf-8"))

    await _record(
        session,
        space_id=work.academy_space_id,
        aggregate_type="revision",
        aggregate_id=revision.id,
        event_type="academy.revision.frozen",
        actor_id=actor_id,
        policy_revision_id=authority.policy_revision_id,
        payload={"work_id": work.id, "revision_number": next_number},
    )
    await session.commit()
    return revision


async def list_revisions(
    session: sqlalchemy.ext.asyncio.AsyncSession, *, work_id: str, actor_id: str
) -> list[models.AcademyRevision]:
    work = await _get_work_scoped(session, work_id, actor_id)
    await policy.require_authority(
        session, space_id=work.academy_space_id, actor_id=actor_id, action="read_private"
    )
    rows = (
        await session.execute(
            sqlalchemy.select(models.AcademyRevision)
            .where(
                models.AcademyRevision.work_id == work.id,
                models.AcademyRevision.academy_space_id == work.academy_space_id,
            )
            .order_by(models.AcademyRevision.revision_number)
        )
    ).scalars()
    return list(rows)


async def _get_revision_scoped(
    session: sqlalchemy.ext.asyncio.AsyncSession, revision_id: str, actor_id: str
) -> tuple[models.AcademyRevision, models.AcademyWork]:
    await context.bind_actor(session, actor_id)
    revision = await session.get(models.AcademyRevision, revision_id)
    if revision is None:
        raise _not_found("Revision")
    work = await _get_work_scoped(session, revision.work_id, actor_id)
    return revision, work


# ── Claims, relations, sources, contributions ────────────────────────────────


async def add_claim(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    revision_id: str,
    actor_id: str,
    payload: schemas.ClaimCreate,
) -> models.AcademyClaimRevision:
    revision, work = await _get_revision_scoped(session, revision_id, actor_id)
    authority = await policy.require_authority(
        session,
        space_id=work.academy_space_id,
        actor_id=actor_id,
        action="annotate_revision",
        program_id=work.program_id,
    )

    claim = (
        await session.execute(
            sqlalchemy.select(models.AcademyClaim).where(
                models.AcademyClaim.work_id == work.id,
                models.AcademyClaim.canonical_key == payload.canonical_key,
                models.AcademyClaim.academy_space_id == work.academy_space_id,
            )
        )
    ).scalar_one_or_none()
    if claim is None:
        claim = models.AcademyClaim(
            academy_space_id=work.academy_space_id,
            work_id=work.id,
            canonical_key=payload.canonical_key,
        )
        session.add(claim)
        await session.flush()

    claim_revision = models.AcademyClaimRevision(
        academy_space_id=work.academy_space_id,
        claim_id=claim.id,
        academy_revision_id=revision.id,
        statement=payload.statement,
        context_role=payload.context_role,
        epistemic_level=payload.epistemic_level,
        claim_state=payload.claim_state,
        origin=payload.origin,
        origin_note=payload.origin_note,
        assumptions=payload.assumptions,
        failure_conditions=payload.failure_conditions,
    )
    session.add(claim_revision)
    await _record(
        session,
        space_id=work.academy_space_id,
        aggregate_type="claim",
        aggregate_id=claim.id,
        event_type="academy.claim.stated",
        actor_id=actor_id,
        policy_revision_id=authority.policy_revision_id,
        payload={"revision_id": revision.id, "level": payload.epistemic_level},
    )
    await session.commit()
    return claim_revision


async def add_relation(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    revision_id: str,
    actor_id: str,
    payload: schemas.RelationCreate,
) -> models.AcademyRelation:
    revision, work = await _get_revision_scoped(session, revision_id, actor_id)
    authority = await policy.require_authority(
        session,
        space_id=work.academy_space_id,
        actor_id=actor_id,
        action="annotate_revision",
        program_id=work.program_id,
    )
    if payload.predicate in _EXPERIMENT_PREDICATES:
        raise _conflict(f"'{payload.predicate}' requires a released experiment result (Phase 5).")
    if payload.predicate == "objects_to" and not (
        payload.target_work_id or payload.target_claim_id or payload.target_external
    ):
        raise _conflict("'objects_to' requires an exact target claim or release.")

    source_claim_id: str | None = None
    if payload.source_claim_key is not None:
        source_claim = (
            await session.execute(
                sqlalchemy.select(models.AcademyClaim).where(
                    models.AcademyClaim.work_id == work.id,
                    models.AcademyClaim.canonical_key == payload.source_claim_key,
                    models.AcademyClaim.academy_space_id == work.academy_space_id,
                )
            )
        ).scalar_one_or_none()
        if source_claim is None:
            raise _not_found("Source claim")
        source_claim_id = source_claim.id

    if payload.target_work_id is not None:
        target = await session.get(models.AcademyWork, payload.target_work_id)
        if target is None or target.academy_space_id != work.academy_space_id:
            # Cross-space citation is explicit and external, never an FK (P5, P14).
            raise _conflict(
                "Target work is not in this space; cite it via target_external instead."
            )

    relation = models.AcademyRelation(
        academy_space_id=work.academy_space_id,
        asserted_in_revision_id=revision.id,
        source_work_id=work.id,
        source_claim_id=source_claim_id,
        predicate=payload.predicate,
        target_work_id=payload.target_work_id,
        target_claim_id=payload.target_claim_id,
        target_external=payload.target_external,
        note=payload.note,
    )
    session.add(relation)
    await _record(
        session,
        space_id=work.academy_space_id,
        aggregate_type="relation",
        aggregate_id=work.id,
        event_type="academy.relation.asserted",
        actor_id=actor_id,
        policy_revision_id=authority.policy_revision_id,
        payload={"predicate": payload.predicate},
    )
    await session.commit()
    return relation


async def add_source_link(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    revision_id: str,
    actor_id: str,
    payload: schemas.SourceLinkCreate,
) -> models.AcademySourceLink:
    revision, work = await _get_revision_scoped(session, revision_id, actor_id)
    authority = await policy.require_authority(
        session,
        space_id=work.academy_space_id,
        actor_id=actor_id,
        action="annotate_revision",
        program_id=work.program_id,
    )

    claim_revision_id: str | None = None
    if payload.claim_key is not None:
        row = (
            await session.execute(
                sqlalchemy.select(models.AcademyClaimRevision)
                .join(
                    models.AcademyClaim,
                    models.AcademyClaim.id == models.AcademyClaimRevision.claim_id,
                )
                .where(
                    models.AcademyClaim.canonical_key == payload.claim_key,
                    models.AcademyClaimRevision.academy_revision_id == revision.id,
                    models.AcademyClaimRevision.academy_space_id == work.academy_space_id,
                )
            )
        ).scalar_one_or_none()
        if row is None:
            raise _not_found("Claim on this revision")
        claim_revision_id = row.id

    link = models.AcademySourceLink(
        academy_space_id=work.academy_space_id,
        academy_revision_id=revision.id,
        claim_revision_id=claim_revision_id,
        source_object_id=payload.source_object_id,
        source_version_id=payload.source_version_id,
        source_anchor_id=payload.source_anchor_id,
        external_uri=payload.external_uri,
        external_identifier=payload.external_identifier,
        relation=payload.relation,
        locator=payload.locator,
    )
    session.add(link)
    await _record(
        session,
        space_id=work.academy_space_id,
        aggregate_type="source_link",
        aggregate_id=revision.id,
        event_type="academy.source.linked",
        actor_id=actor_id,
        policy_revision_id=authority.policy_revision_id,
    )
    await session.commit()
    return link


async def add_contribution(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    revision_id: str,
    actor_id: str,
    payload: schemas.ContributionCreate,
) -> models.AcademyContribution:
    revision, work = await _get_revision_scoped(session, revision_id, actor_id)
    authority = await policy.require_authority(
        session,
        space_id=work.academy_space_id,
        actor_id=actor_id,
        action="annotate_revision",
        program_id=work.program_id,
    )
    contribution = models.AcademyContribution(
        academy_space_id=work.academy_space_id,
        academy_revision_id=revision.id,
        member_id=payload.member_id,
        display_name_snapshot=payload.display_name,
        role=payload.role,
        degree=payload.degree,
        orcid_snapshot=payload.orcid,
        affiliation_snapshot=payload.affiliation,
    )
    session.add(contribution)
    await _record(
        session,
        space_id=work.academy_space_id,
        aggregate_type="contribution",
        aggregate_id=revision.id,
        event_type="academy.contribution.recorded",
        actor_id=actor_id,
        policy_revision_id=authority.policy_revision_id,
    )
    await session.commit()
    return contribution


# ── Release ───────────────────────────────────────────────────────────────────


async def _validate_release(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    work: models.AcademyWork,
    revision: models.AcademyRevision,
) -> list[models.AcademyClaimRevision]:
    """Release validation (P3, P4): claims classified, provenance explicit."""

    claim_revisions = (
        (
            await session.execute(
                sqlalchemy.select(models.AcademyClaimRevision).where(
                    models.AcademyClaimRevision.academy_revision_id == revision.id,
                    models.AcademyClaimRevision.academy_space_id == work.academy_space_id,
                )
            )
        )
        .scalars()
        .all()
    )
    if not claim_revisions:
        raise _conflict("Release blocked: no material claims are annotated on this revision (P3).")
    for claim_revision in claim_revisions:
        if claim_revision.origin == "sourced":
            link = (
                await session.execute(
                    sqlalchemy.select(models.AcademySourceLink.id).where(
                        models.AcademySourceLink.claim_revision_id == claim_revision.id,
                        models.AcademySourceLink.academy_space_id == work.academy_space_id,
                    )
                )
            ).scalar_one_or_none()
            if link is None:
                raise _conflict(
                    "Release blocked: a claim declares itself sourced but has no source link (P4)."
                )
    return list(claim_revisions)


async def create_release(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    work_id: str,
    actor_id: str,
    payload: schemas.ReleaseCreate,
) -> models.AcademyRelease:
    """validate → preparing → build artifacts → released, atomically recorded.

    A failed preparation is retained (`failed`) and nothing becomes public.
    """

    work = await _get_work_scoped(session, work_id, actor_id)
    authority = await policy.require_authority(
        session,
        space_id=work.academy_space_id,
        actor_id=actor_id,
        action="release",
        program_id=work.program_id,
    )

    revision = await session.get(models.AcademyRevision, payload.revision_id)
    if revision is None or revision.work_id != work.id:
        raise _not_found("Revision of this work")

    claim_revisions = await _validate_release(session, work, revision)

    previous = (
        (
            await session.execute(
                sqlalchemy.select(models.AcademyRelease)
                .where(
                    models.AcademyRelease.work_id == work.id,
                    models.AcademyRelease.academy_space_id == work.academy_space_id,
                )
                .order_by(models.AcademyRelease.release_number.desc())
            )
        )
        .scalars()
        .first()
    )
    next_number = (previous.release_number if previous else 0) + 1

    release = models.AcademyRelease(
        academy_space_id=work.academy_space_id,
        work_id=work.id,
        revision_id=revision.id,
        release_number=next_number,
        release_status="preparing",
        visibility=payload.visibility,
        policy_revision_id=authority.policy_revision_id,
        prepared_by=actor_id,
        supersedes_release_id=(
            previous.id if previous and previous.release_status == "released" else None
        ),
    )
    session.add(release)
    await session.flush()

    space = await _get_space(session, work.academy_space_id)
    program_slug: str | None = None
    if work.program_id is not None:
        program = await session.get(models.AcademyProgram, work.program_id)
        program_slug = program.slug if program else None

    store = app.integrations.object_store.get_object_store()
    release_prefix = f"academy/{work.academy_space_id}/releases/{work.id}/v{next_number}"
    try:
        body_markdown = await store.get_text(revision.body_ref)
        if _sha256(body_markdown) != revision.content_hash:
            raise RuntimeError("Frozen body no longer matches its recorded hash.")

        manifest: dict[str, typing.Any] = {
            "schema_version": MANIFEST_SCHEMA_VERSION,
            "space": {"id": space.id, "slug": space.slug},
            "work": {"id": work.id, "kind": work.kind, "slug": work.canonical_slug},
            "release": {"number": next_number, "id": release.id, "visibility": payload.visibility},
            "revision": {
                "id": revision.id,
                "number": revision.revision_number,
                "content_hash": revision.content_hash,
                "language": revision.language,
            },
            "title": revision.title,
            "summary": revision.summary,
            "claims": [
                {
                    "claim_id": claim_revision.claim_id,
                    "statement": claim_revision.statement,
                    "epistemic_level": claim_revision.epistemic_level,
                    "claim_state": claim_revision.claim_state,
                    "context_role": claim_revision.context_role,
                    "origin": claim_revision.origin,
                }
                for claim_revision in claim_revisions
            ],
            "policy_revision_id": authority.policy_revision_id,
        }
        manifest_json = _canonical_json(manifest)
        manifest_hash = _sha256(manifest_json)

        await store.put_bytes(f"{release_prefix}/body.md", body_markdown.encode("utf-8"))
        await store.put_bytes(f"{release_prefix}/manifest.json", manifest_json.encode("utf-8"))
    except Exception as exc:  # noqa: BLE001 — any preparation failure must be recorded, not raised past audit
        release.release_status = "failed"
        release.failure_reason = str(exc)
        await _record(
            session,
            space_id=work.academy_space_id,
            aggregate_type="release",
            aggregate_id=release.id,
            event_type="academy.release.failed",
            actor_id=actor_id,
            policy_revision_id=authority.policy_revision_id,
        )
        await session.commit()
        raise fastapi.HTTPException(
            status_code=502, detail="Release preparation failed; nothing became public."
        ) from exc

    now = datetime.datetime.now(datetime.UTC)
    release.release_status = "released"
    release.manifest_ref = f"{release_prefix}/manifest.json"
    release.manifest_hash = manifest_hash
    release.released_by = actor_id
    release.released_at = now
    work.lifecycle_state = "released"
    if payload.visibility == "public":
        work.visibility = "public"

    session.add(
        models.AcademyReleaseProjection(
            release_id=release.id,
            academy_space_id=space.id,
            space_slug=space.slug,
            work_id=work.id,
            work_slug=work.canonical_slug,
            kind=work.kind,
            program_slug=program_slug,
            release_number=next_number,
            revision_id=revision.id,
            title=revision.title,
            summary=revision.summary,
            body_ref=f"{release_prefix}/body.md",
            body_media_type=revision.body_media_type,
            manifest=manifest,
            manifest_hash=manifest_hash,
            released_at=now,
            supersedes_release_id=release.supersedes_release_id,
        )
    )
    await _record(
        session,
        space_id=work.academy_space_id,
        aggregate_type="release",
        aggregate_id=release.id,
        event_type="academy.release.published",
        actor_id=actor_id,
        policy_revision_id=authority.policy_revision_id,
        payload={"work_id": work.id, "release_number": next_number, "hash": manifest_hash},
    )
    await session.commit()
    return release


async def withdraw_release(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    release_id: str,
    actor_id: str,
    reason: str,
) -> models.AcademyRelease:
    await context.bind_actor(session, actor_id)
    release = await session.get(models.AcademyRelease, release_id)
    if release is None:
        raise _not_found("Release")
    work = await _get_work_scoped(session, release.work_id, actor_id)
    authority = await policy.require_authority(
        session,
        space_id=work.academy_space_id,
        actor_id=actor_id,
        action="withdraw",
        program_id=work.program_id,
    )
    if release.release_status != "released":
        raise _conflict("Only a released release can be withdrawn.")

    now = datetime.datetime.now(datetime.UTC)
    release.release_status = "withdrawn"
    release.withdrawn_at = now
    release.withdrawal_reason = reason

    # The projection row becomes a tombstone, never a deletion (P7).
    projection = await session.get(models.AcademyReleaseProjection, release.id)
    if projection is not None:
        projection.withdrawn_at = now
        projection.withdrawal_reason = reason

    still_public = (
        await session.execute(
            sqlalchemy.select(models.AcademyRelease.id).where(
                models.AcademyRelease.work_id == work.id,
                models.AcademyRelease.academy_space_id == work.academy_space_id,
                models.AcademyRelease.release_status == "released",
            )
        )
    ).scalar_one_or_none()
    if still_public is None:
        work.lifecycle_state = "withdrawn"

    await _record(
        session,
        space_id=work.academy_space_id,
        aggregate_type="release",
        aggregate_id=release.id,
        event_type="academy.release.withdrawn",
        actor_id=actor_id,
        policy_revision_id=authority.policy_revision_id,
        payload={"reason": reason},
    )
    await session.commit()
    return release


# ── Public delivery (projection only — P9 by construction) ───────────────────


async def delivery_catalog(
    session: sqlalchemy.ext.asyncio.AsyncSession, *, space_slug: str
) -> list[models.AcademyReleaseProjection]:
    subquery = (
        sqlalchemy.select(
            models.AcademyReleaseProjection.work_id,
            sqlalchemy.func.max(models.AcademyReleaseProjection.release_number).label("latest"),
        )
        .where(
            models.AcademyReleaseProjection.space_slug == space_slug,
            models.AcademyReleaseProjection.withdrawn_at.is_(None),
        )
        .group_by(models.AcademyReleaseProjection.work_id)
        .subquery()
    )
    rows = (
        await session.execute(
            sqlalchemy.select(models.AcademyReleaseProjection)
            .join(
                subquery,
                sqlalchemy.and_(
                    models.AcademyReleaseProjection.work_id == subquery.c.work_id,
                    models.AcademyReleaseProjection.release_number == subquery.c.latest,
                ),
            )
            .order_by(models.AcademyReleaseProjection.released_at)
        )
    ).scalars()
    return list(rows)


async def delivery_latest(
    session: sqlalchemy.ext.asyncio.AsyncSession, *, work_id: str
) -> models.AcademyReleaseProjection:
    row = (
        (
            await session.execute(
                sqlalchemy.select(models.AcademyReleaseProjection)
                .where(models.AcademyReleaseProjection.work_id == work_id)
                .order_by(models.AcademyReleaseProjection.release_number.desc())
            )
        )
        .scalars()
        .first()
    )
    if row is None:
        raise _not_found("Released work")
    return row


async def delivery_release(
    session: sqlalchemy.ext.asyncio.AsyncSession, *, work_id: str, number: int
) -> models.AcademyReleaseProjection:
    row = (
        await session.execute(
            sqlalchemy.select(models.AcademyReleaseProjection).where(
                models.AcademyReleaseProjection.work_id == work_id,
                models.AcademyReleaseProjection.release_number == number,
            )
        )
    ).scalar_one_or_none()
    if row is None:
        raise _not_found("Release")
    return row


def _canonical_json(payload: dict) -> str:
    import json

    return json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
