"""Steward-editable public copy.

What these pin, in order of how much damage each would do if it regressed: a
reader never sees an unpublished draft; a signed-in member who is not the
steward cannot rewrite the public surfaces; clearing a block restores the
released wording instead of publishing an empty string; and the key space
stays bounded.
"""

from __future__ import annotations

import fastapi.testclient
import pytest

import app.api.v1.sitecontent as sitecontent_router
import app.auth.dependencies

STEWARD = app.auth.dependencies.OwnerContext(owner_id="owner_1", actor_id="owner_1", role="owner")
MEMBER = app.auth.dependencies.OwnerContext(owner_id="member_1", actor_id="member_1", role="member")


@pytest.fixture(autouse=True)
def _reset_limiter() -> None:
    sitecontent_router._limiter._storage.reset()  # noqa: SLF001


@pytest.fixture()
def as_steward(client: fastapi.testclient.TestClient) -> fastapi.testclient.TestClient:
    client.app.dependency_overrides[sitecontent_router.require_steward] = lambda: STEWARD
    yield client
    client.app.dependency_overrides.pop(sitecontent_router.require_steward, None)


def test_public_read_is_empty_before_any_edit(client: fastapi.testclient.TestClient) -> None:
    # An empty table is a valid site: every surface falls back to its default.
    response = client.get("/v1/site-content")

    assert response.status_code == 200
    assert response.json() == {"blocks": {}}


def test_draft_is_never_visible_to_a_reader(
    as_steward: fastapi.testclient.TestClient,
) -> None:
    as_steward.put("/v1/site-content/home.lede", json={"value": "a half-written thought"})

    assert as_steward.get("/v1/site-content").json() == {"blocks": {}}


def test_publishing_makes_the_override_public(
    as_steward: fastapi.testclient.TestClient,
) -> None:
    as_steward.put("/v1/site-content/home.lede", json={"value": "the settled wording"})
    publish = as_steward.post("/v1/site-content/home.lede/publish")

    assert publish.status_code == 200
    assert as_steward.get("/v1/site-content").json() == {
        "blocks": {"home.lede": "the settled wording"}
    }


def test_write_can_publish_in_one_call(as_steward: fastapi.testclient.TestClient) -> None:
    as_steward.put("/v1/site-content/home.lede", json={"value": "said once", "publish": True})

    assert as_steward.get("/v1/site-content").json() == {"blocks": {"home.lede": "said once"}}


def test_clearing_a_block_restores_the_released_default(
    as_steward: fastapi.testclient.TestClient,
) -> None:
    as_steward.put("/v1/site-content/home.lede", json={"value": "override", "publish": True})

    # "Select all, delete" must not publish an empty paragraph to the front door.
    as_steward.put("/v1/site-content/home.lede", json={"value": "   ", "publish": True})

    assert as_steward.get("/v1/site-content").json() == {"blocks": {}}


def test_revert_removes_the_override_entirely(
    as_steward: fastapi.testclient.TestClient,
) -> None:
    as_steward.put("/v1/site-content/home.lede", json={"value": "override", "publish": True})

    assert as_steward.delete("/v1/site-content/home.lede").status_code == 204
    assert as_steward.get("/v1/site-content").json() == {"blocks": {}}
    assert as_steward.get("/v1/site-content/drafts").json() == {"blocks": []}


def test_publishing_an_unknown_block_is_not_found(
    as_steward: fastapi.testclient.TestClient,
) -> None:
    assert as_steward.post("/v1/site-content/home.nothing/publish").status_code == 404


def test_keys_are_normalized_to_lowercase(
    as_steward: fastapi.testclient.TestClient,
) -> None:
    # One block, one address: casing must not fork a surface into two rows.
    as_steward.put("/v1/site-content/Home.Lede", json={"value": "x", "publish": True})

    assert as_steward.get("/v1/site-content").json() == {"blocks": {"home.lede": "x"}}


@pytest.mark.parametrize(
    "key",
    ["home lede", "../etc/passwd", "home..lede", "", "x" * 200],
)
def test_malformed_keys_are_refused(as_steward: fastapi.testclient.TestClient, key: str) -> None:
    response = as_steward.put(f"/v1/site-content/{key}", json={"value": "x"})

    assert response.status_code in {400, 404, 405}


def test_writes_require_a_session(client: fastapi.testclient.TestClient) -> None:
    # No owner context at all: the public surfaces are not anonymously writable.
    response = client.put("/v1/site-content/home.lede", json={"value": "x"})

    assert response.status_code == 401


def test_members_cannot_rewrite_public_copy(client: fastapi.testclient.TestClient) -> None:
    client.app.dependency_overrides[app.auth.dependencies.require_owner] = lambda: MEMBER
    try:
        response = client.put("/v1/site-content/home.lede", json={"value": "x"})
    finally:
        client.app.dependency_overrides.pop(app.auth.dependencies.require_owner, None)

    assert response.status_code == 403


def test_oversized_values_are_refused(as_steward: fastapi.testclient.TestClient) -> None:
    response = as_steward.put("/v1/site-content/home.lede", json={"value": "x" * 5_000})

    assert response.status_code == 422
