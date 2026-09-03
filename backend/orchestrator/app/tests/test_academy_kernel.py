"""Academy kernel lifecycle (doc 15 Phase 1 gate; ADR-0030/0031/0032).

Via API only: create a Definition, freeze a revision, release it, and fetch the
immutable release publicly — while drafts stay invisible and the release state
machine holds.
"""

from __future__ import annotations

import fastapi.testclient
import sqlalchemy.ext.asyncio

import app.domains.academy.bootstrap
import app.domains.academy.models as models

STEWARD = "steward-ada"

PROGRAMS: list[tuple[str, str]] = [("theory", "Theory")]


def _headers(actor: str = STEWARD) -> dict[str, str]:
    return {"X-Owner-Id": actor, "X-Actor-Id": actor}


async def _provision(
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
    *,
    slug: str = "dot-academy",
    steward: str = STEWARD,
    custodian: str = "custodian-ops",
) -> models.AcademySpace:
    async with session_factory() as session:
        return await app.domains.academy.bootstrap.provision_space(
            session,
            slug=slug,
            title="DOT Academy",
            description=None,
            custodian_owner_id=custodian,
            steward_member_id=steward,
            programs=PROGRAMS,
        )


def _create_definition(client: fastapi.testclient.TestClient, space_id: str) -> str:
    response = client.post(
        f"/v1/academy/spaces/{space_id}/works",
        headers=_headers(),
        json={"kind": "definition", "canonical_slug": "big-c", "program_slug": "theory"},
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def _freeze_revision(
    client: fastapi.testclient.TestClient, work_id: str, body: str = "Big C is..."
) -> dict:
    response = client.post(
        f"/v1/academy/works/{work_id}/revisions",
        headers=_headers(),
        json={"title": "Big C", "body_markdown": body},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _annotate_claim(
    client: fastapi.testclient.TestClient, revision_id: str, origin: str = "author_originated"
) -> dict:
    response = client.post(
        f"/v1/academy/revisions/{revision_id}/claims",
        headers=_headers(),
        json={
            "canonical_key": "big-c-definition",
            "statement": "Big C denotes the universal consciousness substrate.",
            "epistemic_level": "Model",
            "origin": origin,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_definition_lifecycle_draft_to_immutable_release(
    client: fastapi.testclient.TestClient,
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> None:
    space = await _provision(session_factory)
    work_id = _create_definition(client, space.id)

    # Draft is invisible through every public delivery path (P9).
    assert client.get(f"/v1/academy/delivery/works/{work_id}").status_code == 404
    assert client.get("/v1/academy/delivery/catalog").json() == []

    revision = _freeze_revision(client, work_id)
    assert revision["revision_number"] == 1
    assert len(revision["content_hash"]) == 64

    # Release without annotated claims is blocked (P3).
    blocked = client.post(
        f"/v1/academy/works/{work_id}/releases",
        headers=_headers(),
        json={"revision_id": revision["id"]},
    )
    assert blocked.status_code == 409

    _annotate_claim(client, revision["id"])
    released = client.post(
        f"/v1/academy/works/{work_id}/releases",
        headers=_headers(),
        json={"revision_id": revision["id"]},
    )
    assert released.status_code == 201, released.text
    body = released.json()
    assert body["release_status"] == "released"
    assert body["release_number"] == 1
    assert body["manifest_hash"]
    assert body["policy_revision_id"]  # releases record their governing policy

    # Public delivery resolves the alias and the immutable version.
    latest = client.get(f"/v1/academy/delivery/works/{work_id}")
    assert latest.status_code == 200
    manifest = latest.json()["manifest"]
    assert manifest["work"]["kind"] == "definition"
    assert manifest["claims"][0]["epistemic_level"] == "Model"
    assert manifest["claims"][0]["origin"] == "author_originated"

    versioned = client.get(f"/v1/academy/delivery/works/{work_id}/releases/1")
    assert versioned.status_code == 200
    assert versioned.headers["Cache-Control"] == "public, max-age=86400, immutable"

    # The released body is readable; the draft body key is not exposed.
    body_ref = latest.json()["body_ref"]
    assert "/releases/" in body_ref
    fetched = client.get(f"/v1/academy/delivery/body/{body_ref}")
    assert fetched.status_code == 200
    assert "Big C" in fetched.text

    catalog = client.get("/v1/academy/delivery/catalog").json()
    assert [item["work_slug"] for item in catalog] == ["big-c"]


async def test_sourced_claim_requires_source_link(
    client: fastapi.testclient.TestClient,
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> None:
    space = await _provision(session_factory)
    work_id = _create_definition(client, space.id)
    revision = _freeze_revision(client, work_id)
    _annotate_claim(client, revision["id"], origin="sourced")

    blocked = client.post(
        f"/v1/academy/works/{work_id}/releases",
        headers=_headers(),
        json={"revision_id": revision["id"]},
    )
    assert blocked.status_code == 409
    assert "source" in blocked.json()["detail"].lower()

    linked = client.post(
        f"/v1/academy/revisions/{revision['id']}/sources",
        headers=_headers(),
        json={"claim_key": "big-c-definition", "external_uri": "https://example.org/paper"},
    )
    assert linked.status_code == 201, linked.text
    released = client.post(
        f"/v1/academy/works/{work_id}/releases",
        headers=_headers(),
        json={"revision_id": revision["id"]},
    )
    assert released.status_code == 201, released.text


async def test_revisions_are_immutable_and_corrections_are_new_releases(
    client: fastapi.testclient.TestClient,
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> None:
    space = await _provision(session_factory)
    work_id = _create_definition(client, space.id)
    first = _freeze_revision(client, work_id, body="First formulation.")
    _annotate_claim(client, first["id"])
    client.post(
        f"/v1/academy/works/{work_id}/releases",
        headers=_headers(),
        json={"revision_id": first["id"]},
    )

    # No mutation surface exists for a frozen revision.
    assert client.patch(
        f"/v1/academy/revisions/{first['id']}", headers=_headers(), json={"title": "x"}
    ).status_code in {404, 405}

    # A correction is a new revision and a new release; v1 stays resolvable.
    second = _freeze_revision(client, work_id, body="Sharper formulation.")
    assert second["revision_number"] == 2
    _annotate_claim(client, second["id"])
    released = client.post(
        f"/v1/academy/works/{work_id}/releases",
        headers=_headers(),
        json={"revision_id": second["id"]},
    )
    assert released.json()["release_number"] == 2

    v1 = client.get(f"/v1/academy/delivery/works/{work_id}/releases/1").json()
    v2 = client.get(f"/v1/academy/delivery/works/{work_id}/releases/2").json()
    assert v1["manifest"]["revision"]["number"] == 1
    assert v2["manifest"]["revision"]["number"] == 2
    latest = client.get(f"/v1/academy/delivery/works/{work_id}").json()
    assert latest["resolved_release_number"] == 2

    # A released work's slug is permanent (citations never break).
    assert (
        client.patch(
            f"/v1/academy/works/{work_id}", headers=_headers(), json={"canonical_slug": "new"}
        ).status_code
        == 409
    )


async def test_withdrawal_leaves_a_tombstone_not_a_hole(
    client: fastapi.testclient.TestClient,
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> None:
    space = await _provision(session_factory)
    work_id = _create_definition(client, space.id)
    revision = _freeze_revision(client, work_id)
    _annotate_claim(client, revision["id"])
    release_id = client.post(
        f"/v1/academy/works/{work_id}/releases",
        headers=_headers(),
        json={"revision_id": revision["id"]},
    ).json()["id"]

    withdrawn = client.post(
        f"/v1/academy/releases/{release_id}/withdraw",
        headers=_headers(),
        json={"reason": "Superseded by a corrected formulation."},
    )
    assert withdrawn.status_code == 200
    assert withdrawn.json()["release_status"] == "withdrawn"

    # A withdrawn release cannot be withdrawn again (state machine holds).
    assert (
        client.post(
            f"/v1/academy/releases/{release_id}/withdraw",
            headers=_headers(),
            json={"reason": "again"},
        ).status_code
        == 409
    )

    # The versioned URL keeps resolving to a tombstone with the reason (P7).
    tombstone = client.get(f"/v1/academy/delivery/works/{work_id}/releases/1").json()
    assert tombstone["withdrawn"] is True
    assert "Superseded" in tombstone["reason"]
    # The catalog no longer lists it.
    assert client.get("/v1/academy/delivery/catalog").json() == []


async def test_experiment_predicates_are_reserved_until_phase_5(
    client: fastapi.testclient.TestClient,
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> None:
    space = await _provision(session_factory)
    work_id = _create_definition(client, space.id)
    revision = _freeze_revision(client, work_id)
    _annotate_claim(client, revision["id"])

    supports = client.post(
        f"/v1/academy/revisions/{revision['id']}/relations",
        headers=_headers(),
        json={"predicate": "supports", "source_claim_key": "big-c-definition"},
    )
    assert supports.status_code == 409

    untargeted_objection = client.post(
        f"/v1/academy/revisions/{revision['id']}/relations",
        headers=_headers(),
        json={"predicate": "objects_to"},
    )
    assert untargeted_objection.status_code == 409

    typed = client.post(
        f"/v1/academy/revisions/{revision['id']}/relations",
        headers=_headers(),
        json={
            "predicate": "contrasts_with",
            "target_external": "book:digital-organism-theory/v3#big-c",
        },
    )
    assert typed.status_code == 201, typed.text
