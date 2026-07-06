import typing

import fastapi
import sqlalchemy.ext.asyncio

from app.db.models import PublicationProject
from app.db.models import PublicationSection
from app.db.models import PublicationRevision
from app.db.models import PublicationRelease
import app.auth.dependencies
import app.db.session
import app.domains.publication
import app.domains.publication.schemas
import app.domains.publication.service

router = fastapi.APIRouter(prefix="/v1/publications", tags=["publications"])


@router.get("/delivery/{owner_id}/{project_slug}/manifest")
async def get_public_delivery_manifest(
    owner_id: str,
    project_slug: str,
    version: typing.Annotated[int | None, fastapi.Query(ge=1)] = None,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> dict[str, typing.Any]:
    return await app.domains.publication.service.get_public_delivery_manifest(
        session, owner_id, project_slug, version
    )


@router.post(
    "/projects",
    response_model=app.domains.publication.schemas.PublicationProjectRead,
    status_code=201,
)
async def create_project(
    payload: app.domains.publication.schemas.PublicationProjectCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> PublicationProject:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.publication.service.create_project(session, owner, payload)


@router.get(
    "/projects", response_model=list[app.domains.publication.schemas.PublicationProjectRead]
)
async def list_projects(
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> list[PublicationProject]:
    return await app.domains.publication.service.list_projects(session, owner)


@router.get(
    "/projects/{project_id}", response_model=app.domains.publication.schemas.PublicationProjectRead
)
async def get_project(
    project_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> PublicationProject:
    return await app.domains.publication.service.get_project(session, owner, project_id)


@router.patch(
    "/projects/{project_id}", response_model=app.domains.publication.schemas.PublicationProjectRead
)
async def update_project(
    project_id: str,
    payload: app.domains.publication.schemas.PublicationProjectUpdate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> PublicationProject:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.publication.service.update_project(session, owner, project_id, payload)


@router.post(
    "/projects/{project_id}/sections",
    response_model=app.domains.publication.schemas.PublicationSectionRead,
    status_code=201,
)
async def create_section(
    project_id: str,
    payload: app.domains.publication.schemas.PublicationSectionCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> PublicationSection:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.publication.service.create_section(session, owner, project_id, payload)


@router.get(
    "/projects/{project_id}/sections",
    response_model=list[app.domains.publication.schemas.PublicationSectionRead]
)
async def list_sections(
    project_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> list[PublicationSection]:
    return await app.domains.publication.service.list_sections(session, owner, project_id)


@router.patch(
    "/sections/{section_id}", response_model=app.domains.publication.schemas.PublicationSectionRead
)
async def update_section(
    section_id: str,
    payload: app.domains.publication.schemas.PublicationSectionUpdate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> PublicationSection:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.publication.service.update_section(session, owner, section_id, payload)


@router.post(
    "/sections/{section_id}/revisions",
    response_model=app.domains.publication.schemas.PublicationRevisionRead,
    status_code=201,
)
async def create_revision(
    section_id: str,
    payload: app.domains.publication.schemas.PublicationRevisionCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> PublicationRevision:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.publication.service.create_revision(
        session, owner, section_id, payload
    )


@router.post(
    "/projects/{project_id}/validate",
    response_model=app.domains.publication.schemas.PublicationValidationRead,
)
async def validate_project(
    project_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> app.domains.publication.schemas.PublicationValidationRead:
    errors: list[str] = await app.domains.publication.service.validate_project(session, owner, project_id)
    return app.domains.publication.schemas.PublicationValidationRead(
        valid=not errors, errors=errors
    )


@router.post(
    "/projects/{project_id}/releases",
    response_model=app.domains.publication.schemas.PublicationReleaseRead,
    status_code=201,
)
async def create_release(
    project_id: str,
    payload: app.domains.publication.schemas.PublicationReleaseCreate,
    idempotency_key: typing.Annotated[
        str | None,
        fastapi.Header(alias="Idempotency-Key", max_length=128),
    ] = None,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> PublicationRelease:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.publication.service.create_release(
        session, owner, project_id, payload, idempotency_key
    )


@router.get("/projects/{project_id}/releases/{version}/manifest")
async def get_release_manifest(
    project_id: str,
    version: typing.Annotated[int, fastapi.Path(ge=1)],
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> dict[str, typing.Any]:
    return await app.domains.publication.service.get_release_manifest(
        session, owner, project_id, version
    )


@router.get(
    "/projects/{project_id}/releases",
    response_model=list[app.domains.publication.schemas.PublicationReleaseRead],
)
async def list_releases(
    project_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> list[PublicationRelease]:
    return await app.domains.publication.service.list_releases(session, owner, project_id)
