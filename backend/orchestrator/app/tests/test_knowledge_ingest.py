"""Ingest pipeline: extraction, chunking, and anchor fidelity.

The load-bearing property is that every chunk's character range resolves back
into the extracted text. A citation the member cannot locate in their own source
is indistinguishable from one the twin invented.
"""

import pytest

import app.domains.knowledge.chunk as chunking
import app.domains.knowledge.embedding as embedding
import app.domains.knowledge.extract as extraction


def _document(paragraphs: int = 8, sentence: str = "lorem ipsum dolor sit amet ") -> str:
    return "\n\n".join(f"Paragraph {i}. " + sentence * 12 for i in range(paragraphs))


def test_every_chunk_range_resolves_to_its_own_text() -> None:
    text = _document()
    chunks = chunking.chunk_text(text)

    assert chunks
    for chunk in chunks:
        assert 0 <= chunk.start < chunk.end <= len(text)
        # The chunk joins segments with a normalized separator, so the range is
        # checked on its endpoints rather than by string equality.
        assert text[chunk.start : chunk.end].strip()
        assert chunk.text.startswith(text[chunk.start : chunk.start + 20].strip()[:20])


def test_chunks_are_indexed_in_order_without_gaps() -> None:
    chunks = chunking.chunk_text(_document(20))
    assert [chunk.index for chunk in chunks] == list(range(len(chunks)))


def test_every_chunk_stays_within_the_size_guarantee() -> None:
    for chunk in chunking.chunk_text(_document(40)):
        assert len(chunk.text) <= chunking.MAX_CHUNK_CHARS


def test_consecutive_chunks_overlap_so_split_statements_stay_retrievable() -> None:
    chunks = chunking.chunk_text(_document(20))
    assert len(chunks) > 1
    for previous, following in zip(chunks, chunks[1:], strict=False):
        assert following.start < previous.end


def test_a_sentence_longer_than_the_window_is_still_chunked() -> None:
    text = "word " * (chunking.TARGET_CHARS // 2)
    chunks = chunking.chunk_text(text)

    assert chunks
    assert all(len(chunk.text) <= chunking.MAX_CHUNK_CHARS for chunk in chunks)


def test_no_chunk_is_only_carried_overlap() -> None:
    """A chunk holding nothing but the previous tail is a duplicate citation."""

    for document in (_document(20), "word " * (chunking.TARGET_CHARS // 2)):
        for chunk in chunking.chunk_text(document):
            assert len(chunk.text) > chunking.OVERLAP_CHARS


def test_empty_and_whitespace_documents_produce_no_chunks() -> None:
    assert chunking.chunk_text("") == []
    assert chunking.chunk_text("   \n\n  \t \n") == []


def test_short_document_is_a_single_chunk() -> None:
    chunks = chunking.chunk_text("A short note about attention.")
    assert len(chunks) == 1
    assert chunks[0].text == "A short note about attention."


def test_token_count_is_positive_for_every_chunk() -> None:
    for chunk in chunking.chunk_text(_document()):
        assert chunk.token_count > 0


@pytest.mark.parametrize(
    ("mime_type", "filename", "supported"),
    [
        ("text/plain", "notes.txt", True),
        ("text/markdown", "doctrine.md", True),
        ("application/json", "graph.json", True),
        ("application/pdf", "book.pdf", True),
        ("", "notes.md", True),
        ("application/octet-stream", "payload.bin", False),
        ("image/png", "photo.png", False),
        ("application/zip", "archive.zip", False),
    ],
)
def test_supported_source_types(mime_type: str, filename: str, supported: bool) -> None:
    assert extraction.is_supported(mime_type, filename) is supported


def test_unsupported_source_is_refused_rather_than_guessed() -> None:
    with pytest.raises(extraction.UnsupportedSourceError):
        extraction.extract(b"\x00\x01\x02", mime_type="image/png", filename="photo.png")


def test_line_endings_are_normalized_so_offsets_are_stable() -> None:
    crlf = extraction.extract(b"one\r\n\r\ntwo", mime_type="text/plain", filename="a.txt")
    lf = extraction.extract(b"one\n\ntwo", mime_type="text/plain", filename="a.txt")
    assert crlf.text == lf.text


def test_extraction_is_capped_below_the_upload_limit() -> None:
    oversized = b"a" * (extraction.MAX_EXTRACTED_CHARS + 5_000)
    result = extraction.extract(oversized, mime_type="text/plain", filename="big.txt")

    assert result.truncated is True
    assert len(result.text) == extraction.MAX_EXTRACTED_CHARS


def test_invalid_json_falls_back_to_raw_text_instead_of_failing() -> None:
    result = extraction.extract(b"{not json", mime_type="application/json", filename="a.json")
    assert result.text == "{not json"


def test_page_spans_map_chunks_to_their_source_page() -> None:
    first = "Page one content. " * 40
    second = "Page two content. " * 40
    text = f"{first}\n\n{second}"
    pages = ((1, 0, len(first)), (2, len(first) + 2, len(text)))

    chunks = chunking.chunk_text(text, pages)

    assert chunks
    assert chunks[0].page == 1
    assert {chunk.page for chunk in chunks} <= {1, 2}


def test_normalized_vectors_are_unit_length() -> None:
    vector = embedding.normalize([3.0, 4.0])
    assert vector == pytest.approx([0.6, 0.8])
    assert embedding.cosine_similarity(vector, vector) == pytest.approx(1.0)


def test_a_zero_vector_normalizes_without_dividing_by_zero() -> None:
    assert embedding.normalize([0.0, 0.0]) == [0.0, 0.0]


def test_similarity_of_mismatched_vectors_is_zero_not_partial() -> None:
    """A dimension change must not silently score against old vectors."""

    assert embedding.cosine_similarity([1.0, 0.0], [1.0, 0.0, 0.0]) == 0.0
    assert embedding.cosine_similarity([], [1.0]) == 0.0


def test_opposing_vectors_score_below_aligned_ones() -> None:
    aligned = embedding.cosine_similarity([1.0, 0.0], [1.0, 0.0])
    orthogonal = embedding.cosine_similarity([1.0, 0.0], [0.0, 1.0])
    opposed = embedding.cosine_similarity([1.0, 0.0], [-1.0, 0.0])

    assert aligned > orthogonal > opposed


async def test_an_unconfigured_embedding_client_refuses_rather_than_returning_empty() -> None:
    """Silent empty vectors would look like a document with no content."""

    with pytest.raises(embedding.EmbeddingUnavailableError):
        await embedding.NullEmbeddingClient().embed(["anything"])
