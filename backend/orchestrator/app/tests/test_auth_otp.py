"""Tests for the OTP auth domain: request, verify, session, logout, invite."""

from __future__ import annotations

import fastapi.testclient
import pytest

# Uses the shared `client` fixture from conftest.py (in-memory SQLite + session override).
# No email provider in tests — dev_code is returned instead of sending email.


# ── /v1/auth/otp/request ─────────────────────────────────────────────────────


def test_request_otp_invalid_email(client: fastapi.testclient.TestClient) -> None:
    r = client.post("/v1/auth/otp/request", json={"email": "not-an-email"})
    assert r.status_code == 422


def test_request_otp_returns_dev_code(client: fastapi.testclient.TestClient) -> None:
    r = client.post("/v1/auth/otp/request", json={"email": "test@example.com"})
    assert r.status_code == 200
    body = r.json()
    assert body["expires_in"] == 600
    assert "dev_code" in body
    assert len(body["dev_code"]) == 6
    assert body["dev_code"].isdigit()


def test_request_otp_cooldown(client: fastapi.testclient.TestClient) -> None:
    client.post("/v1/auth/otp/request", json={"email": "cool@example.com"})
    r = client.post("/v1/auth/otp/request", json={"email": "cool@example.com"})
    assert r.status_code == 429


# ── /v1/auth/otp/verify ──────────────────────────────────────────────────────


def test_verify_wrong_code(client: fastapi.testclient.TestClient) -> None:
    client.post("/v1/auth/otp/request", json={"email": "v@example.com"})
    r = client.post("/v1/auth/otp/verify", json={"email": "v@example.com", "code": "000000"})
    assert r.status_code == 400
    assert "Incorrect" in r.json()["detail"]


def test_verify_correct_code_sets_cookie(client: fastapi.testclient.TestClient) -> None:
    req = client.post("/v1/auth/otp/request", json={"email": "ok@example.com"})
    code = req.json()["dev_code"]
    r = client.post("/v1/auth/otp/verify", json={"email": "ok@example.com", "code": code})
    assert r.status_code == 200
    assert "dot_session" in r.cookies
    body = r.json()
    assert body["user"]["role"] in ("member", "owner")


def test_verify_expired_code_rejected(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    import app.domains.auth.service as svc

    # Force expiry to the past so the code is immediately stale.
    original: int = svc._CODE_TTL_SECONDS
    monkeypatch.setattr(svc, "_CODE_TTL_SECONDS", -1)
    client.post("/v1/auth/otp/request", json={"email": "exp@example.com"})
    monkeypatch.setattr(svc, "_CODE_TTL_SECONDS", original)

    r = client.post("/v1/auth/otp/verify", json={"email": "exp@example.com", "code": "123456"})
    assert r.status_code == 400
    assert "expired" in r.json()["detail"].lower()


def test_verify_code_single_use(client: fastapi.testclient.TestClient) -> None:
    req = client.post("/v1/auth/otp/request", json={"email": "singleuse@example.com"})
    assert "dev_code" in req.json(), req.json()
    code = req.json()["dev_code"]
    client.post("/v1/auth/otp/verify", json={"email": "singleuse@example.com", "code": code})
    r = client.post("/v1/auth/otp/verify", json={"email": "singleuse@example.com", "code": code})
    assert r.status_code == 400


# ── /v1/auth/session ─────────────────────────────────────────────────────────


def test_session_no_cookie_returns_null_user(client: fastapi.testclient.TestClient) -> None:
    r = client.get("/v1/auth/session")
    assert r.status_code == 200
    assert r.json()["user"] is None


# ── /v1/auth/logout ──────────────────────────────────────────────────────────


def test_logout_clears_cookie(client: fastapi.testclient.TestClient) -> None:
    req = client.post("/v1/auth/otp/request", json={"email": "logout@example.com"})
    assert "dev_code" in req.json(), req.json()
    code = req.json()["dev_code"]
    client.post("/v1/auth/otp/verify", json={"email": "logout@example.com", "code": code})
    r = client.post("/v1/auth/logout")
    assert r.status_code == 200
    assert client.cookies.get("dot_session", "") == ""


# ── Session-only clients ─────────────────────────────────────────────────────


def _sign_in(client: fastapi.testclient.TestClient, email: str) -> None:
    code = client.post("/v1/auth/otp/request", json={"email": email}).json()["dev_code"]
    verified = client.post("/v1/auth/otp/verify", json={"email": email, "code": code})
    assert verified.status_code == 200


def test_a_session_alone_authenticates_a_write(client: fastapi.testclient.TestClient) -> None:
    """Production identifies by cookie only; that path must work here too."""

    _sign_in(client, "session-only@example.com")

    response = client.put(
        "/v1/graph/profile",
        json={"graph": {"id": "self", "label": "Session Only", "kind": "self"}},
    )
    assert response.status_code == 200


def test_the_session_cookie_is_locked_down_but_usable_over_local_http(
    client: fastapi.testclient.TestClient,
) -> None:
    """A Secure cookie is never returned over plain HTTP, so dev could not hold a session."""

    code = client.post("/v1/auth/otp/request", json={"email": "flags@example.com"}).json()[
        "dev_code"
    ]
    response = client.post("/v1/auth/otp/verify", json={"email": "flags@example.com", "code": code})

    cookie: str = response.headers["set-cookie"]
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie
    assert "Secure" not in cookie


def test_the_session_cookie_is_secure_in_production(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    import app.api.v1.auth as auth_api

    monkeypatch.setattr(auth_api, "_cookie_secure", lambda: True)

    code = client.post("/v1/auth/otp/request", json={"email": "prod@example.com"}).json()[
        "dev_code"
    ]
    response = client.post("/v1/auth/otp/verify", json={"email": "prod@example.com", "code": code})

    assert "Secure" in response.headers["set-cookie"]


def test_without_a_session_or_owner_header_a_write_is_rejected(
    client: fastapi.testclient.TestClient,
) -> None:
    response = client.put(
        "/v1/graph/profile",
        json={"graph": {"id": "self", "label": "Anonymous", "kind": "self"}},
    )
    assert response.status_code == 401
