"""The reader list — the open door (ADR-0025).

What these pin, in order of how much damage each would do if it regressed: the
list refuses to hold an address it cannot seal; a reader code cannot be redeemed
for a session or for admission to the circle; an unconfirmed address is never on
the list; leaving works and cannot be used to test who is on it; and the list is
never public.
"""

from __future__ import annotations

import asyncio

import cryptography.fernet
import fastapi.testclient
import pytest
import sqlalchemy

import app.api.v1.readers as readers_router
import app.core.contact
import app.db.models

KEY = cryptography.fernet.Fernet.generate_key().decode()


@pytest.fixture(autouse=True)
def _reset_readers_limiter() -> None:
    readers_router._limiter._storage.reset()  # noqa: SLF001


@pytest.fixture()
def sealed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JOIN_CONTACT_KEY", KEY)
    monkeypatch.delenv("RESEND_API_KEY", raising=False)


def _subscribe(client: fastapi.testclient.TestClient, email: str, source: str = "book") -> dict:
    response = client.post("/v1/readers/subscribe", json={"email": email, "source": source})
    assert response.status_code == 202, response.text
    return response.json()


def _confirm(client: fastapi.testclient.TestClient, email: str, code: str) -> dict:
    response = client.post("/v1/readers/confirm", json={"email": email, "code": code})
    assert response.status_code == 200, response.text
    return response.json()


def _rows(session_factory) -> list[app.db.models.ReaderSubscription]:
    async def read() -> list[app.db.models.ReaderSubscription]:
        async with session_factory() as session:
            return list(
                (await session.scalars(sqlalchemy.select(app.db.models.ReaderSubscription))).all()
            )

    return asyncio.get_event_loop().run_until_complete(read())


def test_refuses_subscriptions_when_no_sealing_key_is_configured(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("JOIN_CONTACT_KEY", raising=False)

    assert client.get("/v1/readers/status").json() == {"available": False}

    response = client.post("/v1/readers/subscribe", json={"email": "reader@example.com"})

    # Fail closed: an address with nowhere safe to go must be declined, not kept.
    assert response.status_code == 503


def test_production_refuses_subscriptions_without_email_delivery(
    client: fastapi.testclient.TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("JOIN_CONTACT_KEY", KEY)
    monkeypatch.setenv("ORCHESTRATOR_ENVIRONMENT", "production")
    monkeypatch.setenv("RESEND_API_KEY", "disabled")

    assert client.get("/v1/readers/status").json() == {"available": False}

    response = client.post("/v1/readers/subscribe", json={"email": "reader@example.com"})

    assert response.status_code == 503


def test_confirms_an_address_and_returns_a_way_out(
    client: fastapi.testclient.TestClient, sealed: None
) -> None:
    accepted = _subscribe(client, "reader@example.com")
    assert accepted["status"] == "awaiting_confirmation"

    confirmed = _confirm(client, "reader@example.com", accepted["dev_code"])

    assert confirmed["status"] == "subscribed"
    # A reader learns how to leave at the moment they join, not at the first
    # mailing (ADR-0025).
    assert len(confirmed["unsubscribe_token"]) >= 32


def test_an_unconfirmed_address_is_never_on_the_list(
    client: fastapi.testclient.TestClient, sealed: None, session_factory
) -> None:
    _subscribe(client, "reader@example.com")

    async def read() -> list[dict]:
        import app.domains.readers.service as readers_service

        async with session_factory() as session:
            return await readers_service.list_readers(session)

    # The row exists, but double opt-in means it is not a subscriber yet and
    # must never be sent to.
    assert len(_rows(session_factory)) == 1
    assert asyncio.get_event_loop().run_until_complete(read()) == []


def test_a_reader_code_cannot_be_redeemed_for_a_session(
    client: fastapi.testclient.TestClient, sealed: None
) -> None:
    accepted = _subscribe(client, "reader@example.com")

    stolen = client.post(
        "/v1/auth/otp/verify",
        json={"email": "reader@example.com", "code": accepted["dev_code"]},
    )

    # Sign-in, join and the reader list share the OTP table. Confirming a
    # mailing list must never be the same act as opening a session.
    assert stolen.status_code >= 400


def test_a_reader_code_cannot_verify_a_request_to_join(
    client: fastapi.testclient.TestClient, sealed: None
) -> None:
    accepted = _subscribe(client, "reader@example.com")

    crossed = client.post(
        "/v1/join/requests/verify",
        json={"email": "reader@example.com", "code": accepted["dev_code"]},
    )

    # Reading is not belonging (ADR-0025). Subscribing must not become a route
    # into the invite-only circle.
    assert crossed.status_code >= 400


def test_a_wrong_code_does_not_confirm(client: fastapi.testclient.TestClient, sealed: None) -> None:
    _subscribe(client, "reader@example.com")

    response = client.post(
        "/v1/readers/confirm",
        json={"email": "reader@example.com", "code": "000000"},
    )

    assert response.status_code == 400


def test_says_nothing_about_how_many_others_subscribed(
    client: fastapi.testclient.TestClient, sealed: None
) -> None:
    body = _subscribe(client, "reader@example.com")

    # ADR-0004 L5 bans public counters, and a list size in the response is one
    # wearing a friendlier name.
    for banned in ("count", "total", "subscribers", "position", "rank", "number"):
        assert banned not in body


def test_leaving_takes_the_reader_off_the_list(
    client: fastapi.testclient.TestClient, sealed: None, session_factory
) -> None:
    accepted = _subscribe(client, "reader@example.com")
    confirmed = _confirm(client, "reader@example.com", accepted["dev_code"])

    response = client.post(
        "/v1/readers/unsubscribe", json={"token": confirmed["unsubscribe_token"]}
    )
    assert response.status_code == 200

    async def read() -> list[dict]:
        import app.domains.readers.service as readers_service

        async with session_factory() as session:
            return await readers_service.list_readers(session)

    assert asyncio.get_event_loop().run_until_complete(read()) == []


def test_an_unknown_token_is_answered_exactly_like_a_real_one(
    client: fastapi.testclient.TestClient, sealed: None
) -> None:
    accepted = _subscribe(client, "reader@example.com")
    confirmed = _confirm(client, "reader@example.com", accepted["dev_code"])

    real = client.post("/v1/readers/unsubscribe", json={"token": confirmed["unsubscribe_token"]})
    bogus = client.post("/v1/readers/unsubscribe", json={"token": "f" * 64})

    # Otherwise the endpoint is an oracle for whether an address is on the list.
    assert real.status_code == bogus.status_code == 200
    assert real.json() == bogus.json()


def test_a_reader_who_left_can_come_back(
    client: fastapi.testclient.TestClient,
    sealed: None,
    session_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.domains.readers.service as readers_service

    monkeypatch.setattr(readers_service, "_RESEND_COOLDOWN_SECONDS", 0)

    first = _subscribe(client, "reader@example.com")
    confirmed = _confirm(client, "reader@example.com", first["dev_code"])
    client.post("/v1/readers/unsubscribe", json={"token": confirmed["unsubscribe_token"]})

    second = _subscribe(client, "reader@example.com")
    _confirm(client, "reader@example.com", second["dev_code"])

    async def read() -> list[dict]:
        async with session_factory() as session:
            return await readers_service.list_readers(session)

    # Leaving once must not be a permanent bar the reader imposed on themselves.
    assert len(asyncio.get_event_loop().run_until_complete(read())) == 1


def test_subscribing_twice_does_not_inflate_the_list(
    client: fastapi.testclient.TestClient,
    sealed: None,
    session_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.domains.readers.service as readers_service

    monkeypatch.setattr(readers_service, "_RESEND_COOLDOWN_SECONDS", 0)

    _subscribe(client, "reader@example.com")
    _subscribe(client, "reader@example.com")

    assert len(_rows(session_factory)) == 1


def test_a_resend_is_refused_while_a_code_is_still_fresh(
    client: fastapi.testclient.TestClient, sealed: None
) -> None:
    _subscribe(client, "reader@example.com")

    again = client.post("/v1/readers/subscribe", json={"email": "reader@example.com"})

    assert again.status_code == 429


def test_the_stored_row_does_not_carry_a_readable_address(
    client: fastapi.testclient.TestClient, sealed: None, session_factory
) -> None:
    _subscribe(client, "reader@example.com")

    row = _rows(session_factory)[0]

    # A database dump on its own must not yield a mailing list.
    assert "reader@example.com" not in row.email_sealed
    assert app.core.contact.open_sealed(row.email_sealed) == "reader@example.com"


def test_the_list_is_never_public(client: fastapi.testclient.TestClient, sealed: None) -> None:
    response = client.get("/v1/readers")

    # Unsealing addresses is the most sensitive read in the service.
    assert response.status_code >= 400
