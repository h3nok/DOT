"""Tenant-bound retrieval over the footprint graph (HKI-7).

The retriever takes an owner context rather than an id string, and runs inside
the caller's tenant-bound transaction. Cross-tenant retrieval is not a policy
check here; there is no code path that reaches another tenant's rows.
"""

from __future__ import annotations

import re
import typing

import sqlalchemy
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.db.models

DEFAULT_LIMIT = 12
MAX_LIMIT = 40
_WORD: re.Pattern[str] = re.compile(r"[A-Za-z0-9']{3,}")
_STOPWORDS: frozenset[str] = frozenset(
    {
        "the", "and", "for", "with", "that", "this", "from", "what", "when",
        "where", "which", "have", "has", "was", "were", "are", "you", "your",
        "about", "into", "than", "then", "they", "their", "them", "how", "why",
    }
)


def _terms(question: str) -> list[str]:
    return [w for w in (m.group(0).lower() for m in _WORD.finditer(question)) if w not in _STOPWORDS]


def allowed_visibilities(
    requester: app.auth.dependencies.OwnerContext,
    graph_owner_id: str,
) -> tuple[str, ...]:
    """Resolve visibility server-side. The caller never gets to ask for a scope."""

    if requester.owner_id == graph_owner_id:
        return ("public", "circle", "private")
    if "circle" in requester.scopes:
        return ("public", "circle")
    return ("public",)


def _node_text(node: app.db.models.FootprintNode) -> str:
    parts: list[str] = [node.label, node.kind]
    properties: dict[str, typing.Any] = node.properties or {}
    for value in properties.values():
        if isinstance(value, str):
            parts.append(value)
    return " ".join(parts).lower()


async def retrieve(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    requester: app.auth.dependencies.OwnerContext,
    graph_owner_id: str,
    question: str,
    limit: int = DEFAULT_LIMIT,
) -> list[app.db.models.FootprintNode]:
    visibilities: tuple[str, ...] = allowed_visibilities(requester, graph_owner_id)
    statement: sqlalchemy.Select[tuple[app.db.models.FootprintNode]] = (
        sqlalchemy.select(app.db.models.FootprintNode)
        .where(
            app.db.models.FootprintNode.owner_id == graph_owner_id,
            app.db.models.FootprintNode.visibility.in_(visibilities),
        )
        .order_by(app.db.models.FootprintNode.last_seen_at.desc().nullslast())
        # Bounded candidate window; replaced by a vector index when embeddings land.
        .limit(500)
    )
    result: sqlalchemy.Result[tuple[app.db.models.FootprintNode]] = await session.execute(statement)
    candidates: list[app.db.models.FootprintNode] = list(result.scalars().all())

    terms: list[str] = _terms(question)
    if not terms:
        return candidates[: min(limit, MAX_LIMIT)]

    scored: list[tuple[int, app.db.models.FootprintNode]] = []
    for node in candidates:
        text: str = _node_text(node)
        score: int = sum(text.count(term) for term in terms)
        if score:
            scored.append((score, node))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [node for _, node in scored[: min(limit, MAX_LIMIT)]]


def to_fragments(nodes: list[app.db.models.FootprintNode]) -> list[dict[str, typing.Any]]:
    """Reduce nodes to the minimum the model needs, keyed by citable node id."""

    return [
        {
            "node_id": node.id,
            "kind": node.kind,
            "label": node.label,
            "properties": node.properties or {},
        }
        for node in nodes
    ]
