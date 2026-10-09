from __future__ import annotations

import datetime

import sqlalchemy as sa
import sqlalchemy.orm as orm

import app.db.models as db


class PublishingConnection(db.Base, db.TenantMixin, db.TimestampMixin):
    __tablename__ = "publishing_connections"
    __table_args__ = (sa.UniqueConstraint("owner_id", "actor_id", "platform"),)

    id: orm.Mapped[str] = orm.mapped_column(
        sa.String(64), primary_key=True, default=lambda: db.make_id("pconn")
    )
    owner_id: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)
    actor_id: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)
    platform: orm.Mapped[str] = orm.mapped_column(sa.String(32), nullable=False)
    person_id: orm.Mapped[str] = orm.mapped_column(sa.String(128), nullable=False)
    display_name: orm.Mapped[str] = orm.mapped_column(sa.String(256), nullable=False)
    token_sealed: orm.Mapped[str] = orm.mapped_column(sa.Text(), nullable=False)
    expires_at: orm.Mapped[datetime.datetime] = orm.mapped_column(
        sa.DateTime(timezone=True), nullable=False
    )


class PublishingAuthorization(db.Base, db.TenantMixin):
    __tablename__ = "publishing_authorizations"

    id: orm.Mapped[str] = orm.mapped_column(sa.String(64), primary_key=True)
    owner_id: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)
    actor_id: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)
    expires_at: orm.Mapped[datetime.datetime] = orm.mapped_column(
        sa.DateTime(timezone=True), nullable=False
    )
    used_at: orm.Mapped[datetime.datetime | None] = orm.mapped_column(sa.DateTime(timezone=True))


class DistributionCopy(db.Base, db.TenantMixin, db.TimestampMixin):
    __tablename__ = "distribution_copies"
    __table_args__ = (
        sa.UniqueConstraint("owner_id", "actor_id", "release_id", "platform"),
        sa.CheckConstraint(
            "platform IN ('linkedin', 'substack', 'medium')",
            name="distribution_copies_platform_check",
        ),
        sa.CheckConstraint(
            "status IN ('sending', 'published', 'failed', 'needs_review', 'recorded')",
            name="distribution_copies_status_check",
        ),
    )

    id: orm.Mapped[str] = orm.mapped_column(
        sa.String(64), primary_key=True, default=lambda: db.make_id("dcopy")
    )
    owner_id: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)
    actor_id: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)
    release_id: orm.Mapped[str] = orm.mapped_column(
        sa.ForeignKey("academy_releases.id"), nullable=False
    )
    platform: orm.Mapped[str] = orm.mapped_column(sa.String(32), nullable=False)
    status: orm.Mapped[str] = orm.mapped_column(sa.String(32), nullable=False)
    payload_hash: orm.Mapped[str] = orm.mapped_column(sa.String(64), nullable=False)
    approved_at: orm.Mapped[datetime.datetime] = orm.mapped_column(
        sa.DateTime(timezone=True), nullable=False
    )
    external_url: orm.Mapped[str | None] = orm.mapped_column(sa.String(2048))
    error_code: orm.Mapped[str | None] = orm.mapped_column(sa.String(64))
