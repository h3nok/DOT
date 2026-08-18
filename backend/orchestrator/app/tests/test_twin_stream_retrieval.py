"""The wait tells the truth: what was opened, and nothing shaped like progress.

Grounding is the claim this companion makes, so the stream reports the sections
it actually read before it writes a word. These pin the two things that make
that honest rather than decorative — the labels are the ones the answer will
cite, and they arrive before any prose.
"""

from __future__ import annotations

import dataclasses
import typing

import pytest

import app.auth.dependencies
import app.domains.twin.model as model
import app.domains.twin.retriever as retriever
import app.domains.twin.schemas as schemas
import app.domains.twin.service as service

VISITOR = app.auth.dependencies.OwnerContext(owner_id="visitor", actor_id="visitor")


def _passage(node_id: str, label: str, text: str = "A released passage.") -> retriever.Passage:
    return retriever.Passage(id=node_id, kind="chunk", label=label, text=text, score=1.0)


def test_labels_are_deduped_and_capped_in_retrieval_order() -> None:
    passages = [
        _passage("a", "The Canvas"),
        _passage("b", "The Canvas"),
        _passage("c", "Reality Frames"),
        _passage("d", "   "),
        _passage("e", "The Painting"),
        _passage("f", "Intent"),
        _passage("g", "Love"),
    ]

    labels = service._retrieved_labels(passages)  # noqa: SLF001

    # Order is retrieval order, blanks are dropped, repeats collapse, and the
    # list stops before it becomes a search dump.
    assert labels == ["The Canvas", "Reality Frames", "The Painting", "Intent"]


def test_a_blank_run_yields_no_labels_rather_than_empty_strings() -> None:
    assert service._retrieved_labels([_passage("a", "  ")]) == []  # noqa: SLF001


@pytest.mark.asyncio
async def test_retrieval_is_announced_before_any_prose(monkeypatch: pytest.MonkeyPatch) -> None:
    opened = [_passage("n1", "The Canvas"), _passage("n2", "Reality Frames")]

    async def fake_retrieve(*_args, **_kwargs) -> list[retriever.Passage]:
        return list(opened)

    async def fake_scholarship(passages, _question):
        return passages, False

    @dataclasses.dataclass
    class _Chunk:
        text: str

    class _Client:
        async def stream(self, **_kwargs) -> typing.AsyncIterator[_Chunk]:
            # The model speaks JSON, not prose: `_partial_answer` reads the
            # `answer` value out of a partial object, so a fake that streams
            # bare sentences produces no deltas at all.
            for piece in (
                '{"answer": "The Canvas carries the record. ',
                'The Painting interprets it.", "citations": []}',
            ):
                yield _Chunk(text=piece)

    monkeypatch.setattr(retriever, "retrieve_passages", fake_retrieve)
    monkeypatch.setattr(service, "_with_scholarship", fake_scholarship)
    monkeypatch.setattr(model, "get_model_client", lambda: _Client())

    events = [
        event
        async for event in service.ask_stream(
            None,
            VISITOR,
            schemas.TwinAskRequest(question="What is the Canvas?", owner_id="henok", lens="ground"),
        )
    ]

    kinds = [event["event"] for event in events]
    assert "retrieval" in kinds, kinds
    # Before a word of prose: a wait that names its sources only after the answer
    # has started would be reporting history, not work in progress.
    assert kinds.index("retrieval") < kinds.index("delta")
    assert events[kinds.index("retrieval")]["sources"] == ["The Canvas", "Reality Frames"]


@pytest.mark.asyncio
async def test_the_wait_never_reports_progress(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_retrieve(*_args, **_kwargs) -> list[retriever.Passage]:
        return [_passage("n1", "The Canvas")]

    async def fake_scholarship(passages, _question):
        return passages, False

    class _Client:
        async def stream(self, **_kwargs):
            yield type("C", (), {"text": '{"answer": "An answer.", "citations": []}'})()

    monkeypatch.setattr(retriever, "retrieve_passages", fake_retrieve)
    monkeypatch.setattr(service, "_with_scholarship", fake_scholarship)
    monkeypatch.setattr(model, "get_model_client", lambda: _Client())

    events = [
        event
        async for event in service.ask_stream(
            None,
            VISITOR,
            schemas.TwinAskRequest(question="What is the Canvas?", owner_id="henok", lens="ground"),
        )
    ]

    retrieval = next(e for e in events if e["event"] == "retrieval")
    # Knowing which sections were opened is not knowing how far along the
    # writing is. Nothing here may imply a fraction, a step, or a total.
    assert set(retrieval) == {"event", "sources"}
