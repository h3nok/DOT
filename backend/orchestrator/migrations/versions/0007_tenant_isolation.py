"""Tenant isolation: owner shards, row-level security, and policies (ADR-0011).

Revision ID: 0007_tenant_isolation
Revises: 0006_publication_meta
Create Date: 2026-08-05
"""

from __future__ import annotations

import alembic
import sqlalchemy as sa

revision: str = "0007_tenant_isolation"
down_revision: str | None = "0006_publication_meta"
branch_labels: str | None = None
depends_on: str | None = None

TENANT_TABLES: tuple[str, ...] = (
    "orchestrator_runs",
    "publication_projects",
    "footprint_accounts",
    "footprint_nodes",
    "footprint_edges",
    "footprint_imports",
    "source_objects",
)

# child table -> (parent table, local FK column, parent PK column)
CHILD_TABLES: dict[str, tuple[str, str, str]] = {
    "orchestrator_steps": ("orchestrator_runs", "run_id", "id"),
    "publication_sections": ("publication_projects", "project_id", "id"),
    "publication_releases": ("publication_projects", "project_id", "id"),
    "publication_revisions": ("publication_sections", "section_id", "id"),
    "source_versions": ("source_objects", "source_object_id", "id"),
    "knowledge_chunks": ("source_versions", "source_version_id", "id"),
    "source_anchors": ("knowledge_chunks", "chunk_id", "id"),
}

TENANT_SETTING = "app.tenant_id"


def _is_postgres() -> bool:
    return alembic.op.get_bind().dialect.name == "postgresql"


def _policy_for(table: str) -> str:
    if table in TENANT_TABLES:
        return f"owner_id = current_setting('{TENANT_SETTING}', true)"

    # Ownership can sit several hops up (a revision belongs to a section, which
    # belongs to a project), so walk the chain until it reaches a table that
    # actually carries owner_id and nest an EXISTS per hop.
    def walk(child_ref: str, child: str, depth: int) -> str:
        parent, fk, parent_pk = CHILD_TABLES[child]
        alias: str = f"p{depth}"
        if parent in TENANT_TABLES:
            tail: str = f"{alias}.owner_id = current_setting('{TENANT_SETTING}', true)"
        else:
            tail: str = walk(alias, parent, depth + 1)
        return (
            f"EXISTS (SELECT 1 FROM {parent} {alias} "
            f"WHERE {alias}.{parent_pk} = {child_ref}.{fk} AND {tail})"
        )

    return walk(table, table, 1)


def upgrade() -> None:
    # owner_shard is the future partition/routing key; add it everywhere first so
    # indexes can lead with it without a second rewrite.
    for table in TENANT_TABLES:
        alembic.op.add_column(
            table,
            sa.Column("owner_shard", sa.SmallInteger(), nullable=True),
        )
        alembic.op.create_index(
            f"ix_{table}_owner_shard",
            table,
            ["owner_shard", "owner_id"],
        )

    if not _is_postgres():
        # SQLite (tests, local) cannot enforce RLS; the ORM query guard in
        # app/core/tenancy.py carries that weight there.
        return

    for table in (*TENANT_TABLES, *CHILD_TABLES):
        predicate: str = _policy_for(table)
        alembic.op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        # FORCE also applies the policy to the table owner, so a compromised app
        # role cannot read across tenants simply by owning the table.
        alembic.op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
        alembic.op.execute(
            f"CREATE POLICY {table}_tenant_isolation ON {table} "
            f"USING ({predicate}) WITH CHECK ({predicate})"
        )


def downgrade() -> None:
    if _is_postgres():
        for table in (*TENANT_TABLES, *CHILD_TABLES):
            alembic.op.execute(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table}")
            alembic.op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY")
            alembic.op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")

    for table in TENANT_TABLES:
        alembic.op.drop_index(f"ix_{table}_owner_shard", table_name=table)
        alembic.op.drop_column(table, "owner_shard")
