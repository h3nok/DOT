"""Authenticated purchases and entitlements for first-party DOT products."""

from __future__ import annotations

import datetime

import sqlalchemy
import sqlalchemy.orm

import app.db.models

BOOK_ONE_PDF_PRODUCT_ID = "book-one-pdf"
BOOK_ONE_PDF_PRICE_MINOR = 2_000
BOOK_ONE_PDF_CURRENCY = "usd"


class CommercePurchase(app.db.models.Base, app.db.models.TimestampMixin, app.db.models.TenantMixin):
    __tablename__ = "commerce_purchases"
    __table_args__ = (
        sqlalchemy.UniqueConstraint("checkout_session_id"),
        sqlalchemy.Index("ix_commerce_purchases_owner_product", "owner_id", "product_id"),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("pur")
    )
    owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), nullable=False, index=True
    )
    product_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    checkout_session_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), nullable=False
    )
    payment_intent_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), unique=True
    )
    amount_minor: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False
    )
    currency: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(8), nullable=False
    )
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="pending", index=True
    )
    settled_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    refunded_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )


class ProductEntitlement(
    app.db.models.Base, app.db.models.TimestampMixin, app.db.models.TenantMixin
):
    __tablename__ = "product_entitlements"
    __table_args__ = (
        sqlalchemy.UniqueConstraint(
            "owner_id", "product_id", name="uq_product_entitlement_owner_product"
        ),
        sqlalchemy.Index("ix_product_entitlements_owner_product", "owner_id", "product_id"),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("ent")
    )
    owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), nullable=False, index=True
    )
    product_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    purchase_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("commerce_purchases.id"), nullable=False
    )
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="active", index=True
    )
    granted_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=False
    )
    revoked_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
