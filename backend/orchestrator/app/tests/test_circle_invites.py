"""Invite check/accept and circle reads, ported off the Flask prototype."""

from __future__ import annotations

import fastapi.testclient
import pytest

import app.api.v1.auth as auth_router


def _sign_in(client: fastapi.testclient.TestClient, email: str, name: str) -> str:
    requested = client.post("/v1/auth/otp/request", json={"email": email})
    assert requested.status_code == 200
    code = requested.json()["dev_code"]
    assert code, "dev code is required for the test path"
    verified = client.post(
        "/v1/auth/otp/verify", json={"email": email, "code": code, "display_name": name}
    )
    assert verified.status_code == 200
    return verified.json()["user"]["id"]


@pytest.fixture(autouse=True)
def _reset_limits() -> None:
    auth_router._limiter._storage.reset()  # noqa: SLF001


def test_check_reports_an_unknown_token_as_invalid(
    client: fastapi.testclient.TestClient,
) -> None:
    response = client.get("/v1/auth/invites/check", params={"token": "x" * 32})
    assert response.status_code == 200
    assert response.json() == {"valid": False, "invited_by": None, "expires_at": None}


def test_check_never_reveals_the_recipient(client: fastapi.testclient.TestClient) -> None:
    owner_id: str = _sign_in(client, "owner@example.com", "Owner")
    token = client.post("/v1/auth/invites", headers={"X-Owner-Id": owner_id}).json()["token"]

    body = client.get("/v1/auth/invites/check", params={"token": token}).json()
    assert body["valid"] is True
    assert body["expires_at"]
    assert "email" not in body


def test_accept_requires_a_signed_in_member(client: fastapi.testclient.TestClient) -> None:
    response = client.post("/v1/auth/invites/accept", json={"token": "y" * 32})
    assert response.status_code == 401


def test_accepting_an_unknown_token_is_a_404(client: fastapi.testclient.TestClient) -> None:
    response = client.post(
        "/v1/auth/invites/accept",
        json={"token": "z" * 32},
        headers={"X-Owner-Id": "member_ghost"},
    )
    assert response.status_code == 404


def test_a_token_can_only_be_accepted_once(client: fastapi.testclient.TestClient) -> None:
    owner_id: str = _sign_in(client, "owner2@example.com", "Owner")
    token = client.post("/v1/auth/invites", headers={"X-Owner-Id": owner_id}).json()["token"]

    first = client.post(
        "/v1/auth/invites/accept", json={"token": token}, headers={"X-Owner-Id": "member_one"}
    )
    assert first.status_code == 200

    second = client.post(
        "/v1/auth/invites/accept", json={"token": token}, headers={"X-Owner-Id": "member_two"}
    )
    assert second.status_code == 404
    assert client.get("/v1/auth/invites/check", params={"token": token}).json()["valid"] is False


def test_circle_lists_only_the_callers_own_members(
    client: fastapi.testclient.TestClient,
) -> None:
    owner_id: str = _sign_in(client, "owner3@example.com", "Owner")
    joiner_id: str = _sign_in(client, "joiner@example.com", "Joiner")
    token = client.post("/v1/auth/invites", headers={"X-Owner-Id": owner_id}).json()["token"]
    client.post("/v1/auth/invites/accept", json={"token": token}, headers={"X-Owner-Id": joiner_id})

    mine = client.get("/v1/auth/circle", headers={"X-Owner-Id": owner_id}).json()
    assert mine["count"] == 1
    assert mine["members"][0]["display_name"] == "Joiner"
    assert mine["members"][0]["joined_at"]

    theirs = client.get("/v1/auth/circle", headers={"X-Owner-Id": joiner_id}).json()
    assert theirs == {"owner_id": joiner_id, "count": 0, "members": []}


def test_circle_is_not_public(client: fastapi.testclient.TestClient) -> None:
    assert client.get("/v1/auth/circle").status_code == 401
