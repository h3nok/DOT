"""Ingest: uploaded bytes become citable knowledge.

This is the step that was missing between the vault and the twin. Before it, an
upload produced a source node with a filename and nothing readable behind it, so
the twin could name a member's document but never answer from it.

The pipeline is deliberately re-runnable. Content is hashed, and re-ingesting
identical bytes is a no-op rather than a second set of chunks competing with the
first during retrieval.
"""

from __future__ import annotations

import dataclasses
import hashlib
import logging

import sqlalchemy
import sqlalchemy.ext.asyncio
import sqlalchemy.orm

import app.auth.dependencies
import app.db.models
import app.domains.knowledge.chunk
import app.domains.knowledge.embedding
import app.domains.knowledge.extract
import app.integrations.object_store
import app.settings

logger = logging.getLogger(__name__)

STATUS_PENDING = "pending"
STATUS_PROCESSING = "processing"
STATUS_READY = "ready"
STATUS_FAILED = "failed"
STATUS_UNSUPPORTED = "unsupported"


class IngestError(RuntimeError):
    """Ingest failed. The message is safe to show a member."""


@dataclasses.dataclass(frozen=True)
class IngestResult:
    source_object_id: str
    source_version_id: str | None
    status: str
    chunk_count: int
    embedded_count: int = 0
    reused: bool = False


def _extracted_text_key(owner_id: str, version_id: str) -> str:
    return f"vault/{owner_id}/extracted/{version_id}.txt"


async def _get_or_create_source_object(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    *,
    object_store_key: str,
    filename: str,
    mime_type: str,
    size_bytes: int,
) -> app.db.models.SourceObject:
    existing = await session.execute(
        sqlalchemy.select(app.db.models.SourceObject).where(
            app.db.models.SourceObject.owner_id == owner.owner_id,
            app.db.models.SourceObject.object_store_key == object_store_key,
        )
    )
    source_object: app.db.models.SourceObject | None = existing.scalar_one_or_none()
    if source_object is not None:
        source_object.filename = filename
        source_object.size_bytes = size_bytes
        return source_object

    source_object = app.db.models.SourceObject(
        owner_id=owner.owner_id,
        filename=filename,
        object_store_key=object_store_key,
        size_bytes=size_bytes,
        mime_type=mime_type or "application/octet-stream",
        status=STATUS_PENDING,
    )
    session.add(source_object)
    await session.flush()
    return source_object


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
    return result.scalar_one_or_none()


async def ingest_object(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
    *,
    object_store_key: str,
    filename: str,
    mime_type: str = "",
    size_bytes: int = 0,
) -> IngestResult:
    """Read an uploaded object, extract it, and persist its chunks and anchors."""

    store = app.integrations.object_store.get_object_store()
    try:
        data: bytes = await store.get_bytes(object_store_key)
    except app.integrations.object_store.ObjectNotFoundError as exc:
        raise IngestError("The uploaded file could not be found.") from exc
    except app.integrations.object_store.ObjectStoreError as exc:
        raise IngestError("The uploaded file could not be read.") from exc

    source_object: app.db.models.SourceObject = await _get_or_create_source_object(
        session,
        owner,
        object_store_key=object_store_key,
        filename=filename,
        mime_type=mime_type,
        size_bytes=size_bytes or len(data),
    )

    if not app.domains.knowledge.extract.is_supported(source_object.mime_type, filename):
        source_object.status = STATUS_UNSUPPORTED
        await session.flush()
        return IngestResult(
            source_object_id=source_object.id,
            source_version_id=None,
            status=STATUS_UNSUPPORTED,
            chunk_count=0,
        )

    content_hash: str = hashlib.sha256(data).hexdigest()
    previous: app.db.models.SourceVersion | None = await _latest_version(session, source_object.id)
    unchanged: bool = (
        previous is not None
        and previous.content_hash == content_hash
        and previous.status == STATUS_READY
    )
    if previous is not None and unchanged:
        count: int = await _chunk_count(session, previous.id)
        source_object.status = STATUS_READY
        return IngestResult(
            source_object_id=source_object.id,
            source_version_id=previous.id,
            status=STATUS_READY,
            chunk_count=count,
            reused=True,
        )

    version = app.db.models.SourceVersion(
        source_object_id=source_object.id,
        version_num=(previous.version_num + 1) if previous else 1,
        content_hash=content_hash,
        status=STATUS_PROCESSING,
    )
    session.add(version)
    source_object.status = STATUS_PROCESSING
    await session.flush()

    try:
        extracted = app.domains.knowledge.extract.extract(
            data, mime_type=source_object.mime_type, filename=filename
        )
    except app.domains.knowledge.extract.UnsupportedSourceError as exc:
        version.status = STATUS_UNSUPPORTED
        source_object.status = STATUS_UNSUPPORTED
        await session.flush()
        raise IngestError(str(exc)) from exc

    text_key: str = _extracted_text_key(owner.owner_id, version.id)
    try:
        await store.put_bytes(text_key, extracted.text.encode("utf-8"))
    except app.integrations.object_store.ObjectStoreError as exc:
        version.status = STATUS_FAILED
        source_object.status = STATUS_FAILED
        await session.flush()
        raise IngestError("Extracted text could not be stored.") from exc
    version.extracted_text_ref = text_key

    pages: tuple[tuple[int, int, int], ...] = tuple(
        (page.number, page.start, page.end) for page in extracted.pages
    )
    chunks = app.domains.knowledge.chunk.chunk_text(extracted.text, pages)

    records: list[app.db.models.KnowledgeChunk] = []
    for chunk in chunks:
        record = app.db.models.KnowledgeChunk(
            source_version_id=version.id,
            chunk_index=chunk.index,
            text=chunk.text,
            token_count=chunk.token_count,
        )
        session.add(record)
        await session.flush()
        records.append(record)
        locator: dict[str, int | str] = {"start": chunk.start, "end": chunk.end}
        if chunk.page is not None:
            locator["page"] = chunk.page
        session.add(
            app.db.models.SourceAnchor(
                chunk_id=record.id,
                anchor_type="page" if chunk.page is not None else "char_range",
                locator=locator,
            )
        )

    embedded: int = await embed_chunks(records)

    version.status = STATUS_READY
    source_object.status = STATUS_READY
    await session.flush()

    logger.info(
        "ingest.completed source_object=%s version=%s chunks=%d embedded=%d truncated=%s",
        source_object.id,
        version.id,
        len(chunks),
        embedded,
        extracted.truncated,
    )
    return IngestResult(
        source_object_id=source_object.id,
        source_version_id=version.id,
        status=STATUS_READY,
        chunk_count=len(chunks),
        embedded_count=embedded,
    )


async def embed_chunks(records: list[app.db.models.KnowledgeChunk]) -> int:
    """Attach vectors to chunks. Returns how many were embedded.

    An embedding failure is not an ingest failure. The chunks are already
    readable and keyword-retrievable; refusing to store them because a remote
    model was unreachable would lose the member's document over a transient.
    """

    if not records:
        return 0

    client = app.domains.knowledge.embedding.get_embedding_client()
    if isinstance(client, app.domains.knowledge.embedding.NullEmbeddingClient):
        return 0

    settings: app.settings.Settings = app.settings.get_settings()
    batch_size: int = max(1, settings.EMBEDDING_BATCH_SIZE)
    embedded: int = 0

    for start in range(0, len(records), batch_size):
        batch: list[app.db.models.KnowledgeChunk] = records[start : start + batch_size]
        try:
            vectors: list[list[float]] = await client.embed([record.text for record in batch])
        except app.domains.knowledge.embedding.EmbeddingUnavailableError:
            logger.warning("ingest.embedding_skipped chunks=%d", len(batch))
            continue
        for record, vector in zip(batch, vectors, strict=True):
            record.embedding = vector
            record.embedding_model = client.model
        embedded += len(batch)

    return embedded


async def _chunk_count(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    source_version_id: str,
) -> int:
    result = await session.execute(
        sqlalchemy.select(sqlalchemy.func.count())
        .select_from(app.db.models.KnowledgeChunk)
        .where(app.db.models.KnowledgeChunk.source_version_id == source_version_id)
    )
    return int(result.scalar_one())
