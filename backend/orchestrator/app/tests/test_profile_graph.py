"""The profile graph is stored as nodes and edges, not as a blob."""

from __future__ import annotations

import fastapi.testclient
import pytest

OWNER = "member_profile_a"
OTHER = "member_profile_b"

TREE: dict = {
    "graph": {
        "id": "self",
        "label": "Henok",
        "kind": "self",
        "description": "Root of the tree.",
        "introduction": "Begin with the question that brought you here.",
        "children": [
            {
                "id": "writing",
                "label": "Writing",
                "kind": "page",
                "surface": "publications",
                "actionLabel": "Begin reading",
                "children": [
                    {"id": "dot", "label": "Digital Organism Theory", "kind": "page"},
                ],
            },
            {
                "id": "work",
                "label": "Work",
                "kind": "attribute",
                "meta": [{"label": "Role", "value": "Engineer"}],
            },
        ],
    }
}


def _put(client: fastapi.testclient.TestClient, owner: str, payload: dict):
    return client.put("/v1/graph/profile", json=payload, headers={"X-Owner-Id": owner})


def test_put_then_get_round_trips_the_tree(client: fastapi.testclient.TestClient) -> None:
    assert _put(client, OWNER, TREE).status_code == 200

    response = client.get("/v1/graph/profile", params={"owner_id": OWNER})
    assert response.status_code == 200
    body = response.json()
    assert body["owner_id"] == OWNER
    assert body["updated_at"] is not None

    graph = body["graph"]
    assert graph["id"] == "self"
    assert graph["label"] == "Henok"
    assert graph["introduction"] == "Begin with the question that brought you here."
    assert [child["id"] for child in graph["children"]] == ["writing", "work"]
    assert graph["children"][0]["surface"] == "publications"
    assert graph["children"][0]["actionLabel"] == "Begin reading"
    assert graph["children"][0]["children"][0]["label"] == "Digital Organism Theory"
    assert graph["children"][1]["meta"] == [{"label": "Role", "value": "Engineer"}]


def test_read_is_public_and_needs_no_owner_header(client: fastapi.testclient.TestClient) -> None:
    _put(client, OWNER, TREE)
    response = client.get("/v1/graph/profile", params={"owner_id": OWNER})
    assert response.status_code == 200
    assert response.json()["graph"] is not None


def test_unknown_owner_returns_null_graph(client: fastapi.testclient.TestClient) -> None:
    response = client.get("/v1/graph/profile", params={"owner_id": "nobody"})
    assert response.status_code == 200
    assert response.json() == {"owner_id": "nobody", "graph": None, "updated_at": None}


def test_write_requires_an_owner(client: fastapi.testclient.TestClient) -> None:
    assert client.put("/v1/graph/profile", json=TREE).status_code == 401


def test_one_owner_cannot_see_another_tree(client: fastapi.testclient.TestClient) -> None:
    _put(client, OWNER, TREE)
    assert client.get("/v1/graph/profile", params={"owner_id": OTHER}).json()["graph"] is None


def test_republish_replaces_rather_than_appends(client: fastapi.testclient.TestClient) -> None:
    _put(client, OWNER, TREE)
    _put(client, OWNER, {"graph": {"id": "self", "label": "Henok", "kind": "self"}})

    graph = client.get("/v1/graph/profile", params={"owner_id": OWNER}).json()["graph"]
    assert graph["children"] is None

    snapshot = client.get("/v1/graph/snapshot", headers={"X-Owner-Id": OWNER}).json()
    assert len([n for n in snapshot["nodes"] if n["platform"] == "profile"]) == 1
    assert [e for e in snapshot["edges"] if e["platform"] == "profile"] == []


def test_sibling_ids_repeated_under_different_parents_are_kept_apart(
    client: fastapi.testclient.TestClient,
) -> None:
    payload = {
        "graph": {
            "id": "self",
            "label": "Root",
            "children": [
                {"id": "a", "label": "A", "children": [{"id": "note", "label": "A note"}]},
                {"id": "b", "label": "B", "children": [{"id": "note", "label": "B note"}]},
            ],
        }
    }
    assert _put(client, OWNER, payload).status_code == 200
    graph = client.get("/v1/graph/profile", params={"owner_id": OWNER}).json()["graph"]
    assert graph["children"][0]["children"][0]["label"] == "A note"
    assert graph["children"][1]["children"][0]["label"] == "B note"


def test_graph_nested_past_the_depth_limit_is_rejected(
    client: fastapi.testclient.TestClient,
) -> None:
    node: dict = {"id": "leaf", "label": "leaf"}
    for index in range(12):
        node = {"id": f"n{index}", "label": f"n{index}", "children": [node]}
    assert _put(client, OWNER, {"graph": node}).status_code == 400


# ── Contract enforcement: the client is never trusted ──────────────────────────


def _tree(**node: object) -> dict:
    return {"graph": {"id": "self", "label": "Root", "children": [dict(node)]}}


def test_duplicate_sibling_ids_are_a_validation_error_not_a_crash(
    client: fastapi.testclient.TestClient,
) -> None:
    """Colliding ids used to reach the unique index and surface as a 500."""

    payload = {
        "graph": {
            "id": "self",
            "label": "Root",
            "children": [
                {"id": "twin", "label": "First"},
                {"id": "twin", "label": "Second"},
            ],
        }
    }
    assert _put(client, OWNER, payload).status_code == 422


def test_ids_may_not_contain_path_separators(client: fastapi.testclient.TestClient) -> None:
    """Ids become segments of the stored external_id path."""

    assert _put(client, OWNER, _tree(id="a/b", label="Sneaky")).status_code == 422


@pytest.mark.parametrize(
    "href",
    [
        "javascript:alert(1)",
        "JavaScript:alert(1)",
        "data:text/html;base64,PHNjcmlwdD4=",
        "vbscript:msgbox(1)",
        "//evil.example.com",
    ],
)
def test_unsafe_hrefs_are_rejected(client: fastapi.testclient.TestClient, href: str) -> None:
    assert _put(client, OWNER, _tree(id="x", label="X", href=href)).status_code == 422


@pytest.mark.parametrize(
    "href",
    ["/doctrine", "https://example.com/post", "mailto:hi@example.com", "tel:+15550000000"],
)
def test_safe_hrefs_are_accepted(client: fastapi.testclient.TestClient, href: str) -> None:
    assert _put(client, OWNER, _tree(id="x", label="X", href=href)).status_code == 200


def test_images_must_not_be_inline_payloads(client: fastapi.testclient.TestClient) -> None:
    unsafe = _tree(id="x", label="X", image="data:image/svg+xml,<svg onload=alert(1)>")
    assert _put(client, OWNER, unsafe).status_code == 422


def test_unknown_kind_or_surface_fails_closed(client: fastapi.testclient.TestClient) -> None:
    assert _put(client, OWNER, _tree(id="x", label="X", kind="admin")).status_code == 422
    assert _put(client, OWNER, _tree(id="x", label="X", surface="billing")).status_code == 422


def test_relations_round_trip(client: fastapi.testclient.TestClient) -> None:
    """Navigation is offered in relation language, so it has to survive a publish."""

    payload = _tree(id="coherence", label="Coherence", relation="contrasts")
    assert _put(client, OWNER, payload).status_code == 200

    graph = client.get("/v1/graph/profile", params={"owner_id": OWNER}).json()["graph"]
    assert graph["children"][0]["relation"] == "contrasts"


def test_unknown_relation_fails_closed(client: fastapi.testclient.TestClient) -> None:
    assert _put(client, OWNER, _tree(id="x", label="X", relation="vibes")).status_code == 422
