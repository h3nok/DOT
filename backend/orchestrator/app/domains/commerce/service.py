"""Free Book One delivery and settlement of historical book purchases."""

from __future__ import annotations

import datetime
import pathlib
import typing

import sqlalchemy
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.core.config
import app.domains.commerce.models as models


class BookPurchaseRetiredError(RuntimeError):
    pass


def reject_book_purchase() -> typing.NoReturn:
    raise BookPurchaseRetiredError(
        "Book One is now free. Download without an account; author support is optional."
    )


def pdf_path() -> pathlib.Path:
    return pathlib.Path(app.core.config.get_settings().BOOK_ONE_PDF_PATH).resolve()


def is_configured() -> bool:
    return pdf_path().is_file()


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
