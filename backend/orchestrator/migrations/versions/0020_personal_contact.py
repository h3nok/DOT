"""Sealed, owner-only personal contact inbox.

Revision ID: 0020_personal_contact
Revises: 0019_publication_distribution
"""

from __future__ import annotations

import alembic.op as op
import sqlalchemy as sa

revision = "0020_personal_contact"
down_revision = "0019_publication_distribution"
branch_labels = None
depends_on = None


def columns() -> list[sa.Column]:
    return [
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("owner_id", sa.String(64), nullable=False),
        sa.Column("owner_shard", sa.SmallInteger()),
        sa.Column("submission_key", sa.String(128), nullable=False),
        sa.Column("payload_hash", sa.String(64), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    ]


def upgrade() -> None:
    op.create_table(
        "contact_inquiries",
        *columns(),
        sa.Column("purpose", sa.String(32), nullable=False),
        sa.Column("content_sealed", sa.Text(), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("notification_status", sa.String(32), nullable=False),
        sa.UniqueConstraint("owner_id", "submission_key"),
        sa.CheckConstraint("status IN ('new', 'replied', 'archived')"),
    )
    op.create_table(
        "contact_replies",
        *columns(),
        sa.Column(
            "inquiry_id",
            sa.String(64),
            sa.ForeignKey("contact_inquiries.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("body_sealed", sa.Text(), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("provider_id", sa.String(128)),
        sa.Column("attempt_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("owner_id", "submission_key"),
        sa.CheckConstraint("status IN ('sending', 'sent', 'failed')"),
    )
    op.create_index(
        "ix_contact_inquiries_owner_created", "contact_inquiries", ["owner_id", "created_at", "id"]
    )
    op.create_index(
        "ix_contact_replies_owner_inquiry", "contact_replies", ["owner_id", "inquiry_id"]
    )
    if op.get_bind().dialect.name == "postgresql":
        for table in ("contact_inquiries", "contact_replies"):
            predicate = "owner_id = current_setting('app.tenant_id', true)"
            op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
            op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
            op.execute(
                f"CREATE POLICY {table}_tenant_isolation ON {table} "
                f"USING ({predicate}) WITH CHECK ({predicate})"
            )


def downgrade() -> None:
    op.drop_table("contact_replies")
    op.drop_table("contact_inquiries")
