"""Text extraction from uploaded sources.

Extraction is lossy in one direction only: the text this module returns is the
coordinate space every downstream anchor points into. A citation can therefore
always be resolved back to a location the member can be shown.

Untrusted bytes are parsed here, so every path is bounded — page counts, decoded
size, and the extracted result are all capped rather than trusted.
"""

from __future__ import annotations

import dataclasses
import io
import json
import typing

#: Extracted text is held in memory and embedded downstream, so it is capped
#: well below the upload limit rather than scaling with it.
MAX_EXTRACTED_CHARS = 4_000_000
MAX_PDF_PAGES = 2_000

_TEXT_MIME_PREFIXES: tuple[str, ...] = ("text/",)
_TEXT_MIME_TYPES: frozenset[str] = frozenset(
    {
        "application/json",
        "application/x-ndjson",
        "application/xml",
        "application/yaml",
        "application/x-yaml",
        "application/csv",
        "application/markdown",
    }
)
_TEXT_EXTENSIONS: frozenset[str] = frozenset(
    {"txt", "md", "markdown", "rst", "csv", "tsv", "json", "jsonl", "yaml", "yml", "xml", "log"}
)
_PDF_EXTENSIONS: frozenset[str] = frozenset({"pdf"})


class UnsupportedSourceError(RuntimeError):
    """Raised when a source cannot be read as text. Carries no file content."""


@dataclasses.dataclass(frozen=True)
class PageSpan:
    """Half-open character range in the extracted text for one source page."""

    number: int
    start: int
    end: int


@dataclasses.dataclass(frozen=True)
class ExtractedText:
    text: str
    pages: tuple[PageSpan, ...] = ()
    truncated: bool = False


def _extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def is_supported(mime_type: str, filename: str) -> bool:
    return _kind(mime_type, filename) is not None


def _kind(mime_type: str, filename: str) -> typing.Literal["text", "pdf"] | None:
    normalized: str = (mime_type or "").split(";", 1)[0].strip().lower()
    extension: str = _extension(filename)

    if normalized == "application/pdf" or extension in _PDF_EXTENSIONS:
        return "pdf"
    if normalized.startswith(_TEXT_MIME_PREFIXES) or normalized in _TEXT_MIME_TYPES:
        return "text"
    if extension in _TEXT_EXTENSIONS:
        return "text"
    return None


def _normalize(raw: str) -> tuple[str, bool]:
    """Collapse line endings and trailing whitespace so offsets are stable."""

    text: str = raw.replace("\r\n", "\n").replace("\r", "\n")
    text = "\n".join(line.rstrip() for line in text.split("\n"))
    if len(text) > MAX_EXTRACTED_CHARS:
        return text[:MAX_EXTRACTED_CHARS], True
    return text, False


def _extract_text(data: bytes) -> ExtractedText:
    decoded: str = data.decode("utf-8", errors="replace")
    text, truncated = _normalize(decoded)
    return ExtractedText(text=text, truncated=truncated)


def _extract_json(data: bytes) -> ExtractedText:
    """Re-serialize JSON so keys and values land on separate lines to chunk on."""

    decoded: str = data.decode("utf-8", errors="replace")
    try:
        parsed: typing.Any = json.loads(decoded)
    except json.JSONDecodeError:
        return _extract_text(data)
    text, truncated = _normalize(json.dumps(parsed, indent=2, ensure_ascii=False))
    return ExtractedText(text=text, truncated=truncated)


def _extract_pdf(data: bytes) -> ExtractedText:
    try:
        import pypdf
    except ImportError as exc:  # pragma: no cover - dependency is declared
        raise UnsupportedSourceError("PDF support is not installed.") from exc

    try:
        reader = pypdf.PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            raise UnsupportedSourceError("Encrypted PDFs cannot be read.")
        page_count: int = min(len(reader.pages), MAX_PDF_PAGES)
        parts: list[str] = []
        pages: list[PageSpan] = []
        cursor: int = 0
        for index in range(page_count):
            page_text, _ = _normalize(reader.pages[index].extract_text() or "")
            if not page_text.strip():
                continue
            parts.append(page_text)
            pages.append(PageSpan(number=index + 1, start=cursor, end=cursor + len(page_text)))
            # Page break doubles as a paragraph break for the chunker.
            cursor += len(page_text) + 2
    except UnsupportedSourceError:
        raise
    except Exception as exc:  # noqa: BLE001 - pypdf raises broadly on malformed input
        raise UnsupportedSourceError("PDF could not be read.") from exc

    text, truncated = _normalize("\n\n".join(parts))
    kept: tuple[PageSpan, ...] = tuple(page for page in pages if page.start < len(text))
    return ExtractedText(text=text, pages=kept, truncated=truncated or len(kept) != len(pages))


def extract(data: bytes, *, mime_type: str, filename: str) -> ExtractedText:
    """Return normalized text plus page spans, or raise UnsupportedSourceError."""

    kind = _kind(mime_type, filename)
    if kind is None:
        raise UnsupportedSourceError("This file type cannot be read as text.")
    if kind == "pdf":
        return _extract_pdf(data)
    if _extension(filename) in {"json", "jsonl"} or "json" in (mime_type or ""):
        return _extract_json(data)
    return _extract_text(data)
