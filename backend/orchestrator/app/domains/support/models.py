"""Member support (ADR-0001).

The movement is funded by the people it serves, so this is a first-class plane
rather than a bolt-on. Three properties are non-negotiable:

- Amounts are decided by the server. A client cannot name its own price.
- The ledger is written from Stripe's signed webhook, never from a client claim.
- Supporter email is stored as a blind index, never in plaintext (ADR-0007).
"""

from __future__ import annotations

import datetime
import hashlib
import uuid

import sqlalchemy
import sqlalchemy.orm

import app.db.models

#: Server-owned price list, in minor units. The client picks a tier, not a price.
SUPPORT_TIERS: dict[str, int] = {
    "seed": 500,
    "steward": 2_500,
    "patron": 10_000,
}
SUPPORT_PURPOSES: dict[str, str] = {
    # `lumen` is the stable stored/API key for the companion now named Minty;
    # renaming the key would break existing rows and Stripe metadata.
    "lumen": "Reliable Minty and semantic book search",
    "reader": "Book One reader and concept map",
    "infrastructure": "A secure and reliable public release",
}
MIN_CUSTOM_AMOUNT = 200
MAX_CUSTOM_AMOUNT = 500_000


class SupportContribution(app.db.models.Base):
    """One contribution. Written only from a verified Stripe event."""

    __tablename__ = "support_contributions"
    __table_args__ = (
        sqlalchemy.UniqueConstraint("provider_ref"),
        sqlalchemy.Index("ix_support_contributions_provider_ref", "provider_ref"),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("sup")
    )
    #: Stripe PaymentIntent or Subscription id. Unique so replayed webhooks are inert.
    provider_ref: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), nullable=False
    )
    #: SHA-256 of the lowercased email — a blind index, never the address itself.
    email_hash: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), index=True
    )
    #: Set once a supporter signs in and links the contribution to their member id.
    member_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), index=True
    )
    amount_minor: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False
    )
    currency: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(8), nullable=False, default="usd"
    )
    tier: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="custom"
    )
    purpose: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="general"
    )
    # one_time; recurring is reserved until a real subscription checkout exists.
    cadence: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(16), nullable=False, default="one_time"
    )
    # pending | succeeded | failed | refunded | cancelled
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="pending", index=True
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )
    settled_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )


def hash_email(email: str) -> str:
    return hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()


def resolve_amount(tier: str, custom_amount_minor: int | None) -> tuple[str, int]:
    """Decide the amount server-side. Returns (tier, amount in minor units)."""

    if tier in SUPPORT_TIERS:
        return tier, SUPPORT_TIERS[tier]
    if tier != "custom" or custom_amount_minor is None:
        raise ValueError("Unknown support tier.")
    if not MIN_CUSTOM_AMOUNT <= custom_amount_minor <= MAX_CUSTOM_AMOUNT:
        raise ValueError("Support amount is outside the permitted range.")
    return "custom", custom_amount_minor


def resolve_purpose(purpose: str) -> str:
    if purpose not in SUPPORT_PURPOSES:
        raise ValueError("Unknown support purpose.")
    return purpose


def new_idempotency_key() -> str:
    return uuid.uuid4().hex
