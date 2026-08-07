"""The profile graph: the member's public tree, stored as real nodes and edges.

The homepage tree used to be a JSON blob. It is now footprint nodes joined by
`contains` edges, so the thing a visitor sees and the thing the twin cites are
the same graph.
"""

from __future__ import annotations

import datetime
import typing

import fastapi
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.db.models
import app.domains.graph.schemas

PLATFORM = "profile"
CONTAINS = "contains"
MAX_NODES = 512
MAX_DEPTH = 8

_PROPERTY_KEYS: tuple[str, ...] = (
    "surface",
    "relation",
    "href",
    "description",
    "body",
    "meta",
    "image",
)


def _flatten(
    node: app.domains.graph.schemas.ProfileNode,
    path: str,
    depth: int,
    order: int,
    out: list[tuple[str, str | None, int, app.domains.graph.schemas.ProfileNode]],
) -> None:
    if depth > MAX_DEPTH:
        raise fastapi.HTTPException(status_code=400, detail="Profile graph is nested too deeply.")
    if len(out) >= MAX_NODES:
        raise fastapi.HTTPException(status_code=400, detail="Profile graph has too many nodes.")

    external_id: str = f"{path}/{node.id}" if path else node.id
    out.append((external_id, path or None, order, node))
    for index, child in enumerate(node.children or []):
        _flatten(child, external_id, depth + 1, index, out)


async def replace_profile_graph(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    root: app.domains.graph.schemas.ProfileNode,
) -> datetime.datetime:
    """Replace the owner's profile subgraph in one transaction."""

    flattened: list[tuple[str, str | None, int, app.domains.graph.schemas.ProfileNode]] = []
    _flatten(root, path="", depth=0, order=0, out=flattened)

    existing: sqlalchemy.Result[tuple[app.db.models.FootprintNode]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintNode).where(
            app.db.models.FootprintNode.owner_id == owner.owner_id,
            app.db.models.FootprintNode.platform == PLATFORM,
        )
    )
    stale_ids: list[str] = [node.id for node in existing.scalars().all()]
    if stale_ids:
        await session.execute(
            sqlalchemy.delete(app.db.models.FootprintEdge).where(
                app.db.models.FootprintEdge.owner_id == owner.owner_id,
                app.db.models.FootprintEdge.source_node_id.in_(stale_ids),
            )
        )
        await session.execute(
            sqlalchemy.delete(app.db.models.FootprintNode).where(
                app.db.models.FootprintNode.owner_id == owner.owner_id,
                app.db.models.FootprintNode.platform == PLATFORM,
            )
        )

    now: datetime.datetime = datetime.datetime.now(datetime.UTC)
    by_external: dict[str, app.db.models.FootprintNode] = {}
    for external_id, _parent_external, order, source in flattened:
        dumped: dict[str, typing.Any] = source.model_dump(mode="json", exclude_none=True)
        properties: dict[str, typing.Any] = {
            key: dumped[key] for key in _PROPERTY_KEYS if key in dumped
        }
        properties["dot_id"] = source.id
        properties["order"] = order
        record = app.db.models.FootprintNode(
            owner_id=owner.owner_id,
            kind=source.kind or "attribute",
            label=source.label,
            platform=PLATFORM,
            external_id=external_id,
            source_ref={"origin": "profile_editor"},
            properties=properties,
            visibility="public",
            last_seen_at=now,
        )
        session.add(record)
        by_external[external_id] = record
    await session.flush()

    for external_id, parent_external, order, _ in flattened:
        if parent_external is None:
            continue
        session.add(
            app.db.models.FootprintEdge(
                owner_id=owner.owner_id,
                source_node_id=by_external[parent_external].id,
                target_node_id=by_external[external_id].id,
                relation=CONTAINS,
                platform=PLATFORM,
                weight=float(order),
                evidence_ref={"origin": "profile_editor"},
                last_seen_at=now,
            )
        )
    await session.commit()
    return now


async def read_profile_graph(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner_id: str,
) -> tuple[app.domains.graph.schemas.ProfileNode | None, datetime.datetime | None]:
    """Assemble the stored profile subgraph back into a tree."""

    result: sqlalchemy.Result[tuple[app.db.models.FootprintNode]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintNode).where(
            app.db.models.FootprintNode.owner_id == owner_id,
            app.db.models.FootprintNode.platform == PLATFORM,
            app.db.models.FootprintNode.visibility == "public",
        )
    )
    records: list[app.db.models.FootprintNode] = list(result.scalars().all())
    if not records:
        return None, None

    edge_result: sqlalchemy.Result[tuple[app.db.models.FootprintEdge]] = await session.execute(
        sqlalchemy.select(app.db.models.FootprintEdge).where(
            app.db.models.FootprintEdge.owner_id == owner_id,
            app.db.models.FootprintEdge.platform == PLATFORM,
            app.db.models.FootprintEdge.relation == CONTAINS,
        )
    )
    children_of: dict[str, list[tuple[float, str]]] = {}
    has_parent: set[str] = set()
    for edge in edge_result.scalars().all():
        children_of.setdefault(edge.source_node_id, []).append((edge.weight, edge.target_node_id))
        has_parent.add(edge.target_node_id)

    by_id: dict[str, app.db.models.FootprintNode] = {record.id: record for record in records}
    roots: list[app.db.models.FootprintNode] = [r for r in records if r.id not in has_parent]
    if not roots:
        return None, None

    def build(node_id: str) -> app.domains.graph.schemas.ProfileNode:
        record: app.db.models.FootprintNode = by_id[node_id]
        properties: dict[str, typing.Any] = record.properties or {}
        children: list[app.domains.graph.schemas.ProfileNode] = [
            build(child_id)
            for _, child_id in sorted(children_of.get(node_id, []))
            if child_id in by_id
        ]
        return app.domains.graph.schemas.ProfileNode(
            id=str(properties.get("dot_id") or record.external_id or record.id),
            label=record.label,
            kind=record.kind,
            surface=properties.get("surface"),
            relation=properties.get("relation"),
            href=properties.get("href"),
            description=properties.get("description"),
            body=properties.get("body"),
            meta=properties.get("meta"),
            image=properties.get("image"),
            children=children or None,
        )

    updated: datetime.datetime | None = max(
        (r.last_seen_at for r in records if r.last_seen_at is not None), default=None
    )
    return build(roots[0].id), updated
