"""Provider-hosted sales for immutable public book releases."""

from __future__ import annotations

import asyncio
import pathlib
import typing
import uuid

import app.core.config

try:  # pragma: no cover - exercised only when the optional dep is installed
    import stripe
except ImportError:  # pragma: no cover
    stripe = None  # type: ignore[assignment]

PRODUCT_ID = "digital-organism-theory-v2-pdf"
RELEASE_ID = "dot-book-one-v2"
PRICE_MINOR = 1_200
CURRENCY = "usd"
ARTIFACT_NAME = "consciousness-a-digital-organism-v2.pdf"
ARTIFACT_PATH = pathlib.Path(__file__).parent / "artifacts" / ARTIFACT_NAME


class BookSaleUnavailableError(RuntimeError):
    """The product or payment provider is unavailable."""


class BookDownloadDeniedError(RuntimeError):
    """The checkout does not establish a paid purchase for this release."""


def _value(record: typing.Any, key: str, default: typing.Any = None) -> typing.Any:
    if isinstance(record, dict):
        return record.get(key, default)
    return getattr(record, key, default)


def is_available() -> bool:
    settings: app.core.config.Settings = app.core.config.get_settings()
    return stripe is not None and bool(settings.STRIPE_SECRET_KEY) and ARTIFACT_PATH.is_file()


def product() -> dict[str, typing.Any]:
    return {
        "id": PRODUCT_ID,
        "title": "Consciousness: A Digital Organism",
        "edition": "Line-edited edition · v2",
        "format": "PDF",
        "amount_minor": PRICE_MINOR,
        "currency": CURRENCY,
        "available": is_available(),
    }


def _client() -> typing.Any:
    settings: app.core.config.Settings = app.core.config.get_settings()
    if not is_available():
        raise BookSaleUnavailableError("Book checkout is not configured.")
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


async def create_checkout(product_id: str) -> dict[str, typing.Any]:
    if product_id != PRODUCT_ID:
        raise ValueError("Unknown book product.")

    client: typing.Any = _client()
    settings: app.core.config.Settings = app.core.config.get_settings()
    metadata: dict[str, str] = {
        "product_id": PRODUCT_ID,
        "release_id": RELEASE_ID,
        "format": "pdf",
    }
    base_url: str = settings.FRONTEND_URL.rstrip("/")

    try:
        checkout = await asyncio.to_thread(
            client.checkout.Session.create,
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": CURRENCY,
                        "unit_amount": PRICE_MINOR,
                        "product_data": {
                            "name": "Consciousness: A Digital Organism",
                            "description": "Book One · Line-edited digital edition (PDF)",
                        },
                    },
                    "quantity": 1,
                }
            ],
            metadata=metadata,
            payment_intent_data={"metadata": metadata},
            success_url=(
                f"{base_url}/book/digital-organism-theory"
                "?purchase=thanks&session_id={CHECKOUT_SESSION_ID}"
            ),
            cancel_url=f"{base_url}/book/digital-organism-theory?purchase=cancelled",
            idempotency_key=uuid.uuid4().hex,
        )
    except Exception as exc:  # noqa: BLE001 - provider errors stay opaque
        raise BookSaleUnavailableError("Book checkout provider rejected the request.") from exc

    checkout_url: str = str(_value(checkout, "url", ""))
    if not checkout_url:
        raise BookSaleUnavailableError("Book checkout provider returned no checkout URL.")
    return {"checkout_url": checkout_url, "product": product()}


async def checkout_status(session_id: str) -> dict[str, str]:
    if not session_id.startswith("cs_") or len(session_id) > 128:
        raise ValueError("Invalid checkout session.")

    client: typing.Any = _client()
    try:
        checkout = await asyncio.to_thread(client.checkout.Session.retrieve, session_id)
    except Exception as exc:  # noqa: BLE001 - provider errors stay opaque
        raise BookSaleUnavailableError("Book checkout status is unavailable.") from exc

    metadata: typing.Any = _value(checkout, "metadata", {}) or {}
    product_id: str = str(_value(metadata, "product_id", ""))
    if product_id != PRODUCT_ID:
        raise BookDownloadDeniedError("Checkout is not for this book edition.")

    payment_status: str = str(_value(checkout, "payment_status", ""))
    session_status: str = str(_value(checkout, "status", ""))
    if payment_status in {"paid", "no_payment_required"}:
        return {"status": "paid", "product_id": PRODUCT_ID}
    if session_status == "expired":
        return {"status": "expired", "product_id": PRODUCT_ID}
    return {"status": "processing", "product_id": PRODUCT_ID}


async def paid_artifact(session_id: str) -> pathlib.Path:
    status: dict[str, str] = await checkout_status(session_id)
    if status["status"] != "paid":
        raise BookDownloadDeniedError("Payment is not complete.")
    if not ARTIFACT_PATH.is_file():
        raise BookSaleUnavailableError("The book artifact is unavailable.")
    return ARTIFACT_PATH
