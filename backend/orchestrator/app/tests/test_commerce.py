from __future__ import annotations

import pathlib
import typing

import fastapi.testclient
import pytest
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.core.config
import app.domains.commerce.models as models
import app.domains.support.service as support_service


class _Checkout:
    id = "cs_book_one"
    url = "https://checkout.stripe.test/book-one"


class _StubStripe:
    api_key = ""

    def __init__(self) -> None:
        self.calls: list[dict[str, typing.Any]] = []
        self.checkout = self
        self.Session = self  # noqa: N815

    def create(self, **kwargs: typing.Any) -> _Checkout:
        self.calls.append(kwargs)
        return _Checkout()


@pytest.fixture()
def commerce_config(
    monkeypatch: pytest.MonkeyPatch, tmp_path: pathlib.Path
) -> tuple[_StubStripe, pathlib.Path]:
    stub = _StubStripe()
    pdf = tmp_path / "book-one.pdf"
    pdf.write_bytes(b"%PDF-1.4 protected book")
    settings: app.core.config.Settings = app.core.config.get_settings()
    monkeypatch.setattr(support_service, "stripe", stub)
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_stub", raising=False)
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_stub", raising=False)
    monkeypatch.setattr(settings, "BOOK_ONE_PDF_PATH", str(pdf), raising=False)
    return stub, pdf


def _headers(owner: str = "member-one") -> dict[str, str]:
    return {"X-Owner-Id": owner, "X-Actor-Id": owner}


def _verified(event: dict[str, typing.Any], monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(support_service, "verify_webhook", lambda payload, signature: event)


async def _purchase(
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> models.CommercePurchase:
    async with session_factory() as session:
        return typing.cast(
            models.CommercePurchase,
            await session.scalar(sqlalchemy.select(models.CommercePurchase)),
        )


async def _seed_purchase(
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> models.CommercePurchase:
    async with session_factory() as session:
        session.add(
            models.CommercePurchase(
                owner_id="member-one",
                product_id=models.BOOK_ONE_PDF_PRODUCT_ID,
                checkout_session_id="cs_historical_purchase",
                amount_minor=2_000,
                currency="usd",
                status="pending",
            )
        )
        await session.commit()
    return await _purchase(session_factory)


def test_catalog_is_public_and_free(
    client: fastapi.testclient.TestClient,
    commerce_config: tuple[_StubStripe, pathlib.Path],
) -> None:
    response = client.get("/v1/commerce/products/book-one-pdf")
    assert response.status_code == 200
    assert response.json() == {
        "id": "book-one-pdf",
        "title": "Digital Organism Theory — Book One PDF",
        "amount_minor": 0,
        "currency": "usd",
        "available": True,
    }


@pytest.mark.parametrize("headers", [{}, _headers()])
def test_retired_checkout_cannot_charge_visitors_or_members(
    client: fastapi.testclient.TestClient,
    commerce_config: tuple[_StubStripe, pathlib.Path],
    headers: dict[str, str],
) -> None:
    stub, _ = commerce_config
    response = client.post("/v1/commerce/products/book-one-pdf/checkout", headers=headers)
    assert response.status_code == 410
    assert "now free" in response.json()["detail"]
    assert stub.calls == []


def test_free_download_works_without_payment_configuration(
    client: fastapi.testclient.TestClient,
    commerce_config: tuple[_StubStripe, pathlib.Path],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = app.core.config.get_settings()
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "")
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "")
    assert client.get("/v1/commerce/products/book-one-pdf").json()["available"] is True
    response = client.get("/v1/commerce/products/book-one-pdf/download")
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF")


@pytest.mark.parametrize("headers", [{}, _headers(), _headers("different-member")])
def test_download_is_public_and_independent_of_entitlement(
    client: fastapi.testclient.TestClient,
    commerce_config: tuple[_StubStripe, pathlib.Path],
    headers: dict[str, str],
) -> None:
    path = "/v1/commerce/products/book-one-pdf/download"
    response = client.get(path, headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["cache-control"].startswith("public")


def test_missing_pdf_is_explicitly_unavailable(
    client: fastapi.testclient.TestClient,
    commerce_config: tuple[_StubStripe, pathlib.Path],
) -> None:
    _, pdf = commerce_config
    pdf.unlink()
    assert client.get("/v1/commerce/products/book-one-pdf").json()["available"] is False
    response = client.get("/v1/commerce/products/book-one-pdf/download")
    assert response.status_code == 503
    assert response.json()["detail"] == "Digital edition is unavailable."


async def test_historical_payment_still_settles_private_purchase_records(
    client: fastapi.testclient.TestClient,
    commerce_config: tuple[_StubStripe, pathlib.Path],
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    purchase = await _seed_purchase(session_factory)
    _verified(
        {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": purchase.checkout_session_id,
                    "payment_status": "paid",
                    "payment_intent": "pi_book_one",
                    "amount_total": 2_000,
                    "currency": "usd",
                    "metadata": {
                        "commerce_purchase_id": purchase.id,
                        "owner_id": "member-one",
                        "product_id": "book-one-pdf",
                    },
                }
            },
        },
        monkeypatch,
    )
    assert client.post("/v1/support/webhook", json={}).json() == {"applied": True}

    response = client.get("/v1/commerce/products/book-one-pdf/download", headers=_headers())
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
    assert (
        client.get(
            "/v1/commerce/products/book-one-pdf/entitlement",
            headers=_headers("different-member"),
        ).json()["entitled"]
        is False
    )


async def test_historical_refund_revokes_the_record_not_free_download(
    client: fastapi.testclient.TestClient,
    commerce_config: tuple[_StubStripe, pathlib.Path],
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    purchase = await _seed_purchase(session_factory)
    metadata = {
        "commerce_purchase_id": purchase.id,
        "owner_id": "member-one",
        "product_id": "book-one-pdf",
    }
    _verified(
        {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "payment_status": "paid",
                    "payment_intent": "pi_refunded_book",
                    "amount_total": 2_000,
                    "currency": "usd",
                    "metadata": metadata,
                }
            },
        },
        monkeypatch,
    )
    assert client.post("/v1/support/webhook", json={}).json() == {"applied": True}

    _verified(
        {
            "type": "charge.refunded",
            "data": {
                "object": {
                    "payment_intent": "pi_refunded_book",
                }
            },
        },
        monkeypatch,
    )
    assert client.post("/v1/support/webhook", json={}).json() == {"applied": True}
    assert (
        client.get("/v1/commerce/products/book-one-pdf/entitlement", headers=_headers()).json()[
            "entitled"
        ]
        is False
    )
    assert client.get("/v1/commerce/products/book-one-pdf/download").status_code == 200


async def test_mismatched_provider_amount_never_grants_entitlement(
    client: fastapi.testclient.TestClient,
    commerce_config: tuple[_StubStripe, pathlib.Path],
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    purchase = await _seed_purchase(session_factory)
    _verified(
        {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "payment_status": "paid",
                    "amount_total": 1,
                    "currency": "usd",
                    "metadata": {
                        "commerce_purchase_id": purchase.id,
                        "owner_id": "member-one",
                        "product_id": "book-one-pdf",
                    },
                }
            },
        },
        monkeypatch,
    )
    assert client.post("/v1/support/webhook", json={}).json() == {"applied": False}
    assert (
        client.get("/v1/commerce/products/book-one-pdf/entitlement", headers=_headers()).json()[
            "entitled"
        ]
        is False
    )
