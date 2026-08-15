"""Authenticated commerce purchases and product entitlements.

Revision ID: 0016_commerce_entitlements
Revises: 0015_site_content_blocks
"""

from __future__ import annotations

import alembic.op
import sqlalchemy

revision: str = "0016_commerce_entitlements"
down_revision: str | None = "0015_site_content_blocks"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    alembic.op.create_table(
        "commerce_purchases",
        sqlalchemy.Column("id", sqlalchemy.String(64), primary_key=True),
        sqlalchemy.Column("owner_id", sqlalchemy.String(128), nullable=False),
        sqlalchemy.Column("product_id", sqlalchemy.String(64), nullable=False),
        sqlalchemy.Column("checkout_session_id", sqlalchemy.String(128), nullable=False),
        sqlalchemy.Column("payment_intent_id", sqlalchemy.String(128)),
        sqlalchemy.Column("amount_minor", sqlalchemy.Integer, nullable=False),
        sqlalchemy.Column("currency", sqlalchemy.String(8), nullable=False),
        sqlalchemy.Column(
            "status", sqlalchemy.String(32), nullable=False, server_default="pending"
        ),
        sqlalchemy.Column("settled_at", sqlalchemy.DateTime(timezone=True)),
        sqlalchemy.Column("refunded_at", sqlalchemy.DateTime(timezone=True)),
        sqlalchemy.Column("owner_shard", sqlalchemy.SmallInteger),
        sqlalchemy.Column(
            "created_at",
            sqlalchemy.DateTime(timezone=True),
            server_default=sqlalchemy.func.now(),
            nullable=False,
        ),
        sqlalchemy.Column("updated_at", sqlalchemy.DateTime(timezone=True)),
        sqlalchemy.UniqueConstraint("checkout_session_id"),
        sqlalchemy.UniqueConstraint("payment_intent_id"),
    )
    alembic.op.create_index("ix_commerce_purchases_owner_id", "commerce_purchases", ["owner_id"])
    alembic.op.create_index("ix_commerce_purchases_status", "commerce_purchases", ["status"])
    alembic.op.create_index(
        "ix_commerce_purchases_owner_product",
        "commerce_purchases",
        ["owner_id", "product_id"],
    )

    alembic.op.create_table(
        "product_entitlements",
        sqlalchemy.Column("id", sqlalchemy.String(64), primary_key=True),
        sqlalchemy.Column("owner_id", sqlalchemy.String(128), nullable=False),
        sqlalchemy.Column("product_id", sqlalchemy.String(64), nullable=False),
        sqlalchemy.Column(
            "purchase_id",
            sqlalchemy.String(64),
            sqlalchemy.ForeignKey("commerce_purchases.id"),
            nullable=False,
        ),
        sqlalchemy.Column("status", sqlalchemy.String(32), nullable=False, server_default="active"),
        sqlalchemy.Column("granted_at", sqlalchemy.DateTime(timezone=True), nullable=False),
        sqlalchemy.Column("revoked_at", sqlalchemy.DateTime(timezone=True)),
        sqlalchemy.Column("owner_shard", sqlalchemy.SmallInteger),
        sqlalchemy.Column(
            "created_at",
            sqlalchemy.DateTime(timezone=True),
            server_default=sqlalchemy.func.now(),
            nullable=False,
        ),
        sqlalchemy.Column("updated_at", sqlalchemy.DateTime(timezone=True)),
        sqlalchemy.UniqueConstraint(
            "owner_id", "product_id", name="uq_product_entitlement_owner_product"
        ),
    )
    alembic.op.create_index(
        "ix_product_entitlements_owner_id", "product_entitlements", ["owner_id"]
    )
    alembic.op.create_index("ix_product_entitlements_status", "product_entitlements", ["status"])
    alembic.op.create_index(
        "ix_product_entitlements_owner_product",
        "product_entitlements",
        ["owner_id", "product_id"],
    )


def downgrade() -> None:
    alembic.op.drop_index(
        "ix_product_entitlements_owner_product", table_name="product_entitlements"
    )
    alembic.op.drop_index("ix_product_entitlements_status", table_name="product_entitlements")
    alembic.op.drop_index("ix_product_entitlements_owner_id", table_name="product_entitlements")
    alembic.op.drop_table("product_entitlements")
    alembic.op.drop_index("ix_commerce_purchases_owner_product", table_name="commerce_purchases")
    alembic.op.drop_index("ix_commerce_purchases_status", table_name="commerce_purchases")
    alembic.op.drop_index("ix_commerce_purchases_owner_id", table_name="commerce_purchases")
    alembic.op.drop_table("commerce_purchases")
