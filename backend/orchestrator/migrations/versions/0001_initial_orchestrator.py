"""Initial orchestrator tables.

Revision ID: 0001_initial_orchestrator
Revises:
Create Date: 2026-06-13
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial_orchestrator"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "orchestrator_runs",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("owner_id", sa.String(length=128), nullable=False),
        sa.Column("workflow_type", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("idempotency_key", sa.String(length=256), nullable=True),
        sa.Column("requested_by", sa.String(length=128), nullable=True),
        sa.Column("input_ref", sa.JSON(), nullable=True),
        sa.Column("output_ref", sa.JSON(), nullable=True),
        sa.Column("error_code", sa.String(length=128), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_orchestrator_runs_owner_id", "orchestrator_runs", ["owner_id"])
    op.create_index("ix_orchestrator_runs_workflow_type", "orchestrator_runs", ["workflow_type"])
    op.create_index("ix_orchestrator_runs_status", "orchestrator_runs", ["status"])
    op.create_index(
        "ix_orchestrator_runs_idempotency_key", "orchestrator_runs", ["idempotency_key"]
    )

    op.create_table(
        "publication_projects",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("owner_id", sa.String(length=128), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("slug", sa.String(length=256), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("visibility", sa.String(length=32), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id", "slug", name="uq_publication_project_owner_slug"),
    )
    op.create_index("ix_publication_projects_owner_id", "publication_projects", ["owner_id"])
    op.create_index("ix_publication_projects_status", "publication_projects", ["status"])

    op.create_table(
        "orchestrator_steps",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("run_id", sa.String(length=64), nullable=False),
        sa.Column("step_name", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("input_ref", sa.JSON(), nullable=True),
        sa.Column("output_ref", sa.JSON(), nullable=True),
        sa.Column("error_code", sa.String(length=128), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["run_id"], ["orchestrator_runs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_orchestrator_steps_run_id", "orchestrator_steps", ["run_id"])
    op.create_index("ix_orchestrator_steps_status", "orchestrator_steps", ["status"])

    op.create_table(
        "publication_sections",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("project_id", sa.String(length=64), nullable=False),
        sa.Column("parent_id", sa.String(length=64), nullable=True),
        sa.Column("section_order", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("body_ref", sa.String(length=512), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["parent_id"], ["publication_sections.id"]),
        sa.ForeignKeyConstraint(["project_id"], ["publication_projects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_publication_sections_project_id", "publication_sections", ["project_id"])
    op.create_index("ix_publication_sections_parent_id", "publication_sections", ["parent_id"])
    op.create_index("ix_publication_sections_status", "publication_sections", ["status"])

    op.create_table(
        "publication_releases",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("project_id", sa.String(length=64), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=256), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("manifest_key", sa.String(length=512), nullable=False),
        sa.Column("rendered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["publication_projects.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "version", name="uq_publication_release_version"),
    )
    op.create_index("ix_publication_releases_project_id", "publication_releases", ["project_id"])
    op.create_index("ix_publication_releases_status", "publication_releases", ["status"])

    op.create_table(
        "publication_revisions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("section_id", sa.String(length=64), nullable=False),
        sa.Column("editor_id", sa.String(length=128), nullable=False),
        sa.Column("body_ref", sa.String(length=512), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["section_id"], ["publication_sections.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_publication_revisions_section_id", "publication_revisions", ["section_id"])


def downgrade() -> None:
    op.drop_index("ix_publication_revisions_section_id", table_name="publication_revisions")
    op.drop_table("publication_revisions")
    op.drop_index("ix_publication_releases_status", table_name="publication_releases")
    op.drop_index("ix_publication_releases_project_id", table_name="publication_releases")
    op.drop_table("publication_releases")
    op.drop_index("ix_publication_sections_status", table_name="publication_sections")
    op.drop_index("ix_publication_sections_parent_id", table_name="publication_sections")
    op.drop_index("ix_publication_sections_project_id", table_name="publication_sections")
    op.drop_table("publication_sections")
    op.drop_index("ix_orchestrator_steps_status", table_name="orchestrator_steps")
    op.drop_index("ix_orchestrator_steps_run_id", table_name="orchestrator_steps")
    op.drop_table("orchestrator_steps")
    op.drop_index("ix_publication_projects_status", table_name="publication_projects")
    op.drop_index("ix_publication_projects_owner_id", table_name="publication_projects")
    op.drop_table("publication_projects")
    op.drop_index("ix_orchestrator_runs_idempotency_key", table_name="orchestrator_runs")
    op.drop_index("ix_orchestrator_runs_status", table_name="orchestrator_runs")
    op.drop_index("ix_orchestrator_runs_workflow_type", table_name="orchestrator_runs")
    op.drop_index("ix_orchestrator_runs_owner_id", table_name="orchestrator_runs")
    op.drop_table("orchestrator_runs")
