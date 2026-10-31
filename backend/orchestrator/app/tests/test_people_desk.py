"""The owner's people desk (ADR-0056).

What these pin, in order of how much damage each would do if it regressed: an
ordinary member cannot reach any of it; suspension ends sessions already issued;
a failed invitation email leaves no working link; answering a request forgets the
address; and an invitation link can actually admit someone in production.
"""

from __future__ import annotations

import cryptography.fernet
import fastapi.testclient
import pytest
import sqlalchemy

import app.api.v1.join as join_router
import app.db.models
import app.domains.contact.service as contact_service
import app.settings

KEY = cryptography.fernet.Fernet.generate_key().decode()
OWNER = "steward@example.com"


@pytest.fixture(autouse=True)
def _environment(monkeypatch: pytest.MonkeyPatch) -> None:
    join_router._limiter._storage.reset()  # noqa: SLF001
    monkeypatch.setenv("JOIN_CONTACT_KEY", KEY)
    monkeypatch.setenv("DOT_OWNER_EMAILS", OWNER)
    monkeypatch.delenv("RESEND_API_KEY", raising=False)


def _sign_in(
    client: fastapi.testclient.TestClient,
    email: str,
    *,
    name: str | None = None,
    invite: str | None = None,
) -> tuple[str, dict[str, str]]:
    requested = client.post("/v1/auth/otp/request", json={"email": email, "invite_token": invite})
    assert requested.status_code == 200, requested.text
    verified = client.post(
        "/v1/auth/otp/verify",
        json={
            "email": email,
            "code": requested.json()["dev_code"],
            "display_name": name,
            "invite_token": invite,
        },
    )
    assert verified.status_code == 200, verified.text
    token = verified.cookies["dot_session"]
    client.cookies.clear()
    return verified.json()["user"]["id"], {"Authorization": f"Bearer {token}"}


def _use_jwt_auth(monkeypatch: pytest.MonkeyPatch) -> None:
    """Sessions rather than the local header, as production runs."""
    settings = app.settings.get_settings()
    monkeypatch.setattr(settings, "AUTH_MODE", "jwt")


def _queue_request(client: fastapi.testclient.TestClient, email: str) -> None:
    code = client.post("/v1/join/requests", json={"email": email, "reason": "To read."}).json()[
        "dev_code"
    ]
    assert (
        client.post("/v1/join/requests/verify", json={"email": email, "code": code}).status_code
        == 200
    )


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", "/v1/auth/members"),
        ("post", "/v1/auth/members/find"),
        ("patch", "/v1/auth/members/mbr_x"),
        ("post", "/v1/join/requests/join_x/invite"),
        ("delete", "/v1/join/requests/join_x"),
        ("get", "/v1/join/requests"),
        ("delete", "/v1/readers/reader_x"),
        ("get", "/v1/readers"),
    ],
)
def test_an_ordinary_member_cannot_reach_the_desk(
    client: fastapi.testclient.TestClient,
    monkeypatch: pytest.MonkeyPatch,
    method: str,
    path: str,
) -> None:
    _use_jwt_auth(monkeypatch)
    _, member = _sign_in(client, "member@example.com")
    body = (
        {"json": {"email": "a@example.com"}}
        if path.endswith("find")
        else {"json": {"status": "suspended"}}
        if method == "patch"
        else {}
    )

    assert getattr(client, method)(path, headers=member, **body).status_code == 403
    assert getattr(client, method)(path, **body).status_code == 401


def test_suspension_ends_a_live_session_and_blocks_sign_in_until_restored(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _use_jwt_auth(monkeypatch)
    _, steward = _sign_in(client, OWNER)
    member_id, member = _sign_in(client, "member@example.com")
    assert client.get("/v1/auth/circle", headers=member).status_code == 200

    response = client.patch(
        f"/v1/auth/members/{member_id}", json={"status": "suspended"}, headers=steward
    )
    assert response.json() == {"status": "suspended"}

    assert client.get("/v1/auth/circle", headers=member).status_code == 401
    assert client.get("/v1/auth/session", headers=member).json()["user"] is None
    assert client.post("/v1/auth/invites", headers=member).status_code == 401
    assert (
        client.post("/v1/auth/otp/request", json={"email": "member@example.com"}).status_code == 403
    )
    # Public reading stays open: the session is ignored, not punished.
    assert client.get("/v1/readers/status", headers=member).status_code == 200

    client.patch(f"/v1/auth/members/{member_id}", json={"status": "active"}, headers=steward)
    assert client.get("/v1/auth/circle", headers=member).status_code == 200


def test_the_owner_cannot_be_suspended(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _use_jwt_auth(monkeypatch)
    owner_id, steward = _sign_in(client, OWNER)

    response = client.patch(
        f"/v1/auth/members/{owner_id}", json={"status": "suspended"}, headers=steward
    )

    assert response.status_code == 409


def test_members_are_listed_without_addresses_or_sign_in_times(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _use_jwt_auth(monkeypatch)
    _, steward = _sign_in(client, OWNER, name="Steward")
    token = client.post("/v1/auth/invites", headers=steward).json()["token"]
    _sign_in(client, "invited@example.com", name="Invited", invite=token)

    response = client.get("/v1/auth/members", headers=steward)

    assert "invited@example.com" not in response.text
    assert "signed_in" not in response.text
    invited = next(m for m in response.json()["members"] if m["display_name"] == "Invited")
    assert invited["invited_by"] == "Steward"


def test_a_member_is_found_only_by_an_address_already_known(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _use_jwt_auth(monkeypatch)
    _, steward = _sign_in(client, OWNER)
    member_id, _ = _sign_in(client, "member@example.com")

    found = client.post(
        "/v1/auth/members/find", json={"email": "Member@Example.com"}, headers=steward
    )
    missing = client.post(
        "/v1/auth/members/find", json={"email": "nobody@example.com"}, headers=steward
    )

    assert [m["id"] for m in found.json()["members"]] == [member_id]
    assert missing.json()["members"] == []


def test_invitations_list_their_status_and_only_the_issuer_can_revoke(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _use_jwt_auth(monkeypatch)
    _, steward = _sign_in(client, OWNER)
    _, member = _sign_in(client, "member@example.com")
    issued = client.post("/v1/auth/invites", headers=steward).json()

    assert client.delete(f"/v1/auth/invites/{issued['id']}", headers=member).status_code == 404
    listed = client.get("/v1/auth/invites", headers=steward).json()["invites"]
    assert [(i["id"], i["status"]) for i in listed] == [(issued["id"], "open")]
    assert "token" not in listed[0]

    assert client.delete(f"/v1/auth/invites/{issued['id']}", headers=steward).status_code == 204
    assert client.get("/v1/auth/invites", headers=steward).json()["invites"][0]["status"] == (
        "revoked"
    )
    assert client.get("/v1/auth/invites/check", params={"token": issued["token"]}).json() == {
        "valid": False,
        "invited_by": None,
        "expires_at": None,
    }


def test_an_invitation_admits_someone_in_production_and_nothing_else_does(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _use_jwt_auth(monkeypatch)
    _, steward = _sign_in(client, OWNER)
    token = client.post("/v1/auth/invites", headers=steward).json()["token"]
    monkeypatch.setenv("ORCHESTRATOR_ENVIRONMENT", "production")

    # Who is refused is under test here, not the mail provider.
    async def send_code_email(*_args, **_kwargs) -> bool:
        return True

    monkeypatch.setattr("app.domains.auth.service.email_delivery_available", lambda: True)
    monkeypatch.setattr("app.domains.auth.service.send_code_email", send_code_email)

    stranger = client.post("/v1/auth/otp/request", json={"email": "stranger@example.com"})
    invited = client.post(
        "/v1/auth/otp/request", json={"email": "invited@example.com", "invite_token": token}
    )

    assert stranger.status_code == 403
    assert invited.status_code == 200


async def test_inviting_a_requester_emails_a_link_and_forgets_the_address(
    client: fastapi.testclient.TestClient,
    monkeypatch: pytest.MonkeyPatch,
    session_factory,
) -> None:
    _use_jwt_auth(monkeypatch)
    _, steward = _sign_in(client, OWNER)
    _queue_request(client, "reader@example.com")
    request_id = client.get("/v1/join/requests", headers=steward).json()["requests"][0]["id"]
    sent: dict = {}

    async def deliver(**kwargs) -> str:
        sent.update(kwargs)
        return "resend_id"

    monkeypatch.setattr(contact_service, "mail_available", lambda: True)
    monkeypatch.setattr(contact_service, "deliver", deliver)

    response = client.post(f"/v1/join/requests/{request_id}/invite", headers=steward)

    assert response.status_code == 200
    assert response.json()["dev_link"] is None
    assert sent["to"] == "reader@example.com"
    token = sent["text"].split("/invite#")[1].split()[0]
    assert client.get("/v1/auth/invites/check", params={"token": token}).json()["valid"] is True
    async with session_factory() as session:
        rows = await session.scalars(sqlalchemy.select(app.db.models.JoinRequest))
        assert rows.all() == []


def test_a_failed_invitation_email_keeps_the_request_and_leaves_no_open_link(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _use_jwt_auth(monkeypatch)
    _, steward = _sign_in(client, OWNER)
    _queue_request(client, "reader@example.com")
    request_id = client.get("/v1/join/requests", headers=steward).json()["requests"][0]["id"]

    async def deliver(**_kwargs) -> None:
        return None

    monkeypatch.setattr(contact_service, "mail_available", lambda: True)
    monkeypatch.setattr(contact_service, "deliver", deliver)

    response = client.post(f"/v1/join/requests/{request_id}/invite", headers=steward)

    assert response.status_code == 502
    assert len(client.get("/v1/join/requests", headers=steward).json()["requests"]) == 1
    invites = client.get("/v1/auth/invites", headers=steward).json()["invites"]
    assert [i["status"] for i in invites] == ["revoked"]


def test_declining_removes_the_request_without_sending_anything(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _use_jwt_auth(monkeypatch)
    _, steward = _sign_in(client, OWNER)
    _queue_request(client, "reader@example.com")
    request_id = client.get("/v1/join/requests", headers=steward).json()["requests"][0]["id"]

    async def deliver(**_kwargs) -> str:
        raise AssertionError("Declining must not send email.")

    monkeypatch.setattr(contact_service, "deliver", deliver)

    assert client.delete(f"/v1/join/requests/{request_id}", headers=steward).status_code == 204
    assert client.get("/v1/join/requests", headers=steward).json()["requests"] == []
    assert client.delete(f"/v1/join/requests/{request_id}", headers=steward).status_code == 404


def test_removing_a_reader_takes_them_off_the_list(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _use_jwt_auth(monkeypatch)
    _, steward = _sign_in(client, OWNER)
    code = client.post("/v1/readers/subscribe", json={"email": "reader@example.com"}).json()[
        "dev_code"
    ]
    client.post("/v1/readers/confirm", json={"email": "reader@example.com", "code": code})
    reader_id = client.get("/v1/readers", headers=steward).json()["readers"][0]["id"]

    assert client.delete(f"/v1/readers/{reader_id}", headers=steward).status_code == 204
    assert client.get("/v1/readers", headers=steward).json()["readers"] == []
    assert client.delete("/v1/readers/reader_missing", headers=steward).status_code == 404
