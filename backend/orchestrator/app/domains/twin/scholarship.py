"""Bounded scholarly context for Minty's public reading companion.

Google Scholar does not offer a supported search API and explicitly blocks bulk
automated access. Minty therefore retrieves inspectable abstracts through the
official Crossref REST API, or Semantic Scholar's Academic Graph API when an API
key is configured, then gives the reader a Google Scholar query link for
independent discovery. Remote records are still untrusted context and pass
through the same citation boundary as canon.
"""

from __future__ import annotations

import re
import time
import typing
import urllib.parse
from html.parser import HTMLParser

import httpx

import app.domains.twin.retriever as retriever
import app.settings

SEARCH_ENDPOINT = "https://api.semanticscholar.org/graph/v1/paper/search"
CROSSREF_ENDPOINT = "https://api.crossref.org/works"
MAX_RESULTS = 3
CACHE_TTL_SECONDS = 3_600
MAX_CACHE_ENTRIES = 128
_CACHE: dict[str, tuple[float, list[retriever.Passage]]] = {}

_RESEARCH_INTENT = re.compile(
    r"\b(?:academic|evidence|empirical|literature|paper|papers|peer[- ]reviewed|"
    r"research|scholar|scholarly|science|scientific|studies|study)\b",
    re.IGNORECASE,
)

_QUERY_EXPANSIONS: tuple[tuple[re.Pattern[str], str], ...] = (
    (
        re.compile(r"\bdigital organism\b", re.IGNORECASE),
        "self-organization information processing living systems autopoiesis",
    ),
    (
        re.compile(r"\b(?:canvas|painting)\b", re.IGNORECASE),
        "predictive processing cognitive schemas conditioning prior expectations perception",
    ),
    (
        re.compile(r"\b(?:little c|intent)\b", re.IGNORECASE),
        "conscious intention agency goal-directed action motor preparation",
    ),
    (
        re.compile(r"\breality frames?\b", re.IGNORECASE),
        "ecological psychology affordances constraints perception action",
    ),
    (
        re.compile(r"\b(?:fear|love)\b", re.IGNORECASE),
        "threat cognition social safety compassion cognitive flexibility",
    ),
)


def wants_scholarship(question: str) -> bool:
    """Research is pulled only when the reader explicitly asks for it."""

    return bool(_RESEARCH_INTENT.search(question))


def research_query(question: str) -> str:
    """Translate DOT-specific vocabulary into neutral research vocabulary."""

    reader_question, _, supporting_passage = question.partition("\n")
    expansions = [
        expansion for pattern, expansion in _QUERY_EXPANSIONS if pattern.search(reader_question)
    ]
    # When the reader says only "test this", the released passage supplies the
    # vocabulary. When they name Painting, Fear, Intent, etc., that explicit
    # subject wins and incidental terms in the passage cannot redirect search.
    if not expansions:
        expansions = [
            expansion
            for pattern, expansion in _QUERY_EXPANSIONS
            if pattern.search(supporting_passage)
        ]
    # Once local vocabulary has a neutral expansion, do not append boilerplate
    # such as "what peer-reviewed research bears on..." or the DOT term itself.
    # Crossref's bibliographic search otherwise overweights generic words such
    # as "research", "model", and "predictive" and returns unrelated records.
    if expansions:
        return " ".join(expansions)[:300]
    return question[:300]


def _authors(record: dict[str, typing.Any]) -> str:
    names = [
        author.get("name", "").strip()
        for author in record.get("authors", [])
        if isinstance(author, dict) and isinstance(author.get("name"), str)
    ]
    if not names:
        return "Unknown author"
    if len(names) == 1:
        return names[0]
    return f"{names[0]} et al."


def _doi_href(external_ids: object) -> str | None:
    if not isinstance(external_ids, dict):
        return None
    doi = external_ids.get("DOI")
    if not isinstance(doi, str) or not doi.strip():
        return None
    return f"https://doi.org/{urllib.parse.quote(doi.strip(), safe='/().;:-_')}"


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.parts.append(data.strip())


def _plain_text(markup: object) -> str:
    if not isinstance(markup, str):
        return ""
    parser = _TextExtractor()
    parser.feed(markup)
    return " ".join(parser.parts)


def _first_string(value: object) -> str | None:
    if not isinstance(value, list):
        return None
    return next((item.strip() for item in value if isinstance(item, str) and item.strip()), None)


def _crossref_year(record: dict[str, typing.Any]) -> int | None:
    published = record.get("published")
    if not isinstance(published, dict):
        return None
    date_parts = published.get("date-parts")
    if not isinstance(date_parts, list) or not date_parts or not isinstance(date_parts[0], list):
        return None
    year = date_parts[0][0] if date_parts[0] else None
    return year if isinstance(year, int) else None


def _crossref_authors(record: dict[str, typing.Any]) -> str:
    authors = record.get("author")
    if not isinstance(authors, list):
        return "Unknown author"
    names: list[str] = []
    for author in authors:
        if not isinstance(author, dict):
            continue
        name = " ".join(
            part.strip()
            for key in ("given", "family")
            if isinstance((part := author.get(key)), str) and part.strip()
        )
        if name:
            names.append(name)
    if not names:
        return "Unknown author"
    return names[0] if len(names) == 1 else f"{names[0]} et al."


def _crossref_passage(record: dict[str, typing.Any]) -> retriever.Passage | None:
    doi = record.get("DOI")
    title = _first_string(record.get("title"))
    abstract = _plain_text(record.get("abstract"))
    if not isinstance(doi, str) or not doi.strip() or not title or not abstract:
        return None

    author = _crossref_authors(record)
    year = _crossref_year(record)
    label = f"{author} ({year}) · {title}" if year else f"{author} · {title}"
    locator: dict[str, typing.Any] = {
        "provider": "Crossref",
        "title": title,
        "authors": author,
        "href": f"https://doi.org/{urllib.parse.quote(doi.strip(), safe='/().;:-_')}",
        "scholar_url": (
            "https://scholar.google.com/scholar?" + urllib.parse.urlencode({"q": f'"{title}"'})
        ),
    }
    if year:
        locator["year"] = year
    venue = _first_string(record.get("container-title"))
    if venue:
        locator["venue"] = venue

    return retriever.Passage(
        id=f"crossref:{doi.strip().lower()}",
        kind="scholarly_work",
        label=label,
        text=f"Title: {title}\nAuthors: {author}\nAbstract: {abstract}",
        score=1.0,
        locator=locator,
    )


def _paper_passage(record: dict[str, typing.Any]) -> retriever.Passage | None:
    paper_id = record.get("paperId")
    title = record.get("title")
    abstract = record.get("abstract")
    if not all(isinstance(value, str) and value.strip() for value in (paper_id, title, abstract)):
        # Metadata alone can locate a paper but cannot ground a claim about it.
        return None

    year = record.get("year") if isinstance(record.get("year"), int) else None
    author = _authors(record)
    label = f"{author} ({year}) · {title.strip()}" if year else f"{author} · {title.strip()}"
    href = _doi_href(record.get("externalIds"))
    if href is None:
        raw_url = record.get("url")
        href = raw_url if isinstance(raw_url, str) and raw_url.startswith("https://") else None

    locator: dict[str, typing.Any] = {
        "provider": "Semantic Scholar",
        "title": title.strip(),
        "authors": author,
        "scholar_url": (
            "https://scholar.google.com/scholar?"
            + urllib.parse.urlencode({"q": f'"{title.strip()}"'})
        ),
    }
    if href:
        locator["href"] = href
    if year:
        locator["year"] = year
    venue = record.get("venue")
    if isinstance(venue, str) and venue.strip():
        locator["venue"] = venue.strip()

    return retriever.Passage(
        id=f"s2:{paper_id.strip()}",
        kind="scholarly_work",
        label=label,
        text=f"Title: {title.strip()}\nAuthors: {author}\nAbstract: {abstract.strip()}",
        score=1.0,
        locator=locator,
    )


async def search(question: str) -> list[retriever.Passage]:
    """Return a small, abstract-bearing research set or fail closed to none."""

    settings = app.settings.get_settings()
    if not settings.SCHOLARLY_SEARCH_ENABLED or not wants_scholarship(question):
        return []

    query = research_query(question)
    cached = _CACHE.get(query)
    if cached and time.monotonic() - cached[0] < CACHE_TTL_SECONDS:
        return cached[1]

    headers: dict[str, str] = {}
    if settings.SEMANTIC_SCHOLAR_API_KEY:
        headers["x-api-key"] = settings.SEMANTIC_SCHOLAR_API_KEY

    passages: list[retriever.Passage] = []
    async with httpx.AsyncClient(timeout=settings.SCHOLARLY_SEARCH_TIMEOUT_SECONDS) as client:
        # An API key gets the supported Semantic Scholar pool. Without one,
        # start with Crossref instead of spending latency on a public pool that
        # routinely answers 429 under production traffic.
        if settings.SEMANTIC_SCHOLAR_API_KEY:
            try:
                response = await client.get(
                    SEARCH_ENDPOINT,
                    params={
                        "query": query,
                        "limit": 6,
                        "fields": "paperId,title,authors,year,abstract,url,externalIds,venue",
                    },
                    headers=headers,
                )
                response.raise_for_status()
                payload = response.json()
                records = payload.get("data", []) if isinstance(payload, dict) else []
                passages = [
                    passage
                    for record in records
                    if isinstance(record, dict) and (passage := _paper_passage(record)) is not None
                ][:MAX_RESULTS]
            except (httpx.HTTPError, ValueError, TypeError):
                passages = []

        # Semantic Scholar's unauthenticated pool can be saturated. Crossref is
        # an official public metadata API; only abstract-bearing records cross
        # the grounding boundary, so this fallback cannot turn a title into a
        # claim about a paper.
        if not passages:
            try:
                params: dict[str, str | int] = {
                    "query.bibliographic": query,
                    # Crossref type describes publication format, not review
                    # status. Restrict to journal articles but never represent
                    # the provider metadata itself as proof of peer review.
                    "filter": "has-abstract:true,type:journal-article",
                    "rows": 6,
                    "select": "DOI,title,abstract,author,published,container-title,URL",
                }
                if settings.SCHOLARLY_CONTACT_EMAIL:
                    params["mailto"] = settings.SCHOLARLY_CONTACT_EMAIL
                response = await client.get(
                    CROSSREF_ENDPOINT,
                    params=params,
                    headers={"User-Agent": "DOT-Minty/1.0 (https://dotheory.org)"},
                )
                response.raise_for_status()
                payload = response.json()
                message = payload.get("message", {}) if isinstance(payload, dict) else {}
                records = message.get("items", []) if isinstance(message, dict) else []
                passages = [
                    passage
                    for record in records
                    if isinstance(record, dict)
                    and (passage := _crossref_passage(record)) is not None
                ][:MAX_RESULTS]
            except (httpx.HTTPError, ValueError, TypeError):
                passages = []

    # Cache empty results briefly too: an unavailable provider should not be
    # hammered by repeated UI retries.
    if len(_CACHE) >= MAX_CACHE_ENTRIES:
        _CACHE.pop(next(iter(_CACHE)))
    _CACHE[query] = (time.monotonic(), passages)
    return passages
