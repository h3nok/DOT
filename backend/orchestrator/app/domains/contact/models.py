from __future__ import annotations

import datetime

import sqlalchemy as sa
import sqlalchemy.orm as orm

import app.db.models as db


class ContactInquiry(db.Base, db.TenantMixin, db.TimestampMixin):
    __tablename__ = "contact_inquiries"
    __table_args__ = (
        sa.UniqueConstraint("owner_id", "submission_key"),
        sa.CheckConstraint("status IN ('new', 'replied', 'archived')"),
        sa.Index("ix_contact_inquiries_owner_created", "owner_id", "created_at", "id"),
    )

    id: orm.Mapped[str] = orm.mapped_column(
        sa.String(64), primary_key=True, default=lambda: db.make_id("inq")
    )
    owner_id: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)
    submission_key: orm.Mapped[str] = orm.mapped_column(sa.String(128), nullable=False)
    payload_hash: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)
    purpose: orm.Mapped[str] = orm.mapped_column(sa.String(32), nullable=False)
    content_sealed: orm.Mapped[str] = orm.mapped_column(sa.Text(), nullable=False)
    status: orm.Mapped[str] = orm.mapped_column(sa.String(32), default="new", nullable=False)
    notification_status: orm.Mapped[str] = orm.mapped_column(
        sa.String(32), default="pending", nullable=False
    )


class ContactReply(db.Base, db.TenantMixin, db.TimestampMixin):
    __tablename__ = "contact_replies"
    __table_args__ = (
        sa.UniqueConstraint("owner_id", "submission_key"),
        sa.CheckConstraint("status IN ('sending', 'sent', 'failed')"),
        sa.Index("ix_contact_replies_owner_inquiry", "owner_id", "inquiry_id"),
    )

    id: orm.Mapped[str] = orm.mapped_column(
        sa.String(64), primary_key=True, default=lambda: db.make_id("reply")
    )
    owner_id: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)
    inquiry_id: orm.Mapped[str] = orm.mapped_column(
        sa.ForeignKey("contact_inquiries.id", ondelete="CASCADE"), nullable=False
    )
    submission_key: orm.Mapped[str] = orm.mapped_column(sa.String(128), nullable=False)
    payload_hash: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)
    body_sealed: orm.Mapped[str] = orm.mapped_column(sa.Text(), nullable=False)
    status: orm.Mapped[str] = orm.mapped_column(sa.String(32), nullable=False)
    provider_id: orm.Mapped[str | None] = orm.mapped_column(sa.String(128))
    attempt_at: orm.Mapped[datetime.datetime] = orm.mapped_column(
        sa.DateTime(timezone=True), nullable=False
    )
