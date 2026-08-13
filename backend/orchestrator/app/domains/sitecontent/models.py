"""Editable public copy (ADR-0021).

The public surfaces ship with their copy compiled in. This table holds only the
*overrides* the steward has written, which is what keeps the arrangement safe:
a missing row, an unreachable orchestrator, or an empty database all degrade to
the released wording rather than to a blank page.

Two properties matter:

- A block has a draft and a published value, and the public read path returns
  the published value only. An unfinished edit is never visible to a reader.
- Blocks are addressed by a stable dotted key (``home.lede``), not by row id,
  so the compiled-in default and its override are matched by meaning.
"""

from __future__ import annotations

import sqlalchemy
import sqlalchemy.orm

import app.db.models

#: Longest override we will store. Public copy is short by design; this is a
#: guard against a paste of the whole book into a hero paragraph.
MAX_VALUE_LENGTH = 4_000

#: Keys are dotted, lowercase, and bounded. Validated server-side so a client
#: cannot invent unbounded key space.
KEY_PATTERN = r"^[a-z0-9]+(?:[._-][a-z0-9]+)*$"
MAX_KEY_LENGTH = 96


class SiteContentBlock(app.db.models.Base):
    """One steward-editable copy block, addressed by its dotted key."""

    __tablename__ = "site_content_blocks"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("scb")
    )
    #: Stable address shared with the frontend default, e.g. ``home.lede``.
    key: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(MAX_KEY_LENGTH), nullable=False, unique=True, index=True
    )
    #: What readers see. NULL means "no override" — the compiled-in default wins.
    published_value: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Text
    )
    #: Work in progress, visible only to the steward until published.
    draft_value: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.Text)
    updated_by: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    updated_at: sqlalchemy.orm.Mapped[object | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now()
    )
    published_at: sqlalchemy.orm.Mapped[object | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
