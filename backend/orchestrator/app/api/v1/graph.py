from datetime import datetime
import typing

import fastapi
import sqlalchemy.ext.asyncio

from app.db.models import FootprintAccount, FootprintEdge, FootprintImport, FootprintNode
import app.auth.dependencies
import app.db.session
import app.domains.graph.profile
import app.domains.graph.schemas
import app.domains.graph.service

router = fastapi.APIRouter(
    prefix="/v1/graph",
    tags=["graph"],
    # Binds every request in this router to the caller's tenant (ADR-0011).
    dependencies=[fastapi.Depends(app.db.session.get_tenant_session)],
)

# The published profile tree is readable by anyone, so it never takes a tenant
# context from the caller (ADR-0011 §public delivery).
public_router = fastapi.APIRouter(prefix="/v1/graph", tags=["graph"])


@public_router.get("/profile", response_model=app.domains.graph.schemas.ProfileGraphRead)
async def get_profile_graph(
    owner_id: typing.Annotated[str, fastapi.Query(min_length=1, max_length=128)],
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> app.domains.graph.schemas.ProfileGraphRead:
    graph, updated_at = await app.domains.graph.profile.read_profile_graph(session, owner_id)
    return app.domains.graph.schemas.ProfileGraphRead(
        owner_id=owner_id, graph=graph, updated_at=updated_at
    )


@router.put("/profile", response_model=app.domains.graph.schemas.ProfileGraphRead)
async def put_profile_graph(
    payload: app.domains.graph.schemas.ProfileGraphWrite,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> app.domains.graph.schemas.ProfileGraphRead:
    app.auth.dependencies.ensure_write_scope(owner)
    updated_at: datetime = await app.domains.graph.profile.replace_profile_graph(
        session, owner, payload.graph
    )
    return app.domains.graph.schemas.ProfileGraphRead(
        owner_id=owner.owner_id, graph=payload.graph, updated_at=updated_at
    )


@router.post(
    "/accounts", response_model=app.domains.graph.schemas.FootprintAccountRead, status_code=201
)
async def create_account(
    payload: app.domains.graph.schemas.FootprintAccountCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> FootprintAccount:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.graph.service.create_account(session, owner, payload)


@router.get("/accounts", response_model=list[app.domains.graph.schemas.FootprintAccountRead])
async def list_accounts(
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> list[FootprintAccount]:
    return await app.domains.graph.service.list_accounts(session, owner)


@router.post("/nodes", response_model=app.domains.graph.schemas.FootprintNodeRead, status_code=201)
async def create_node(
    payload: app.domains.graph.schemas.FootprintNodeCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> FootprintNode:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.graph.service.create_node(session, owner, payload)


@router.post("/edges", response_model=app.domains.graph.schemas.FootprintEdgeRead, status_code=201)
async def create_edge(
    payload: app.domains.graph.schemas.FootprintEdgeCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> FootprintEdge:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.graph.service.create_edge(session, owner, payload)


@router.post(
    "/imports", response_model=app.domains.graph.schemas.FootprintImportRead, status_code=201
)
async def create_import(
    payload: app.domains.graph.schemas.FootprintImportCreate,
    idempotency_key: typing.Annotated[
        str | None,
        fastapi.Header(alias="Idempotency-Key", max_length=128),
    ] = None,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> FootprintImport:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.graph.service.create_import(session, owner, payload, idempotency_key)


@router.get("/imports", response_model=list[app.domains.graph.schemas.FootprintImportRead])
async def list_imports(
    connector: typing.Annotated[str | None, fastapi.Query(max_length=64)] = None,
    status: typing.Annotated[str | None, fastapi.Query(max_length=32)] = None,
    limit: typing.Annotated[int, fastapi.Query(ge=1, le=100)] = 50,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> list[FootprintImport]:
    return await app.domains.graph.service.list_imports(
        session,
        owner,
        connector=connector,
        status=status,
        limit=limit,
    )


@router.get("/imports/{import_id}", response_model=app.domains.graph.schemas.FootprintImportRead)
async def get_import(
    import_id: str,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> FootprintImport:
    return await app.domains.graph.service.get_import(session, owner, import_id)


@router.post(
    "/imports/{import_id}/process",
    response_model=app.domains.graph.schemas.FootprintImportRead,
)
async def process_import(
    import_id: str,
    payload: app.domains.graph.schemas.FootprintImportProcessRequest | None = None,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> FootprintImport:
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.graph.service.process_import(
        session,
        owner,
        import_id,
        feed_xml=payload.feed_xml if payload else None,
    )


@router.get("/snapshot", response_model=app.domains.graph.schemas.FootprintGraphSnapshot)
async def get_snapshot(
    platform: typing.Annotated[str | None, fastapi.Query(max_length=64)] = None,
    kind: typing.Annotated[str | None, fastapi.Query(max_length=64)] = None,
    relation: typing.Annotated[str | None, fastapi.Query(max_length=64)] = None,
    node_limit: typing.Annotated[int, fastapi.Query(ge=1, le=1000)] = 250,
    edge_limit: typing.Annotated[int, fastapi.Query(ge=1, le=2000)] = 500,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> app.domains.graph.schemas.FootprintGraphSnapshot:
    return await app.domains.graph.service.get_snapshot(
        session,
        owner,
        platform=platform,
        kind=kind,
        relation=relation,
        node_limit=node_limit,
        edge_limit=edge_limit,
    )
