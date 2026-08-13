"""Minty's academic context stays bounded, inspectable, and subordinate to canon."""

import app.domains.twin.boundary as boundary
import app.domains.twin.retriever as retriever
import app.domains.twin.scholarship as scholarship
import app.domains.twin.service as service


def _canon() -> retriever.Passage:
    return retriever.Passage(
        id="book-1",
        kind="chunk",
        label="Book One · The Canvas",
        text="The Painting interprets what the Canvas carries.",
        score=1.0,
        locator={"edition": "digital-organism-theory-v2", "section": "the-canvas"},
    )


def _paper() -> retriever.Passage:
    return retriever.Passage(
        id="s2:paper-1",
        kind="scholarly_work",
        label="Researcher et al. (2025) · Predictive processing",
        text="Abstract: Prior expectations influence perception.",
        score=1.0,
        locator={
            "provider": "Semantic Scholar",
            "href": "https://doi.org/10.1000/example",
            "scholar_url": "https://scholar.google.com/scholar?q=example",
        },
    )


def test_research_intent_and_dot_query_expansion() -> None:
    assert scholarship.wants_scholarship("What academic evidence bears on the Painting?")
    assert not scholarship.wants_scholarship("What does the Painting mean?")
    query = scholarship.research_query("What evidence bears on the Painting?")
    assert "cognitive schemas" in query
    assert "predictive processing" in query


def test_explicit_concept_is_not_redirected_by_incidental_passage_terms() -> None:
    query = scholarship.research_query(
        "What research bears on the Painting model?\n"
        "The passage also discusses Little c, Intent, action, and consequence."
    )

    assert "prior expectations perception" in query
    assert "conscious intention agency" not in query
    assert "Little c" not in query
    assert "peer-reviewed research" not in query
    assert "Painting model" not in query


def test_paper_context_requires_an_abstract_and_links_verification() -> None:
    record = {
        "paperId": "paper-1",
        "title": "A testable account",
        "abstract": "We compare two accounts of perception.",
        "authors": [{"name": "A. Researcher"}],
        "year": 2025,
        "externalIds": {"DOI": "10.1000/example"},
        "venue": "Journal of Examples",
    }

    passage = scholarship._paper_passage(record)  # noqa: SLF001 - boundary contract

    assert passage is not None
    assert passage.kind == "scholarly_work"
    assert passage.locator is not None
    assert passage.locator["href"] == "https://doi.org/10.1000/example"
    assert passage.locator["scholar_url"].startswith("https://scholar.google.com/")
    assert scholarship._paper_passage({**record, "abstract": None}) is None  # noqa: SLF001


def test_crossref_context_strips_markup_and_requires_an_abstract() -> None:
    record = {
        "DOI": "10.1000/crossref",
        "title": ["A second account"],
        "abstract": "<jats:p>Expectations <jats:italic>shape</jats:italic> perception.</jats:p>",
        "author": [{"given": "B.", "family": "Researcher"}],
        "published": {"date-parts": [[2024, 4, 2]]},
        "container-title": ["Journal of Examples"],
    }

    passage = scholarship._crossref_passage(record)  # noqa: SLF001

    assert passage is not None
    assert "Expectations shape perception." in passage.text
    assert "<jats" not in passage.text
    assert passage.locator is not None
    assert passage.locator["provider"] == "Crossref"
    assert scholarship._crossref_passage({**record, "abstract": ""}) is None  # noqa: SLF001


async def test_test_lens_fetches_research_only_beside_canon(monkeypatch) -> None:
    seen: list[tuple[str, bool]] = []

    async def fake_search(question: str):
        seen.append(question)
        return [_paper()]

    monkeypatch.setattr(scholarship, "search", fake_search)

    passages, available = await service._with_scholarship(  # noqa: SLF001
        [_canon()], "What academic evidence tests this?"
    )
    private, private_available = await service._with_scholarship(  # noqa: SLF001
        [
            retriever.Passage(
                id="note-1",
                kind="note",
                label="Private note",
                text="A personal note.",
                score=1.0,
            )
        ],
        "Find academic evidence",
    )

    assert len(seen) == 1
    assert seen[0].startswith("What academic evidence tests this?")
    assert "The Painting interprets" in seen[0]
    assert available is True
    assert [passage.id for passage in passages] == ["book-1", "s2:paper-1"]
    assert private_available is False
    assert [passage.id for passage in private] == ["note-1"]


def test_research_answer_must_cite_book_and_paper() -> None:
    passages = [_canon(), _paper()]

    both = boundary.FinalAnswer(answer="A bounded comparison.", cites=["book-1", "s2:paper-1"])
    book_only = boundary.FinalAnswer(answer="An uncited comparison.", cites=["book-1"])
    paper_only = boundary.FinalAnswer(answer="Canon disappeared.", cites=["s2:paper-1"])

    assert service._grounded_citation_ids(  # noqa: SLF001
        both, passages, scholarship_available=True
    ) == ["book-1", "s2:paper-1"]
    assert (
        service._grounded_citation_ids(  # noqa: SLF001
            book_only, passages, scholarship_available=True
        )
        is None
    )
    assert (
        service._grounded_citation_ids(  # noqa: SLF001
            paper_only, passages, scholarship_available=True
        )
        is None
    )


def test_scholarly_abstract_crosses_the_model_boundary_as_citable_text() -> None:
    fragments = retriever.passages_to_fragments([_canon(), _paper()])
    book = next(fragment for fragment in fragments if fragment["node_id"] == "book-1")
    paper = next(fragment for fragment in fragments if fragment["node_id"] == "s2:paper-1")

    assert "The Painting interprets" in book["text"]
    assert "Prior expectations influence perception" in paper["text"]
    assert "properties" not in paper
    instruction = service._scholarship_instruction(True)  # noqa: SLF001
    assert "released Book One node_id" in instruction
    assert "scholarly_work node_id" in instruction
