"""Site publication mail, separate from memberships and editorial content."""

from __future__ import annotations

import datetime

import sqlalchemy as sa
import sqlalchemy.orm as orm

from app.db.models import Base, TimestampMixin, make_id


class NewsletterCampaign(Base, TimestampMixin):
    __tablename__ = "newsletter_campaigns"
    __table_args__ = (sa.UniqueConstraint("release_id", "publication"),)
    id: orm.Mapped[str] = orm.mapped_column(
        sa.String(64), primary_key=True, default=lambda: make_id("mail")
    )
    publication: orm.Mapped[str] = orm.mapped_column(sa.String(32), nullable=False, default="amm")
    release_id: orm.Mapped[str] = orm.mapped_column(
        sa.ForeignKey("academy_releases.id"), nullable=False
    )
    work_id: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)
    release_number: orm.Mapped[int] = orm.mapped_column(sa.Integer, nullable=False)
    approved_by: orm.Mapped[str | None] = orm.mapped_column(sa.String(128))
    approved_at: orm.Mapped[datetime.datetime | None] = orm.mapped_column(
        sa.DateTime(timezone=True)
    )
    cancelled_at: orm.Mapped[datetime.datetime | None] = orm.mapped_column(
        sa.DateTime(timezone=True)
    )
    # Public released prose + fixed sender/footer, never recipient addresses.
    envelope: orm.Mapped[dict] = orm.mapped_column(sa.JSON, nullable=False)
    payload_hash: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)


class NewsletterDelivery(Base):
    __tablename__ = "newsletter_deliveries"
    __table_args__ = (sa.UniqueConstraint("campaign_id", "subscription_id"),)
    id: orm.Mapped[str] = orm.mapped_column(
        sa.String(64), primary_key=True, default=lambda: make_id("ndel")
    )
    campaign_id: orm.Mapped[str] = orm.mapped_column(
        sa.ForeignKey("newsletter_campaigns.id"), nullable=False, index=True
    )
    subscription_id: orm.Mapped[str] = orm.mapped_column(
        sa.ForeignKey("reader_subscriptions.id"), nullable=False, index=True
    )
    state: orm.Mapped[str] = orm.mapped_column(sa.String(32), nullable=False, default="pending")
    attempted_at: orm.Mapped[datetime.datetime | None] = orm.mapped_column(
        sa.DateTime(timezone=True)
    )
    provider_id: orm.Mapped[str | None] = orm.mapped_column(sa.String(128), unique=True)
    error_code: orm.Mapped[str | None] = orm.mapped_column(sa.String(64))


class NewsletterEvent(Base):
    __tablename__ = "newsletter_events"
    # Dedupe operational callbacks. Never keep the raw provider payload.
    id: orm.Mapped[str] = orm.mapped_column(sa.String(128), primary_key=True)
    received_at: orm.Mapped[datetime.datetime] = orm.mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now()
    )
