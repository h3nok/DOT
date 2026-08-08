"""Stripe-backed support service.

The ledger is written from signed webhook events. The intent endpoints only ask
The hosted checkout asks Stripe to collect money; it never records that money
was received. Only a verified provider event may settle the ledger.
"""

from __future__ import annotations

import asyncio
import datetime
import typing

import sqlalchemy
import sqlalchemy.ext.asyncio

import app.core.config
import app.db.models
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
    has_secrets: bool = bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_WEBHOOK_SECRET)
    return stripe is not None and has_secrets


def _client() -> typing.Any:
    settings: app.core.config.Settings = app.core.config.get_settings()
    if not is_configured():
        raise SupportUnavailableError("Support is not configured.")
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def _value(record: typing.Any, key: str, default: typing.Any = None) -> typing.Any:
    if isinstance(record, dict):
        return record.get(key, default)
    return getattr(record, key, default)


async def create_checkout(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    tier: str,
    custom_amount_minor: int | None,
    purpose: str,
) -> dict[str, typing.Any]:
    resolved_tier, amount_minor = models.resolve_amount(tier, custom_amount_minor)
    resolved_purpose: str = models.resolve_purpose(purpose)
    client: typing.Any = _client()
    settings: app.core.config.Settings = app.core.config.get_settings()
    contribution_id: str = app.db.models.make_id("sup")
    metadata: dict[str, str] = {
        "support_id": contribution_id,
        "tier": resolved_tier,
        "purpose": resolved_purpose,
        "cadence": "one_time",
    }
    base_url: str = settings.FRONTEND_URL.rstrip("/")

    try:
        checkout = await asyncio.to_thread(
            client.checkout.Session.create,
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": amount_minor,
                        "product_data": {
                            "name": "Support the DOT work",
                            "description": models.SUPPORT_PURPOSES[resolved_purpose],
                        },
                    },
                    "quantity": 1,
                }
            ],
            metadata=metadata,
            payment_intent_data={"metadata": metadata},
            success_url=f"{base_url}/?support=thanks&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base_url}/?support=cancelled",
            idempotency_key=models.new_idempotency_key(),
        )
    except Exception as exc:  # noqa: BLE001 - provider errors are opaque by design
        raise SupportUnavailableError("Support provider rejected the request.") from exc

    checkout_id: str = str(_value(checkout, "id", ""))
    checkout_url: str = str(_value(checkout, "url", ""))
    if not checkout_id or not checkout_url:
        raise SupportUnavailableError("Support provider returned no checkout URL.")

    session.add(
        models.SupportContribution(
            id=contribution_id,
            provider_ref=checkout_id,
            email_hash=None,
            amount_minor=amount_minor,
            currency="usd",
            tier=resolved_tier,
            purpose=resolved_purpose,
            cadence="one_time",
            status="pending",
        )
    )
    await session.commit()

    return {
        "checkout_url": checkout_url,
        "amount_minor": amount_minor,
        "currency": "usd",
        "tier": resolved_tier,
        "purpose": resolved_purpose,
    }


async def checkout_status(session_id: str) -> dict[str, str]:
    if not session_id.startswith("cs_") or len(session_id) > 128:
        raise ValueError("Invalid checkout session.")
    client: typing.Any = _client()
    try:
        checkout = await asyncio.to_thread(client.checkout.Session.retrieve, session_id)
    except Exception as exc:  # noqa: BLE001 - provider errors are opaque by design
        raise SupportUnavailableError("Checkout status is unavailable.") from exc

    payment_status: str = str(_value(checkout, "payment_status", ""))
    session_status: str = str(_value(checkout, "status", ""))
    if payment_status in {"paid", "no_payment_required"}:
        return {"status": "paid"}
    if session_status == "expired":
        return {"status": "expired"}
    return {"status": "processing"}


def verify_webhook(payload: bytes, signature: str) -> dict[str, typing.Any]:
    """Verify the Stripe signature. Unsigned events are never processed."""

    settings: app.core.config.Settings = app.core.config.get_settings()
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise WebhookVerificationError("Webhook secret is not configured.")
    client: typing.Any = _client()
    try:
        return client.Webhook.construct_event(payload, signature, settings.STRIPE_WEBHOOK_SECRET)
    except Exception as exc:  # noqa: BLE001 - any failure means discard
        raise WebhookVerificationError("Webhook signature did not verify.") from exc


_STATUS_BY_EVENT: dict[str, str] = {
    "checkout.session.async_payment_succeeded": "succeeded",
    "checkout.session.async_payment_failed": "failed",
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
    obj: dict[str, typing.Any] = event.get("data", {}).get("object", {}) or {}
    if event_type == "checkout.session.completed":
        status = "succeeded" if obj.get("payment_status") == "paid" else "pending"
    if status is None:
        return False

    provider_ref: str = str(obj.get("payment_intent") or obj.get("id") or "")
    if not provider_ref:
        return False

    metadata: dict[str, typing.Any] = obj.get("metadata") or {}
    support_id: str = str(metadata.get("support_id") or "")
    contribution: models.SupportContribution | None = (
        await session.get(models.SupportContribution, support_id) if support_id else None
    )
    if contribution is None:
        contribution = await session.scalar(
            sqlalchemy.select(models.SupportContribution).where(
                models.SupportContribution.provider_ref == provider_ref
            )
        )
    if contribution is None:
        purpose: str = str(metadata.get("purpose") or "general")
        customer_details: dict[str, typing.Any] = obj.get("customer_details") or {}
        customer_email: str = str(customer_details.get("email") or "")
        changed = True
        contribution = models.SupportContribution(
            provider_ref=provider_ref,
            email_hash=(
                models.hash_email(customer_email)
                if customer_email
                else str(metadata.get("email_hash") or "") or None
            ),
            # Amount comes from the provider's event, never from a client.
            amount_minor=int(
                obj.get("amount_received") or obj.get("amount_total") or obj.get("amount") or 0
            ),
            currency=str(obj.get("currency") or "usd"),
            tier=str(metadata.get("tier") or "custom"),
            purpose=purpose if purpose in models.SUPPORT_PURPOSES else "general",
            cadence=str(metadata.get("cadence") or "one_time"),
            status=status,
        )
        session.add(contribution)
    else:
        changed: bool = contribution.status != status
        contribution.status = status
        provider_amount: int = int(
            obj.get("amount_received") or obj.get("amount_total") or obj.get("amount") or 0
        )
        if provider_amount:
            contribution.amount_minor = provider_amount
        if obj.get("payment_intent"):
            contribution.provider_ref = str(obj["payment_intent"])

        customer_details: dict[str, typing.Any] = obj.get("customer_details") or {}
        customer_email: str = str(customer_details.get("email") or "")
        if customer_email:
            contribution.email_hash = models.hash_email(customer_email)

    if status == "succeeded":
        contribution.settled_at = datetime.datetime.now(datetime.UTC)
    await session.commit()
    return changed


async def totals(session: sqlalchemy.ext.asyncio.AsyncSession) -> dict[str, int]:
    result: sqlalchemy.Result[tuple[int, int]] = await session.execute(
        sqlalchemy.select(
            sqlalchemy.func.count(models.SupportContribution.id),
            sqlalchemy.func.coalesce(
                sqlalchemy.func.sum(models.SupportContribution.amount_minor), 0
            ),
        ).where(models.SupportContribution.status == "succeeded")
    )
    supporters, total_minor = result.one()
    return {"supporters": int(supporters), "total_minor": int(total_minor)}
