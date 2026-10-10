from __future__ import annotations

import datetime
import json
import uuid

import cryptography.fernet
import httpx
import pytest
import sqlalchemy as sa

import app.api.v1.contact
import app.auth.dependencies as auth
import app.core.tenancy
import app.domains.contact.models as models
import app.domains.contact.service as service
import app.settings

OWNER = {"X-Owner-Id": "henok"}
MESSAGE = {
    "purpose": "project",
    "name": "Example Builder",
    "email": "builder@example.org",
    "message": "I'd like to discuss a useful digital product.",
    "organization": "Example",
    "timeline": "November",
    "budget": "Still exploring",
    "consent": True,
}


@pytest.fixture(autouse=True)
def contact_config(monkeypatch):
    app.api.v1.contact._limiter._storage.reset()  # noqa: SLF001
    monkeypatch.setenv("ORCHESTRATOR_CONTACT_EMAIL", "henok@sullix.com")
    monkeypatch.setenv("ORCHESTRATOR_CONTACT_OWNER_ID", "henok")
    monkeypatch.setenv("JOIN_CONTACT_KEY", cryptography.fernet.Fernet.generate_key().decode())
    monkeypatch.setenv("EMAIL_FROM", "no-reply@dotheory.org")
    monkeypatch.setenv("RESEND_API_KEY", "test-only-provider-key")
    app.settings.get_settings.cache_clear()
    calls = []
    outcome = {"status": 200, "timeout": False}
    original = httpx.AsyncClient

    def respond(request):
        calls.append(request)
        if outcome["timeout"]:
            raise httpx.ReadTimeout("Unknown delivery outcome", request=request)
        return httpx.Response(outcome["status"], json={"id": "provider-accepted"})

    monkeypatch.setattr(
        service.httpx,
        "AsyncClient",
        lambda **kw: original(
            transport=httpx.MockTransport(respond),
            **kw,
        ),
    )
    yield calls, outcome
    app.settings.get_settings.cache_clear()


def submit(client, payload=None, key=None):
    return client.post(
        "/v1/contact/messages",
        json=MESSAGE if payload is None else payload,
        headers={"Idempotency-Key": key or str(uuid.uuid4())},
    )


def reply(client, inquiry_id, key, message="Thank you. Let's discuss the scope."):
    return client.post(
        f"/v1/contact/inbox/{inquiry_id}/replies",
        json={"message": message},
        headers={**OWNER, "Idempotency-Key": key},
    )


async def test_public_receipt_routes_to_trusted_inbox_and_seals_details(
    client, session_factory, contact_config
):
    calls, _ = contact_config
    receipt = submit(client)
    assert receipt.status_code == 201, receipt.text
    assert receipt.json()["status"] == "received"
    identifier = receipt.json()["reference"]
    assert identifier.startswith("inq_")
    assert len(calls) == 1
    mail = json.loads(calls[0].content)
    assert mail["to"] == ["henok@sullix.com"]
    assert mail["reply_to"] == MESSAGE["email"]
    assert MESSAGE["message"] in mail["text"]
    async with session_factory() as session:
        await app.core.tenancy.bind_tenant(session, "henok")
        row = await session.scalar(
            sa.select(models.ContactInquiry).where(models.ContactInquiry.owner_id == "henok")
        )
        assert row.id == identifier
        assert row.notification_status == "accepted"
        assert MESSAGE["email"] not in row.content_sealed
        assert MESSAGE["name"] not in row.content_sealed
        assert MESSAGE["message"] not in row.content_sealed
        assert MESSAGE["email"] not in row.payload_hash
    inbox = client.get("/v1/contact/inbox", headers=OWNER)
    assert inbox.status_code == 200
    assert inbox.headers["Cache-Control"] == "no-store"
    assert receipt.headers["Cache-Control"] == "no-store"
    assert inbox.json()["messages"][0]["message"] == MESSAGE["message"]
    assert inbox.json()["has_more"] is False


def test_public_retry_receives_original_reference_without_duplicate_email(client, contact_config):
    calls, _ = contact_config
    key = str(uuid.uuid4())
    first = submit(client, key=key)
    assert submit(client, key=key).json() == first.json()
    assert len(calls) == 1
    changed = submit(client, {**MESSAGE, "message": "A different useful project."}, key)
    assert changed.status_code == 409
    assert len(client.get("/v1/contact/inbox", headers=OWNER).json()["messages"]) == 1


@pytest.mark.parametrize(
    "change",
    [
        {"email": "invalid"},
        {"consent": False},
        {"message": "tiny"},
        {"purpose": "marketing"},
        {"owner_id": "someone_else"},
        {"recipient": "other@example.org"},
        {"name": " "},
    ],
)
def test_rejects_invalid_or_client_directed_messages(client, contact_config, change):
    assert submit(client, {**MESSAGE, **change}).status_code == 422
    assert contact_config[0] == []


def test_honeypot_does_not_store_or_send(client, contact_config):
    assert submit(client, {**MESSAGE, "website": "bot-filled"}).status_code == 201
    assert client.get("/v1/contact/inbox", headers=OWNER).json()["messages"] == []
    assert contact_config[0] == []


def test_notification_failure_preserves_received_message(client, contact_config):
    calls, outcome = contact_config
    outcome["timeout"] = True
    received = submit(client)
    assert received.status_code == 201
    row = client.get(f"/v1/contact/inbox/{received.json()['reference']}", headers=OWNER).json()
    assert row["notification_status"] == "failed"
    assert row["message"] == MESSAGE["message"]
    assert len(calls) == 1


def test_unavailable_form_fails_closed(client, monkeypatch, contact_config):
    monkeypatch.setenv("ORCHESTRATOR_CONTACT_EMAIL", "")
    app.settings.get_settings.cache_clear()
    assert client.get("/v1/contact/status").json() == {"available": False}
    assert submit(client).status_code == 503
    assert contact_config[0] == []


def test_inbox_requires_owner_role_with_scope_even_if_member_can_write(client, monkeypatch):
    monkeypatch.setenv("ORCHESTRATOR_AUTH_MODE", "jwt")
    app.settings.get_settings.cache_clear()
    assert client.get("/v1/contact/inbox").status_code == 401
    for role, scopes, expected in [
        ("member", ["member", "owner:write"], 403),
        ("owner", ["member"], 403),
        ("owner", ["owner:write"], 200),
        ("admin", ["member"], 200),
    ]:
        token = auth.mint_test_token(owner_id="member_123", role=role, scopes=scopes)
        assert (
            client.get(
                "/v1/contact/inbox", headers={"Authorization": f"Bearer {token}"}
            ).status_code
            == expected
        )


def test_local_other_tenant_cannot_open_inbox(client):
    assert client.get("/v1/contact/inbox", headers={"X-Owner-Id": "other"}).status_code == 403


def test_replies_use_visitor_recipient_and_retries_do_not_duplicate(client, contact_config):
    calls, _ = contact_config
    identifier = submit(client).json()["reference"]
    key = str(uuid.uuid4())
    first = reply(client, identifier, key)
    assert first.status_code == 200, first.text
    assert first.json()["status"] == "sent"
    assert reply(client, identifier, key).json() == first.json()
    assert len(calls) == 2
    mail = json.loads(calls[-1].content)
    assert mail["to"] == [MESSAGE["email"]]
    assert mail["reply_to"] == "henok@sullix.com"
    detail = client.get(f"/v1/contact/inbox/{identifier}", headers=OWNER).json()
    assert detail["status"] == "replied"
    assert len(detail["replies"]) == 1
    assert reply(client, identifier, key, "Changed reply text").status_code == 409


def test_unknown_delivery_can_retry_same_provider_reference(client, contact_config):
    calls, outcome = contact_config
    identifier = submit(client).json()["reference"]
    key = str(uuid.uuid4())
    outcome["timeout"] = True
    assert reply(client, identifier, key).json()["status"] == "failed"
    assert client.get(f"/v1/contact/inbox/{identifier}", headers=OWNER).json()["status"] == "new"
    outcome["timeout"] = False
    assert reply(client, identifier, key).json()["status"] == "sent"
    assert calls[-1].headers["Idempotency-Key"] == calls[-2].headers["Idempotency-Key"]


async def test_expired_retry_refuses_duplicate_risk(client, session_factory, contact_config):
    calls, outcome = contact_config
    identifier = submit(client).json()["reference"]
    key = str(uuid.uuid4())
    outcome["timeout"] = True
    assert reply(client, identifier, key).json()["status"] == "failed"
    async with session_factory() as session:
        await app.core.tenancy.bind_tenant(session, "henok")
        await session.execute(
            sa.update(models.ContactReply)
            .where(models.ContactReply.owner_id == "henok")
            .values(created_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=24))
        )
        await session.commit()
    assert reply(client, identifier, key).status_code == 409
    assert len(calls) == 2


async def test_reply_lease_prevents_overlap_and_recovers_with_original_key(
    client, session_factory, contact_config
):
    calls, outcome = contact_config
    identifier = submit(client).json()["reference"]
    key = str(uuid.uuid4())
    outcome["timeout"] = True
    assert reply(client, identifier, key).json()["status"] == "failed"
    now = datetime.datetime.now(datetime.UTC)
    async with session_factory() as session:
        await app.core.tenancy.bind_tenant(session, "henok")
        await session.execute(
            sa.update(models.ContactReply)
            .where(models.ContactReply.owner_id == "henok")
            .values(status="sending", attempt_at=now)
        )
        await session.commit()
    assert reply(client, identifier, key).status_code == 409
    assert len(calls) == 2
    async with session_factory() as session:
        await app.core.tenancy.bind_tenant(session, "henok")
        await session.execute(
            sa.update(models.ContactReply)
            .where(models.ContactReply.owner_id == "henok")
            .values(attempt_at=now - datetime.timedelta(seconds=61))
        )
        await session.commit()
    outcome["timeout"] = False
    assert reply(client, identifier, key).json()["status"] == "sent"
    assert calls[-1].headers["Idempotency-Key"] == calls[-2].headers["Idempotency-Key"]


async def test_archive_and_delete_remove_all_stored_content(client, session_factory):
    identifier = submit(client).json()["reference"]
    assert reply(client, identifier, str(uuid.uuid4())).json()["status"] == "sent"
    path = f"/v1/contact/inbox/{identifier}"
    assert (
        client.patch(path, headers=OWNER, json={"status": "archived"}).json()["status"]
        == "archived"
    )
    assert client.get("/v1/contact/inbox?status=new", headers=OWNER).json()["messages"] == []
    assert client.delete(path, headers=OWNER).status_code == 204
    assert client.get(path, headers=OWNER).status_code == 404
    async with session_factory() as session:
        await app.core.tenancy.bind_tenant(session, "henok")
        assert (
            await session.scalar(
                sa.select(sa.func.count())
                .select_from(models.ContactReply)
                .where(models.ContactReply.owner_id == "henok")
            )
            == 0
        )


def test_public_rate_limit_caps_abuse(client):
    for _ in range(5):
        assert submit(client, {**MESSAGE, "website": "bot"}).status_code == 201
    assert submit(client).status_code == 429


def test_one_visitor_exhausting_the_limit_does_not_close_contact_for_others(client):
    # Behind Cloud Run every request shares the proxy's socket address.
    abuser = {"X-Forwarded-For": "81.2.69.142"}
    for _ in range(5):
        response = client.post(
            "/v1/contact/messages",
            json={**MESSAGE, "website": "bot"},
            headers={**abuser, "Idempotency-Key": str(uuid.uuid4())},
        )
        assert response.status_code == 201
    spoofed = {"X-Forwarded-For": "81.2.69.50, 81.2.69.142"}
    blocked = client.post(
        "/v1/contact/messages",
        json=MESSAGE,
        headers={**spoofed, "Idempotency-Key": str(uuid.uuid4())},
    )
    assert blocked.status_code == 429

    visitor = client.post(
        "/v1/contact/messages",
        json=MESSAGE,
        headers={"X-Forwarded-For": "81.2.69.160", "Idempotency-Key": str(uuid.uuid4())},
    )
    assert visitor.status_code == 201
