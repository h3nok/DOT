"""A citation has to open at the passage, not the top of the chapter.

The whole promise of this platform is that a claim can be walked back to its
origin. Chunk locators carry the section and character offsets, which names the
source but does not open it — the reader lands at the chapter head and has to
hunt. The extractive fallback already recovered the heading; the two synthesis
paths shipped the raw locator, so every model-answered citation lost its anchor.
"""

from __future__ import annotations

import app.domains.twin.retriever as retriever
import app.domains.twin.service as service

CHUNK = """## Repainting the Canvas

A hardened Painting is not fate.

Repainting begins when a pattern becomes visible and Little c can remain present
long enough to examine it.
"""


def _passage(locator: dict | None) -> retriever.Passage:
    return retriever.Passage(
        id="chk_1",
        kind="chunk",
        label="Consciousness: A Digital Organism · Chapter 5 · The Canvas",
        text=CHUNK,
        score=1.0,
        locator=locator,
    )


def test_a_chunk_citation_gains_the_heading_anchor() -> None:
    locator = service._locator_with_heading(  # noqa: SLF001
        _passage({"section": "the-canvas", "start": 10, "end": 200}),
        "Why do I keep repeating the same patterns?",
    )

    assert locator is not None
    assert locator["heading"] == "repainting-the-canvas"
    assert locator["heading_title"] == "Repainting the Canvas"
    # The offsets the retriever supplied must survive enrichment.
    assert locator["section"] == "the-canvas"
    assert locator["start"] == 10


def test_the_slug_matches_the_readers_own_heading_rules() -> None:
    # `headingSlug.ts` is the single implementation for links into the released
    # text. Apostrophes are dropped, not hyphenated, or the anchor lands nowhere.
    assert service._heading_slug("What Chapter 1 Has—and Has Not—Established") == (  # noqa: SLF001
        "what-chapter-1-has-and-has-not-established"
    )
    assert service._heading_slug("A Reader's Method") == "a-readers-method"  # noqa: SLF001


def test_an_existing_heading_is_never_overwritten() -> None:
    locator = service._locator_with_heading(  # noqa: SLF001
        _passage({"section": "the-canvas", "heading": "already-set"}),
        "anything",
    )

    assert locator is not None
    assert locator["heading"] == "already-set"


def test_a_passage_without_a_locator_stays_without_one() -> None:
    assert service._locator_with_heading(_passage(None), "anything") is None  # noqa: SLF001


def test_a_chunk_with_no_heading_keeps_its_locator_unchanged() -> None:
    passage = retriever.Passage(
        id="chk_2",
        kind="chunk",
        label="Untitled",
        text="A paragraph carrying no markdown heading at all.",
        score=1.0,
        locator={"section": "the-canvas"},
    )

    locator = service._locator_with_heading(passage, "anything")  # noqa: SLF001

    assert locator == {"section": "the-canvas"}
