"""The profile graph is the agent's ground truth.

The homepage tree and the twin's evidence are deliberately the same rows. These
assert that end of the loop: what the owner publishes is what a visitor's
question retrieves, what the twin is allowed to cite, and nothing wider.
"""

from __future__ import annotations

import json

import app.auth.dependencies
import app.db.models
import app.domains.graph.profile as profile
import app.domains.graph.schemas as graph_schemas
import app.domains.twin.retriever as retriever
import app.domains.twin.schemas as twin_schemas
import app.domains.twin.service as twin_service

OWNER = app.auth.dependencies.OwnerContext(owner_id="owner-henok", actor_id="owner-henok")
VISITOR = app.auth.dependencies.OwnerContext(owner_id="owner-guest", actor_id="owner-guest")

TREE = graph_schemas.ProfileNode(
    id="self",
    label="Henok",
    kind="self",
    description="Digital Organism",
    children=[
        graph_schemas.ProfileNode(
            id="stay-whole",
            label="Stay Whole",
            kind="attribute",
            description="A human compass for digital life.",
            children=[
                graph_schemas.ProfileNode(
                    id="discernment",
                    label="Discernment",
                    kind="attribute",
                    body="Knowing what is observed, sourced, inferred, or generated.",
                )
            ],
        ),
        graph_schemas.ProfileNode(id="work", label="Work", kind="attribute"),
    ],
)


class _StubModel:
    def __init__(self, raw: str) -> None:
        self.raw: str = raw
        self.seen_user: str = ""

    async def complete(self, *, system: str, user: str) -> str:
        self.seen_user = user
        return self.raw


async def test_a_visitor_question_retrieves_the_published_profile(session_factory) -> None:
    async with session_factory() as session:
        await profile.replace_profile_graph(session, OWNER, TREE)

        passages = await retriever.retrieve_passages(
            session, VISITOR, OWNER.owner_id, "discernment"
        )

    assert any(passage.label == "Discernment" for passage in passages)


async def test_the_twin_cites_a_profile_node(session_factory) -> None:
    async with session_factory() as session:
        await profile.replace_profile_graph(session, OWNER, TREE)
        passages = await retriever.retrieve_passages(
            session, VISITOR, OWNER.owner_id, "discernment"
        )
        target = next(passage for passage in passages if passage.label == "Discernment")

        stub = _StubModel(
            json.dumps({"answer": "It is about telling evidence apart.", "cites": [target.id]})
        )
        answer = await twin_service.ask(
            session,
            VISITOR,
            twin_schemas.TwinAskRequest(
                question="What does discernment mean here?", owner_id=OWNER.owner_id
            ),
            client=stub,
        )

    assert answer.grounded is True
    assert [citation.node_id for citation in answer.citations] == [target.id]


async def test_republishing_removes_retired_nodes_from_the_agents_evidence(
    session_factory,
) -> None:
    """A node the owner deleted must stop being citable, not linger as evidence."""

    async with session_factory() as session:
        await profile.replace_profile_graph(session, OWNER, TREE)
        await profile.replace_profile_graph(
            session,
            OWNER,
            graph_schemas.ProfileNode(id="self", label="Henok", kind="self"),
        )

        passages = await retriever.retrieve_passages(
            session, VISITOR, OWNER.owner_id, "discernment"
        )

    assert all(passage.label != "Discernment" for passage in passages)


async def test_a_visitor_cannot_retrieve_a_private_node_through_the_profile(
    session_factory,
) -> None:
    async with session_factory() as session:
        await profile.replace_profile_graph(session, OWNER, TREE)
        session.add(
            app.db.models.FootprintNode(
                owner_id=OWNER.owner_id,
                kind="note",
                label="Discernment draft, unpublished",
                visibility="private",
            )
        )
        await session.commit()

        passages = await retriever.retrieve_passages(
            session, VISITOR, OWNER.owner_id, "discernment"
        )

    assert all("unpublished" not in passage.label for passage in passages)
