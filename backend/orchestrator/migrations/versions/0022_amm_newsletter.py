"""Publication-specific consent and deliberate newsletter delivery."""

from __future__ import annotations

import alembic.op as op
import sqlalchemy as sa

revision = "0022_amm_newsletter"
down_revision = "0021_writing_draft_metadata"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "reader_subscriptions",
        sa.Column("publication", sa.String(32), nullable=False, server_default="all"),
    )
    op.add_column("reader_subscriptions", sa.Column("suppressed_at", sa.DateTime(timezone=True)))
    op.drop_constraint("uq_reader_subscriptions_email_hash", "reader_subscriptions", type_="unique")
    op.create_unique_constraint(
        "uq_reader_subscriptions_publication", "reader_subscriptions", ["email_hash", "publication"]
    )
    op.create_table(
        "newsletter_campaigns",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("publication", sa.String(32), nullable=False),
        sa.Column(
            "release_id", sa.String(64), sa.ForeignKey("academy_releases.id"), nullable=False
        ),
        sa.Column("work_id", sa.String(64), nullable=False),
        sa.Column("release_number", sa.Integer, nullable=False),
        sa.Column("approved_by", sa.String(128)),
        sa.Column("approved_at", sa.DateTime(timezone=True)),
        sa.Column("cancelled_at", sa.DateTime(timezone=True)),
        sa.Column("envelope", sa.JSON, nullable=False),
        sa.Column("payload_hash", sa.String(64), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("release_id", "publication"),
    )
    op.create_table(
        "newsletter_deliveries",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "campaign_id",
            sa.String(64),
            sa.ForeignKey("newsletter_campaigns.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "subscription_id",
            sa.String(64),
            sa.ForeignKey("reader_subscriptions.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("state", sa.String(32), nullable=False),
        sa.Column("attempted_at", sa.DateTime(timezone=True)),
        sa.Column("provider_id", sa.String(128), unique=True),
        sa.Column("error_code", sa.String(64)),
        sa.UniqueConstraint("campaign_id", "subscription_id"),
    )
    op.create_table(
        "newsletter_events",
        sa.Column("id", sa.String(128), primary_key=True),
        sa.Column(
            "received_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )


def downgrade() -> None:
    # AMM consent cannot be collapsed into the old global row without data loss.
    raise RuntimeError("Export newsletter consent and delivery records before a manual rollback.")
