"""Twin conversations: the twin remembers a thread instead of single questions.

Revision ID: 0010_twin_conversations
Revises: 0009_chunk_embeddings
Create Date: 2026-08-05
"""

from __future__ import annotations

import alembic
import sqlalchemy as sa

revision: str = "0010_twin_conversations"
down_revision: str | None = "0009_chunk_embeddings"
branch_labels: str | None = None
depends_on: str | None = None

TENANT_SETTING = "app.tenant_id"


def _is_postgres() -> bool:
    return alembic.op.get_bind().dialect.name == "postgresql"


def upgrade() -> None:
    alembic.op.create_table(
        "twin_conversations",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("owner_id", sa.String(128), nullable=False, index=True),
        sa.Column("subject_owner_id", sa.String(128), nullable=False, index=True),
        sa.Column("title", sa.String(256), nullable=False, server_default="New conversation"),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("message_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("owner_shard", sa.SmallInteger(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    alembic.op.create_index(
        "ix_twin_conversations_owner_shard", "twin_conversations", ["owner_shard", "owner_id"]
    )
    # The conversation list is always "mine, most recent first"; without this it
    # is a full scan of every member's threads.
    alembic.op.create_index(
        "ix_twin_conversations_owner_recent",
        "twin_conversations",
        ["owner_id", "last_message_at"],
    )

    alembic.op.create_table(
        "twin_messages",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "conversation_id",
            sa.String(64),
            sa.ForeignKey("twin_conversations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("seq", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("citations", sa.JSON(), nullable=True),
        sa.Column("refusal_code", sa.String(64), nullable=True, index=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("conversation_id", "seq", name="uq_twin_message_seq"),
    )
    # Replaying a thread is ordered by turn within one conversation.
    alembic.op.create_index(
        "ix_twin_messages_conversation_seq", "twin_messages", ["conversation_id", "seq"]
    )

    if not _is_postgres():
        # SQLite cannot enforce RLS; the ORM guard in app/core/tenancy.py covers it.
        return

    owner_predicate: str = f"owner_id = current_setting('{TENANT_SETTING}', true)"
    message_predicate: str = (
        "EXISTS (SELECT 1 FROM twin_conversations p1 "
        "WHERE p1.id = twin_messages.conversation_id "
        f"AND p1.owner_id = current_setting('{TENANT_SETTING}', true))"
    )

    for table, predicate in (
        ("twin_conversations", owner_predicate),
        ("twin_messages", message_predicate),
    ):
        alembic.op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        alembic.op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
        alembic.op.execute(
            f"CREATE POLICY {table}_tenant_isolation ON {table} "
            f"USING ({predicate}) WITH CHECK ({predicate})"
        )


def downgrade() -> None:
    if _is_postgres():
        for table in ("twin_messages", "twin_conversations"):
            alembic.op.execute(f"DROP POLICY IF EXISTS {table}_tenant_isolation ON {table}")
            alembic.op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY")
            alembic.op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")

    alembic.op.drop_index("ix_twin_messages_conversation_seq", table_name="twin_messages")
    alembic.op.drop_table("twin_messages")
    alembic.op.drop_index("ix_twin_conversations_owner_recent", table_name="twin_conversations")
    alembic.op.drop_index("ix_twin_conversations_owner_shard", table_name="twin_conversations")
    alembic.op.drop_table("twin_conversations")
