import json as _json
import typing
import xml.etree.ElementTree as _ET

import fastapi
import slowapi
import slowapi.util
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.core.config
import app.db.models
import app.db.session
import app.domains.publication
import app.domains.publication.schemas
import app.domains.publication.service
import app.integrations.object_store

router = fastapi.APIRouter(
    prefix="/v1/publications",
    tags=["publications"],
    # Binds every request in this router to the caller's tenant (ADR-0011).
    dependencies=[fastapi.Depends(app.db.session.get_tenant_session)],
)

# Sealed releases the member chose to publish. Unauthenticated by design, and
# therefore never given a tenant context by the caller (ADR-0011 §public delivery).
public_router = fastapi.APIRouter(prefix="/v1/publications", tags=["publications"])

# Limiter instance is attached to app.state by main.py; resolved per-request.
_limiter = slowapi.Limiter(key_func=slowapi.util.get_remote_address)


@public_router.get("/delivery/{owner_id}/{project_slug}/manifest")
@_limiter.limit("60/minute")
async def get_public_delivery_manifest(
    request: fastapi.Request,
    owner_id: str,
    project_slug: str,
    version: typing.Annotated[int | None, fastapi.Query(ge=1)] = None,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> fastapi.Response:
    data: dict[
        str, typing.Any
    ] = await app.domains.publication.service.get_public_delivery_manifest(
        session, owner_id, project_slug, version
    )
    # Immutable manifests are versioned; cache 1 h at edge, 24 h in CDN.
    cache = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600"
    return fastapi.Response(
        content=_json.dumps(data),
        media_type="application/json",
        headers={"Cache-Control": cache, "Vary": "Accept-Encoding"},
    )


@public_router.get("/delivery/body/{body_key:path}", include_in_schema=False)
@_limiter.limit("120/minute")
async def get_section_body(
    request: fastapi.Request,
    body_key: str,
) -> fastapi.Response:
    # Only serve keys under the releases/ namespace to prevent path traversal.
    if not body_key.startswith("releases/") or ".." in body_key:
        raise fastapi.HTTPException(status_code=404, detail="Not found.")
    try:
        text: str = await app.integrations.object_store.get_object_store().get_text(body_key)
    except app.integrations.object_store.ObjectNotFoundError:
        raise fastapi.HTTPException(status_code=404, detail="Body not found.") from None
    except app.integrations.object_store.ObjectStoreError as exc:
        raise fastapi.HTTPException(status_code=503, detail="Body could not be read.") from exc
    return fastapi.Response(
        content=text,
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "public, max-age=86400, immutable"},
    )


@public_router.get("/sitemap.xml", include_in_schema=False)
async def sitemap(
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
    settings: app.core.config.Settings = fastapi.Depends(app.core.config.get_settings),
) -> fastapi.Response:
    rows: list[
        tuple[app.db.models.PublicationProject, app.db.models.PublicationRelease]
    ] = await app.domains.publication.service.list_public_releases(session)
    urlset: _ET.Element = _ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    base: str = settings.FRONTEND_URL.rstrip("/")
    for project, release in rows:
        url: _ET.Element = _ET.SubElement(urlset, "url")
        _ET.SubElement(url, "loc").text = f"{base}/read/{project.owner_id}/{project.slug}"
        if release.published_at:
            _ET.SubElement(url, "lastmod").text = release.published_at.strftime("%Y-%m-%d")
        _ET.SubElement(url, "changefreq").text = "monthly"
        _ET.SubElement(url, "priority").text = "0.8"
    xml_bytes: bytes = (
        b'<?xml version="1.0" encoding="UTF-8"?>\n'
        + _ET.tostring(urlset, encoding="unicode").encode()
    )
    return fastapi.Response(
        content=xml_bytes,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600, s-maxage=86400"},
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
) -> app.db.models.PublicationProject:
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
) -> list[app.db.models.PublicationProject]:
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
) -> app.db.models.PublicationProject:
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
) -> app.db.models.PublicationProject:
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
) -> app.db.models.PublicationSection:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.publication.service.create_section(session, owner, project_id, payload)


@router.get(
    "/projects/{project_id}/sections",
    response_model=list[app.domains.publication.schemas.PublicationSectionRead],
)
async def list_sections(
    project_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> list[app.db.models.PublicationSection]:
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
) -> app.db.models.PublicationSection:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.publication.service.update_section(session, owner, section_id, payload)


@router.put(
    "/sections/{section_id}/body",
    response_model=app.domains.publication.schemas.PublicationSectionRead,
)
async def set_section_body(
    section_id: str,
    request: fastapi.Request,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> app.db.models.PublicationSection:
    app.auth.dependencies.ensure_write_scope(owner)
    raw: bytes = await request.body()
    if not raw:
        raise fastapi.HTTPException(status_code=422, detail="Body must not be empty.")
    if len(raw) > 2_000_000:
        raise fastapi.HTTPException(status_code=413, detail="Body exceeds 2 MB limit.")
    try:
        body_text: str = raw.decode("utf-8")
    except UnicodeDecodeError as err:
        raise fastapi.HTTPException(status_code=422, detail="Body must be UTF-8 text.") from err
    return await app.domains.publication.service.set_section_body(
        session, owner, section_id, body_text
    )


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
) -> app.db.models.PublicationRevision:
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
    errors: list[str] = await app.domains.publication.service.validate_project(
        session, owner, project_id
    )
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
) -> app.db.models.PublicationRelease:
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
) -> list[app.db.models.PublicationRelease]:
    return await app.domains.publication.service.list_releases(session, owner, project_id)
