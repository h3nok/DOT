"""The profile graph is stored as nodes and edges, not as a blob."""

from __future__ import annotations

import fastapi.testclient

OWNER = "member_profile_a"
OTHER = "member_profile_b"

TREE: dict = {
    "graph": {
        "id": "self",
        "label": "Henok",
        "kind": "self",
        "description": "Root of the tree.",
        "children": [
            {
                "id": "writing",
                "label": "Writing",
                "kind": "page",
                "surface": "publications",
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
    assert [child["id"] for child in graph["children"]] == ["writing", "work"]
    assert graph["children"][0]["surface"] == "publications"
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
