"""Free verified admission, scoped authority, and reversible membership."""

from __future__ import annotations

import fastapi.testclient
import pytest
import sqlalchemy as sa

import app.db.models as db
import app.domains.auth.service as service
import app.settings


@pytest.fixture
def open_membership(client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch):
    settings = app.settings.get_settings()
    monkeypatch.setattr(settings, "OPEN_MEMBERSHIP_ENABLED", True)
    monkeypatch.setattr(settings, "AUTH_MODE", "jwt")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setenv("ORCHESTRATOR_ENVIRONMENT", "production")
    monkeypatch.setenv("RESEND_API_KEY", "synthetic-mail-provider-key")
    client.base_url = "https://testserver"
    codes: dict[str, str] = {}

    async def deliver(email: str, code: str, *, purpose: str = "signin") -> bool:
        codes[email] = code
        return True

    monkeypatch.setattr(service, "send_code_email", deliver)
    return codes


def register(client, codes, email="member@example.com", name="Reader"):
    requested = client.post("/v1/auth/otp/request", json={"email": email})
    assert requested.status_code == 200, requested.text
    assert "dev_code" not in requested.json() or requested.json()["dev_code"] is None
    verified = client.post(
        "/v1/auth/otp/verify", json={"email": email, "code": codes[email], "display_name": name}
    )
    assert verified.status_code == 200, verified.text
    return verified


async def test_free_registration_creates_only_a_verified_member(
    client, session_factory, open_membership
):
    email = "free@example.com"
    assert client.get("/v1/auth/membership/status").json() == {"open": True, "available": True}
    requested = client.post("/v1/auth/otp/request", json={"email": email})
    assert requested.status_code == 200
    async with session_factory() as session:
        assert await session.scalar(sa.select(sa.func.count()).select_from(db.Member)) == 0
    verified = client.post(
        "/v1/auth/otp/verify",
        json={"email": email, "code": open_membership[email], "role": "owner"},
    )
    assert verified.status_code == 200, verified.text
    assert verified.json()["user"]["role"] == "member"
    assert verified.json()["user"]["is_owner"] is False
    assert "Secure" in verified.headers["set-cookie"]
    assert "HttpOnly" in verified.headers["set-cookie"]
    async with session_factory() as session:
        assert await session.scalar(sa.select(sa.func.count()).select_from(db.Member)) == 1
        assert (
            await session.scalar(sa.select(sa.func.count()).select_from(db.ReaderSubscription)) == 0
        )
        assert await session.scalar(sa.select(sa.func.count()).select_from(db.JoinRequest)) == 0


def test_free_member_cannot_open_owner_lists_or_publishing_controls(client, open_membership):
    register(client, open_membership)
    assert client.get("/v1/auth/session").json()["user"]["role"] == "member"
    for route in ["/v1/readers", "/v1/join/requests", "/v1/auth/members", "/v1/newsletters/status"]:
        assert client.get(route).status_code == 403, route
    assert client.get("/v1/auth/membership/me").status_code == 200


def test_profile_export_excludes_credentials_and_email_indexes(client, open_membership):
    register(client, open_membership)
    response = client.get("/v1/auth/membership/me")
    assert response.headers["cache-control"] == "no-store"
    assert set(response.json()) == {"id", "display_name", "role", "status", "joined_at"}
    assert response.json()["display_name"] == "Reader"


def test_closure_ends_old_sessions_even_after_verified_rejoining(client, open_membership):
    first = register(client, open_membership)
    original_id = first.json()["user"]["id"]
    old_token = first.cookies["dot_session"]
    assert client.delete("/v1/auth/membership/me").status_code == 200
    client.cookies.clear()
    old_headers = {"Authorization": "Bearer " + old_token}
    assert client.get("/v1/auth/membership/me", headers=old_headers).status_code == 401
    second = register(client, open_membership, name="Rejoined")
    assert second.json()["user"]["id"] == original_id
    new_token = second.cookies["dot_session"]
    client.cookies.clear()
    assert client.get("/v1/auth/membership/me", headers=old_headers).status_code == 401
    assert (
        client.get(
            "/v1/auth/membership/me", headers={"Authorization": "Bearer " + new_token}
        ).status_code
        == 200
    )


async def test_open_registration_does_not_bypass_suspension(
    client, session_factory, open_membership
):
    member = register(client, open_membership).json()["user"]
    async with session_factory() as session:
        await session.execute(
            sa.update(db.Member).where(db.Member.id == member["id"]).values(status="suspended")
        )
        await session.commit()
    assert client.get("/v1/auth/session").json()["user"] is None
    client.cookies.clear()
    assert (
        client.post("/v1/auth/otp/request", json={"email": "member@example.com"}).status_code == 403
    )


def test_availability_does_not_claim_signup_when_email_delivery_is_missing(
    client, open_membership, monkeypatch
):
    monkeypatch.setenv("RESEND_API_KEY", "disabled")
    assert client.get("/v1/auth/membership/status").json() == {"open": True, "available": False}
    assert client.post("/v1/auth/otp/request", json={"email": "new@example.com"}).status_code == 503


def test_owner_account_cannot_be_closed_through_member_departure(client, open_membership):
    register(client, open_membership, email="henok@sullix.com", name="Owner")
    assert client.delete("/v1/auth/membership/me").status_code == 403
    assert client.get("/v1/auth/session").json()["user"]["role"] == "owner"
