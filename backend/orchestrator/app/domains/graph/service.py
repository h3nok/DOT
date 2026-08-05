from __future__ import annotations

import asyncio
import datetime
import ipaddress
import socket
import typing
import urllib.parse

import fastapi
import httpx
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.core.http_client
import app.db.models
import app.domains.graph.schemas
import app.integrations.connectors.rss

FOOTPRINT_IMPORT_WORKFLOW = "footprint_import"
RSS_CONNECTORS: set[str] = {"rss", "substack"}
MAX_FEED_BYTES = 2_000_000
MAX_FEED_REDIRECTS = 3
FEED_ACCEPT_HEADER = (
    "application/rss+xml, application/atom+xml, application/xml, text/xml, "
    "text/plain;q=0.6, */*;q=0.2"
)
ALLOWED_FEED_CONTENT_TYPES: set[str] = {
    "application/rss+xml",
    "application/atom+xml",
    "application/xml",
    "text/xml",
    "text/plain",
}
RETRYABLE_FEED_STATUSES: set[int] = {429, 502, 503, 504}


async def create_account(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    payload: app.domains.graph.schemas.FootprintAccountCreate,
) -> app.db.models.FootprintAccount:
    result: sqlalchemy.Result[tuple[app.db.models.FootprintAccount]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintAccount).where(
            app.db.models.FootprintAccount.owner_id == owner.owner_id,
            app.db.models.FootprintAccount.platform == payload.platform,
            app.db.models.FootprintAccount.handle == payload.handle,
        )
    )
    existing: app.db.models.FootprintAccount | None = result.scalar_one_or_none()
    if existing is not None:
        if payload.display_name is not None:
            existing.display_name = payload.display_name
        if payload.profile_url is not None:
            existing.profile_url = payload.profile_url
        if payload.external_id is not None:
            existing.external_id = payload.external_id
        existing.auth_mode = payload.auth_mode
        existing.status = payload.status
        if payload.sync_cursor is not None:
            existing.sync_cursor = payload.sync_cursor
        await session.commit()
        await session.refresh(existing)
        return existing

    account = app.db.models.FootprintAccount(
        owner_id=owner.owner_id,
        platform=payload.platform,
        handle=payload.handle,
        display_name=payload.display_name,
        profile_url=payload.profile_url,
        external_id=payload.external_id,
        auth_mode=payload.auth_mode,
        status=payload.status,
        sync_cursor=payload.sync_cursor,
    )
    session.add(account)
    await session.commit()
    await session.refresh(account)
    return account


async def list_accounts(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
) -> list[app.db.models.FootprintAccount]:
    result: sqlalchemy.Result[tuple[app.db.models.FootprintAccount]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintAccount)
        .where(app.db.models.FootprintAccount.owner_id == owner.owner_id)
        .order_by(
            app.db.models.FootprintAccount.platform.asc(),
            app.db.models.FootprintAccount.handle.asc(),
        )
    )
    return list(result.scalars().all())


async def _get_owned_run(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner_id: str,
    run_id: str,
) -> app.db.models.OrchestratorRun | None:
    """Load a run by id within its tenant. Never fetch a tenant row by id alone."""

    result: sqlalchemy.Result[tuple[app.db.models.OrchestratorRun]] = await session.execute(
        sqlalchemy.select(app.db.models.OrchestratorRun).where(
            app.db.models.OrchestratorRun.id == run_id,
            app.db.models.OrchestratorRun.owner_id == owner_id,
        )
    )
    return result.scalar_one_or_none()


async def get_account(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    account_id: str,
) -> app.db.models.FootprintAccount:
    result: sqlalchemy.Result[tuple[app.db.models.FootprintAccount]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintAccount).where(
            app.db.models.FootprintAccount.id == account_id,
            app.db.models.FootprintAccount.owner_id == owner.owner_id,
        )
    )
    account: app.db.models.FootprintAccount | None = result.scalar_one_or_none()
    if account is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Footprint account not found.",
        )
    return account


async def get_import(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    import_id: str,
) -> app.db.models.FootprintImport:
    result: sqlalchemy.Result[tuple[app.db.models.FootprintImport]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintImport).where(
            app.db.models.FootprintImport.id == import_id,
            app.db.models.FootprintImport.owner_id == owner.owner_id,
        )
    )
    footprint_import: app.db.models.FootprintImport | None = result.scalar_one_or_none()
    if footprint_import is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Footprint import not found.",
        )
    return footprint_import


async def list_imports(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    *,
    connector: str | None = None,
    status: str | None = None,
    limit: int = 50,
) -> list[app.db.models.FootprintImport]:
    filters: list[typing.Any] = [app.db.models.FootprintImport.owner_id == owner.owner_id]
    if connector:
        filters.append(app.db.models.FootprintImport.connector == connector)
    if status:
        filters.append(app.db.models.FootprintImport.status == status)

    result: sqlalchemy.Result[tuple[app.db.models.FootprintImport]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintImport)
        .where(*filters)
        .order_by(app.db.models.FootprintImport.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def create_node(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    payload: app.domains.graph.schemas.FootprintNodeCreate,
) -> app.db.models.FootprintNode:
    node = app.db.models.FootprintNode(
        owner_id=owner.owner_id,
        kind=payload.kind,
        label=payload.label,
        platform=payload.platform,
        external_id=payload.external_id,
        source_ref=payload.source_ref,
        properties=payload.properties,
        visibility=payload.visibility,
        confidence=payload.confidence,
    )
    session.add(node)
    await session.commit()
    await session.refresh(node)
    return node


async def get_node(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    node_id: str,
) -> app.db.models.FootprintNode:
    result: sqlalchemy.Result[tuple[app.db.models.FootprintNode]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintNode).where(
            app.db.models.FootprintNode.id == node_id,
            app.db.models.FootprintNode.owner_id == owner.owner_id,
        )
    )
    node: app.db.models.FootprintNode | None = result.scalar_one_or_none()
    if node is None:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Footprint node not found.",
        )
    return node


async def list_nodes(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    *,
    platform: str | None = None,
    kind: str | None = None,
    limit: int = 250,
) -> list[app.db.models.FootprintNode]:
    filters: list[typing.Any] = [app.db.models.FootprintNode.owner_id == owner.owner_id]
    if platform:
        filters.append(app.db.models.FootprintNode.platform == platform)
    if kind:
        filters.append(app.db.models.FootprintNode.kind == kind)

    result: sqlalchemy.Result[tuple[app.db.models.FootprintNode]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintNode)
        .where(*filters)
        .order_by(app.db.models.FootprintNode.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def create_edge(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    payload: app.domains.graph.schemas.FootprintEdgeCreate,
) -> app.db.models.FootprintEdge:
    if payload.source_node_id == payload.target_node_id:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Footprint edge must connect two distinct nodes.",
        )

    source: app.db.models.FootprintNode = await get_node(session, owner, payload.source_node_id)
    target: app.db.models.FootprintNode = await get_node(session, owner, payload.target_node_id)
    now: datetime.datetime = datetime.datetime.now(datetime.UTC)
    edge = app.db.models.FootprintEdge(
        owner_id=owner.owner_id,
        source_node_id=source.id,
        target_node_id=target.id,
        relation=payload.relation,
        platform=payload.platform,
        weight=payload.weight,
        confidence=payload.confidence,
        evidence_ref=payload.evidence_ref,
        last_seen_at=now,
    )
    session.add(edge)
    await session.commit()
    await session.refresh(edge)
    return edge


async def upsert_node(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner_id: str,
    *,
    kind: str,
    label: str,
    platform: str,
    external_id: str,
    source_ref: dict[str, typing.Any],
    properties: dict[str, typing.Any] | None = None,
    visibility: str = "private",
    confidence: float = 1.0,
) -> app.db.models.FootprintNode:
    result: sqlalchemy.Result[tuple[app.db.models.FootprintNode]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintNode).where(
            app.db.models.FootprintNode.owner_id == owner_id,
            app.db.models.FootprintNode.platform == platform,
            app.db.models.FootprintNode.external_id == external_id,
        )
    )
    node: app.db.models.FootprintNode | None = result.scalar_one_or_none()
    now: datetime.datetime = datetime.datetime.now(datetime.UTC)
    if node is None:
        node = app.db.models.FootprintNode(
            owner_id=owner_id,
            kind=kind,
            label=label,
            platform=platform,
            external_id=external_id,
            source_ref=source_ref,
            properties=properties or {},
            visibility=visibility,
            confidence=confidence,
            last_seen_at=now,
        )
        session.add(node)
        await session.flush()
        return node

    node.kind = kind
    node.label = label
    node.source_ref = source_ref
    node.properties = properties or {}
    node.visibility = visibility
    node.confidence = confidence
    node.last_seen_at = now
    await session.flush()
    return node


async def upsert_edge(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner_id: str,
    *,
    source_node_id: str,
    target_node_id: str,
    relation: str,
    platform: str,
    weight: float = 1.0,
    confidence: float = 1.0,
    evidence_ref: dict[str, typing.Any] | None = None,
) -> app.db.models.FootprintEdge:
    result: sqlalchemy.Result[tuple[app.db.models.FootprintEdge]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintEdge).where(
            app.db.models.FootprintEdge.owner_id == owner_id,
            app.db.models.FootprintEdge.source_node_id == source_node_id,
            app.db.models.FootprintEdge.target_node_id == target_node_id,
            app.db.models.FootprintEdge.relation == relation,
            app.db.models.FootprintEdge.platform == platform,
        )
    )
    edge: app.db.models.FootprintEdge | None = result.scalar_one_or_none()
    now: datetime.datetime = datetime.datetime.now(datetime.UTC)
    if edge is None:
        edge = app.db.models.FootprintEdge(
            owner_id=owner_id,
            source_node_id=source_node_id,
            target_node_id=target_node_id,
            relation=relation,
            platform=platform,
            weight=weight,
            confidence=confidence,
            evidence_ref=evidence_ref,
            last_seen_at=now,
        )
        session.add(edge)
        await session.flush()
        return edge

    edge.weight = weight
    edge.confidence = confidence
    edge.evidence_ref = evidence_ref
    edge.last_seen_at = now
    await session.flush()
    return edge


async def list_edges(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    *,
    platform: str | None = None,
    relation: str | None = None,
    limit: int = 500,
) -> list[app.db.models.FootprintEdge]:
    filters: list[typing.Any] = [app.db.models.FootprintEdge.owner_id == owner.owner_id]
    if platform:
        filters.append(app.db.models.FootprintEdge.platform == platform)
    if relation:
        filters.append(app.db.models.FootprintEdge.relation == relation)

    result: sqlalchemy.Result[tuple[app.db.models.FootprintEdge]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintEdge)
        .where(*filters)
        .order_by(app.db.models.FootprintEdge.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def create_import(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    payload: app.domains.graph.schemas.FootprintImportCreate,
    idempotency_key: str | None = None,
) -> app.db.models.FootprintImport:
    account: app.db.models.FootprintAccount | None = None
    if payload.account_id:
        account = await get_account(session, owner, payload.account_id)

    scoped_key: str | None = (
        f"{FOOTPRINT_IMPORT_WORKFLOW}:{payload.connector}:{idempotency_key.strip()}"
        if idempotency_key and idempotency_key.strip()
        else None
    )
    if scoped_key:
        existing_result: sqlalchemy.Result[
            tuple[app.db.models.FootprintImport]
        ] = await session.execute(
            sqlalchemy.select(app.db.models.FootprintImport)
            .join(
                app.db.models.OrchestratorRun,
                app.db.models.FootprintImport.run_id == app.db.models.OrchestratorRun.id,
            )
            .where(
                app.db.models.FootprintImport.owner_id == owner.owner_id,
                app.db.models.OrchestratorRun.workflow_type == FOOTPRINT_IMPORT_WORKFLOW,
                app.db.models.OrchestratorRun.idempotency_key == scoped_key,
            )
            .order_by(app.db.models.FootprintImport.created_at.desc())
        )
        existing_import: app.db.models.FootprintImport | None = existing_result.scalars().first()
        if existing_import is not None:
            return existing_import

    run = app.db.models.OrchestratorRun(
        owner_id=owner.owner_id,
        workflow_type=FOOTPRINT_IMPORT_WORKFLOW,
        status="queued",
        idempotency_key=scoped_key,
        requested_by=owner.actor_id,
        input_ref={
            "connector": payload.connector,
            "import_mode": payload.import_mode,
            "account_id": account.id if account else None,
            "source_ref": payload.source_ref or {},
        },
    )
    session.add(run)
    await session.flush()

    footprint_import = app.db.models.FootprintImport(
        owner_id=owner.owner_id,
        account_id=account.id if account else None,
        run_id=run.id,
        connector=payload.connector,
        import_mode=payload.import_mode,
        status="queued",
        requested_by=owner.actor_id,
        source_ref=payload.source_ref,
        summary={
            "message": (
                "Import queued. Connector execution will normalize source items "
                "into footprint graph nodes and edges."
            ),
        },
    )
    session.add(footprint_import)
    await session.commit()
    await session.refresh(footprint_import)
    return footprint_import


def resolve_feed_url(
    footprint_import: app.db.models.FootprintImport,
    account: app.db.models.FootprintAccount | None,
) -> str:
    source_ref = footprint_import.source_ref or {}
    feed_url: str = str(source_ref.get("feed_url") or "").strip()
    if not feed_url and account and account.profile_url:
        feed_url: str = f"{account.profile_url.rstrip('/')}/feed"

    validate_feed_url(feed_url)
    return feed_url


def _is_blocked_network_address(value: str) -> bool:
    try:
        address: ipaddress.IPv4Address | ipaddress.IPv6Address = ipaddress.ip_address(value)
    except ValueError:
        return False

    return (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_multicast
        or address.is_reserved
        or address.is_unspecified
    )


def validate_feed_url(feed_url: str) -> None:
    parsed: urllib.parse.ParseResult = urllib.parse.urlparse(feed_url)
    host: str | None = parsed.hostname
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or not host:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="RSS import requires an http(s) feed_url.",
        )
    if parsed.username or parsed.password:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="RSS feed_url cannot include credentials.",
        )
    if host.lower() in {"localhost", "localhost.localdomain"} or _is_blocked_network_address(host):
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="RSS feed_url must resolve to a public network address.",
        )


async def assert_public_feed_target(feed_url: str) -> None:
    parsed: urllib.parse.ParseResult = urllib.parse.urlparse(feed_url)
    host: str | None = parsed.hostname
    if not host:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="RSS import requires an http(s) feed_url.",
        )

    try:
        default_port: int = 443 if parsed.scheme == "https" else 80
        addresses: list[tuple[int, int, int, str, tuple[str, int] | tuple[str, int, int, int]]] = await asyncio_getaddrinfo(host, parsed.port or default_port)
    except socket.gaierror as exc: socket.gaierror:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="RSS feed host could not be resolved.",
        ) from exc

    resolved_hosts: set[str] = {address[4][0] for address in addresses}
    has_blocked_address: bool = any(
        _is_blocked_network_address(address) for address in resolved_hosts
    )
    if not resolved_hosts or has_blocked_address:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="RSS feed_url must resolve to a public network address.",
        )


async def asyncio_getaddrinfo(
    host: str,
    port: int,
) -> list[tuple[int, int, int, str, tuple[str, int] | tuple[str, int, int, int]]]:
    return await asyncio.to_thread(socket.getaddrinfo, host, port, type=socket.SOCK_STREAM)


def _validate_feed_response_headers(response: httpx.Response) -> None:
    content_length = response.headers.get("content-length")
    try:
        declared_length: int | None = int(content_length) if content_length else None
    except ValueError:
        declared_length = None
    if declared_length and declared_length > MAX_FEED_BYTES:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="RSS feed is too large.",
        )

    content_type = response.headers.get("content-type", "").split(";")[0].strip().lower()
    if content_type and content_type not in ALLOWED_FEED_CONTENT_TYPES:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="RSS feed returned an unsupported content type.",
        )


async def _read_limited_feed_response(response: httpx.Response) -> str:
    body = bytearray()
    async for chunk in response.aiter_bytes():
        body.extend(chunk)
        if len(body) > MAX_FEED_BYTES:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="RSS feed is too large.",
            )
    return body.decode(response.encoding or "utf-8", errors="replace")


async def fetch_feed_xml(feed_url: str) -> str:
    current_url: str = feed_url
    async with app.core.http_client.create_service_client(
        "dot-orchestrator-rss",
        timeout=20.0,
        max_connections=10,
    ) as client: httpx.AsyncClient:
        for redirect_count in range(MAX_FEED_REDIRECTS + 1):
            validate_feed_url(current_url)
            await assert_public_feed_target(current_url)

            last_exc: Exception | None = None
            for attempt in range(3):
                try:
                    async with client.stream(
                        "GET",
                        current_url,
                        headers={"Accept": FEED_ACCEPT_HEADER},
                        follow_redirects=False,
                    ) as response: httpx.Response:
                        if response.status_code in {301, 302, 303, 307, 308}:
                            location = response.headers.get("location")
                            if not location:
                                raise fastapi.HTTPException(
                                    status_code=fastapi.status.HTTP_502_BAD_GATEWAY,
                                    detail="RSS feed redirect did not include a location.",
                                )
                            if redirect_count >= MAX_FEED_REDIRECTS:
                                raise fastapi.HTTPException(
                                    status_code=fastapi.status.HTTP_502_BAD_GATEWAY,
                                    detail="RSS feed redirected too many times.",
                                )
                            current_url: str = urllib.parse.urljoin(current_url, location)
                            break

                        if response.status_code in RETRYABLE_FEED_STATUSES and attempt < 2:
                            continue

                        _validate_feed_response_headers(response)
                        try:
                            response.raise_for_status()
                        except httpx.HTTPStatusError as exc: httpx.HTTPStatusError:
                            raise fastapi.HTTPException(
                                status_code=fastapi.status.HTTP_502_BAD_GATEWAY,
                                detail="RSS feed request failed.",
                            ) from exc
                        return await _read_limited_feed_response(response)
                except (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout) as exc: httpx.ConnectError | httpx.ConnectTimeout | httpx.ReadTimeout:
                    last_exc = exc
                    if attempt < 2:
                        continue
                    raise fastapi.HTTPException(
                        status_code=fastapi.status.HTTP_502_BAD_GATEWAY,
                        detail="RSS feed request failed.",
                    ) from exc
            else:
                if last_exc:
                    raise fastapi.HTTPException(
                        status_code=fastapi.status.HTTP_502_BAD_GATEWAY,
                        detail="RSS feed request failed.",
                    ) from last_exc

        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_502_BAD_GATEWAY,
            detail="RSS feed redirected too many times.",
        )


def _date_property(value: datetime.datetime | None) -> str | None:
    return value.isoformat() if value else None


async def _mark_import_failed(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    footprint_import: app.db.models.FootprintImport,
    *,
    error_code: str,
) -> None:
    footprint_import.status = "failed"
    footprint_import.completed_at = datetime.datetime.now(datetime.UTC)
    footprint_import.summary = {"error_code": error_code}
    if footprint_import.run_id:
        run: app.db.models.OrchestratorRun | None = await _get_owned_run(session, footprint_import.owner_id, footprint_import.run_id)
        if run is not None:
            run.status = "failed"
            run.error_code = error_code
            run.completed_at = footprint_import.completed_at
    await session.commit()


async def process_import(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    import_id: str,
    *,
    feed_xml: str | None = None,
) -> app.db.models.FootprintImport:
    footprint_import: app.db.models.FootprintImport = await get_import(session, owner, import_id)
    connector: str = footprint_import.connector.lower()
    if connector not in RSS_CONNECTORS and footprint_import.import_mode.lower() != "rss":
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Only RSS-compatible footprint imports can be processed now.",
        )

    account = None
    if footprint_import.account_id:
        # Scope the lookup itself rather than fetching by id and checking after.
        account: app.db.models.FootprintAccount = await get_account(session, owner, footprint_import.account_id)

    if footprint_import.run_id:
        run: app.db.models.OrchestratorRun | None = await _get_owned_run(session, owner.owner_id, footprint_import.run_id)
        if run is not None:
            run.status = "running"
            run.started_at = run.started_at or datetime.datetime.now(datetime.UTC)
        footprint_import.status = "running"
        await session.commit()

    try:
        feed_url: str = resolve_feed_url(footprint_import, account)
    except fastapi.HTTPException:
        await _mark_import_failed(session, footprint_import, error_code="feed_url_rejected")
        raise

    try:
        xml_text: str = feed_xml if feed_xml is not None else await fetch_feed_xml(feed_url)
    except fastapi.HTTPException:
        await _mark_import_failed(session, footprint_import, error_code="feed_fetch_failed")
        raise

    try:
        fallback_title: str = account.display_name or account.handle if account else "Imported feed"
        feed: app.integrations.connectors.rss.RssFeed = app.integrations.connectors.rss.parse_feed(xml_text, fallback_title=fallback_title)
    except Exception as exc: Exception:
        await _mark_import_failed(session, footprint_import, error_code="feed_parse_failed")
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="RSS feed could not be parsed.",
        ) from exc

    platform: str = connector if connector != "rss" else account.platform if account else "rss"
    generated_node_ids: set[str] = set()
    generated_edge_ids: set[str] = set()

    account_label: str = account.display_name or account.handle if account else feed.title
    account_external_id: str = (
        account.external_id
        or f"account:{account.id}"
        if account
        else app.integrations.connectors.rss.stable_external_id("account", feed_url)
    )
    account_node: app.db.models.FootprintNode = await upsert_node(
        session,
        owner.owner_id,
        kind="platform_account",
        label=account_label,
        platform=platform,
        external_id=account_external_id,
        source_ref={
            "import_id": footprint_import.id,
            "account_id": account.id if account else None,
            "feed_url": feed_url,
        },
        properties={
            "handle": account.handle if account else None,
            "profile_url": account.profile_url if account else feed.link,
            "connector": connector,
        },
        visibility="public",
    )
    generated_node_ids.add(account_node.id)

    publication_node: app.db.models.FootprintNode = await upsert_node(
        session,
        owner.owner_id,
        kind="publication",
        label=feed.title,
        platform=platform,
        external_id=app.integrations.connectors.rss.stable_external_id("feed", feed_url),
        source_ref={"import_id": footprint_import.id, "feed_url": feed_url, "url": feed.link},
        properties={"url": feed.link, "connector": connector},
        visibility="public",
    )
    generated_node_ids.add(publication_node.id)
    edge: app.db.models.FootprintEdge = await upsert_edge(
        session,
        owner.owner_id,
        source_node_id=account_node.id,
        target_node_id=publication_node.id,
        relation="published_to",
        platform=platform,
        evidence_ref={"import_id": footprint_import.id, "feed_url": feed_url},
    )
    generated_edge_ids.add(edge.id)

    topic_count = 0
    for item in feed.items:
        post_node: app.db.models.FootprintNode = await upsert_node(
            session,
            owner.owner_id,
            kind="post",
            label=item.title,
            platform=platform,
            external_id=item.external_id,
            source_ref={
                "import_id": footprint_import.id,
                "feed_url": feed_url,
                "url": item.link,
            },
            properties={
                "published_at": _date_property(item.published_at),
                "excerpt": item.excerpt,
                "tags": list(item.tags),
            },
            visibility="public",
        )
        generated_node_ids.add(post_node.id)
        authored_edge: app.db.models.FootprintEdge = await upsert_edge(
            session,
            owner.owner_id,
            source_node_id=account_node.id,
            target_node_id=post_node.id,
            relation="authored",
            platform=platform,
            evidence_ref={"import_id": footprint_import.id, "url": item.link},
        )
        published_edge: app.db.models.FootprintEdge = await upsert_edge(
            session,
            owner.owner_id,
            source_node_id=post_node.id,
            target_node_id=publication_node.id,
            relation="published_to",
            platform=platform,
            evidence_ref={"import_id": footprint_import.id, "url": item.link},
        )
        generated_edge_ids.update({authored_edge.id, published_edge.id})

        for topic in app.integrations.connectors.rss.normalize_topics(item.tags):
            topic_node: app.db.models.FootprintNode = await upsert_node(
                session,
                owner.owner_id,
                kind="topic",
                label=topic,
                platform=platform,
                external_id=f"topic:{app.integrations.connectors.rss.stable_slug(topic)}",
                source_ref={"import_id": footprint_import.id, "feed_url": feed_url},
                properties={"connector": connector},
                visibility="public",
                confidence=0.9,
            )
            topic_count += 1
            generated_node_ids.add(topic_node.id)
            topic_edge: app.db.models.FootprintEdge = await upsert_edge(
                session,
                owner.owner_id,
                source_node_id=post_node.id,
                target_node_id=topic_node.id,
                relation="mentions",
                platform=platform,
                confidence=0.9,
                evidence_ref={"import_id": footprint_import.id, "url": item.link},
            )
            generated_edge_ids.add(topic_edge.id)

    now: datetime.datetime = datetime.datetime.now(datetime.UTC)
    footprint_import.status = "succeeded"
    footprint_import.completed_at = now
    footprint_import.summary = {
        "feed_title": feed.title,
        "feed_url": feed_url,
        "item_count": len(feed.items),
        "topic_count": topic_count,
        "node_count": len(generated_node_ids),
        "edge_count": len(generated_edge_ids),
    }
    if account is not None:
        account.last_synced_at = now
        account.sync_cursor = {
            "feed_url": feed_url,
            "last_import_id": footprint_import.id,
            "item_count": len(feed.items),
        }
    if footprint_import.run_id:
        run: app.db.models.OrchestratorRun | None = await _get_owned_run(session, footprint_import.owner_id, footprint_import.run_id)
        if run is not None:
            run.status = "succeeded"
            run.completed_at = now
            run.output_ref = {
                "import_id": footprint_import.id,
                "summary": footprint_import.summary,
            }
    await session.commit()
    await session.refresh(footprint_import)
    return footprint_import


async def get_snapshot(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    *,
    platform: str | None = None,
    kind: str | None = None,
    relation: str | None = None,
    node_limit: int = 250,
    edge_limit: int = 500,
) -> app.domains.graph.schemas.FootprintGraphSnapshot:
    accounts: list[app.db.models.FootprintAccount] = await list_accounts(session, owner)
    nodes: list[app.db.models.FootprintNode] = await list_nodes(session, owner, platform=platform, kind=kind, limit=node_limit)
    edges: list[app.db.models.FootprintEdge] = await list_edges(session, owner, platform=platform, relation=relation, limit=edge_limit)
    node_ids: set[str] = {node.id for node in nodes}
    visible_edges: list[app.db.models.FootprintEdge] = [
        edge
        for edge in edges
        if edge.source_node_id in node_ids and edge.target_node_id in node_ids
    ]
    return app.domains.graph.schemas.FootprintGraphSnapshot(
        owner_id=owner.owner_id,
        accounts=accounts,
        nodes=nodes,
        edges=visible_edges,
    )
