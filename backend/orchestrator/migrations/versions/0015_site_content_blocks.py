"""Steward-editable public copy, with draft and published values kept apart.

Only overrides live here. A missing row means the compiled-in default is the
live copy, so an empty table is a valid, fully-rendering site (ADR-0021).

Revision ID: 0015_site_content_blocks
Revises: 0014_join_requests
"""

from __future__ import annotations

import alembic.op
import sqlalchemy

revision: str = "0015_site_content_blocks"
down_revision: str | None = "0014_join_requests"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    alembic.op.create_table(
        "site_content_blocks",
        sqlalchemy.Column("id", sqlalchemy.String(64), primary_key=True),
        sqlalchemy.Column("key", sqlalchemy.String(96), nullable=False),
        sqlalchemy.Column("published_value", sqlalchemy.Text),
        sqlalchemy.Column("draft_value", sqlalchemy.Text),
        sqlalchemy.Column("updated_by", sqlalchemy.String(64)),
        sqlalchemy.Column(
            "updated_at",
            sqlalchemy.DateTime(timezone=True),
            server_default=sqlalchemy.func.now(),
        ),
        sqlalchemy.Column("published_at", sqlalchemy.DateTime(timezone=True)),
    )
    alembic.op.create_index(
        "ix_site_content_blocks_key", "site_content_blocks", ["key"], unique=True
    )


def downgrade() -> None:
    alembic.op.drop_index("ix_site_content_blocks_key", table_name="site_content_blocks")
    alembic.op.drop_table("site_content_blocks")
