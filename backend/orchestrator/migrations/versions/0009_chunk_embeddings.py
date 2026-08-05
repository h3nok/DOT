"""Chunk embeddings for retrieval.

Revision ID: 0009_chunk_embeddings
Revises: 0008_support_contributions
Create Date: 2026-08-05

Vectors are JSON floats rather than a Postgres vector type. Retrieval is always
tenant-scoped, so the candidate set stays small enough to score in process, and
the same schema runs on SQLite under test. The seam for pgvector is the storage
column, not the query path.
"""

from __future__ import annotations

import alembic
import sqlalchemy

op = alembic.op

revision: str = "0009_chunk_embeddings"
down_revision: str | None = "0008_support_contributions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "knowledge_chunks",
        sqlalchemy.Column("embedding", sqlalchemy.JSON(), nullable=True),
    )
    op.add_column(
        "knowledge_chunks",
        sqlalchemy.Column("embedding_model", sqlalchemy.String(length=64), nullable=True),
    )
    # Retrieval filters to one model before scoring, and re-embedding scans for
    # rows that have none.
    op.create_index(
        "ix_knowledge_chunks_embedding_model",
        "knowledge_chunks",
        ["embedding_model"],
    )


def downgrade() -> None:
    op.drop_index("ix_knowledge_chunks_embedding_model", table_name="knowledge_chunks")
    op.drop_column("knowledge_chunks", "embedding_model")
    op.drop_column("knowledge_chunks", "embedding")
