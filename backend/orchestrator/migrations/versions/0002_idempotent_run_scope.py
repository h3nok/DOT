"""Add scoped idempotency constraint for orchestrator runs.

Revision ID: 0002_idempotent_run_scope
Revises: 0001_initial_orchestrator
Create Date: 2026-06-13
"""

import collections.abc

import alembic

revision: str = "0002_idempotent_run_scope"
down_revision: str | None = "0001_initial_orchestrator"
branch_labels: str | collections.abc.Sequence[str] | None = None
depends_on: str | collections.abc.Sequence[str] | None = None


def upgrade() -> None:
    alembic.op.create_unique_constraint(
        "uq_orchestrator_run_idempotency_scope",
        "orchestrator_runs",
        ["owner_id", "workflow_type", "idempotency_key"],
    )


def downgrade() -> None:
    alembic.op.drop_constraint(
        "uq_orchestrator_run_idempotency_scope",
        "orchestrator_runs",
        type_="unique",
    )
