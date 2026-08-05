"""Chunking (ADR-0010 grounding).

Chunks are the unit the twin cites, so each one carries a character range back
into the extracted text. A citation that cannot be located in the source is a
citation the member cannot check, which the grounding contract does not allow.

Splitting prefers paragraph boundaries, falls back to sentences, and only cuts
mid-sentence when a single sentence exceeds the window on its own.

Carried overlap is a prefix rather than budgeted content. Counting it against
the packing budget lets a chunk be emitted that holds nothing but the tail of
the one before it, which is a citation pointing at a duplicate.
"""

from __future__ import annotations

import dataclasses
import re

#: Sized for retrieval rather than display: large enough to carry an argument,
#: small enough that a citation points at something specific.
TARGET_CHARS = 1_400
OVERLAP_CHARS = 160
_SEPARATOR = "\n\n"

#: The guarantee callers can rely on, derived rather than declared.
MAX_CHUNK_CHARS = TARGET_CHARS + OVERLAP_CHARS + len(_SEPARATOR)

_PARAGRAPH_BREAK: re.Pattern[str] = re.compile(r"\n\s*\n")
_SENTENCE_END: re.Pattern[str] = re.compile(r"(?<=[.!?])\s+")


@dataclasses.dataclass(frozen=True)
class Chunk:
    index: int
    text: str
    start: int
    end: int
    page: int | None = None

    @property
    def token_count(self) -> int:
        """Approximate tokens. Used for budgeting a prompt, not for billing."""

        return max(1, len(self.text) // 4)


@dataclasses.dataclass(frozen=True)
class _Segment:
    text: str
    start: int


def _segments(text: str) -> list[_Segment]:
    """Paragraphs, with anything oversized broken down until it fits the budget."""

    out: list[_Segment] = []
    cursor: int = 0
    for piece in _PARAGRAPH_BREAK.split(text):
        start: int = text.find(piece, cursor) if piece else cursor
        if start < 0:
            start = cursor
        cursor = start + len(piece)
        stripped: str = piece.strip()
        if not stripped:
            continue
        offset: int = start + piece.index(stripped)
        if len(stripped) <= TARGET_CHARS:
            out.append(_Segment(text=stripped, start=offset))
            continue
        out.extend(_split_long(stripped, offset))
    return out


def _split_long(paragraph: str, origin: int) -> list[_Segment]:
    out: list[_Segment] = []
    cursor: int = 0
    for sentence in _SENTENCE_END.split(paragraph):
        if not sentence:
            continue
        start: int = paragraph.find(sentence, cursor)
        if start < 0:
            start = cursor
        cursor = start + len(sentence)
        if len(sentence) <= TARGET_CHARS:
            out.append(_Segment(text=sentence, start=origin + start))
            continue
        # A single sentence longer than the budget: cut it on the budget.
        for offset in range(0, len(sentence), TARGET_CHARS):
            out.append(
                _Segment(
                    text=sentence[offset : offset + TARGET_CHARS],
                    start=origin + start + offset,
                )
            )
    return out


def _page_for(start: int, pages: tuple[tuple[int, int, int], ...]) -> int | None:
    for number, page_start, page_end in pages:
        if page_start <= start < page_end:
            return number
    return None


def chunk_text(
    text: str,
    pages: tuple[tuple[int, int, int], ...] = (),
) -> list[Chunk]:
    """Split extracted text into citable chunks with stable character ranges."""

    segments: list[_Segment] = _segments(text)
    if not segments:
        return []

    chunks: list[Chunk] = []
    buffer: list[_Segment] = []
    buffered: int = 0
    prefix: _Segment | None = None

    def flush() -> None:
        nonlocal buffer, buffered, prefix
        if not buffer:
            return
        parts: list[_Segment] = ([prefix] if prefix else []) + buffer
        body: str = _SEPARATOR.join(part.text for part in parts)
        chunks.append(
            Chunk(
                index=len(chunks),
                text=body,
                start=parts[0].start,
                end=buffer[-1].start + len(buffer[-1].text),
                page=_page_for(parts[0].start, pages),
            )
        )
        # Carry the tail forward so a statement split across a boundary stays
        # retrievable from either side.
        emitted: Chunk = chunks[-1]
        tail: str = emitted.text[-OVERLAP_CHARS:] if OVERLAP_CHARS else ""
        prefix = _Segment(text=tail, start=max(emitted.end - len(tail), 0)) if tail else None
        buffer = []
        buffered = 0

    for segment in segments:
        if buffered and buffered + len(_SEPARATOR) + len(segment.text) > TARGET_CHARS:
            flush()
        buffer.append(segment)
        buffered += len(segment.text) + (len(_SEPARATOR) if buffered else 0)

    flush()
    return chunks
