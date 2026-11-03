"""Version member sessions so departure cannot revive an earlier credential."""

from __future__ import annotations

import alembic.op as op
import sqlalchemy as sa

revision = "0023_open_free_membership"
down_revision = "0022_amm_newsletter"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "members", sa.Column("session_version", sa.Integer(), nullable=False, server_default="0")
    )


def downgrade() -> None:
    op.drop_column("members", "session_version")
