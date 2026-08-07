"""Add members, otp_codes, and invite_codes tables.

Revision ID: 0005_auth_members
Revises: 0a354b662a63
Create Date: 2026-08-04
"""

import collections.abc

import alembic
import sqlalchemy as sa

revision: str = "0005_auth_members"
down_revision: str | None = "0a354b662a63"
branch_labels: str | collections.abc.Sequence[str] | None = None
depends_on: str | collections.abc.Sequence[str] | None = None


def upgrade() -> None:
    alembic.op.create_table(
        "members",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("email_hash", sa.String(64), nullable=False),
        sa.Column("display_name", sa.String(128), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("role", sa.String(32), nullable=False, server_default="member"),
        sa.Column("invited_by", sa.String(64), sa.ForeignKey("members.id"), nullable=True),
        sa.Column("last_signed_in_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    alembic.op.create_index("ix_members_email_hash", "members", ["email_hash"], unique=True)
    alembic.op.create_index("ix_members_status", "members", ["status"])
    alembic.op.create_index("ix_members_invited_by", "members", ["invited_by"])

    alembic.op.create_table(
        "otp_codes",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("email_hash", sa.String(64), nullable=False),
        sa.Column("code_hash", sa.String(128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts", sa.Integer, nullable=False, server_default="0"),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    alembic.op.create_index("ix_otp_codes_email_hash", "otp_codes", ["email_hash"])

    alembic.op.create_table(
        "invite_codes",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("issued_by", sa.String(64), sa.ForeignKey("members.id"), nullable=False),
        sa.Column("accepted_by", sa.String(64), sa.ForeignKey("members.id"), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    alembic.op.create_index(
        "ix_invite_codes_token_hash", "invite_codes", ["token_hash"], unique=True
    )
    alembic.op.create_index("ix_invite_codes_issued_by", "invite_codes", ["issued_by"])


def downgrade() -> None:
    alembic.op.drop_table("invite_codes")
    alembic.op.drop_table("otp_codes")
    alembic.op.drop_table("members")
