"""Support contributions ledger (ADR-0012).

Amounts and status are written from verified Stripe webhooks; email is stored as
a blind index only.

Revision ID: 0008_support_contributions
Revises: 0007_tenant_isolation
Create Date: 2026-08-05
"""

from __future__ import annotations

import alembic
import sqlalchemy

op = alembic.op

revision: str = "0008_support_contributions"
down_revision: str | None = "0007_tenant_isolation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "support_contributions",
        sqlalchemy.Column("id", sqlalchemy.String(64), primary_key=True),
        sqlalchemy.Column("provider_ref", sqlalchemy.String(128), nullable=False, unique=True),
        sqlalchemy.Column("email_hash", sqlalchemy.String(64), nullable=True),
        sqlalchemy.Column("member_id", sqlalchemy.String(64), nullable=True),
        sqlalchemy.Column("amount_minor", sqlalchemy.Integer, nullable=False),
        sqlalchemy.Column("currency", sqlalchemy.String(8), nullable=False, server_default="usd"),
        sqlalchemy.Column("tier", sqlalchemy.String(32), nullable=False, server_default="custom"),
        sqlalchemy.Column(
            "cadence", sqlalchemy.String(16), nullable=False, server_default="one_time"
        ),
        sqlalchemy.Column(
            "status", sqlalchemy.String(32), nullable=False, server_default="pending"
        ),
        sqlalchemy.Column(
            "created_at",
            sqlalchemy.DateTime(timezone=True),
            server_default=sqlalchemy.func.now(),
            nullable=False,
        ),
        sqlalchemy.Column("settled_at", sqlalchemy.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_support_contributions_provider_ref", "support_contributions", ["provider_ref"]
    )
    op.create_index("ix_support_contributions_email_hash", "support_contributions", ["email_hash"])
    op.create_index("ix_support_contributions_member_id", "support_contributions", ["member_id"])
    op.create_index("ix_support_contributions_status", "support_contributions", ["status"])


def downgrade() -> None:
    op.drop_index("ix_support_contributions_status", table_name="support_contributions")
    op.drop_index("ix_support_contributions_member_id", table_name="support_contributions")
    op.drop_index("ix_support_contributions_email_hash", table_name="support_contributions")
    op.drop_index("ix_support_contributions_provider_ref", table_name="support_contributions")
    op.drop_table("support_contributions")
