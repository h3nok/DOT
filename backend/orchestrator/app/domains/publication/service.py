import datetime
import re
import typing

import fastapi
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.db.models
import app.domains.publication.schemas
import app.integrations.object_store

PUBLICATION_RELEASE_WORKFLOW = "publication_release"


def slugify(value: str) -> str:
    normalized: str = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return normalized or "untitled"


async def create_project(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    payload: app.domains.publication.schemas.PublicationProjectCreate,
) -> app.db.models.PublicationProject:
    project = app.db.models.PublicationProject(
        owner_id=owner.owner_id,
        type=payload.type,
        title=payload.title,
        slug=payload.slug or slugify(payload.title),
        visibility=payload.visibility,
        meta=payload.meta,
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project


async def list_projects(
    session: sqlalchemy.ext.asyncio.AsyncSession, owner: app.auth.dependencies.OwnerContext
) -> list[app.db.models.PublicationProject]:
    result: sqlalchemy.Result[tuple[app.db.models.PublicationProject]] = await session.execute(
        sqlalchemy.select(app.db.models.PublicationProject)
        .where(app.db.models.PublicationProject.owner_id == owner.owner_id)
        .order_by(app.db.models.PublicationProject.created_at.desc())
    )
    return list(result.scalars().all())


async def get_project(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    project_id: str,
) -> app.db.models.PublicationProject:
    result: sqlalchemy.Result[tuple[app.db.models.PublicationProject]] = await session.execute(
        sqlalchemy.select(app.db.models.PublicationProject).where(
            app.db.models.PublicationProject.id == project_id,
            app.db.models.PublicationProject.owner_id == owner.owner_id,
        )
    )
    project: app.db.models.PublicationProject | None = result.scalar_one_or_none()
    if project is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND, detail="Project not found."
        )
    return project


async def update_project(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    project_id: str,
    payload: app.domains.publication.schemas.PublicationProjectUpdate,
) -> app.db.models.PublicationProject:
    project: app.db.models.PublicationProject = await get_project(session, owner, project_id)
    updates: dict[str, typing.Any] = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(project, field, value)
    await session.commit()
    await session.refresh(project)
    return project


async def create_section(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    project_id: str,
    payload: app.domains.publication.schemas.PublicationSectionCreate,
) -> app.db.models.PublicationSection:
    await get_project(session, owner, project_id)
    section = app.db.models.PublicationSection(
        project_id=project_id,
        parent_id=payload.parent_id,
        section_order=payload.order,
        title=payload.title,
        body_ref=payload.body_ref,
        meta=payload.meta,
    )
    session.add(section)
    if payload.body_ref:
        session.add(
            app.db.models.PublicationRevision(
                section=section,
                editor_id=owner.actor_id,
                body_ref=payload.body_ref,
                message="Initial section body.",
            )
        )
    await session.commit()
    await session.refresh(section)
    return section


async def list_sections(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    project_id: str,
) -> list[app.db.models.PublicationSection]:
    await get_project(session, owner, project_id)
    result: sqlalchemy.Result[tuple[app.db.models.PublicationSection]] = await session.execute(
        sqlalchemy.select(app.db.models.PublicationSection)
        .where(app.db.models.PublicationSection.project_id == project_id)
        .order_by(app.db.models.PublicationSection.section_order.asc())
    )
    return list(result.scalars().all())


async def get_section(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    section_id: str,
) -> app.db.models.PublicationSection:
    result: sqlalchemy.Result[tuple[app.db.models.PublicationSection]] = await session.execute(
        sqlalchemy.select(app.db.models.PublicationSection)
        .join(app.db.models.PublicationProject)
        .where(
            app.db.models.PublicationSection.id == section_id,
            app.db.models.PublicationProject.owner_id == owner.owner_id,
        )
    )
    section: app.db.models.PublicationSection | None = result.scalar_one_or_none()
    if section is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND, detail="Section not found."
        )
    return section


async def update_section(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    section_id: str,
    payload: app.domains.publication.schemas.PublicationSectionUpdate,
) -> app.db.models.PublicationSection:
    section: app.db.models.PublicationSection = await get_section(session, owner, section_id)
    updates: dict[str, typing.Any] = payload.model_dump(exclude_unset=True)
    if "order" in updates:
        section.section_order = updates.pop("order")
    body_ref: typing.Any | None = updates.get("body_ref")
    for field, value in updates.items():
        setattr(section, field, value)
    if body_ref:
        session.add(
            app.db.models.PublicationRevision(
                section_id=section.id,
                editor_id=owner.actor_id,
                body_ref=body_ref,
                message="Section body updated.",
            )
        )
    await session.commit()
    await session.refresh(section)
    return section


async def create_revision(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    section_id: str,
    payload: app.domains.publication.schemas.PublicationRevisionCreate,
) -> app.db.models.PublicationRevision:
    section: app.db.models.PublicationSection = await get_section(session, owner, section_id)
    section.body_ref = payload.body_ref
    revision = app.db.models.PublicationRevision(
        section_id=section_id,
        editor_id=owner.actor_id,
        body_ref=payload.body_ref,
        message=payload.message,
    )
    session.add(revision)
    await session.commit()
    await session.refresh(revision)
    return revision


async def set_section_body(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    section_id: str,
    body_text: str,
) -> app.db.models.PublicationSection:
    """Store draft body text in the object store and point the section at it."""
    section: app.db.models.PublicationSection = await get_section(session, owner, section_id)
    key: str = f"drafts/{section.project_id}/sections/{section.id}.md"
    try:
        await app.integrations.object_store.get_object_store().put_bytes(
            key, body_text.encode("utf-8")
        )
    except app.integrations.object_store.ObjectStoreError as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Section body could not be persisted.",
        ) from exc
    section.body_ref = key
    session.add(
        app.db.models.PublicationRevision(
            section_id=section.id,
            editor_id=owner.actor_id,
            body_ref=key,
            message="Section body uploaded.",
        )
    )
    await session.commit()
    await session.refresh(section)
    return section


async def validate_project(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    project_id: str,
) -> list[str]:
    await get_project(session, owner, project_id)
    result: sqlalchemy.Result[tuple[app.db.models.PublicationSection]] = await session.execute(
        sqlalchemy.select(app.db.models.PublicationSection)
        .where(app.db.models.PublicationSection.project_id == project_id)
        .order_by(app.db.models.PublicationSection.section_order.asc())
    )
    sections: list[app.db.models.PublicationSection] = list(result.scalars().all())
    errors: list[str] = []
    if not sections:
        errors.append("Project must have at least one section.")
    for section in sections:
        if not section.title.strip():
            errors.append(f"Section {section.id} is missing a title.")
        if not section.body_ref:
            errors.append(f"Section {section.id} is missing a body reference.")
    return errors


async def list_release_sections(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    project_id: str,
) -> list[app.db.models.PublicationSection]:
    result: sqlalchemy.Result[tuple[app.db.models.PublicationSection]] = await session.execute(
        sqlalchemy.select(app.db.models.PublicationSection)
        .where(app.db.models.PublicationSection.project_id == project_id)
        .order_by(
            app.db.models.PublicationSection.section_order.asc(),
            app.db.models.PublicationSection.created_at.asc(),
        )
    )
    return list(result.scalars().all())


def scoped_idempotency_key(project_id: str, idempotency_key: str | None) -> str | None:
    key: str = idempotency_key.strip() if idempotency_key else ""
    if not key:
        return None
    return f"{PUBLICATION_RELEASE_WORKFLOW}:{project_id}:{key}"


def serialize_timestamp(value: datetime.datetime | None) -> str | None:
    return value.isoformat() if value else None


def build_release_manifest(
    project: app.db.models.PublicationProject,
    release: app.db.models.PublicationRelease,
    sections: list[app.db.models.PublicationSection],
    generated_at: datetime.datetime,
    body_keys: dict[str, str] | None = None,
) -> dict[str, typing.Any]:
    return {
        "schema_version": "publication.release.v1",
        "generated_at": generated_at.isoformat(),
        "project": {
            "id": project.id,
            "owner_id": project.owner_id,
            "type": project.type,
            "title": project.title,
            "slug": project.slug,
            "status": project.status,
            "visibility": project.visibility,
            "meta": project.meta,
        },
        "release": {
            "id": release.id,
            "project_id": release.project_id,
            "version": release.version,
            "slug": release.slug,
            "status": release.status,
            "manifest_key": release.manifest_key,
            "rendered_at": serialize_timestamp(release.rendered_at),
            "published_at": serialize_timestamp(release.published_at),
            "revoked_at": serialize_timestamp(release.revoked_at),
        },
        "sections": [
            {
                "id": section.id,
                "parent_id": section.parent_id,
                "order": section.section_order,
                "title": section.title,
                "body_ref": (body_keys or {}).get(section.id, section.body_ref),
                "status": section.status,
                "meta": section.meta,
            }
            for section in sections
        ],
    }


async def _resolve_section_body(section: app.db.models.PublicationSection) -> str:
    """Return the draft body text: fetch from the store for key refs, else inline."""
    ref: str = section.body_ref or ""
    if ref.startswith(("drafts/", "releases/")):
        return await app.integrations.object_store.get_object_store().get_text(ref)
    return ref


async def snapshot_release_bodies(
    owner_id: str,
    project_slug: str,
    version: int,
    sections: list[app.db.models.PublicationSection],
) -> dict[str, str]:
    """Copy section bodies into the immutable release namespace.

    Returns a map of section id → release-scoped body key. After this, a
    release is fully self-contained: mutating drafts can never change it.
    """
    store: (
        app.integrations.object_store.FilesystemObjectStore
        | app.integrations.object_store.S3ObjectStore
    ) = app.integrations.object_store.get_object_store()
    body_keys: dict[str, str] = {}
    for section in sections:
        body_text: str = await _resolve_section_body(section)
        key: str = (
            f"releases/{owner_id}/{project_slug}/v{version}/sections/"
            f"{section.section_order:03d}-{section.id}.md"
        )
        await store.put_bytes(key, body_text.encode("utf-8"))
        body_keys[section.id] = key
    return body_keys


async def get_idempotent_release(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    project_id: str,
    idempotency_key: str | None,
) -> app.db.models.PublicationRelease | None:
    if idempotency_key is None:
        return None

    result: sqlalchemy.Result[tuple[app.db.models.OrchestratorRun]] = await session.execute(
        sqlalchemy.select(app.db.models.OrchestratorRun)
        .where(
            app.db.models.OrchestratorRun.owner_id == owner.owner_id,
            app.db.models.OrchestratorRun.workflow_type == PUBLICATION_RELEASE_WORKFLOW,
            app.db.models.OrchestratorRun.idempotency_key == idempotency_key,
        )
        .order_by(app.db.models.OrchestratorRun.created_at.desc())
    )
    run: app.db.models.OrchestratorRun | None = result.scalars().first()
    if run is None:
        return None

    if (run.input_ref or {}).get("project_id") != project_id:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_409_CONFLICT,
            detail="Idempotency key was already used for a different publication project.",
        )

    release_id = (run.output_ref or {}).get("release_id")
    if not release_id:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_409_CONFLICT,
            detail="Idempotent publication run is missing release metadata.",
        )

    release: app.db.models.PublicationRelease | None = await session.get(
        app.db.models.PublicationRelease, release_id
    )
    if release is None or release.project_id != project_id:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_409_CONFLICT,
            detail="Idempotent publication run points to a missing release.",
        )
    return release


async def create_release(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    project_id: str,
    payload: app.domains.publication.schemas.PublicationReleaseCreate,
    idempotency_key: str | None = None,
) -> app.db.models.PublicationRelease:
    project: app.db.models.PublicationProject = await get_project(session, owner, project_id)
    scoped_key: str | None = scoped_idempotency_key(project_id, idempotency_key)
    existing_release: app.db.models.PublicationRelease | None = await get_idempotent_release(
        session, owner, project_id, scoped_key
    )
    if existing_release is not None:
        return existing_release

    errors: list[str] = await validate_project(session, owner, project_id)
    if errors:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_409_CONFLICT,
            detail={"message": "Project is not ready to publish.", "errors": errors},
        )
    sections: list[app.db.models.PublicationSection] = await list_release_sections(
        session, project_id
    )

    version_result: sqlalchemy.Result[tuple[int]] = await session.execute(
        sqlalchemy.select(
            sqlalchemy.func.coalesce(
                sqlalchemy.func.max(app.db.models.PublicationRelease.version), 0
            )
        ).where(app.db.models.PublicationRelease.project_id == project_id)
    )
    version: int = int(version_result.scalar_one()) + 1
    release_slug: str = payload.slug or project.slug
    manifest_key: str = f"releases/{owner.owner_id}/{project.slug}/v{version}/manifest.json"
    now: datetime.datetime = datetime.datetime.now(datetime.UTC)
    release = app.db.models.PublicationRelease(
        project_id=project_id,
        version=version,
        slug=release_slug,
        status="published",
        manifest_key=manifest_key,
        rendered_at=now,
        published_at=now,
    )
    session.add(release)
    await session.flush()

    run = app.db.models.OrchestratorRun(
        owner_id=owner.owner_id,
        workflow_type=PUBLICATION_RELEASE_WORKFLOW,
        status="succeeded",
        idempotency_key=scoped_key,
        requested_by=owner.actor_id,
        input_ref={"project_id": project_id, "slug": release_slug},
        output_ref={
            "release_id": release.id,
            "release_version": version,
            "manifest_key": manifest_key,
        },
        started_at=now,
        completed_at=now,
    )
    project.status = "published"
    session.add(run)

    try:
        body_keys: dict[str, str] = await snapshot_release_bodies(
            owner.owner_id, project.slug, version, sections
        )
        manifest: dict[str, typing.Any] = build_release_manifest(
            project, release, sections, now, body_keys
        )
        await app.integrations.object_store.get_object_store().put_json(manifest_key, manifest)
    except app.integrations.object_store.ObjectStoreError as exc:
        await session.rollback()
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Release manifest could not be persisted.",
        ) from exc

    await session.commit()
    await session.refresh(release)
    return release


async def list_releases(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    project_id: str,
) -> list[app.db.models.PublicationRelease]:
    await get_project(session, owner, project_id)
    result: sqlalchemy.Result[tuple[app.db.models.PublicationRelease]] = await session.execute(
        sqlalchemy.select(app.db.models.PublicationRelease)
        .where(app.db.models.PublicationRelease.project_id == project_id)
        .order_by(app.db.models.PublicationRelease.version.desc())
    )
    return list(result.scalars().all())


async def get_release_manifest(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    project_id: str,
    version: int,
) -> dict[str, typing.Any]:
    await get_project(session, owner, project_id)
    result: sqlalchemy.Result[tuple[app.db.models.PublicationRelease]] = await session.execute(
        sqlalchemy.select(app.db.models.PublicationRelease).where(
            app.db.models.PublicationRelease.project_id == project_id,
            app.db.models.PublicationRelease.version == version,
        )
    )
    release: app.db.models.PublicationRelease | None = result.scalar_one_or_none()
    if release is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND, detail="Release not found."
        )

    try:
        return await app.integrations.object_store.get_object_store().get_json(release.manifest_key)
    except app.integrations.object_store.ObjectNotFoundError as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Manifest not found.",
        ) from exc
    except app.integrations.object_store.ObjectStoreError as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Release manifest could not be read.",
        ) from exc


async def get_public_delivery_manifest(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner_id: str,
    project_slug: str,
    version: int | None = None,
) -> dict[str, typing.Any]:
    project_result: sqlalchemy.Result[
        tuple[app.db.models.PublicationProject]
    ] = await session.execute(
        sqlalchemy.select(app.db.models.PublicationProject).where(
            app.db.models.PublicationProject.owner_id == owner_id,
            app.db.models.PublicationProject.slug == project_slug,
            app.db.models.PublicationProject.status == "published",
            app.db.models.PublicationProject.visibility == "public",
        )
    )
    project: app.db.models.PublicationProject | None = project_result.scalar_one_or_none()
    if project is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND, detail="Delivery not found."
        )

    release_query: sqlalchemy.Select[tuple[app.db.models.PublicationRelease]] = sqlalchemy.select(
        app.db.models.PublicationRelease
    ).where(
        app.db.models.PublicationRelease.project_id == project.id,
        app.db.models.PublicationRelease.status == "published",
    )
    if version is not None:
        release_query: sqlalchemy.Select[tuple[app.db.models.PublicationRelease]] = (
            release_query.where(app.db.models.PublicationRelease.version == version)
        )
    release_result: sqlalchemy.Result[
        tuple[app.db.models.PublicationRelease]
    ] = await session.execute(
        release_query.order_by(app.db.models.PublicationRelease.version.desc())
    )
    release: app.db.models.PublicationRelease | None = release_result.scalars().first()
    if release is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND, detail="Delivery not found."
        )

    try:
        return await app.integrations.object_store.get_object_store().get_json(release.manifest_key)
    except app.integrations.object_store.ObjectNotFoundError as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Delivery manifest not found.",
        ) from exc
    except app.integrations.object_store.ObjectStoreError as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Delivery manifest could not be read.",
        ) from exc


async def list_public_releases(
    session: sqlalchemy.ext.asyncio.AsyncSession,
) -> list[tuple[app.db.models.PublicationProject, app.db.models.PublicationRelease]]:
    """Return all published public releases for sitemap generation."""
    result: sqlalchemy.Result[
        tuple[app.db.models.PublicationProject, app.db.models.PublicationRelease]
    ] = await session.execute(
        sqlalchemy.select(app.db.models.PublicationProject, app.db.models.PublicationRelease)
        .join(
            app.db.models.PublicationRelease,
            app.db.models.PublicationRelease.project_id == app.db.models.PublicationProject.id,
        )
        .where(
            app.db.models.PublicationProject.status == "published",
            app.db.models.PublicationProject.visibility == "public",
            app.db.models.PublicationRelease.status == "published",
            app.db.models.PublicationRelease.revoked_at.is_(None),
        )
        .order_by(app.db.models.PublicationRelease.published_at.desc())
    )
    return list(result.all())
