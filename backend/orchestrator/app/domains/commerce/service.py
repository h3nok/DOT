"""Server-priced commerce and webhook-settled product entitlements."""

from __future__ import annotations

import asyncio
import datetime
import pathlib
import typing

import sqlalchemy
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.core.config
import app.db.models
import app.domains.commerce.models as models

try:  # pragma: no cover - exercised only when the optional dependency is installed
    import stripe
except ImportError:  # pragma: no cover
    stripe = None  # type: ignore[assignment]


class CommerceUnavailableError(RuntimeError):
    pass


def _value(record: typing.Any, key: str, default: typing.Any = None) -> typing.Any:
    if isinstance(record, dict):
        return record.get(key, default)
    return getattr(record, key, default)


def _client() -> typing.Any:
    settings = app.core.config.get_settings()
    if stripe is None or not settings.STRIPE_SECRET_KEY or not settings.STRIPE_WEBHOOK_SECRET:
        raise CommerceUnavailableError("Book purchase is not configured.")
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def pdf_path() -> pathlib.Path:
    return pathlib.Path(app.core.config.get_settings().BOOK_ONE_PDF_PATH).resolve()


def is_configured() -> bool:
    settings = app.core.config.get_settings()
    return bool(
        stripe is not None
        and settings.STRIPE_SECRET_KEY
        and settings.STRIPE_WEBHOOK_SECRET
        and pdf_path().is_file()
    )


async def has_entitlement(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
) -> bool:
    entitlement = await session.scalar(
        sqlalchemy.select(models.ProductEntitlement).where(
            models.ProductEntitlement.owner_id == owner.owner_id,
            models.ProductEntitlement.product_id == models.BOOK_ONE_PDF_PRODUCT_ID,
            models.ProductEntitlement.status == "active",
        )
    )
    return entitlement is not None


async def create_checkout(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    owner: app.auth.dependencies.OwnerContext,
) -> dict[str, str]:
    if await has_entitlement(session, owner):
        raise ValueError("This member already owns the digital edition.")

    client = _client()
    settings = app.core.config.get_settings()
    purchase_id = app.db.models.make_id("pur")
    metadata = {
        "commerce_purchase_id": purchase_id,
        "owner_id": owner.owner_id,
        "product_id": models.BOOK_ONE_PDF_PRODUCT_ID,
    }
    base_url = settings.FRONTEND_URL.rstrip("/")

    try:
        checkout = await asyncio.to_thread(
            client.checkout.Session.create,
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": models.BOOK_ONE_PDF_CURRENCY,
                        "unit_amount": models.BOOK_ONE_PDF_PRICE_MINOR,
                        "product_data": {
                            "name": "Digital Organism Theory — Book One PDF",
                            "description": "Authenticated digital edition for offline study.",
                        },
                    },
                    "quantity": 1,
                }
            ],
            client_reference_id=owner.owner_id,
            metadata=metadata,
            payment_intent_data={"metadata": metadata},
            success_url=(
                f"{base_url}/book/digital-organism-theory/copy"
                "?purchase=processing&session_id={CHECKOUT_SESSION_ID}"
            ),
            cancel_url=f"{base_url}/book/digital-organism-theory/copy?purchase=cancelled",
            idempotency_key=app.db.models.make_id("checkout"),
        )
    except Exception as exc:  # noqa: BLE001 - provider errors remain opaque
        raise CommerceUnavailableError("Book purchase provider rejected the request.") from exc

    checkout_id = str(_value(checkout, "id", ""))
    checkout_url = str(_value(checkout, "url", ""))
    if not checkout_id or not checkout_url:
        raise CommerceUnavailableError("Book purchase provider returned no checkout URL.")

    session.add(
        models.CommercePurchase(
            id=purchase_id,
            owner_id=owner.owner_id,
            product_id=models.BOOK_ONE_PDF_PRODUCT_ID,
            checkout_session_id=checkout_id,
            amount_minor=models.BOOK_ONE_PDF_PRICE_MINOR,
            currency=models.BOOK_ONE_PDF_CURRENCY,
            status="pending",
        )
    )
    await session.commit()
    return {"checkout_url": checkout_url}


async def is_commerce_event(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    event: dict[str, typing.Any],
) -> bool:
    obj = event.get("data", {}).get("object", {}) or {}
    metadata = obj.get("metadata") or {}
    if metadata.get("commerce_purchase_id"):
        return True
    if str(event.get("type", "")) != "charge.refunded":
        return False
    payment_intent_id = str(obj.get("payment_intent") or "")
    if not payment_intent_id:
        return False
    purchase_id = await session.scalar(
        sqlalchemy.select(models.CommercePurchase.id).where(
            models.CommercePurchase.payment_intent_id == payment_intent_id
        )
    )
    return purchase_id is not None


async def apply_event(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    event: dict[str, typing.Any],
) -> bool:
    """Grant or revoke an entitlement from an already verified Stripe event."""

    event_type = str(event.get("type", ""))
    obj: dict[str, typing.Any] = event.get("data", {}).get("object", {}) or {}
    metadata: dict[str, typing.Any] = obj.get("metadata") or {}
    purchase_id = str(metadata.get("commerce_purchase_id") or "")
    purchase = await session.get(models.CommercePurchase, purchase_id) if purchase_id else None
    if purchase is None and event_type == "charge.refunded":
        payment_intent_id = str(obj.get("payment_intent") or "")
        if payment_intent_id:
            purchase = await session.scalar(
                sqlalchemy.select(models.CommercePurchase).where(
                    models.CommercePurchase.payment_intent_id == payment_intent_id
                )
            )
    if purchase is None:
        return False

    if event_type == "charge.refunded":
        payment_intent_id = str(obj.get("payment_intent") or "")
        if not payment_intent_id or payment_intent_id != purchase.payment_intent_id:
            return False
        purchase.status = "refunded"
        purchase.refunded_at = datetime.datetime.now(datetime.UTC)
        entitlement = await session.scalar(
            sqlalchemy.select(models.ProductEntitlement).where(
                models.ProductEntitlement.owner_id == purchase.owner_id,
                models.ProductEntitlement.product_id == purchase.product_id,
            )
        )
        if entitlement is not None:
            entitlement.status = "revoked"
            entitlement.revoked_at = datetime.datetime.now(datetime.UTC)
        await session.commit()
        return True

    if event_type not in {
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
    }:
        return False
    if str(obj.get("payment_status") or "") != "paid":
        return False

    provider_amount = int(obj.get("amount_total") or 0)
    provider_currency = str(obj.get("currency") or "").lower()
    metadata_matches = (
        str(metadata.get("owner_id") or "") == purchase.owner_id
        and str(metadata.get("product_id") or "") == purchase.product_id
    )
    if (
        not metadata_matches
        or provider_amount != purchase.amount_minor
        or provider_currency != purchase.currency
    ):
        purchase.status = "failed"
        await session.commit()
        return False

    purchase.status = "succeeded"
    purchase.payment_intent_id = str(obj.get("payment_intent") or "") or None
    purchase.settled_at = datetime.datetime.now(datetime.UTC)
    entitlement = await session.scalar(
        sqlalchemy.select(models.ProductEntitlement).where(
            models.ProductEntitlement.owner_id == purchase.owner_id,
            models.ProductEntitlement.product_id == purchase.product_id,
        )
    )
    now = datetime.datetime.now(datetime.UTC)
    if entitlement is None:
        session.add(
            models.ProductEntitlement(
                owner_id=purchase.owner_id,
                product_id=purchase.product_id,
                purchase_id=purchase.id,
                status="active",
                granted_at=now,
            )
        )
    else:
        entitlement.purchase_id = purchase.id
        entitlement.status = "active"
        entitlement.granted_at = now
        entitlement.revoked_at = None
    await session.commit()
    return True
