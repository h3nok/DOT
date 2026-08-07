"""Support plane (ADR-0012).

These tests pin the three defects the Flask prototype shipped with: unverified
webhooks, client-chosen amounts, and a placeholder API key.
"""

from __future__ import annotations

import typing

import fastapi.testclient
import pytest

import app.core.config
import app.domains.support.models as models
import app.domains.support.service as support_service


class _StubIntent:
    def __init__(self, amount: int) -> None:
        self.id: str = f"pi_{amount}"
        self.client_secret: str = f"pi_{amount}_secret_test"
        self.amount: int = amount


class _StubStripe:
    """Records what the service asked Stripe to charge."""

    api_key: str = ""

    def __init__(self) -> None:
        self.calls: list[dict[str, typing.Any]] = []
        self.PaymentIntent: _StubStripe = self  # noqa: N815 - mirrors the stripe module shape

    def create(self, **kwargs: typing.Any) -> _StubIntent:
        self.calls.append(kwargs)
        return _StubIntent(kwargs["amount"])


@pytest.fixture()
def stub_stripe(monkeypatch: pytest.MonkeyPatch) -> _StubStripe:
    stub = _StubStripe()
    settings: app.core.config.Settings = app.core.config.get_settings()
    monkeypatch.setattr(support_service, "stripe", stub)
    monkeypatch.setattr(settings, "STRIPE_SECRET_KEY", "sk_test_stub", raising=False)
    monkeypatch.setattr(settings, "STRIPE_PUBLISHABLE_KEY", "pk_test_stub", raising=False)
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "whsec_stub", raising=False)
    return stub


def test_options_lists_server_owned_tiers(client: fastapi.testclient.TestClient) -> None:
    body = client.get("/v1/support/options").json()
    assert {tier["id"] for tier in body["tiers"]} == set(models.SUPPORT_TIERS)
    assert body["min_custom_minor"] == models.MIN_CUSTOM_AMOUNT
    assert body["max_custom_minor"] == models.MAX_CUSTOM_AMOUNT


def test_unconfigured_support_publishes_no_key_and_refuses_intents(
    client: fastapi.testclient.TestClient,
) -> None:
    assert client.get("/v1/support/options").json()["publishable_key"] == ""
    response = client.post("/v1/support/intents", json={"tier": "seed"})
    assert response.status_code == 503


def test_named_tier_charges_the_server_price(
    client: fastapi.testclient.TestClient, stub_stripe: _StubStripe
) -> None:
    response = client.post("/v1/support/intents", json={"tier": "steward"})
    assert response.status_code == 200
    assert response.json()["amount_minor"] == models.SUPPORT_TIERS["steward"]
    assert stub_stripe.calls[0]["amount"] == models.SUPPORT_TIERS["steward"]


def test_client_cannot_name_a_price_for_a_named_tier(
    client: fastapi.testclient.TestClient, stub_stripe: _StubStripe
) -> None:
    response = client.post(
        "/v1/support/intents", json={"tier": "seed", "custom_amount_minor": 100_000}
    )
    # The custom amount is ignored outright; the tier price is what Stripe sees.
    assert response.json()["amount_minor"] == models.SUPPORT_TIERS["seed"]
    assert stub_stripe.calls[0]["amount"] == models.SUPPORT_TIERS["seed"]


@pytest.mark.parametrize("amount", [1, models.MAX_CUSTOM_AMOUNT + 1, -500])
def test_custom_amounts_outside_the_range_are_rejected(
    client: fastapi.testclient.TestClient, stub_stripe: _StubStripe, amount: int
) -> None:
    response = client.post(
        "/v1/support/intents", json={"tier": "custom", "custom_amount_minor": amount}
    )
    assert response.status_code == 422
    assert stub_stripe.calls == []


def test_unknown_tier_is_rejected(
    client: fastapi.testclient.TestClient, stub_stripe: _StubStripe
) -> None:
    assert client.post("/v1/support/intents", json={"tier": "free_money"}).status_code == 400


def test_email_is_never_sent_or_stored_in_the_clear(
    client: fastapi.testclient.TestClient, stub_stripe: _StubStripe
) -> None:
    client.post("/v1/support/intents", json={"tier": "seed", "email": "a@example.com"})
    metadata = stub_stripe.calls[0]["metadata"]
    assert "a@example.com" not in repr(stub_stripe.calls)
    assert metadata["email_hash"] == models.hash_email("a@example.com")


def test_unsigned_webhook_is_rejected(
    client: fastapi.testclient.TestClient, stub_stripe: _StubStripe
) -> None:
    forged = {"type": "payment_intent.succeeded", "data": {"object": {"id": "pi_x"}}}
    assert client.post("/v1/support/webhook", json=forged).status_code == 400


def test_forged_signature_is_rejected(
    client: fastapi.testclient.TestClient, stub_stripe: _StubStripe
) -> None:
    forged = {"type": "payment_intent.succeeded", "data": {"object": {"id": "pi_x"}}}
    response = client.post(
        "/v1/support/webhook", json=forged, headers={"Stripe-Signature": "t=1,v1=deadbeef"}
    )
    assert response.status_code == 400
    assert client.get("/v1/support/totals").json()["supporters"] == 0


def test_webhook_without_a_configured_secret_never_processes(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    settings: app.core.config.Settings = app.core.config.get_settings()
    monkeypatch.setattr(settings, "STRIPE_WEBHOOK_SECRET", "", raising=False)
    response = client.post(
        "/v1/support/webhook",
        json={"type": "payment_intent.succeeded"},
        headers={"Stripe-Signature": "t=1,v1=deadbeef"},
    )
    assert response.status_code == 400


def _verified(event: dict, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(support_service, "verify_webhook", lambda payload, signature: event)


def test_ledger_records_the_amount_stripe_reports_not_the_metadata(
    client: fastapi.testclient.TestClient,
    stub_stripe: _StubStripe,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _verified(
        {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_verified",
                    "amount_received": 2_500,
                    "currency": "usd",
                    # A caller controls metadata; it must not set the amount.
                    "metadata": {"tier": "patron", "amount": "999999"},
                }
            },
        },
        monkeypatch,
    )
    assert client.post("/v1/support/webhook", json={}).json() == {"applied": True}

    totals = client.get("/v1/support/totals").json()
    assert totals == {"supporters": 1, "total_minor": 2_500, "currency": "usd"}


def test_replayed_events_do_not_double_count(
    client: fastapi.testclient.TestClient,
    stub_stripe: _StubStripe,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _verified(
        {
            "type": "payment_intent.succeeded",
            "data": {"object": {"id": "pi_replay", "amount_received": 500}},
        },
        monkeypatch,
    )
    assert client.post("/v1/support/webhook", json={}).json() == {"applied": True}
    assert client.post("/v1/support/webhook", json={}).json() == {"applied": False}
    assert client.get("/v1/support/totals").json()["total_minor"] == 500


def test_failed_payments_are_not_counted(
    client: fastapi.testclient.TestClient,
    stub_stripe: _StubStripe,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _verified(
        {
            "type": "payment_intent.payment_failed",
            "data": {"object": {"id": "pi_failed", "amount": 10_000}},
        },
        monkeypatch,
    )
    client.post("/v1/support/webhook", json={})
    assert client.get("/v1/support/totals").json() == {
        "supporters": 0,
        "total_minor": 0,
        "currency": "usd",
    }


def test_totals_expose_no_individual_supporters(
    client: fastapi.testclient.TestClient,
    stub_stripe: _StubStripe,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _verified(
        {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_named",
                    "amount_received": 500,
                    "metadata": {"email_hash": models.hash_email("a@example.com")},
                }
            },
        },
        monkeypatch,
    )
    client.post("/v1/support/webhook", json={})
    body = client.get("/v1/support/totals").text
    assert "email" not in body and "a@example.com" not in body
