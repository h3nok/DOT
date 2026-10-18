"""Immutable writing presentation, private media and save identity.

Revision ID: 0021_writing_draft_metadata
Revises: 0020_personal_contact
"""

from __future__ import annotations

import alembic.op as op
import sqlalchemy as sa

revision = "0021_writing_draft_metadata"
down_revision = "0020_personal_contact"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "academy_revisions",
        sa.Column("editor_metadata", sa.JSON(), nullable=False, server_default="{}"),
    )


def downgrade() -> None:
    op.drop_column("academy_revisions", "editor_metadata")
