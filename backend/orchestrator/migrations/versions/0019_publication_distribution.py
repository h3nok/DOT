"""Private publishing connections and exact-release distribution records.

Revision ID: 0019_publication_distribution
Revises: 0018_academy_kernel
"""

from __future__ import annotations

import alembic.op
import sqlalchemy as sa

revision = "0019_publication_distribution"
down_revision = "0018_academy_kernel"
branch_labels = None
depends_on = None

TABLES = ("publishing_connections", "publishing_authorizations", "distribution_copies")


def _tenant_columns() -> list[sa.Column]:
    return [
        sa.Column("owner_id", sa.String(64), nullable=False),
        sa.Column("actor_id", sa.String(64), nullable=False),
        sa.Column("owner_shard", sa.SmallInteger()),
    ]


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    ]


def upgrade() -> None:
    alembic.op.create_table(
        "publishing_connections",
        sa.Column("id", sa.String(64), primary_key=True),
        *_tenant_columns(),
        sa.Column("platform", sa.String(32), nullable=False),
        sa.Column("person_id", sa.String(128), nullable=False),
        sa.Column("display_name", sa.String(256), nullable=False),
        sa.Column("token_sealed", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        *_timestamps(),
        sa.UniqueConstraint("owner_id", "actor_id", "platform"),
    )
    alembic.op.create_table(
        "publishing_authorizations",
        sa.Column("id", sa.String(64), primary_key=True),
        *_tenant_columns(),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True)),
    )
    alembic.op.create_table(
        "distribution_copies",
        sa.Column("id", sa.String(64), primary_key=True),
        *_tenant_columns(),
        sa.Column(
            "release_id", sa.String(64), sa.ForeignKey("academy_releases.id"), nullable=False
        ),
        sa.Column("platform", sa.String(32), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("payload_hash", sa.String(64), nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("external_url", sa.String(2048)),
        sa.Column("error_code", sa.String(64)),
        *_timestamps(),
        sa.UniqueConstraint("owner_id", "actor_id", "release_id", "platform"),
        sa.CheckConstraint(
            "platform IN ('linkedin', 'substack', 'medium')",
            name="distribution_copies_platform_check",
        ),
        sa.CheckConstraint(
            "status IN ('sending', 'published', 'failed', 'needs_review', 'recorded')",
            name="distribution_copies_status_check",
        ),
    )
    if alembic.op.get_bind().dialect.name == "postgresql":
        for table in TABLES:
            predicate = "owner_id = current_setting('app.tenant_id', true)"
            alembic.op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
            alembic.op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
            alembic.op.execute(
                f"CREATE POLICY {table}_tenant_isolation ON {table} "
                f"USING ({predicate}) WITH CHECK ({predicate})"
            )


def downgrade() -> None:
    for table in reversed(TABLES):
        alembic.op.drop_table(table)
