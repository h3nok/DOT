"""Join requests: a verifiable queue of people asking to be let in.

The address is stored sealed (ADR-0007) with a blind index beside it, so lookup
and dedupe never need the key.

Revision ID: 0014_join_requests
Revises: 0013_twin_feedback
"""

from __future__ import annotations

import alembic.op
import sqlalchemy

revision: str = "0014_join_requests"
down_revision: str | None = "0013_twin_feedback"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    alembic.op.create_table(
        "join_requests",
        sqlalchemy.Column("id", sqlalchemy.String(64), primary_key=True),
        sqlalchemy.Column("email_hash", sqlalchemy.String(64), nullable=False),
        sqlalchemy.Column("email_sealed", sqlalchemy.Text, nullable=False),
        sqlalchemy.Column("reason", sqlalchemy.String(600)),
        sqlalchemy.Column("verified_at", sqlalchemy.DateTime(timezone=True)),
        sqlalchemy.Column(
            "status", sqlalchemy.String(16), nullable=False, server_default="pending"
        ),
        sqlalchemy.Column(
            "created_at",
            sqlalchemy.DateTime(timezone=True),
            server_default=sqlalchemy.func.now(),
            nullable=False,
        ),
        sqlalchemy.Column("updated_at", sqlalchemy.DateTime(timezone=True)),
        sqlalchemy.UniqueConstraint("email_hash", name="uq_join_requests_email_hash"),
    )
    alembic.op.create_index("ix_join_requests_email_hash", "join_requests", ["email_hash"])
    # Sign-in and join share the OTP table, so a code has to declare what it is
    # for. Without this a code proving an address for the queue would also open
    # a session. Existing rows are sign-in codes by definition.
    alembic.op.add_column(
        "otp_codes",
        sqlalchemy.Column(
            "purpose",
            sqlalchemy.String(16),
            nullable=False,
            server_default="signin",
        ),
    )


def downgrade() -> None:
    alembic.op.drop_column("otp_codes", "purpose")
    alembic.op.drop_index("ix_join_requests_email_hash", table_name="join_requests")
    alembic.op.drop_table("join_requests")
