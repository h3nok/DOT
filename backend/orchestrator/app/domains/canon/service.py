"""The canon: released text the twin is allowed to quote.

The book is the movement's fixed reference (ADR-0017), so it has to be reachable
by the agent rather than only by the browser. Sections are ingested as source
objects whose chunks carry a locator back to part, chapter, and character range —
a citation a reader can actually turn to.

Canon is ingested `public` deliberately, and it is the only thing that ever is.
Uploaded documents stay private (ADR-0007); widening is an explicit act here, not
a default anywhere else.

Claim levels are **declared, never inferred**. The book distinguishes
observation, model, hypothesis, and speculation; guessing which one a passage
belongs to would manufacture exactly the false certainty the theory argues
against. An undeclared section carries no claim level at all.
"""

from __future__ import annotations

import dataclasses
import hashlib
import typing

import sqlalchemy
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.db.models
import app.domains.knowledge.chunk
import app.domains.knowledge.service

#: The vocabulary the book declares in its reader contract.
CLAIM_LEVELS: frozenset[str] = frozenset({"Observation", "Model", "Hypothesis", "Speculation"})

ANCHOR_TYPE = "canon_passage"


class CanonError(Exception):
    """A section that cannot be ingested as written."""


@dataclasses.dataclass(frozen=True)
class CanonSection:
    """One released section of an edition."""

    slug: str
    kind: str
    title: str
    part: str
    text: str
    number: int | None = None
    #: Declared by the author. Never derived from the prose.
    claim_level: str | None = None

    def __post_init__(self) -> None:
        if self.claim_level is not None and self.claim_level not in CLAIM_LEVELS:
            raise CanonError(
                f"{self.slug}: unknown claim level {self.claim_level!r}; "
                f"expected one of {sorted(CLAIM_LEVELS)}"
            )


@dataclasses.dataclass(frozen=True)
class CanonIngestResult:
    section_slug: str
    source_object_id: str
    source_version_id: str
    chunk_count: int
    embedded_count: int
    unchanged: bool


def citation_label(edition_title: str, section: CanonSection) -> str:
    """What a reader sees next to a quoted passage."""

    if section.kind == "chapter" and section.number is not None:
        return f"{edition_title} · Chapter {section.number} · {section.title}"
    return f"{edition_title} · {section.title}"


async def _existing_object(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner_id: str,
    object_store_key: str,
) -> app.db.models.SourceObject | None:
    result = await session.execute(
        sqlalchemy.select(app.db.models.SourceObject).where(
            app.db.models.SourceObject.owner_id == owner_id,
            app.db.models.SourceObject.object_store_key == object_store_key,
        )
    )
    return result.scalar_one_or_none()


async def _latest_version(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    source_object_id: str,
) -> app.db.models.SourceVersion | None:
    result = await session.execute(
        sqlalchemy.select(app.db.models.SourceVersion)
        .where(app.db.models.SourceVersion.source_object_id == source_object_id)
        .order_by(app.db.models.SourceVersion.version_num.desc())
        .limit(1)
    )
    return result.scalars().first()


async def ingest_section(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    *,
    edition_slug: str,
    edition_title: str,
    section: CanonSection,
    release_id: str | None = None,
) -> CanonIngestResult:
    """Ingest one section. Re-ingesting identical text is a no-op."""

    if not section.text.strip():
        raise CanonError(f"{section.slug}: section has no text")

    # New canon is keyed by immutable release id. `edition_slug` remains as a
    # compatibility fallback for callers ingesting an unversioned private draft.
    key: str = f"canon/{release_id or edition_slug}/{section.slug}.md"
    digest: str = hashlib.sha256(section.text.encode("utf-8")).hexdigest()
    label: str = citation_label(edition_title, section)

    record: app.db.models.SourceObject | None = await _existing_object(session, owner.owner_id, key)
    if record is None:
        record = app.db.models.SourceObject(
            owner_id=owner.owner_id,
            filename=label,
            object_store_key=key,
            size_bytes=len(section.text.encode("utf-8")),
            mime_type="text/markdown",
            status="ready",
            visibility="public",
        )
        session.add(record)
        await session.flush()
    else:
        # A retitled section is still the same section; keep the citation current.
        record.filename = label
        record.status = "ready"
        record.visibility = "public"

    previous: app.db.models.SourceVersion | None = await _latest_version(session, record.id)
    if previous is not None and previous.content_hash == digest:
        existing_chunks = list(
            (
                await session.scalars(
                    sqlalchemy.select(app.db.models.KnowledgeChunk)
                    .where(app.db.models.KnowledgeChunk.source_version_id == previous.id)
                    .order_by(app.db.models.KnowledgeChunk.chunk_index)
                )
            ).all()
        )
        embedded = await app.domains.knowledge.service.embed_chunks(existing_chunks)
        await session.commit()
        return CanonIngestResult(
            section_slug=section.slug,
            source_object_id=record.id,
            source_version_id=previous.id,
            chunk_count=len(existing_chunks),
            embedded_count=embedded,
            unchanged=True,
        )

    # Historical releases remain in storage for provenance, but only the newest
    # released text may be retrieved as canon.
    if previous is not None:
        previous.status = "superseded"

    version = app.db.models.SourceVersion(
        source_object_id=record.id,
        version_num=(previous.version_num + 1) if previous else 1,
        content_hash=digest,
        status="ready",
    )
    session.add(version)
    await session.flush()

    chunks = app.domains.knowledge.chunk.chunk_text(section.text)
    stored_chunks: list[app.db.models.KnowledgeChunk] = []
    for chunk in chunks:
        stored = app.db.models.KnowledgeChunk(
            source_version_id=version.id,
            chunk_index=chunk.index,
            text=chunk.text,
            token_count=chunk.token_count,
        )
        session.add(stored)
        await session.flush()
        stored_chunks.append(stored)

        locator: dict[str, typing.Any] = {
            "edition": edition_slug,
            "section": section.slug,
            "part": section.part,
            "title": section.title,
            "kind": section.kind,
            "start": chunk.start,
            "end": chunk.end,
        }
        if release_id is not None:
            locator["release_id"] = release_id
        if section.number is not None:
            locator["chapter"] = section.number
        if section.claim_level is not None:
            locator["claim_level"] = section.claim_level

        session.add(
            app.db.models.SourceAnchor(
                chunk_id=stored.id,
                anchor_type=ANCHOR_TYPE,
                locator=locator,
            )
        )

    embedded = await app.domains.knowledge.service.embed_chunks(stored_chunks)
    await session.commit()
    return CanonIngestResult(
        section_slug=section.slug,
        source_object_id=record.id,
        source_version_id=version.id,
        chunk_count=len(chunks),
        embedded_count=embedded,
        unchanged=False,
    )


async def ingest_edition(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    *,
    edition_slug: str,
    edition_title: str,
    sections: typing.Sequence[CanonSection],
    release_id: str | None = None,
) -> list[CanonIngestResult]:
    results: list[CanonIngestResult] = []
    for section in sections:
        results.append(
            await ingest_section(
                session,
                owner,
                edition_slug=edition_slug,
                edition_title=edition_title,
                section=section,
                release_id=release_id,
            )
        )
    return results
