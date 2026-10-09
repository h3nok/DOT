from __future__ import annotations

import datetime
import json
import urllib.parse

import cryptography.fernet
import httpx
import pytest
import sqlalchemy as sa

import app.core.tenancy
import app.domains.academy.bootstrap
import app.domains.distribution.models as models
import app.domains.distribution.service as service
import app.settings

HEADERS = {"X-Owner-Id": "author", "X-Actor-Id": "author"}
OTHER = {"X-Owner-Id": "other", "X-Actor-Id": "other"}
APPROVAL = {"approved": True}


@pytest.fixture
def linkedin(monkeypatch):
    key = cryptography.fernet.Fernet.generate_key().decode()
    for name, value in {
        "LINKEDIN_CLIENT_ID": "test-client",
        "LINKEDIN_CLIENT_SECRET": "test-secret",
        "LINKEDIN_REDIRECT_URI": "https://api.example.org/v1/distribution/linkedin/callback",
        "PUBLISHING_TOKEN_KEY": key,
        "FRONTEND_URL": "https://dotheory.org",
    }.items():
        monkeypatch.setenv("ORCHESTRATOR_" + name, value)
    app.settings.get_settings.cache_clear()
    requests = []
    outcome = {"status": 201, "timeout": False}
    original_client = httpx.AsyncClient

    def respond(request):
        requests.append(request)
        if request.url.path.endswith("accessToken"):
            return httpx.Response(200, json={"access_token": "private-token", "expires_in": 3600})
        if request.url.path.endswith("userinfo"):
            return httpx.Response(200, json={"sub": "member-42", "name": "Test author"})
        if outcome["timeout"]:
            raise httpx.ReadTimeout("Unknown provider outcome", request=request)
        return httpx.Response(outcome["status"], headers={"X-RestLi-Id": "urn:li:share:123"})

    monkeypatch.setattr(
        service.httpx,
        "AsyncClient",
        lambda **kwargs: original_client(transport=httpx.MockTransport(respond), **kwargs),
    )
    return requests, outcome, key


def connect(client, headers=HEADERS):
    response = client.post("/v1/distribution/linkedin/authorize", headers=headers, json=APPROVAL)
    assert response.status_code == 200, response.text
    state = urllib.parse.parse_qs(
        urllib.parse.urlsplit(response.json()["authorization_url"]).query
    )["state"][0]
    callback = client.get(
        "/v1/distribution/linkedin/callback",
        headers=headers,
        params={"state": state, "code": "one-time-code"},
        follow_redirects=False,
    )
    assert callback.status_code == 303
    assert callback.headers["location"].endswith("connected=linkedin")
    return state


async def release(client, session_factory):
    async with session_factory() as session:
        space = await app.domains.academy.bootstrap.provision_space(
            session,
            slug="dot-academy",
            title="Test Academy",
            description=None,
            custodian_owner_id="custodian",
            steward_member_id="author",
            programs=[],
        )
    work = client.post(
        f"/v1/academy/spaces/{space.id}/works",
        headers=HEADERS,
        json={"kind": "essay", "canonical_slug": "test-writing"},
    ).json()["id"]
    revision = client.post(
        f"/v1/academy/works/{work}/revisions",
        headers=HEADERS,
        json={
            "title": "Released title",
            "summary": "Released summary",
            "body_markdown": "Released body",
        },
    ).json()["id"]
    assert (
        client.post(
            f"/v1/academy/revisions/{revision}/claims",
            headers=HEADERS,
            json={
                "canonical_key": "test",
                "statement": "Test claim",
                "epistemic_level": "Hypothesis",
                "origin": "author_originated",
            },
        ).status_code
        == 201
    )
    response = client.post(
        f"/v1/academy/works/{work}/releases",
        headers=HEADERS,
        json={"revision_id": revision, "visibility": "public"},
    )
    assert response.status_code == 201, response.text
    return work, response.json()["id"]


async def test_connection_is_private_encrypted_single_use_and_removable(
    client, session_factory, linkedin
):
    state = connect(client)
    status = client.get("/v1/distribution/linkedin", headers=HEADERS)
    assert status.headers["Cache-Control"] == "no-store"
    assert status.json()["connected"] is True
    assert "private-token" not in status.text
    assert client.get("/v1/distribution/linkedin", headers=OTHER).json()["connected"] is False
    assert client.post("/v1/distribution/linkedin/authorize", headers=HEADERS).status_code == 422
    async with session_factory() as session:
        await app.core.tenancy.bind_tenant(session, "author")
        row = (
            await session.execute(
                sa.select(models.PublishingConnection).where(
                    models.PublishingConnection.owner_id == "author"
                )
            )
        ).scalar_one()
        assert "private-token" not in row.token_sealed
        assert (
            cryptography.fernet.Fernet(linkedin[2].encode()).decrypt(row.token_sealed.encode())
            == b"private-token"
        )
    for headers in (OTHER, HEADERS):
        replay = client.get(
            "/v1/distribution/linkedin/callback",
            headers=headers,
            params={"state": state, "code": "replay"},
            follow_redirects=False,
        )
        assert replay.headers["location"].endswith("connected=failed")
    assert len(linkedin[0]) == 2
    assert client.delete("/v1/distribution/linkedin", headers=OTHER).status_code == 204
    assert client.get("/v1/distribution/linkedin", headers=HEADERS).json()["connected"] is True
    assert client.delete("/v1/distribution/linkedin", headers=HEADERS).status_code == 204
    assert client.get("/v1/distribution/linkedin", headers=HEADERS).json()["connected"] is False


async def test_sharing_uses_released_text_is_idempotent_and_requires_publisher(
    client, session_factory, linkedin
):
    connect(client)
    work, release_id = await release(client, session_factory)
    # Editing the private draft never changes the external payload.
    client.post(
        f"/v1/academy/works/{work}/revisions",
        headers=HEADERS,
        json={"title": "Private changed title", "body_markdown": "Private changed body"},
    )
    route = f"/v1/distribution/works/{work}/releases/1/linkedin"
    assert client.post(route, headers=OTHER, json=APPROVAL).status_code in (403, 404)
    assert client.post(route, headers=HEADERS, json={"approved": False}).status_code == 422
    for _ in range(2):
        response = client.post(route, headers=HEADERS, json=APPROVAL)
        assert response.status_code == 200, response.text
        assert response.json()["status"] == "published"
    posts = [r for r in linkedin[0] if r.url.path.endswith("ugcPosts")]
    assert len(posts) == 1
    payload = json.loads(posts[0].content)
    text = payload["specificContent"]["com.linkedin.ugc.ShareContent"]["shareCommentary"]["text"]
    assert "Released title" in text and "Released summary" in text
    assert f"/writing/{work}/releases/1" in text and "Private changed" not in text
    assert (
        client.post(
            f"/v1/academy/releases/{release_id}/withdraw",
            headers=HEADERS,
            json={"reason": "Test withdrawal"},
        ).status_code
        == 200
    )
    assert client.post(route, headers=HEADERS, json=APPROVAL).status_code == 409
    assert len([r for r in linkedin[0] if r.url.path.endswith("ugcPosts")]) == 1


@pytest.mark.parametrize(
    "timeout,expected,attempts", [(True, "needs_review", 1), (False, "failed", 2)]
)
async def test_unknown_outcomes_are_not_resent_and_native_release_survives(
    client, session_factory, linkedin, timeout, expected, attempts
):
    connect(client)
    work, _ = await release(client, session_factory)
    linkedin[1].update(timeout=timeout, status=403)
    route = f"/v1/distribution/works/{work}/releases/1/linkedin"
    for _ in range(2):
        response = client.post(route, headers=HEADERS, json=APPROVAL)
        assert response.status_code == 200, response.text
        assert response.json()["status"] == expected
    assert len([r for r in linkedin[0] if r.url.path.endswith("ugcPosts")]) == attempts
    assert client.get(f"/v1/academy/delivery/works/{work}/releases/1").status_code == 200


async def test_copy_records_reject_wrong_platform_and_private_or_withdrawn_releases(
    client, session_factory
):
    work, _ = await release(client, session_factory)
    route = f"/v1/distribution/works/{work}/releases/1/copies"
    for url in (
        "http://author.substack.com/p/test",
        "https://substack.com.evil.org/p/test",
        "https://medium.com/@test/piece",
        "https://author.substack.com:bad/p/test",
        "https://user:secret@author.substack.com/p/test",
    ):
        assert (
            client.post(
                route, headers=HEADERS, json={"platform": "substack", "url": url}
            ).status_code
            == 422
        )
    response = client.post(
        route,
        headers=HEADERS,
        json={"platform": "substack", "url": "https://author.substack.com/p/test"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "recorded"
    assert client.get(route, headers=OTHER).status_code in (403, 404)
    assert len(client.get(route, headers=HEADERS).json()) == 1
    assert (
        client.post(
            route.replace("/1/", "/2/"),
            headers=HEADERS,
            json={"platform": "medium", "url": "https://medium.com/@test/piece"},
        ).status_code
        == 404
    )


async def test_expired_connection_cannot_publish(client, session_factory, linkedin):
    connect(client)
    work, _ = await release(client, session_factory)
    async with session_factory() as session:
        await app.core.tenancy.bind_tenant(session, "author")
        await session.execute(
            sa.update(models.PublishingConnection)
            .where(models.PublishingConnection.owner_id == "author")
            .values(expires_at=datetime.datetime.now(datetime.UTC) - datetime.timedelta(seconds=1))
        )
        await session.commit()
    assert client.get("/v1/distribution/linkedin", headers=HEADERS).json()["connected"] is False
    assert (
        client.post(
            f"/v1/distribution/works/{work}/releases/1/linkedin", headers=HEADERS, json=APPROVAL
        ).status_code
        == 409
    )
    assert len(linkedin[0]) == 2
