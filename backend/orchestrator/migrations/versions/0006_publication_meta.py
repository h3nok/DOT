"""Add meta JSON to publication projects and sections.

Revision ID: 0006_publication_meta
Revises: 0005_auth_members
Create Date: 2026-08-04
"""

from __future__ import annotations

import alembic
import sqlalchemy as sa

revision: str = "0006_publication_meta"
down_revision: str | None = "0005_auth_members"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    alembic.op.add_column("publication_projects", sa.Column("meta", sa.JSON(), nullable=True))
    alembic.op.add_column("publication_sections", sa.Column("meta", sa.JSON(), nullable=True))


def downgrade() -> None:
    alembic.op.drop_column("publication_sections", "meta")
    alembic.op.drop_column("publication_projects", "meta")
