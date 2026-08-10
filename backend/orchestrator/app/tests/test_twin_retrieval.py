"""Unified retrieval: graph nodes and vault passages in one citable set.

The twin can now answer from a member's documents, not just from node labels.
That widens what it can say, so these assert the boundary widened with it: a
document passage is citable by its owner and reachable by no one else.
"""

import app.auth.dependencies
import app.db.models
import app.domains.twin.retriever as retriever

ALICE = app.auth.dependencies.OwnerContext(owner_id="owner-alice", actor_id="owner-alice")
BOB = app.auth.dependencies.OwnerContext(owner_id="owner-bob", actor_id="owner-bob")
BOB_IN_CIRCLE = app.auth.dependencies.OwnerContext(
    owner_id="owner-bob", actor_id="owner-bob", scopes=("circle",)
)


async def _seed_document(
    session,
    *,
    owner_id: str,
    filename: str = "private-notes.md",
    text: str = "The launch date for the platform is the fourteenth of March.",
    object_store_key: str | None = None,
    visibility: str = "private",
) -> str:
    source = app.db.models.SourceObject(
        owner_id=owner_id,
        filename=filename,
        object_store_key=object_store_key or f"vault/{owner_id}/{filename}",
        size_bytes=len(text),
        mime_type="text/markdown",
        status="ready",
        visibility=visibility,
    )
    session.add(source)
    await session.flush()

    version = app.db.models.SourceVersion(
        source_object_id=source.id, version_num=1, content_hash="hash", status="ready"
    )
    session.add(version)
    await session.flush()

    chunk = app.db.models.KnowledgeChunk(
        source_version_id=version.id, chunk_index=0, text=text, token_count=len(text) // 4
    )
    session.add(chunk)
    await session.flush()

    session.add(
        app.db.models.SourceAnchor(
            chunk_id=chunk.id, anchor_type="char_range", locator={"start": 0, "end": len(text)}
        )
    )
    await session.commit()
    return chunk.id


async def test_a_members_own_document_is_retrievable_and_citable(session_factory) -> None:
    async with session_factory() as session:
        chunk_id: str = await _seed_document(session, owner_id="owner-alice")

        passages = await retriever.retrieve_passages(
            session, ALICE, "owner-alice", "when is the launch date"
        )

    assert any(passage.id == chunk_id for passage in passages)
    passage = next(passage for passage in passages if passage.id == chunk_id)
    assert passage.kind == "chunk"
    assert passage.label == "private-notes.md"
    assert "fourteenth of March" in passage.text


async def test_another_member_never_reaches_the_vault(session_factory) -> None:
    async with session_factory() as session:
        await _seed_document(session, owner_id="owner-alice")

        for requester in (BOB, BOB_IN_CIRCLE):
            passages = await retriever.retrieve_passages(
                session, requester, "owner-alice", "when is the launch date"
            )
            assert [passage for passage in passages if passage.kind == "chunk"] == []


async def test_a_document_still_being_processed_is_not_retrieved(session_factory) -> None:
    """Half-ingested content would be cited as if it were the whole document."""

    async with session_factory() as session:
        source = app.db.models.SourceObject(
            owner_id="owner-alice",
            filename="draft.md",
            object_store_key="vault/owner-alice/draft.md",
            size_bytes=10,
            mime_type="text/markdown",
            status="processing",
        )
        session.add(source)
        await session.flush()
        version = app.db.models.SourceVersion(
            source_object_id=source.id, version_num=1, status="processing"
        )
        session.add(version)
        await session.flush()
        session.add(
            app.db.models.KnowledgeChunk(
                source_version_id=version.id,
                chunk_index=0,
                text="launch date is the fourteenth",
                token_count=7,
            )
        )
        await session.commit()

        passages = await retriever.retrieve_passages(session, ALICE, "owner-alice", "launch date")

    assert [passage for passage in passages if passage.kind == "chunk"] == []


async def test_graph_nodes_and_documents_are_returned_together(session_factory) -> None:
    async with session_factory() as session:
        chunk_id: str = await _seed_document(session, owner_id="owner-alice")
        session.add(
            app.db.models.FootprintNode(
                owner_id="owner-alice", kind="note", label="launch planning"
            )
        )
        await session.commit()

        passages = await retriever.retrieve_passages(session, ALICE, "owner-alice", "launch")

    kinds = {passage.kind for passage in passages}
    assert "chunk" in kinds
    assert kinds - {"chunk"}
    assert any(passage.id == chunk_id for passage in passages)


async def test_retrieval_never_exceeds_the_requested_limit(session_factory) -> None:
    async with session_factory() as session:
        for index in range(30):
            await _seed_document(
                session,
                owner_id="owner-alice",
                filename=f"note-{index}.md",
                text=f"Launch note {index}. The launch date matters.",
            )

        passages = await retriever.retrieve_passages(
            session, ALICE, "owner-alice", "launch date", limit=5
        )

    assert len(passages) <= 5


async def test_fragments_expose_document_text_and_keep_the_citable_id(session_factory) -> None:
    async with session_factory() as session:
        chunk_id: str = await _seed_document(session, owner_id="owner-alice")
        passages = await retriever.retrieve_passages(session, ALICE, "owner-alice", "launch date")

    fragments = retriever.passages_to_fragments(passages)
    fragment = next(item for item in fragments if item["node_id"] == chunk_id)

    assert fragment["kind"] == "chunk"
    assert "fourteenth of March" in fragment["text"]


async def test_an_empty_vault_and_empty_graph_retrieve_nothing(session_factory) -> None:
    async with session_factory() as session:
        passages = await retriever.retrieve_passages(session, ALICE, "owner-alice", "anything")

    assert passages == []


async def test_reader_scope_retrieves_only_the_named_release(session_factory) -> None:
    visitor = app.auth.dependencies.OwnerContext(owner_id="visitor", actor_id="visitor")
    async with session_factory() as session:
        old_id = await _seed_document(
            session,
            owner_id="owner-alice",
            filename="Book One v1",
            text="The old Canvas account described legacy stabilization.",
            object_store_key="canon/dot-book-one-v1/the-canvas.md",
            visibility="public",
        )
        current_id = await _seed_document(
            session,
            owner_id="owner-alice",
            filename="Book One v2",
            text="The Canvas carries the accumulated effects of experience.",
            object_store_key="canon/dot-book-one-v2/the-canvas.md",
            visibility="public",
        )
        session.add(
            app.db.models.FootprintNode(
                owner_id="owner-alice",
                kind="theory",
                label="Legacy Canvas stabilization",
                visibility="public",
            )
        )
        await session.commit()

        passages = await retriever.retrieve_passages(
            session,
            visitor,
            "owner-alice",
            "Canvas",
            canon_release_id="dot-book-one-v2",
            reader_section_slug="the-canvas",
        )

    assert [passage.id for passage in passages] == [current_id]
    assert old_id not in {passage.id for passage in passages}
    assert {passage.kind for passage in passages} == {"chunk"}
