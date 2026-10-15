"""Consent, exact releases, durable send attempts, and untracked mail boundaries."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
import uuid
from urllib.parse import urlsplit

import cryptography.fernet
import httpx
import pytest
import sqlalchemy as sa

import app.api.v1.readers as readers_router
import app.auth.dependencies as auth
import app.db.models as db
from app.domains.readers import mail, models, newsletter
from app.tests.test_academy_kernel import STEWARD, _headers
from app.tests.test_writing_desk import draft_payload, work


@pytest.fixture(autouse=True)
def isolated_mail(monkeypatch):
    readers_router._limiter._storage.reset()  # noqa: SLF001
    monkeypatch.setenv("JOIN_CONTACT_KEY", cryptography.fernet.Fernet.generate_key().decode())
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    monkeypatch.delenv("NEWSLETTER_ENABLED", raising=False)


def owner_headers(role="owner", actor=STEWARD):
    token = auth.mint_test_token(owner_id=actor, actor_id=actor, role=role, scopes=["owner:write"])
    return {"Authorization": "Bearer " + token}


def join(client, email, publication="amm", include_all=False):
    selection = {"email": email, "publication": publication, "include_all": include_all}
    sent = client.post("/v1/readers/subscribe", json=selection)
    assert sent.status_code == 202, sent.text
    confirmed = client.post(
        "/v1/readers/confirm", json={**selection, "code": sent.json()["dev_code"]}
    )
    assert confirmed.status_code == 200, confirmed.text
    return confirmed.json()["unsubscribe_token"]


async def edition(client, session_factory):
    identity = await work(client, session_factory)
    payload = draft_payload()
    payload["body"] = (
        "## Synthetic edition\n\nA **fixture**, not a real newsletter."
        "\n\n![A test figure](post/banner.png)"
    )
    payload["assets"] = payload["assets"][:1]
    payload["presentation"] = {"format": "letter", "series": newsletter.TITLE}
    saved = client.post(f"/v1/academy/works/{identity}/drafts", headers=_headers(), json=payload)
    assert saved.status_code == 201, saved.text
    released = client.post(
        f"/v1/academy/works/{identity}/releases",
        headers=_headers(),
        json={"revision_id": saved.json()["id"]},
    )
    assert released.status_code == 201, released.text
    prepared = client.post(
        "/v1/newsletters/campaigns",
        headers=owner_headers(),
        json={"work_id": identity, "release_number": 1},
    )
    assert prepared.status_code == 200, prepared.text
    return identity, prepared.json()


@pytest.fixture
def ready(monkeypatch):
    async def readiness():
        return {"ready": True, "reason": None, "missing": []}

    monkeypatch.setattr(mail, "readiness", readiness)


def approve(client, campaign):
    response = client.post(
        f"/v1/newsletters/campaigns/{campaign['id']}/approve",
        headers=owner_headers(),
        json={"approved": True, "payload_hash": campaign["payload_hash"]},
    )
    assert response.status_code == 200, response.text
    return response.json()


async def test_scope_is_bound_to_confirmation_and_existing_general_readers_stay_separate(
    client, session_factory
):
    join(client, "general@example.com", "all")
    selection = {"email": "amm@example.com", "publication": "amm", "include_all": False}
    sent = client.post("/v1/readers/subscribe", json=selection).json()
    widened = client.post(
        "/v1/readers/confirm", json={**selection, "include_all": True, "code": sent["dev_code"]}
    )
    assert widened.status_code == 400
    general = client.post(
        "/v1/readers/confirm", json={"email": selection["email"], "code": sent["dev_code"]}
    )
    assert general.status_code == 400
    confirmed = client.post("/v1/readers/confirm", json={**selection, "code": sent["dev_code"]})
    assert confirmed.status_code == 200
    async with session_factory() as session:
        rows = list(await session.scalars(sa.select(db.ReaderSubscription)))
        assert sorted(row.publication for row in rows) == ["all", "amm"]
        assert (
            len(
                list(
                    await session.scalars(
                        sa.select(db.ReaderSubscription).where(*newsletter.eligible())
                    )
                )
            )
            == 1
        )


async def test_optional_other_writing_and_scoped_or_all_unsubscribe(client, session_factory):
    token = join(client, "both@example.com", include_all=True)
    assert (
        client.post(
            "/v1/newsletters/one-click?token=" + token, content="List-Unsubscribe=One-Click"
        ).status_code
        == 200
    )
    assert client.get("/v1/newsletters/one-click?token=" + token).status_code == 405
    async with session_factory() as session:
        rows = list(await session.scalars(sa.select(db.ReaderSubscription)))
        assert len(rows) == 2
        assert all(row.confirmed_at for row in rows)
        assert next(row for row in rows if row.publication == "all").unsubscribed_at is None
        assert next(row for row in rows if row.publication == "amm").unsubscribed_at is not None
    client.post("/v1/readers/unsubscribe", json={"token": token, "all_publications": True})
    async with session_factory() as session:
        assert all(
            row.unsubscribed_at for row in await session.scalars(sa.select(db.ReaderSubscription))
        )


async def test_only_owner_can_prepare_an_exact_public_amm_release(client, session_factory):
    assert client.get("/v1/newsletters/campaigns").status_code == 401
    assert (
        client.get("/v1/newsletters/campaigns", headers=owner_headers(role="member")).status_code
        == 403
    )
    identity, campaign = await edition(client, session_factory)
    assert campaign["approved_at"] is None
    assert campaign["counts"] == {}
    assert "<strong>fixture</strong>" in campaign["envelope"]["html"]
    assert f"/writing/{identity}/releases/1" in campaign["envelope"]["text"]
    again = client.post(
        "/v1/newsletters/campaigns",
        headers=owner_headers(),
        json={"work_id": identity, "release_number": 1},
    ).json()
    assert again["id"] == campaign["id"]
    assert (
        client.post(
            "/v1/newsletters/campaigns",
            headers=owner_headers(),
            json={"work_id": identity, "release_number": 2},
        ).status_code
        == 404
    )
    assert (
        client.post(
            f"/v1/newsletters/campaigns/{campaign['id']}/approve",
            headers=owner_headers(),
            json={"approved": True, "payload_hash": campaign["payload_hash"]},
        ).status_code
        == 503
    )


async def test_approval_freezes_audience_dispatch_rechecks_consent_and_dedupes(
    client, session_factory, ready, monkeypatch
):
    sent = []

    async def deliver(payload, identity):
        sent.append((payload, identity))
        return "accepted", str(uuid.uuid4())

    monkeypatch.setattr(mail, "deliver", deliver)
    join(client, "eligible@example.com")
    leaving = join(client, "leaving@example.com")
    join(client, "general@example.com", "all")
    _, campaign = await edition(client, session_factory)
    assert campaign["eligible_readers"] == 2
    invalid = client.post(
        f"/v1/newsletters/campaigns/{campaign['id']}/approve",
        headers=owner_headers(),
        json={"approved": True, "payload_hash": "0" * 64},
    )
    assert invalid.status_code == 409
    assert approve(client, campaign)["counts"] == {"pending": 2}
    assert approve(client, campaign)["counts"] == {"pending": 2}
    # Preparing again cannot replace an already approved message, even after
    # an operator edits the runtime sender settings.
    with monkeypatch.context() as changed:
        changed.setenv("NEWSLETTER_REPLY_TO", "changed@example.com")
        prepared_again = client.post(
            "/v1/newsletters/campaigns",
            headers=owner_headers(),
            json={"work_id": campaign["work_id"], "release_number": 1},
        )
        assert prepared_again.status_code == 200
        assert prepared_again.json()["envelope"] == campaign["envelope"]
        assert prepared_again.json()["payload_hash"] == campaign["payload_hash"]
    join(client, "too-late@example.com")
    client.post("/v1/readers/unsubscribe", json={"token": leaving})
    endpoint = f"/v1/newsletters/campaigns/{campaign['id']}/dispatch"
    response = client.post(endpoint, headers=owner_headers())
    assert response.status_code == 200, response.text
    assert response.json()["counts"] == {"accepted": 1, "skipped": 1}
    assert client.post(endpoint, headers=owner_headers()).status_code == 200
    assert len(sent) == 1
    payload = sent[0][0]
    assert payload["to"] == ["eligible@example.com"]
    assert payload["tags"] == [{"name": "publication", "value": "amm"}]
    assert payload["headers"]["List-Unsubscribe-Post"] == "List-Unsubscribe=One-Click"
    assert "Unsubscribe from AMM" in payload["html"]
    assert "Leave all writing lists" in payload["text"]
    assert "<img" not in payload["html"]
    assert "tracking" not in payload


async def test_ambiguous_delivery_is_not_retried_and_cancellation_keeps_public_edition(
    client, session_factory, ready, monkeypatch
):
    attempts = []

    async def uncertain(payload, identity):
        attempts.append(identity)
        return "needs_review", None

    monkeypatch.setattr(mail, "deliver", uncertain)
    join(client, "one@example.com")
    join(client, "two@example.com")
    identity, campaign = await edition(client, session_factory)
    approve(client, campaign)
    endpoint = f"/v1/newsletters/campaigns/{campaign['id']}"
    first = client.post(endpoint + "/dispatch", headers=owner_headers()).json()
    assert first["counts"] == {"needs_review": 1, "pending": 1}
    cancelled = client.post(endpoint + "/cancel", headers=owner_headers()).json()
    assert cancelled["counts"] == {"needs_review": 1, "skipped": 1}
    assert client.post(endpoint + "/dispatch", headers=owner_headers()).status_code == 409
    assert len(attempts) == 1
    assert client.get(f"/v1/academy/delivery/works/{identity}").status_code == 200


async def test_signed_callbacks_dedupe_suppress_and_do_not_store_recipient_payload(
    client, session_factory, ready, monkeypatch
):
    async def deliver(payload, identity):
        return "accepted", "provider-message"

    monkeypatch.setattr(mail, "deliver", deliver)
    join(client, "bounce@example.com", include_all=True)
    _, campaign = await edition(client, session_factory)
    approve(client, campaign)
    client.post(f"/v1/newsletters/campaigns/{campaign['id']}/dispatch", headers=owner_headers())
    secret = b"a-synthetic-webhook-secret-for-tests"
    monkeypatch.setenv("NEWSLETTER_WEBHOOK_SECRET", "whsec_" + base64.b64encode(secret).decode())
    payload = json.dumps(
        {
            "type": "email.bounced",
            "data": {"email_id": "provider-message", "to": ["bounce@example.com"]},
        }
    ).encode()
    timestamp = str(int(time.time()))
    signed = b"evt_test." + timestamp.encode() + b"." + payload
    headers = {
        "svix-id": "evt_test",
        "svix-timestamp": timestamp,
        "svix-signature": "v1,"
        + base64.b64encode(hmac.new(secret, signed, hashlib.sha256).digest()).decode(),
    }
    assert client.post("/v1/newsletters/webhook", content=payload).status_code == 400
    for _ in range(2):
        result = client.post("/v1/newsletters/webhook", content=payload, headers=headers)
        assert result.status_code == 200, result.text
    async with session_factory() as session:
        assert all(
            row.suppressed_at for row in await session.scalars(sa.select(db.ReaderSubscription))
        )
        assert len(list(await session.scalars(sa.select(models.NewsletterEvent)))) == 1
        assert (await session.scalar(sa.select(models.NewsletterDelivery))).state == "bounced"
    headers["svix-timestamp"] = str(int(timestamp) - 1000)
    assert (
        client.post("/v1/newsletters/webhook", content=payload, headers=headers).status_code == 400
    )


async def test_unrelated_mail_callbacks_are_ignored_but_early_amm_receipts_retry(
    client, session_factory, monkeypatch
):
    secret = b"synthetic-account-wide-webhook-secret"
    monkeypatch.setenv("NEWSLETTER_WEBHOOK_SECRET", "whsec_" + base64.b64encode(secret).decode())
    for tags, expected in [
        (None, 200),
        ({"category": "sign_in"}, 200),
        ({"publication": "amm"}, 503),
    ]:
        payload = json.dumps(
            {"type": "email.delivered", "data": {"email_id": "not-yet-recorded", "tags": tags}}
        ).encode()
        timestamp = str(int(time.time()))
        identity = "evt_" + uuid.uuid4().hex
        signed = identity.encode() + b"." + timestamp.encode() + b"." + payload
        headers = {
            "svix-id": identity,
            "svix-timestamp": timestamp,
            "svix-signature": "v1,"
            + base64.b64encode(hmac.new(secret, signed, hashlib.sha256).digest()).decode(),
        }
        response = client.post("/v1/newsletters/webhook", content=payload, headers=headers)
        assert response.status_code == expected, response.text
    async with session_factory() as session:
        assert not list(await session.scalars(sa.select(models.NewsletterEvent)))
        assert not list(await session.scalars(sa.select(models.NewsletterDelivery)))


async def test_transport_uses_stable_idempotency_and_holds_timeouts(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "synthetic")
    seen = []

    class Client:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, **kwargs):
            seen.append(kwargs)
            raise httpx.ReadTimeout("synthetic")

    monkeypatch.setattr(mail.httpx, "AsyncClient", Client)
    assert await mail.deliver({"text": "fixture"}, "same-id") == ("needs_review", None)
    assert seen[0]["headers"]["Idempotency-Key"] == "newsletter/same-id"


async def test_reader_to_email_to_delivery_to_unsubscribe_lifecycle(
    client, session_factory, ready, monkeypatch
):
    # Use the real subscriber, publisher, campaign and transport paths. Only the
    # provider HTTP boundary is synthetic; no real address receives this test.
    join(client, "lifecycle@example.com", include_all=True)
    monkeypatch.setenv("EMAIL_FROM", "DOT <letters@example.com>")
    monkeypatch.setenv("RESEND_API_KEY", "synthetic")
    monkeypatch.setenv("NEWSLETTER_POSTAL_ADDRESS", "Synthetic test address")
    monkeypatch.setenv("NEWSLETTER_PUBLIC_API_URL", "https://api.example.com")
    sent = []

    class Provider:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, **kwargs):
            assert url == "https://api.resend.com/emails"
            sent.append(kwargs["json"])
            return httpx.Response(200, json={"id": "lifecycle-message"})

    monkeypatch.setattr(mail.httpx, "AsyncClient", Provider)
    _, campaign = await edition(client, session_factory)
    assert sent == []  # Neither publication nor preview sends email.
    approve(client, campaign)
    dispatched = client.post(
        f"/v1/newsletters/campaigns/{campaign['id']}/dispatch", headers=owner_headers()
    )
    assert dispatched.status_code == 200
    assert dispatched.json()["counts"] == {"accepted": 1}
    assert len(sent) == 1
    message = sent[0]
    assert message["from"] == f"{newsletter.TITLE} <letters@example.com>"
    assert message["to"] == ["lifecycle@example.com"]
    assert "A <strong>fixture</strong>, not a real newsletter." in message["html"]
    assert "Synthetic test address" in message["html"]
    assert "<img" not in message["html"]

    secret = b"a-synthetic-lifecycle-webhook-secret"
    monkeypatch.setenv("NEWSLETTER_WEBHOOK_SECRET", "whsec_" + base64.b64encode(secret).decode())
    payload = json.dumps(
        {"type": "email.delivered", "data": {"email_id": "lifecycle-message"}}
    ).encode()
    timestamp = str(int(time.time()))
    signed = b"evt_lifecycle." + timestamp.encode() + b"." + payload
    headers = {
        "svix-id": "evt_lifecycle",
        "svix-timestamp": timestamp,
        "svix-signature": "v1,"
        + base64.b64encode(hmac.new(secret, signed, hashlib.sha256).digest()).decode(),
    }
    assert (
        client.post("/v1/newsletters/webhook", content=payload, headers=headers).status_code == 200
    )
    history = client.get("/v1/newsletters/campaigns", headers=owner_headers()).json()
    assert history[0]["counts"] == {"delivered": 1}

    leave = urlsplit(message["headers"]["List-Unsubscribe"].strip("<>"))
    assert (
        client.post(
            leave.path + "?" + leave.query, content="List-Unsubscribe=One-Click"
        ).status_code
        == 200
    )
    _, next_campaign = await edition(client, session_factory)
    assert next_campaign["eligible_readers"] == 0
    async with session_factory() as session:
        rows = list(await session.scalars(sa.select(db.ReaderSubscription)))
        assert next(row for row in rows if row.publication == "amm").unsubscribed_at
        assert next(row for row in rows if row.publication == "all").unsubscribed_at is None
    assert len(sent) == 1


async def test_stale_sending_record_is_reported_for_review(client, session_factory, ready):
    join(client, "stale@example.com")
    _, campaign = await edition(client, session_factory)
    approve(client, campaign)
    async with session_factory() as session:
        row = await session.scalar(sa.select(models.NewsletterDelivery))
        row.state = "sending"
        row.attempted_at = newsletter.now() - newsletter.dt.timedelta(minutes=3)
        await session.commit()
    listed = client.get("/v1/newsletters/campaigns", headers=owner_headers()).json()
    assert listed[0]["counts"]["needs_review"] == 1
    assert listed[0]["counts"]["sending"] == 0


async def test_retry_only_requeues_definite_rejections(client, session_factory, ready):
    join(client, "retry@example.com")
    join(client, "unknown@example.com")
    _, campaign = await edition(client, session_factory)
    approve(client, campaign)
    async with session_factory() as session:
        rows = list(await session.scalars(sa.select(models.NewsletterDelivery)))
        rows[0].state, rows[1].state = "rejected", "needs_review"
        await session.commit()
    result = client.post(
        f"/v1/newsletters/campaigns/{campaign['id']}/retry-rejected", headers=owner_headers()
    )
    assert result.status_code == 200, result.text
    assert result.json()["counts"] == {"pending": 1, "needs_review": 1}


async def test_verified_sender_must_have_both_tracking_modes_off(monkeypatch):
    for key, value in {
        "RESEND_API_KEY": "synthetic",
        "EMAIL_FROM": "AMM <mail@example.com>",
        "NEWSLETTER_POSTAL_ADDRESS": "Synthetic postal address",
        "NEWSLETTER_PUBLIC_API_URL": "https://api.example.com",
        "NEWSLETTER_RESEND_DOMAIN_ID": "synthetic-domain",
        "NEWSLETTER_WEBHOOK_SECRET": "synthetic-secret",
        "NEWSLETTER_ENABLED": "true",
    }.items():
        monkeypatch.setenv(key, value)
    domain = {
        "name": "example.com",
        "status": "verified",
        "open_tracking": False,
        "click_tracking": False,
    }

    class Client:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def get(self, url, **kwargs):
            return httpx.Response(200, json=domain)

    monkeypatch.setattr(mail.httpx, "AsyncClient", Client)
    assert (await mail.readiness())["ready"] is True
    domain["open_tracking"] = True
    assert (await mail.readiness())["ready"] is False
    domain["open_tracking"], domain["click_tracking"] = False, True
    assert (await mail.readiness())["ready"] is False
    domain["click_tracking"], domain["status"] = False, "pending"
    assert (await mail.readiness())["ready"] is False
