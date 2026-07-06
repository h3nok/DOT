"""Add digital footprint graph tables.

Revision ID: 0003_footprint_graph
Revises: 0002_idempotent_run_scope
Create Date: 2026-06-13
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_footprint_graph"
down_revision: str | None = "0002_idempotent_run_scope"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "footprint_accounts",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("owner_id", sa.String(length=128), nullable=False),
        sa.Column("platform", sa.String(length=64), nullable=False),
        sa.Column("handle", sa.String(length=256), nullable=False),
        sa.Column("display_name", sa.String(length=256), nullable=True),
        sa.Column("profile_url", sa.String(length=1024), nullable=True),
        sa.Column("external_id", sa.String(length=256), nullable=True),
        sa.Column("auth_mode", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("sync_cursor", sa.JSON(), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "owner_id", "platform", "handle", name="uq_footprint_account_owner_platform_handle"
        ),
    )
    op.create_index("ix_footprint_accounts_owner_id", "footprint_accounts", ["owner_id"])
    op.create_index("ix_footprint_accounts_platform", "footprint_accounts", ["platform"])
    op.create_index("ix_footprint_accounts_external_id", "footprint_accounts", ["external_id"])
    op.create_index("ix_footprint_accounts_status", "footprint_accounts", ["status"])

    op.create_table(
        "footprint_nodes",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("owner_id", sa.String(length=128), nullable=False),
        sa.Column("kind", sa.String(length=64), nullable=False),
        sa.Column("label", sa.String(length=512), nullable=False),
        sa.Column("platform", sa.String(length=64), nullable=True),
        sa.Column("external_id", sa.String(length=256), nullable=True),
        sa.Column("source_ref", sa.JSON(), nullable=True),
        sa.Column("properties", sa.JSON(), nullable=True),
        sa.Column("visibility", sa.String(length=32), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column(
            "first_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "owner_id", "platform", "external_id", name="uq_footprint_node_owner_platform_external"
        ),
    )
    op.create_index("ix_footprint_nodes_owner_id", "footprint_nodes", ["owner_id"])
    op.create_index("ix_footprint_nodes_kind", "footprint_nodes", ["kind"])
    op.create_index("ix_footprint_nodes_platform", "footprint_nodes", ["platform"])
    op.create_index("ix_footprint_nodes_external_id", "footprint_nodes", ["external_id"])
    op.create_index("ix_footprint_nodes_visibility", "footprint_nodes", ["visibility"])

    op.create_table(
        "footprint_edges",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("owner_id", sa.String(length=128), nullable=False),
        sa.Column("source_node_id", sa.String(length=64), nullable=False),
        sa.Column("target_node_id", sa.String(length=64), nullable=False),
        sa.Column("relation", sa.String(length=64), nullable=False),
        sa.Column("platform", sa.String(length=64), nullable=True),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("evidence_ref", sa.JSON(), nullable=True),
        sa.Column(
            "first_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["source_node_id"], ["footprint_nodes.id"]),
        sa.ForeignKeyConstraint(["target_node_id"], ["footprint_nodes.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "owner_id",
            "source_node_id",
            "target_node_id",
            "relation",
            "platform",
            name="uq_footprint_edge_owner_relation",
        ),
    )
    op.create_index("ix_footprint_edges_owner_id", "footprint_edges", ["owner_id"])
    op.create_index("ix_footprint_edges_source_node_id", "footprint_edges", ["source_node_id"])
    op.create_index("ix_footprint_edges_target_node_id", "footprint_edges", ["target_node_id"])
    op.create_index("ix_footprint_edges_relation", "footprint_edges", ["relation"])
    op.create_index("ix_footprint_edges_platform", "footprint_edges", ["platform"])

    op.create_table(
        "footprint_imports",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("owner_id", sa.String(length=128), nullable=False),
        sa.Column("account_id", sa.String(length=64), nullable=True),
        sa.Column("run_id", sa.String(length=64), nullable=True),
        sa.Column("connector", sa.String(length=64), nullable=False),
        sa.Column("import_mode", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("requested_by", sa.String(length=128), nullable=True),
        sa.Column("source_ref", sa.JSON(), nullable=True),
        sa.Column("summary", sa.JSON(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["footprint_accounts.id"]),
        sa.ForeignKeyConstraint(["run_id"], ["orchestrator_runs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_footprint_imports_owner_id", "footprint_imports", ["owner_id"])
    op.create_index("ix_footprint_imports_account_id", "footprint_imports", ["account_id"])
    op.create_index("ix_footprint_imports_run_id", "footprint_imports", ["run_id"])
    op.create_index("ix_footprint_imports_connector", "footprint_imports", ["connector"])
    op.create_index("ix_footprint_imports_status", "footprint_imports", ["status"])


def downgrade() -> None:
    op.drop_index("ix_footprint_imports_status", table_name="footprint_imports")
    op.drop_index("ix_footprint_imports_connector", table_name="footprint_imports")
    op.drop_index("ix_footprint_imports_run_id", table_name="footprint_imports")
    op.drop_index("ix_footprint_imports_account_id", table_name="footprint_imports")
    op.drop_index("ix_footprint_imports_owner_id", table_name="footprint_imports")
    op.drop_table("footprint_imports")
    op.drop_index("ix_footprint_edges_platform", table_name="footprint_edges")
    op.drop_index("ix_footprint_edges_relation", table_name="footprint_edges")
    op.drop_index("ix_footprint_edges_target_node_id", table_name="footprint_edges")
    op.drop_index("ix_footprint_edges_source_node_id", table_name="footprint_edges")
    op.drop_index("ix_footprint_edges_owner_id", table_name="footprint_edges")
    op.drop_table("footprint_edges")
    op.drop_index("ix_footprint_nodes_visibility", table_name="footprint_nodes")
    op.drop_index("ix_footprint_nodes_external_id", table_name="footprint_nodes")
    op.drop_index("ix_footprint_nodes_platform", table_name="footprint_nodes")
    op.drop_index("ix_footprint_nodes_kind", table_name="footprint_nodes")
    op.drop_index("ix_footprint_nodes_owner_id", table_name="footprint_nodes")
    op.drop_table("footprint_nodes")
    op.drop_index("ix_footprint_accounts_status", table_name="footprint_accounts")
    op.drop_index("ix_footprint_accounts_external_id", table_name="footprint_accounts")
    op.drop_index("ix_footprint_accounts_platform", table_name="footprint_accounts")
    op.drop_index("ix_footprint_accounts_owner_id", table_name="footprint_accounts")
    op.drop_table("footprint_accounts")
