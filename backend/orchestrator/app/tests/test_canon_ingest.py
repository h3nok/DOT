"""The canon is what the copilot teaches from.

A visitor asking about the book must get the book back, with a citation they can
turn to. A visitor asking about anything else must still reach nothing private.
These assert both halves, because widening retrieval is where a leak would come
from.
"""

from __future__ import annotations

import json

import pytest

import app.auth.dependencies
import app.db.models
import app.domains.canon.service as canon
import app.domains.knowledge.embedding
import app.domains.knowledge.service as knowledge_service
import app.domains.twin.retriever as retriever
import app.domains.twin.schemas as twin_schemas
import app.domains.twin.service as twin_service

AUTHOR = app.auth.dependencies.OwnerContext(owner_id="owner-henok", actor_id="owner-henok")
VISITOR = app.auth.dependencies.OwnerContext(owner_id="owner-guest", actor_id="owner-guest")

EDITION = "digital-organism-theory"
EDITION_TITLE = "Consciousness: A Digital Organism"

CANVAS = canon.CanonSection(
    slug="the-canvas",
    kind="chapter",
    number=5,
    title="The Canvas",
    part="The Human Instance",
    text=(
        "Something in you is always adapting. DOT calls the persistent layer the Canvas.\n\n"
        "The Canvas carries. The Painting interprets. Character acts. The Canvas is the "
        "capacity for persistence and update, and the Painting is what has accumulated on "
        "that substrate: expectations, associations, fears, habits, and meanings.\n\n"
        "Canvas entropy refers to contradictory policies competing for control, unresolved "
        "fear repeatedly capturing attention, and a narrowed decision-space in which only "
        "familiar reactions feel available."
    ),
)


class _StubModel:
    def __init__(self, raw: str) -> None:
        self.raw: str = raw
        self.seen_user: str = ""

    async def complete(self, *, system: str, user: str) -> str:
        self.seen_user = user
        return self.raw


class _StubEmbeddingClient:
    model = "test-embedding"

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [[float(index + 1), 1.0] for index, _ in enumerate(texts)]


async def test_canon_chunks_gain_embeddings_when_a_model_becomes_available(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    records = [
        app.db.models.KnowledgeChunk(
            source_version_id="version",
            chunk_index=index,
            text=text,
            token_count=4,
        )
        for index, text in enumerate(["The Canvas carries.", "The Painting interprets."])
    ]
    monkeypatch.setattr(
        app.domains.knowledge.embedding,
        "get_embedding_client",
        lambda: _StubEmbeddingClient(),
    )

    embedded = await knowledge_service.embed_chunks(records)

    assert embedded == 2
    assert all(record.embedding for record in records)
    assert {record.embedding_model for record in records} == {"test-embedding"}

    # A safe canon re-run does not pay to regenerate vectors from the same model.
    assert await knowledge_service.embed_chunks(records) == 0


async def _ingest(session, section: canon.CanonSection = CANVAS) -> canon.CanonIngestResult:
    return await canon.ingest_section(
        session,
        AUTHOR,
        edition_slug=EDITION,
        edition_title=EDITION_TITLE,
        section=section,
    )


async def test_a_visitor_can_be_taught_from_the_book(session_factory) -> None:
    async with session_factory() as session:
        await _ingest(session)

        passages = await retriever.retrieve_passages(
            session, VISITOR, AUTHOR.owner_id, "what is canvas entropy?"
        )

    assert passages, "a visitor asking about the book must reach the book"
    assert any("Canvas entropy" in passage.text for passage in passages)


async def test_a_citation_points_at_a_chapter_a_reader_can_turn_to(session_factory) -> None:
    async with session_factory() as session:
        await _ingest(session)
        passages = await retriever.retrieve_passages(
            session, VISITOR, AUTHOR.owner_id, "canvas entropy"
        )

    passage = next(p for p in passages if p.kind == "chunk")
    assert passage.label == "Consciousness: A Digital Organism · Chapter 5 · The Canvas"
    assert passage.locator is not None
    assert passage.locator["chapter"] == 5
    assert passage.locator["part"] == "The Human Instance"
    assert passage.locator["section"] == "the-canvas"
    assert passage.locator["start"] < passage.locator["end"]


async def test_the_twin_quotes_the_book_and_cites_it(session_factory) -> None:
    async with session_factory() as session:
        await _ingest(session)
        passages = await retriever.retrieve_passages(
            session, VISITOR, AUTHOR.owner_id, "what does the canvas carry?"
        )
        target = next(p for p in passages if p.kind == "chunk")

        stub = _StubModel(
            json.dumps(
                {"answer": "The Canvas carries; the Painting interprets.", "cites": [target.id]}
            )
        )
        answer = await twin_service.ask(
            session,
            VISITOR,
            twin_schemas.TwinAskRequest(
                question="What does the Canvas carry?", owner_id=AUTHOR.owner_id
            ),
            client=stub,
        )

    assert answer.grounded is True
    assert [citation.node_id for citation in answer.citations] == [target.id]
    # The prose has to reach the model, or it is answering from memory.
    assert "The Canvas carries" in stub.seen_user


async def test_a_private_upload_is_still_invisible_to_a_visitor(session_factory) -> None:
    """Widening retrieval for canon must not widen it for the vault."""

    async with session_factory() as session:
        await _ingest(session)

        source = app.db.models.SourceObject(
            owner_id=AUTHOR.owner_id,
            filename="unpublished-notes.md",
            object_store_key="vault/owner-henok/unpublished-notes.md",
            size_bytes=64,
            mime_type="text/markdown",
            status="ready",
            visibility="private",
        )
        session.add(source)
        await session.flush()
        version = app.db.models.SourceVersion(
            source_object_id=source.id, version_num=1, content_hash="h", status="ready"
        )
        session.add(version)
        await session.flush()
        session.add(
            app.db.models.KnowledgeChunk(
                source_version_id=version.id,
                chunk_index=0,
                text="Canvas entropy is a placeholder name I may abandon before publishing.",
                token_count=16,
            )
        )
        await session.commit()

        visitor_passages = await retriever.retrieve_passages(
            session, VISITOR, AUTHOR.owner_id, "canvas entropy"
        )
        author_passages = await retriever.retrieve_passages(
            session, AUTHOR, AUTHOR.owner_id, "canvas entropy"
        )

    assert all("abandon before publishing" not in p.text for p in visitor_passages)
    assert any("abandon before publishing" in p.text for p in author_passages)


async def test_reingesting_identical_text_changes_nothing(session_factory) -> None:
    async with session_factory() as session:
        first = await _ingest(session)
        second = await _ingest(session)

        total = await session.scalar(
            __import__("sqlalchemy")
            .select(__import__("sqlalchemy").func.count())
            .select_from(app.db.models.KnowledgeChunk)
        )

    assert first.unchanged is False
    assert second.unchanged is True
    assert second.source_version_id == first.source_version_id
    assert total == first.chunk_count


async def test_revised_text_supersedes_without_destroying_the_record(session_factory) -> None:
    async with session_factory() as session:
        first = await _ingest(session)
        revised = await _ingest(
            session,
            canon.CanonSection(
                slug=CANVAS.slug,
                kind=CANVAS.kind,
                number=CANVAS.number,
                title=CANVAS.title,
                part=CANVAS.part,
                text=CANVAS.text + "\n\nA further paragraph, added in revision.",
            ),
        )
        previous = await session.get(app.db.models.SourceVersion, first.source_version_id)

    assert revised.unchanged is False
    assert revised.source_version_id != first.source_version_id
    assert revised.source_object_id == first.source_object_id
    assert previous is not None
    assert previous.status == "superseded"


async def test_a_declared_claim_level_travels_with_the_passage(session_factory) -> None:
    async with session_factory() as session:
        await _ingest(
            session,
            canon.CanonSection(
                slug="the-digital-organism",
                kind="chapter",
                number=1,
                title="The Digital Organism",
                part="The Proposed Architecture",
                text=(
                    "DOT hypothesizes that Consciousness is not a product appearing late "
                    "inside an otherwise unconscious reality. This is not established "
                    "science. It is the organizing hypothesis."
                ),
                claim_level="Hypothesis",
            ),
        )
        passages = await retriever.retrieve_passages(
            session, VISITOR, AUTHOR.owner_id, "organizing hypothesis"
        )

    passage = next(p for p in passages if p.kind == "chunk")
    assert passage.locator is not None
    assert passage.locator["claim_level"] == "Hypothesis"


def test_a_claim_level_is_declared_never_guessed() -> None:
    with pytest.raises(canon.CanonError):
        canon.CanonSection(
            slug="x", kind="chapter", title="X", part="P", text="text", claim_level="Probably true"
        )


async def test_an_empty_section_is_refused(session_factory) -> None:
    async with session_factory() as session:
        with pytest.raises(canon.CanonError):
            await _ingest(
                session,
                canon.CanonSection(
                    slug="blank", kind="chapter", title="Blank", part="P", text="   "
                ),
            )


# ── The public route: no session, public material only ────────────────────────


def test_a_visitor_can_ask_without_signing_in(client) -> None:
    """The authenticated route 401s a visitor; the movement needs one that does not."""

    response = client.post(
        "/v1/twin/public/ask",
        json={"question": "What is the Canvas?", "owner_id": "owner-henok"},
    )

    assert response.status_code == 200
    body = response.json()
    # Nothing is ingested in this fixture, so it must refuse rather than invent.
    assert body["grounded"] is False
    assert body["citations"] == []


def test_the_public_route_requires_naming_whose_canon(client) -> None:
    response = client.post("/v1/twin/public/ask", json={"question": "What is the Canvas?"})

    assert response.status_code == 422


def test_the_public_route_refuses_to_be_told_who_is_asking(client) -> None:
    """An owner_id header must not promote a visitor into a member."""

    response = client.post(
        "/v1/twin/public/ask",
        headers={"X-Owner-Id": "owner-henok"},
        json={"question": "notes", "owner_id": "owner-henok", "requester_id": "owner-henok"},
    )

    assert response.status_code == 422
