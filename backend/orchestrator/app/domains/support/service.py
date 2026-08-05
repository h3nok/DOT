"""Stripe-backed support service.

The ledger is written from signed webhook events. The intent endpoints only ask
Stripe to collect money; they never record that money was received.
"""

from __future__ import annotations

import datetime
import typing

import sqlalchemy
import sqlalchemy.ext.asyncio

import app.core.config
import app.domains.support.models as models

try:  # pragma: no cover - exercised only when the optional dep is installed
    import stripe
except ImportError:  # pragma: no cover
    stripe = None  # type: ignore[assignment]


class SupportUnavailableError(RuntimeError):
    """Support is not configured, or the provider rejected the request."""


class WebhookVerificationError(RuntimeError):
    """The webhook signature did not verify. The event is discarded."""


def is_configured() -> bool:
    settings: app.core.config.Settings = app.core.config.get_settings()
    return bool(stripe is not None and settings.STRIPE_SECRET_KEY)


def _client() -> typing.Any:
    settings: app.core.config.Settings = app.core.config.get_settings()
    if not is_configured():
        raise SupportUnavailableError("Support is not configured.")
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


async def create_intent(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    tier: str,
    custom_amount_minor: int | None,
    cadence: str,
    email: str | None,
) -> dict[str, typing.Any]:
    resolved_tier, amount_minor = models.resolve_amount(tier, custom_amount_minor)
    client: typing.Any = _client()

    try:
        intent = client.PaymentIntent.create(
            amount=amount_minor,
            currency="usd",
            description="Support for the DOT movement",
            # Carried back on the webhook so the ledger never trusts the client.
            metadata={
                "tier": resolved_tier,
                "cadence": cadence,
                "email_hash": models.hash_email(email) if email else "",
            },
            idempotency_key=models.new_idempotency_key(),
        )
    except Exception as exc:  # noqa: BLE001 - provider errors are opaque by design
        raise SupportUnavailableError("Support provider rejected the request.") from exc

    session.add(
        models.SupportContribution(
            provider_ref=intent.id,
            email_hash=models.hash_email(email) if email else None,
            amount_minor=amount_minor,
            currency="usd",
            tier=resolved_tier,
            cadence=cadence,
            status="pending",
        )
    )
    await session.commit()

    return {
        "client_secret": intent.client_secret,
        "amount_minor": amount_minor,
        "currency": "usd",
        "tier": resolved_tier,
        "cadence": cadence,
    }


def verify_webhook(payload: bytes, signature: str) -> dict[str, typing.Any]:
    """Verify the Stripe signature. Unsigned events are never processed."""

    settings: app.core.config.Settings = app.core.config.get_settings()
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise WebhookVerificationError("Webhook secret is not configured.")
    client: typing.Any = _client()
    try:
        return client.Webhook.construct_event(
            payload, signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as exc:  # noqa: BLE001 - any failure means discard
        raise WebhookVerificationError("Webhook signature did not verify.") from exc


_STATUS_BY_EVENT: dict[str, str] = {
    "payment_intent.succeeded": "succeeded",
    "payment_intent.payment_failed": "failed",
    "charge.refunded": "refunded",
    "customer.subscription.deleted": "cancelled",
    "invoice.payment_succeeded": "succeeded",
}


async def apply_event(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    event: dict[str, typing.Any],
) -> bool:
    """Record a verified event. Returns True when the ledger changed."""

    event_type: str = str(event.get("type", ""))
    status: str | None = _STATUS_BY_EVENT.get(event_type)
    if status is None:
        return False

    obj: dict[str, typing.Any] = event.get("data", {}).get("object", {}) or {}
    provider_ref: str = str(obj.get("payment_intent") or obj.get("id") or "")
    if not provider_ref:
        return False

    contribution: models.SupportContribution | None = await session.scalar(
        sqlalchemy.select(models.SupportContribution).where(
            models.SupportContribution.provider_ref == provider_ref
        )
    )
    if contribution is None:
        metadata: dict[str, typing.Any] = obj.get("metadata") or {}
        contribution = models.SupportContribution(
            provider_ref=provider_ref,
            email_hash=str(metadata.get("email_hash") or "") or None,
            # Amount comes from the provider's event, never from a client.
            amount_minor=int(obj.get("amount_received") or obj.get("amount") or 0),
            currency=str(obj.get("currency") or "usd"),
            tier=str(metadata.get("tier") or "custom"),
            cadence=str(metadata.get("cadence") or "one_time"),
            status=status,
        )
        session.add(contribution)
    else:
        if contribution.status == status:
            return False  # Replayed event.
        contribution.status = status
        provider_amount: int = int(obj.get("amount_received") or obj.get("amount") or 0)
        if provider_amount:
            contribution.amount_minor = provider_amount

    if status == "succeeded":
        contribution.settled_at = datetime.datetime.now(datetime.UTC)
    await session.commit()
    return True


async def totals(session: sqlalchemy.ext.asyncio.AsyncSession) -> dict[str, int]:
    result: sqlalchemy.Result[typing.Tuple[int, int]] = await session.execute(
        sqlalchemy.select(
            sqlalchemy.func.count(models.SupportContribution.id),
            sqlalchemy.func.coalesce(sqlalchemy.func.sum(models.SupportContribution.amount_minor), 0),
        ).where(models.SupportContribution.status == "succeeded")
    )
    supporters, total_minor = result.one()
    return {"supporters": int(supporters), "total_minor": int(total_minor)}
