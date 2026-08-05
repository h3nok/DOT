import fastapi.testclient
import httpx

OWNER_HEADERS: dict[str, str] = {"X-Owner-Id": "owner_1"}
OTHER_OWNER_HEADERS: dict[str, str] = {"X-Owner-Id": "owner_2"}
SUBSTACK_RSS = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Henok Notes</title>
    <link>https://henok.substack.com</link>
    <item>
      <title>Graph-aware publishing</title>
    <link>https://henok.substack.com/p/graph-aware-publishing</link>
      <guid>post-1</guid>
      <pubDate>Sat, 13 Jun 2026 12:00:00 GMT</pubDate>
      <description><![CDATA[How member-owned graph navigation changes publishing.]]></description>
      <category>Digital Footprint</category>
      <category>Publishing</category>
    </item>
    <item>
      <title>Substack as a graph source</title>
    <link>https://henok.substack.com/p/substack-source</link>
      <guid>post-2</guid>
      <pubDate>Sat, 13 Jun 2026 13:00:00 GMT</pubDate>
      <description>RSS imports should be explicit and inspectable.</description>
      <category>Digital Footprint</category>
    </item>
  </channel>
</rss>
"""


def create_node(
    client: fastapi.testclient.TestClient,
    *,
    headers: dict[str, str] = OWNER_HEADERS,
    label: str,
    kind: str = "post",
    platform: str = "substack",
    external_id: str | None = None,
) -> dict:
    response: httpx.Response = client.post(
        "/v1/graph/nodes",
        headers=headers,
        json={
            "kind": kind,
            "label": label,
            "platform": platform,
            "external_id": external_id,
            "source_ref": {"url": f"https://example.com/{label.lower().replace(' ', '-')}"},
        },
    )
    assert response.status_code == 201
    return response.json()


def test_graph_requires_owner(client: fastapi.testclient.TestClient) -> None:
    response: httpx.Response = client.get("/v1/graph/snapshot")

    assert response.status_code == 401


def test_graph_snapshot_is_owner_scoped(client: fastapi.testclient.TestClient) -> None:
    account_response: httpx.Response = client.post(
        "/v1/graph/accounts",
        headers=OWNER_HEADERS,
        json={
            "platform": "substack",
            "handle": "henok",
            "profile_url": "https://henok.substack.com",
            "auth_mode": "rss",
        },
    )
    assert account_response.status_code == 201
    post_node = create_node(client, label="Graph-aware publishing")
    topic_node = create_node(client, label="Digital footprint", kind="topic", platform="manual")

    edge_response: httpx.Response = client.post(
        "/v1/graph/edges",
        headers=OWNER_HEADERS,
        json={
            "source_node_id": post_node["id"],
            "target_node_id": topic_node["id"],
            "relation": "mentions",
            "platform": "substack",
            "confidence": 0.84,
        },
    )
    assert edge_response.status_code == 201

    owner_snapshot: httpx.Response = client.get("/v1/graph/snapshot", headers=OWNER_HEADERS)
    other_snapshot: httpx.Response = client.get("/v1/graph/snapshot", headers=OTHER_OWNER_HEADERS)

    assert owner_snapshot.status_code == 200
    assert len(owner_snapshot.json()["accounts"]) == 1
    assert len(owner_snapshot.json()["nodes"]) == 2
    assert len(owner_snapshot.json()["edges"]) == 1
    assert other_snapshot.status_code == 200
    assert other_snapshot.json()["nodes"] == []
    assert other_snapshot.json()["edges"] == []


def test_graph_account_create_is_idempotent(client: fastapi.testclient.TestClient) -> None:
    payload = {
        "platform": "substack",
        "handle": "henok",
        "display_name": "Henok Notes",
        "profile_url": "https://henok.substack.com",
        "auth_mode": "rss",
    }
    first_response: httpx.Response = client.post(
        "/v1/graph/accounts", headers=OWNER_HEADERS, json=payload
    )
    second_response: httpx.Response = client.post(
        "/v1/graph/accounts",
        headers=OWNER_HEADERS,
        json={**payload, "display_name": "Henok Research"},
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert second_response.json()["id"] == first_response.json()["id"]
    assert second_response.json()["display_name"] == "Henok Research"

    accounts_response: httpx.Response = client.get("/v1/graph/accounts", headers=OWNER_HEADERS)
    assert accounts_response.status_code == 200
    assert len(accounts_response.json()) == 1


def test_graph_edge_rejects_cross_owner_nodes(client: fastapi.testclient.TestClient) -> None:
    owner_node = create_node(client, label="Owner post")
    other_node = create_node(
        client,
        headers=OTHER_OWNER_HEADERS,
        label="Other owner topic",
        kind="topic",
        platform="manual",
    )

    response: httpx.Response = client.post(
        "/v1/graph/edges",
        headers=OWNER_HEADERS,
        json={
            "source_node_id": owner_node["id"],
            "target_node_id": other_node["id"],
            "relation": "mentions",
        },
    )

    assert response.status_code == 404


def test_graph_import_creates_run_and_is_idempotent(client: fastapi.testclient.TestClient) -> None:
    account_response: httpx.Response = client.post(
        "/v1/graph/accounts",
        headers=OWNER_HEADERS,
        json={
            "platform": "substack",
            "handle": "henok",
            "profile_url": "https://henok.substack.com",
            "auth_mode": "rss",
        },
    )
    assert account_response.status_code == 201
    headers = {**OWNER_HEADERS, "Idempotency-Key": "substack-rss-sync"}
    payload = {
        "connector": "substack",
        "import_mode": "rss",
        "account_id": account_response.json()["id"],
        "source_ref": {"feed_url": "https://henok.substack.com/feed"},
    }

    first_response: httpx.Response = client.post("/v1/graph/imports", headers=headers, json=payload)
    second_response: httpx.Response = client.post(
        "/v1/graph/imports", headers=headers, json=payload
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert second_response.json()["id"] == first_response.json()["id"]
    assert first_response.json()["run_id"].startswith("run_")

    run_response: httpx.Response = client.get(
        f"/v1/runs/{first_response.json()['run_id']}",
        headers=OWNER_HEADERS,
    )
    assert run_response.status_code == 200
    assert run_response.json()["workflow_type"] == "footprint_import"


def test_graph_import_list_is_owner_scoped(client: fastapi.testclient.TestClient) -> None:
    owner_import_response: httpx.Response = client.post(
        "/v1/graph/imports",
        headers=OWNER_HEADERS,
        json={
            "connector": "substack",
            "import_mode": "rss",
            "source_ref": {"feed_url": "https://henok.substack.com/feed"},
        },
    )
    other_import_response: httpx.Response = client.post(
        "/v1/graph/imports",
        headers=OTHER_OWNER_HEADERS,
        json={
            "connector": "rss",
            "import_mode": "rss",
            "source_ref": {"feed_url": "https://other.example.com/feed"},
        },
    )
    assert owner_import_response.status_code == 201
    assert other_import_response.status_code == 201

    owner_list_response: httpx.Response = client.get(
        "/v1/graph/imports", headers=OWNER_HEADERS
    )
    other_list_response: httpx.Response = client.get(
        "/v1/graph/imports", headers=OTHER_OWNER_HEADERS
    )
    filtered_response: httpx.Response = client.get(
        "/v1/graph/imports?connector=rss", headers=OWNER_HEADERS
    )

    assert owner_list_response.status_code == 200
    assert other_list_response.status_code == 200
    assert [item["id"] for item in owner_list_response.json()] == [
        owner_import_response.json()["id"]
    ]
    assert [item["id"] for item in other_list_response.json()] == [
        other_import_response.json()["id"]
    ]
    assert filtered_response.status_code == 200
    assert filtered_response.json() == []


def test_graph_import_processes_substack_rss(client: fastapi.testclient.TestClient) -> None:
    account_response: httpx.Response = client.post(
        "/v1/graph/accounts",
        headers=OWNER_HEADERS,
        json={
            "platform": "substack",
            "handle": "henok",
            "display_name": "Henok Notes",
            "profile_url": "https://henok.substack.com",
            "auth_mode": "rss",
        },
    )
    assert account_response.status_code == 201
    import_response: httpx.Response = client.post(
        "/v1/graph/imports",
        headers={**OWNER_HEADERS, "Idempotency-Key": "substack-process"},
        json={
            "connector": "substack",
            "import_mode": "rss",
            "account_id": account_response.json()["id"],
            "source_ref": {"feed_url": "https://henok.substack.com/feed"},
        },
    )
    assert import_response.status_code == 201

    process_response: httpx.Response = client.post(
        f"/v1/graph/imports/{import_response.json()['id']}/process",
        headers=OWNER_HEADERS,
        json={"feed_xml": SUBSTACK_RSS},
    )

    assert process_response.status_code == 200
    processed_import = process_response.json()
    assert processed_import["status"] == "succeeded"
    assert processed_import["summary"]["item_count"] == 2
    assert processed_import["summary"]["node_count"] == 6
    assert processed_import["summary"]["edge_count"] == 8

    snapshot_response: httpx.Response = client.get("/v1/graph/snapshot", headers=OWNER_HEADERS)
    assert snapshot_response.status_code == 200
    snapshot = snapshot_response.json()
    assert {node["kind"] for node in snapshot["nodes"]} == {
        "platform_account",
        "publication",
        "post",
        "topic",
    }
    assert {edge["relation"] for edge in snapshot["edges"]} == {
        "authored",
        "mentions",
        "published_to",
    }

    second_process_response: httpx.Response = client.post(
        f"/v1/graph/imports/{import_response.json()['id']}/process",
        headers=OWNER_HEADERS,
        json={"feed_xml": SUBSTACK_RSS},
    )
    second_snapshot_response: httpx.Response = client.get(
        "/v1/graph/snapshot", headers=OWNER_HEADERS
    )

    assert second_process_response.status_code == 200
    assert len(second_snapshot_response.json()["nodes"]) == len(snapshot["nodes"])
    assert len(second_snapshot_response.json()["edges"]) == len(snapshot["edges"])


def test_graph_import_rejects_private_feed_url(
    client: fastapi.testclient.TestClient,
) -> None:
    import_response: httpx.Response = client.post(
        "/v1/graph/imports",
        headers=OWNER_HEADERS,
        json={
            "connector": "substack",
            "import_mode": "rss",
            "source_ref": {"feed_url": "http://127.0.0.1/feed"},
        },
    )
    assert import_response.status_code == 201

    process_response: httpx.Response = client.post(
        f"/v1/graph/imports/{import_response.json()['id']}/process",
        headers=OWNER_HEADERS,
        json={"feed_xml": SUBSTACK_RSS},
    )
    failed_import_response: httpx.Response = client.get(
        f"/v1/graph/imports/{import_response.json()['id']}",
        headers=OWNER_HEADERS,
    )

    assert process_response.status_code == 400
    assert failed_import_response.status_code == 200
    assert failed_import_response.json()["status"] == "failed"
    assert failed_import_response.json()["summary"] == {"error_code": "feed_url_rejected"}


def test_graph_import_process_is_owner_scoped(client: fastapi.testclient.TestClient) -> None:
    import_response: httpx.Response = client.post(
        "/v1/graph/imports",
        headers=OWNER_HEADERS,
        json={
            "connector": "substack",
            "import_mode": "rss",
            "source_ref": {"feed_url": "https://henok.substack.com/feed"},
        },
    )
    assert import_response.status_code == 201

    process_response: httpx.Response = client.post(
        f"/v1/graph/imports/{import_response.json()['id']}/process",
        headers=OTHER_OWNER_HEADERS,
        json={"feed_xml": SUBSTACK_RSS},
    )

    assert process_response.status_code == 404
