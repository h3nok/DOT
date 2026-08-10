from __future__ import annotations

import pathlib
import typing

import fastapi.testclient
import pytest

import app.core.config
import app.domains.publication.book_sales as book_sales


class _Checkout:
    def __init__(
        self,
        *,
        metadata: dict[str, str] | None = None,
        payment_status: str = "paid",
        status: str = "complete",
    ) -> None:
        self.id = "cs_book"
        self.url = "https://checkout.stripe.test/book"
        self.metadata = metadata or {"product_id": book_sales.PRODUCT_ID}
        self.payment_status = payment_status
        self.status = status


class _Stripe:
    api_key = ""

    def __init__(self) -> None:
        self.calls: list[dict[str, typing.Any]] = []
        self.checkout = self
        self.Session = self  # noqa: N815 - mirrors Stripe
        self.retrieved = _Checkout()

    def create(self, **kwargs: typing.Any) -> _Checkout:
        self.calls.append(kwargs)
        return _Checkout()

    def retrieve(self, session_id: str) -> _Checkout:
        return self.retrieved


@pytest.fixture()
def stub_stripe(monkeypatch: pytest.MonkeyPatch, tmp_path: pathlib.Path) -> _Stripe:
    stub = _Stripe()
    artifact = tmp_path / book_sales.ARTIFACT_NAME
    artifact.write_bytes(b"%PDF-1.7\nbook")
    settings = app.core.config.get_settings()
    monkeypatch.setattr(book_sales, "stripe", stub)
    monkeypatch.setattr(book_sales, "ARTIFACT_PATH", artifact)
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_stub", raising=False)
    return stub


def test_product_is_server_priced_and_closed_when_unconfigured(
    client: fastapi.testclient.TestClient,
) -> None:
    body = client.get("/v1/books/digital-organism-theory/product").json()
    assert body["amount_minor"] == book_sales.PRICE_MINOR
    assert body["available"] is False


def test_checkout_uses_the_catalog_price_and_release_metadata(
    client: fastapi.testclient.TestClient,
    stub_stripe: _Stripe,
) -> None:
    response = client.post(
        "/v1/books/digital-organism-theory/checkout-sessions",
        json={"product_id": book_sales.PRODUCT_ID},
    )
    assert response.status_code == 200
    price_data = stub_stripe.calls[0]["line_items"][0]["price_data"]
    assert price_data["unit_amount"] == book_sales.PRICE_MINOR
    assert stub_stripe.calls[0]["metadata"] == {
        "product_id": book_sales.PRODUCT_ID,
        "release_id": book_sales.RELEASE_ID,
        "format": "pdf",
    }


def test_checkout_rejects_unknown_products(
    client: fastapi.testclient.TestClient,
    stub_stripe: _Stripe,
) -> None:
    response = client.post(
        "/v1/books/digital-organism-theory/checkout-sessions",
        json={"product_id": "client-priced-copy"},
    )
    assert response.status_code == 400
    assert stub_stripe.calls == []


def test_paid_matching_checkout_can_download_the_pdf(
    client: fastapi.testclient.TestClient,
    stub_stripe: _Stripe,
) -> None:
    response = client.get("/v1/books/digital-organism-theory/checkout-sessions/cs_book/download")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["cache-control"] == "private, no-store"
    assert response.content.startswith(b"%PDF")


def test_checkout_status_is_private_and_reports_provider_state(
    client: fastapi.testclient.TestClient,
    stub_stripe: _Stripe,
) -> None:
    response = client.get("/v1/books/digital-organism-theory/checkout-sessions/cs_book")
    assert response.status_code == 200
    assert response.headers["cache-control"] == "private, no-store"
    assert response.json() == {
        "status": "paid",
        "product_id": book_sales.PRODUCT_ID,
    }


@pytest.mark.parametrize(
    ("checkout", "expected"),
    [
        (_Checkout(payment_status="unpaid", status="open"), 403),
        (_Checkout(metadata={"product_id": "another-book"}), 403),
    ],
)
def test_download_fails_closed_without_a_paid_matching_checkout(
    client: fastapi.testclient.TestClient,
    stub_stripe: _Stripe,
    checkout: _Checkout,
    expected: int,
) -> None:
    stub_stripe.retrieved = checkout
    response = client.get("/v1/books/digital-organism-theory/checkout-sessions/cs_book/download")
    assert response.status_code == expected
