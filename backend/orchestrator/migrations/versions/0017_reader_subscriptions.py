"""Reader subscriptions: the open door, beside the invite-only one.

ADR-0025. Reading and belonging are different relationships, so the reader list
is a separate table from `join_requests` and the two are never joined. Addresses
are sealed with a blind index beside them (ADR-0007); the unsubscribe token is
stored only as a SHA-256 because it is a bearer capability that must work with
no session.

Revision ID: 0017_reader_subscriptions
Revises: 0016_commerce_entitlements
"""

from __future__ import annotations

import alembic.op
import sqlalchemy

revision: str = "0017_reader_subscriptions"
down_revision: str | None = "0016_commerce_entitlements"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    alembic.op.create_table(
        "reader_subscriptions",
        sqlalchemy.Column("id", sqlalchemy.String(64), primary_key=True),
        sqlalchemy.Column("email_hash", sqlalchemy.String(64), nullable=False),
        sqlalchemy.Column("email_sealed", sqlalchemy.Text, nullable=False),
        sqlalchemy.Column("confirmed_at", sqlalchemy.DateTime(timezone=True)),
        sqlalchemy.Column("unsubscribed_at", sqlalchemy.DateTime(timezone=True)),
        sqlalchemy.Column("unsubscribe_token_hash", sqlalchemy.String(64), nullable=False),
        sqlalchemy.Column("source", sqlalchemy.String(32)),
        sqlalchemy.Column(
            "created_at",
            sqlalchemy.DateTime(timezone=True),
            server_default=sqlalchemy.func.now(),
            nullable=False,
        ),
        sqlalchemy.Column("updated_at", sqlalchemy.DateTime(timezone=True)),
        sqlalchemy.UniqueConstraint(
            "email_hash", name="uq_reader_subscriptions_email_hash"
        ),
    )
    alembic.op.create_index(
        "ix_reader_subscriptions_email_hash", "reader_subscriptions", ["email_hash"]
    )
    # The unsubscribe link resolves by this alone, on a table that is expected to
    # outgrow the queue. Without the index, leaving gets slower as the list grows.
    alembic.op.create_index(
        "ix_reader_subscriptions_unsubscribe_token_hash",
        "reader_subscriptions",
        ["unsubscribe_token_hash"],
    )


def downgrade() -> None:
    alembic.op.drop_index(
        "ix_reader_subscriptions_unsubscribe_token_hash", table_name="reader_subscriptions"
    )
    alembic.op.drop_index(
        "ix_reader_subscriptions_email_hash", table_name="reader_subscriptions"
    )
    alembic.op.drop_table("reader_subscriptions")
