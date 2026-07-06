import typing

import fastapi
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.db.session
import app.domains.graph.schemas
import app.domains.graph.service

router = fastapi.APIRouter(prefix="/v1/graph", tags=["graph"])


@router.post(
    "/accounts", response_model=app.domains.graph.schemas.FootprintAccountRead, status_code=201
)
async def create_account(
    payload: app.domains.graph.schemas.FootprintAccountCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
):
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.graph.service.create_account(session, owner, payload)


@router.get("/accounts", response_model=list[app.domains.graph.schemas.FootprintAccountRead])
async def list_accounts(
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
):
    return await app.domains.graph.service.list_accounts(session, owner)


@router.post("/nodes", response_model=app.domains.graph.schemas.FootprintNodeRead, status_code=201)
async def create_node(
    payload: app.domains.graph.schemas.FootprintNodeCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
):
    app.auth.dependencies.ensure_write_scope(owner)
    return await app.domains.graph.service.create_node(session, owner, payload)


@router.post("/edges", response_model=app.domains.graph.schemas.FootprintEdgeRead, status_code=201)
async def create_edge(
    payload: app.domains.graph.schemas.FootprintEdgeCreate,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
):
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
):
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
):
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
):
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
):
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
):
    return await app.domains.graph.service.get_snapshot(
        session,
        owner,
        platform=platform,
        kind=kind,
        relation=relation,
        node_limit=node_limit,
        edge_limit=edge_limit,
    )
