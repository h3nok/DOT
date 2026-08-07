"""Source visibility, so published canon can be cited by anyone.

Revision ID: 0011_source_visibility
Revises: 0010_twin_conversations
Create Date: 2026-08-06

Uploaded documents are private and stay private: the column defaults to
`private` and existing rows are backfilled to it, so widening is only ever an
explicit act. Public sources exist for released canon — a book a visitor is
invited to read is a book the twin must be able to quote back with a citation.
"""

from __future__ import annotations

import alembic
import sqlalchemy

op = alembic.op

revision: str = "0011_source_visibility"
down_revision: str | None = "0010_twin_conversations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "source_objects",
        sqlalchemy.Column(
            "visibility",
            sqlalchemy.String(length=16),
            nullable=False,
            server_default="private",
        ),
    )
    # Retrieval filters on it before scoring.
    op.create_index(
        "ix_source_objects_visibility",
        "source_objects",
        ["visibility"],
    )


def downgrade() -> None:
    op.drop_index("ix_source_objects_visibility", table_name="source_objects")
    op.drop_column("source_objects", "visibility")
