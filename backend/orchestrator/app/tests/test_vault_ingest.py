"""Vault ingest, end to end.

Before this pipeline an upload produced a source node carrying a filename and
nothing else, so the twin could name a member's document but never answer from
it. These assert that uploading actually leaves readable, citable knowledge
behind, and that it stays inside the uploader's tenant.
"""

import fastapi.testclient
import httpx

OWNER_HEADERS: dict[str, str] = {"X-Owner-Id": "owner_1"}
OTHER_OWNER_HEADERS: dict[str, str] = {"X-Owner-Id": "owner_2"}

DOCUMENT: str = "\n\n".join(
    [
        "Attention is the scarce resource, not content.",
        "A feed optimizes for time spent. A graph optimizes for understanding. " * 30,
        "Publication is the act of making a position checkable by someone else. " * 30,
    ]
)


def _upload(
    client: fastapi.testclient.TestClient,
    *,
    filename: str = "doctrine.md",
    content_type: str = "text/markdown",
    body: bytes | None = None,
    headers: dict[str, str] = OWNER_HEADERS,
) -> dict:
    payload: bytes = body if body is not None else DOCUMENT.encode("utf-8")

    reserved: httpx.Response = client.post(
        "/v1/vault/upload-url",
        headers=headers,
        json={"filename": filename, "content_type": content_type, "size": len(payload)},
    )
    assert reserved.status_code == 200, reserved.text
    key: str = reserved.json()["key"]

    stored: httpx.Response = client.put(f"/v1/vault/upload/{key}", headers=headers, content=payload)
    assert stored.status_code == 200, stored.text

    registered: httpx.Response = client.post(
        "/v1/vault/nodes",
        headers=headers,
        json={
            "key": key,
            "filename": filename,
            "metadata": {"content_type": content_type, "size": len(payload)},
        },
    )
    assert registered.status_code == 201, registered.text
    return registered.json()


def test_uploading_a_document_leaves_readable_chunks_behind(
    client: fastapi.testclient.TestClient,
) -> None:
    node: dict = _upload(client)
    properties: dict = node["properties"]

    assert properties["ingest_status"] == "ready"
    assert properties["chunk_count"] > 1
    assert properties["source_version_id"]


def test_a_source_the_twin_cannot_read_is_marked_rather_than_failed(
    client: fastapi.testclient.TestClient,
) -> None:
    node: dict = _upload(
        client,
        filename="photo.png",
        content_type="image/png",
        body=b"\x89PNG\r\n\x1a\n" + b"\x00" * 64,
    )

    assert node["properties"]["ingest_status"] == "unsupported"
    assert node["properties"]["chunk_count"] == 0


def test_re_registering_identical_content_does_not_duplicate_chunks(
    client: fastapi.testclient.TestClient,
) -> None:
    first: dict = _upload(client)
    second: dict = _upload(client)

    assert second["properties"]["chunk_count"] == first["properties"]["chunk_count"]
    # Distinct uploads get distinct keys, so these are distinct source objects;
    # the guarantee is that neither grew a second competing set of chunks.
    assert second["properties"]["source_version_id"] != first["properties"]["source_version_id"]


def test_registering_a_key_outside_your_vault_is_refused(
    client: fastapi.testclient.TestClient,
) -> None:
    node: dict = _upload(client)
    key: str = node["source_ref"]["object_store_key"]

    stolen: httpx.Response = client.post(
        "/v1/vault/nodes",
        headers=OTHER_OWNER_HEADERS,
        json={"key": key, "filename": "doctrine.md"},
    )

    assert stolen.status_code == 403


def test_a_plain_text_upload_is_chunked_the_same_way(
    client: fastapi.testclient.TestClient,
) -> None:
    node: dict = _upload(client, filename="notes.txt", content_type="text/plain")
    assert node["properties"]["ingest_status"] == "ready"
    assert node["properties"]["chunk_count"] >= 1
