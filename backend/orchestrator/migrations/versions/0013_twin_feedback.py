"""Twin feedback: a member's explicit verdict on one answer (L8).

Zero retention (HKI-6) applies to conversation content, not to a member's own
deliberate signal. This table stores the verdict and its coarse shape — rating,
lens, whose twin — and never the prompt or answer text.

Revision ID: 0013_twin_feedback
Revises: 0012_support_purpose
Create Date: 2026-08-10
"""

from __future__ import annotations

import alembic
import sqlalchemy as sa

revision: str = "0013_twin_feedback"
down_revision: str | None = "0012_support_purpose"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    alembic.op.create_table(
        "twin_feedback",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("owner_id", sa.String(128), nullable=False, index=True),
        sa.Column("subject_owner_id", sa.String(128), nullable=False, index=True),
        sa.Column("rating", sa.String(16), nullable=False),
        sa.Column("lens", sa.String(16), nullable=False, server_default="ground"),
        sa.Column("owner_shard", sa.SmallInteger(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    # The accountability read is "this member's verdicts, most recent first."
    alembic.op.create_index(
        "ix_twin_feedback_owner_recent", "twin_feedback", ["owner_id", "created_at"]
    )


def downgrade() -> None:
    alembic.op.drop_index("ix_twin_feedback_owner_recent", table_name="twin_feedback")
    alembic.op.drop_table("twin_feedback")
