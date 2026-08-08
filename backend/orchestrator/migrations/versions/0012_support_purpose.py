"""Record what a contribution is intended to build.

Revision ID: 0012_support_purpose
Revises: 0011_source_visibility
Create Date: 2026-08-07
"""

from __future__ import annotations

import alembic
import sqlalchemy

op = alembic.op

revision: str = "0012_support_purpose"
down_revision: str | None = "0011_source_visibility"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "support_contributions",
        sqlalchemy.Column(
            "purpose",
            sqlalchemy.String(length=32),
            nullable=False,
            server_default="general",
        ),
    )


def downgrade() -> None:
    op.drop_column("support_contributions", "purpose")
