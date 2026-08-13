"""The request-to-join queue.

What these pin, in order of how much damage each would do if it regressed:
the queue refuses to hold an address it cannot seal; a join code cannot be
redeemed for a session; the stored address is not readable from the row; and the
queue is never public.
"""

from __future__ import annotations

import cryptography.fernet
import fastapi.testclient
import pytest
import sqlalchemy

import app.api.v1.join as join_router
import app.core.contact
import app.db.models

KEY = cryptography.fernet.Fernet.generate_key().decode()


@pytest.fixture(autouse=True)
def _reset_join_limiter() -> None:
    join_router._limiter._storage.reset()  # noqa: SLF001


@pytest.fixture()
def sealed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JOIN_CONTACT_KEY", KEY)
    monkeypatch.delenv("RESEND_API_KEY", raising=False)


def _request(client: fastapi.testclient.TestClient, email: str, reason: str | None = None) -> dict:
    response = client.post("/v1/join/requests", json={"email": email, "reason": reason})
    assert response.status_code == 202, response.text
    return response.json()


def test_refuses_requests_when_no_sealing_key_is_configured(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("JOIN_CONTACT_KEY", raising=False)

    assert client.get("/v1/join/status").json() == {"available": False}

    response = client.post("/v1/join/requests", json={"email": "reader@example.com"})

    # Fail closed: an address with nowhere safe to go must be declined, not kept.
    assert response.status_code == 503


def test_production_refuses_requests_without_email_delivery(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("JOIN_CONTACT_KEY", KEY)
    monkeypatch.setenv("ORCHESTRATOR_ENVIRONMENT", "production")
    monkeypatch.setenv("RESEND_API_KEY", "disabled")

    assert client.get("/v1/join/status").json() == {"available": False}

    response = client.post("/v1/join/requests", json={"email": "reader@example.com"})

    assert response.status_code == 503


def test_verifies_an_address_and_records_the_request(
    client: fastapi.testclient.TestClient, sealed: None
) -> None:
    accepted = _request(client, "reader@example.com", "I disagree with chapter four.")
    assert accepted["status"] == "awaiting_verification"

    verify = client.post(
        "/v1/join/requests/verify",
        json={"email": "reader@example.com", "code": accepted["dev_code"]},
    )

    assert verify.status_code == 200
    assert verify.json()["status"] == "verified"


def test_says_nothing_about_queue_position_or_size(
    client: fastapi.testclient.TestClient, sealed: None
) -> None:
    body = _request(client, "reader@example.com")

    # ADR-0004 bans manufactured scarcity, and a position is the cheapest form
    # of it. Nothing in the accepted response may hint at rank or volume.
    for banned in ("position", "queue", "ahead", "total", "count", "rank"):
        assert banned not in body


def test_a_join_code_cannot_be_redeemed_for_a_session(
    client: fastapi.testclient.TestClient, sealed: None
) -> None:
    accepted = _request(client, "reader@example.com")

    stolen = client.post(
        "/v1/auth/otp/verify",
        json={"email": "reader@example.com", "code": accepted["dev_code"]},
    )

    # Both flows share the OTP table. Proving an address for the queue must
    # never be the same act as opening a session.
    assert stolen.status_code >= 400


def test_a_wrong_code_does_not_verify(client: fastapi.testclient.TestClient, sealed: None) -> None:
    _request(client, "reader@example.com")

    response = client.post(
        "/v1/join/requests/verify",
        json={"email": "reader@example.com", "code": "000000"},
    )

    assert response.status_code == 400


def test_asking_twice_refreshes_one_row_rather_than_inflating_the_queue(
    client: fastapi.testclient.TestClient,
    sealed: None,
    session_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import asyncio

    import app.domains.join.service as join_service

    # The resend cooldown is a separate protection with its own test; standing
    # it down here is what lets this one reach the dedupe it is about.
    monkeypatch.setattr(join_service, "_RESEND_COOLDOWN_SECONDS", 0)

    _request(client, "reader@example.com", "first reason")
    _request(client, "reader@example.com", "second reason")

    async def read() -> tuple[int, str | None]:
        async with session_factory() as session:
            rows = (await session.scalars(sqlalchemy.select(app.db.models.JoinRequest))).all()
            return len(rows), rows[0].reason if rows else None

    total, reason = asyncio.get_event_loop().run_until_complete(read())

    assert total == 1
    assert reason == "second reason"


def test_a_resend_is_refused_while_a_code_is_still_fresh(
    client: fastapi.testclient.TestClient, sealed: None
) -> None:
    _request(client, "reader@example.com")

    again = client.post("/v1/join/requests", json={"email": "reader@example.com"})

    assert again.status_code == 429


def test_the_stored_row_does_not_carry_a_readable_address(
    client: fastapi.testclient.TestClient, sealed: None, session_factory
) -> None:
    import asyncio

    _request(client, "reader@example.com")

    async def row() -> app.db.models.JoinRequest:
        async with session_factory() as session:
            return (await session.scalars(sqlalchemy.select(app.db.models.JoinRequest))).all()[0]

    stored = asyncio.get_event_loop().run_until_complete(row())

    # A database dump on its own must not hand over the address (ADR-0007).
    assert "reader@example.com" not in stored.email_sealed
    assert "reader@example.com" not in stored.email_hash
    # ...and the blind index still resolves it for lookup.
    assert stored.email_hash == app.core.contact.blind_index("reader@example.com")
    # ...while the running service, holding the key, can answer them.
    assert app.core.contact.open_sealed(stored.email_sealed) == "reader@example.com"


def test_the_queue_is_never_public(client: fastapi.testclient.TestClient, sealed: None) -> None:
    accepted = _request(client, "reader@example.com")
    client.post(
        "/v1/join/requests/verify",
        json={"email": "reader@example.com", "code": accepted["dev_code"]},
    )

    response = client.get("/v1/join/requests")

    # Who asked to join is exactly the public list this platform refuses to keep.
    assert response.status_code in (401, 403)
