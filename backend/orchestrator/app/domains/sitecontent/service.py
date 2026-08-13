"""Read and write steward-editable public copy.

Every write is validated here rather than at the edge, so the key space stays
bounded no matter which router grows a new entry point later.
"""

from __future__ import annotations

import datetime
import re

import sqlalchemy
import sqlalchemy.ext.asyncio

import app.domains.sitecontent.models as models
import app.domains.sitecontent.schemas as schemas

_KEY_RE = re.compile(models.KEY_PATTERN)


class InvalidContentKeyError(ValueError):
    """The requested block key is not a well-formed content address."""


def validate_key(key: str) -> str:
    normalized: str = (key or "").strip().lower()
    if not normalized or len(normalized) > models.MAX_KEY_LENGTH:
        raise InvalidContentKeyError("Content key must be 1-96 characters.")
    if not _KEY_RE.match(normalized):
        raise InvalidContentKeyError("Content key must be dotted lowercase, e.g. 'home.lede'.")
    return normalized


async def published_blocks(session: sqlalchemy.ext.asyncio.AsyncSession) -> dict[str, str]:
    """Every live override. Blocks with no published value are simply absent,
    which is how the reader falls back to the released wording."""

    result = await session.execute(
        sqlalchemy.select(
            models.SiteContentBlock.key, models.SiteContentBlock.published_value
        ).where(models.SiteContentBlock.published_value.is_not(None))
    )
    return {key: value for key, value in result.all() if value is not None}


async def all_blocks(
    session: sqlalchemy.ext.asyncio.AsyncSession,
) -> list[schemas.SiteContentValue]:
    result = await session.execute(
        sqlalchemy.select(models.SiteContentBlock).order_by(models.SiteContentBlock.key)
    )
    return [
        schemas.SiteContentValue(
            key=row.key,
            published_value=row.published_value,
            draft_value=row.draft_value,
            updated_at=row.updated_at,
            published_at=row.published_at,
        )
        for row in result.scalars().all()
    ]


async def _get_row(
    session: sqlalchemy.ext.asyncio.AsyncSession, key: str
) -> models.SiteContentBlock | None:
    result = await session.execute(
        sqlalchemy.select(models.SiteContentBlock).where(models.SiteContentBlock.key == key)
    )
    return result.scalar_one_or_none()


async def write_block(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    key: str,
    value: str,
    publish: bool,
    actor_id: str,
) -> schemas.SiteContentValue:
    """Save a draft, optionally publishing it in the same call.

    An empty value clears the override rather than publishing an empty string,
    so "select all, delete" restores the released copy instead of blanking a
    public surface.
    """

    validated: str = validate_key(key)
    now = datetime.datetime.now(datetime.UTC)
    cleared: bool = value == ""

    row: models.SiteContentBlock | None = await _get_row(session, validated)
    if row is None:
        row = models.SiteContentBlock(key=validated)
        session.add(row)

    row.draft_value = None if cleared else value
    row.updated_by = actor_id
    row.updated_at = now
    if publish:
        row.published_value = None if cleared else value
        row.published_at = now

    await session.commit()
    return schemas.SiteContentValue(
        key=row.key,
        published_value=row.published_value,
        draft_value=row.draft_value,
        updated_at=row.updated_at,
        published_at=row.published_at,
    )


async def publish_block(
    session: sqlalchemy.ext.asyncio.AsyncSession, *, key: str, actor_id: str
) -> schemas.SiteContentValue | None:
    validated: str = validate_key(key)
    row: models.SiteContentBlock | None = await _get_row(session, validated)
    if row is None:
        return None

    row.published_value = row.draft_value
    row.published_at = datetime.datetime.now(datetime.UTC)
    row.updated_by = actor_id
    await session.commit()
    return schemas.SiteContentValue(
        key=row.key,
        published_value=row.published_value,
        draft_value=row.draft_value,
        updated_at=row.updated_at,
        published_at=row.published_at,
    )


async def revert_block(session: sqlalchemy.ext.asyncio.AsyncSession, *, key: str) -> bool:
    """Drop the override entirely so the compiled-in default takes over again."""

    validated: str = validate_key(key)
    result = await session.execute(
        sqlalchemy.delete(models.SiteContentBlock).where(models.SiteContentBlock.key == validated)
    )
    await session.commit()
    return bool(result.rowcount)
