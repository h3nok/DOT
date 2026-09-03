"""Institutional isolation (P14, ADR-0032).

A second space is data, not code; neither space can touch the other; custody
confers no editorial authority. This suite is the Phase 1 release gate.
"""

from __future__ import annotations

import fastapi.testclient
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.domains.academy.bootstrap
import app.domains.academy.context
import app.domains.academy.models as models

ALICE = "steward-alice"
BOB = "steward-bob"
CUSTODIAN = "custodian-carl"


def _headers(actor: str) -> dict[str, str]:
    return {"X-Owner-Id": actor, "X-Actor-Id": actor}


async def _two_spaces(
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> tuple[models.AcademySpace, models.AcademySpace]:
    """Two institutions provisioned by INSERT + seed — zero code changes."""

    async with session_factory() as session:
        space_a = await app.domains.academy.bootstrap.provision_space(
            session,
            slug="dot-academy",
            title="DOT Academy",
            description=None,
            custodian_owner_id=CUSTODIAN,
            steward_member_id=ALICE,
            programs=[("theory", "Theory")],
        )
    async with session_factory() as session:
        space_b = await app.domains.academy.bootstrap.provision_space(
            session,
            slug="second-school",
            title="A Second School",
            description=None,
            custodian_owner_id=CUSTODIAN,
            steward_member_id=BOB,
            programs=[("inquiry", "Inquiry")],
        )
    return space_a, space_b


async def test_cross_space_writes_and_reads_are_denied(
    client: fastapi.testclient.TestClient,
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> None:
    space_a, space_b = await _two_spaces(session_factory)

    created = client.post(
        f"/v1/academy/spaces/{space_a.id}/works",
        headers=_headers(ALICE),
        json={"kind": "definition", "canonical_slug": "big-c"},
    )
    assert created.status_code == 201, created.text
    work_id = created.json()["id"]

    # Bob is a steward — of the other institution. Every path is closed.
    assert (
        client.post(
            f"/v1/academy/spaces/{space_a.id}/works",
            headers=_headers(BOB),
            json={"kind": "essay", "canonical_slug": "intrusion"},
        ).status_code
        == 403
    )
    assert (
        client.get(f"/v1/academy/spaces/{space_a.id}/works", headers=_headers(BOB)).status_code
        == 403
    )
    assert client.get(f"/v1/academy/works/{work_id}", headers=_headers(BOB)).status_code == 403
    assert (
        client.post(
            f"/v1/academy/works/{work_id}/revisions",
            headers=_headers(BOB),
            json={"title": "x", "body_markdown": "y"},
        ).status_code
        == 403
    )
    assert (
        client.post(
            f"/v1/academy/works/{work_id}/releases",
            headers=_headers(BOB),
            json={"revision_id": "arev_none"},
        ).status_code
        == 403
    )

    # Alice, symmetrically, has no authority in Bob's school.
    assert (
        client.post(
            f"/v1/academy/spaces/{space_b.id}/works",
            headers=_headers(ALICE),
            json={"kind": "definition", "canonical_slug": "big-c"},
        ).status_code
        == 403
    )


async def test_custody_confers_no_editorial_authority(
    client: fastapi.testclient.TestClient,
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> None:
    space_a, _ = await _two_spaces(session_factory)

    # Carl operates the infrastructure and is the recorded custodian of the
    # space. Without a membership and grant he can transition nothing (P14).
    assert (
        client.post(
            f"/v1/academy/spaces/{space_a.id}/works",
            headers=_headers(CUSTODIAN),
            json={"kind": "definition", "canonical_slug": "custody-test"},
        ).status_code
        == 403
    )
    assert (
        client.get(
            f"/v1/academy/spaces/{space_a.id}/works", headers=_headers(CUSTODIAN)
        ).status_code
        == 403
    )


async def test_roles_do_not_imply_one_another(
    client: fastapi.testclient.TestClient,
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> None:
    space_a, _ = await _two_spaces(session_factory)

    # A contributor without a publisher grant can draft but not release.
    async with session_factory() as session:
        await app.domains.academy.context.bind_space(session, space_a.id, ALICE)
        policy_id = (
            await session.execute(
                sqlalchemy.select(models.AcademyPolicy.id).where(
                    models.AcademyPolicy.academy_space_id == space_a.id
                )
            )
        ).scalar_one()
        membership = models.AcademyMembership(
            academy_space_id=space_a.id, member_id="contributor-cleo"
        )
        session.add(membership)
        await session.flush()
        session.add(
            models.AcademyRoleGrant(
                academy_space_id=space_a.id,
                membership_id=membership.id,
                role="contributor",
                policy_revision_id=policy_id,
                granted_by=ALICE,
            )
        )
        await session.commit()

    created = client.post(
        f"/v1/academy/spaces/{space_a.id}/works",
        headers=_headers("contributor-cleo"),
        json={"kind": "essay", "canonical_slug": "first-essay"},
    )
    assert created.status_code == 201, created.text
    work_id = created.json()["id"]
    revision = client.post(
        f"/v1/academy/works/{work_id}/revisions",
        headers=_headers("contributor-cleo"),
        json={"title": "First essay", "body_markdown": "Text."},
    ).json()

    release_attempt = client.post(
        f"/v1/academy/works/{work_id}/releases",
        headers=_headers("contributor-cleo"),
        json={"revision_id": revision["id"]},
    )
    assert release_attempt.status_code == 403


async def test_spaces_share_nothing_but_the_schema(
    client: fastapi.testclient.TestClient,
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> None:
    space_a, space_b = await _two_spaces(session_factory)

    # The same slug can exist independently in both institutions.
    for space_id, actor in ((space_a.id, ALICE), (space_b.id, BOB)):
        response = client.post(
            f"/v1/academy/spaces/{space_id}/works",
            headers=_headers(actor),
            json={"kind": "definition", "canonical_slug": "shared-term"},
        )
        assert response.status_code == 201, response.text

    a_works = client.get(f"/v1/academy/spaces/{space_a.id}/works", headers=_headers(ALICE)).json()
    b_works = client.get(f"/v1/academy/spaces/{space_b.id}/works", headers=_headers(BOB)).json()
    assert {work["academy_space_id"] for work in a_works} == {space_a.id}
    assert {work["academy_space_id"] for work in b_works} == {space_b.id}

    # Cross-space relation targets must be explicit external citations (P5).
    revision = client.post(
        f"/v1/academy/works/{a_works[0]['id']}/revisions",
        headers=_headers(ALICE),
        json={"title": "t", "body_markdown": "b"},
    ).json()
    cross = client.post(
        f"/v1/academy/revisions/{revision['id']}/relations",
        headers=_headers(ALICE),
        json={"predicate": "cites", "target_work_id": b_works[0]["id"]},
    )
    assert cross.status_code == 409
    assert "target_external" in cross.json()["detail"]
