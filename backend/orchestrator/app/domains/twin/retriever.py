"""Tenant-bound retrieval over the footprint graph (HKI-7).

The retriever takes an owner context rather than an id string, and runs inside
the caller's tenant-bound transaction. Cross-tenant retrieval is not a policy
check here; there is no code path that reaches another tenant's rows.
"""

from __future__ import annotations

import dataclasses
import re
import typing

import sqlalchemy
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.db.models
import app.domains.knowledge.embedding

DEFAULT_LIMIT = 12
MAX_LIMIT = 40
#: Bounded candidate window. Retrieval is always tenant-scoped, so this caps
#: work per member rather than per corpus.
CHUNK_CANDIDATE_WINDOW = 800
#: Vector similarity leads the blend; keyword overlap keeps exact terms honest.
VECTOR_WEIGHT = 0.7
_WORD: re.Pattern[str] = re.compile(r"[A-Za-z0-9']{3,}")
_STOPWORDS: frozenset[str] = frozenset(
    {
        "the",
        "and",
        "for",
        "with",
        "that",
        "this",
        "from",
        "what",
        "when",
        "where",
        "which",
        "have",
        "has",
        "was",
        "were",
        "are",
        "you",
        "your",
        "about",
        "into",
        "than",
        "then",
        "they",
        "their",
        "them",
        "how",
        "why",
    }
)


def _terms(question: str) -> list[str]:
    words = (match.group(0).lower() for match in _WORD.finditer(question))
    return [word for word in words if word not in _STOPWORDS]


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


@dataclasses.dataclass(frozen=True)
class Passage:
    """A retrieved, citable unit — a graph node or a passage from a document.

    Both carry a stable id, so the grounding check stays a subset test over ids
    and does not need to know which store an answer came from.
    """

    id: str
    kind: str
    label: str
    text: str
    score: float
    properties: dict[str, typing.Any] = dataclasses.field(default_factory=dict)
    #: Where in the source this passage sits, for a citation a member can open.
    locator: dict[str, typing.Any] | None = None


def _normalized(scores: list[float]) -> list[float]:
    """Scale to 0..1 so keyword counts and cosine scores can be compared."""

    if not scores:
        return []
    highest: float = max(scores)
    if highest <= 0:
        return [0.0 for _ in scores]
    return [score / highest for score in scores]


async def _node_passages(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    requester: app.auth.dependencies.OwnerContext,
    graph_owner_id: str,
    question: str,
    limit: int,
) -> list[Passage]:
    nodes: list[app.db.models.FootprintNode] = await retrieve(
        session, requester, graph_owner_id, question, limit
    )
    terms: list[str] = _terms(question)
    raw: list[float] = [
        float(sum(_node_text(node).count(term) for term in terms)) if terms else 1.0
        for node in nodes
    ]
    return [
        Passage(
            id=node.id,
            kind=node.kind,
            label=node.label,
            text=_node_text(node),
            score=score,
            properties=node.properties or {},
        )
        for node, score in zip(nodes, _normalized(raw), strict=True)
    ]


async def _chunk_candidates(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner_id: str,
    visibilities: tuple[str, ...],
) -> list[tuple[app.db.models.KnowledgeChunk, str, dict[str, typing.Any] | None]]:
    statement = (
        sqlalchemy.select(
            app.db.models.KnowledgeChunk,
            app.db.models.SourceObject.filename,
            app.db.models.SourceAnchor.locator,
        )
        .join(
            app.db.models.SourceVersion,
            app.db.models.KnowledgeChunk.source_version_id == app.db.models.SourceVersion.id,
        )
        .join(
            app.db.models.SourceObject,
            app.db.models.SourceVersion.source_object_id == app.db.models.SourceObject.id,
        )
        .outerjoin(
            app.db.models.SourceAnchor,
            app.db.models.SourceAnchor.chunk_id == app.db.models.KnowledgeChunk.id,
        )
        .where(
            app.db.models.SourceObject.owner_id == owner_id,
            app.db.models.SourceObject.visibility.in_(visibilities),
            app.db.models.SourceVersion.status == "ready",
        )
        .order_by(app.db.models.SourceVersion.created_at.desc().nullslast())
        .limit(CHUNK_CANDIDATE_WINDOW)
    )
    result = await session.execute(statement)
    return [(row[0], row[1], row[2]) for row in result.all()]


async def _chunk_passages(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    requester: app.auth.dependencies.OwnerContext,
    graph_owner_id: str,
    question: str,
    limit: int,
) -> list[Passage]:
    """Document passages, scored by vector similarity when available.

    Uploaded documents are private to the member who uploaded them. Released
    canon is the deliberate exception: a text a visitor is invited to read is one
    the twin must be able to quote back with a citation. Visibility is resolved
    server-side and fails closed — a stranger reaches public sources only.
    """

    visibilities: tuple[str, ...] = allowed_visibilities(requester, graph_owner_id)

    candidates = await _chunk_candidates(session, graph_owner_id, visibilities)
    if not candidates:
        return []

    terms: list[str] = _terms(question)
    keyword: list[float] = [
        float(sum(chunk.text.lower().count(term) for term in terms)) if terms else 0.0
        for chunk, _, _ in candidates
    ]
    scores: list[float] = _normalized(keyword)

    query_vector: list[float] | None = await _embed_question(question)
    if query_vector is not None:
        vector_scores: list[float] = [
            app.domains.knowledge.embedding.cosine_similarity(query_vector, chunk.embedding or [])
            for chunk, _, _ in candidates
        ]
        # Vector similarity leads; keyword overlap keeps exact terms competitive.
        scores = [
            (VECTOR_WEIGHT * vector) + ((1.0 - VECTOR_WEIGHT) * word)
            for vector, word in zip(vector_scores, scores, strict=True)
        ]

    ranked = sorted(
        (
            (score, chunk, filename, locator)
            for score, (chunk, filename, locator) in zip(scores, candidates, strict=True)
            if score > 0
        ),
        key=lambda row: row[0],
        reverse=True,
    )
    return [
        Passage(
            id=chunk.id,
            kind="chunk",
            label=filename,
            text=chunk.text,
            score=score,
            properties={"filename": filename, "chunk_index": chunk.chunk_index},
            locator=locator,
        )
        for score, chunk, filename, locator in ranked[:limit]
    ]


async def _embed_question(question: str) -> list[float] | None:
    """Embed the query, or None when no embedding model is configured."""

    client = app.domains.knowledge.embedding.get_embedding_client()
    if isinstance(client, app.domains.knowledge.embedding.NullEmbeddingClient):
        return None
    try:
        vectors: list[list[float]] = await client.embed([question])
    except app.domains.knowledge.embedding.EmbeddingUnavailableError:
        # Degrade to keyword rather than failing the whole question.
        return None
    return vectors[0] if vectors else None


async def retrieve_passages(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    requester: app.auth.dependencies.OwnerContext,
    graph_owner_id: str,
    question: str,
    limit: int = DEFAULT_LIMIT,
) -> list[Passage]:
    """Graph nodes and vault passages, ranked together into one citable set."""

    bounded: int = min(limit, MAX_LIMIT)
    nodes: list[Passage] = await _node_passages(
        session, requester, graph_owner_id, question, bounded
    )
    chunks: list[Passage] = await _chunk_passages(
        session, requester, graph_owner_id, question, bounded
    )

    # Documents answer "what did I write about this"; nodes answer "what is
    # this". Both are kept so one cannot crowd the other out entirely.
    reserved: int = min(len(chunks), max(1, bounded // 2)) if chunks else 0
    merged: list[Passage] = chunks[:reserved] + nodes[: bounded - reserved]
    merged.extend(passage for passage in chunks[reserved:] if len(merged) < bounded)
    merged.sort(key=lambda passage: passage.score, reverse=True)
    return merged[:bounded]


def passages_to_fragments(passages: list[Passage]) -> list[dict[str, typing.Any]]:
    """Reduce passages to what the model needs, keyed by citable id."""

    fragments: list[dict[str, typing.Any]] = []
    for passage in passages:
        fragment: dict[str, typing.Any] = {
            "node_id": passage.id,
            "kind": passage.kind,
            "label": passage.label,
        }
        if passage.kind == "chunk":
            fragment["text"] = passage.text
        else:
            fragment["properties"] = passage.properties
        fragments.append(fragment)
    return fragments
