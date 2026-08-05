import fastapi.testclient
import httpx

OWNER_HEADERS: dict[str, str] = {"X-Owner-Id": "owner_1"}
OTHER_OWNER_HEADERS: dict[str, str] = {"X-Owner-Id": "owner_2"}


def create_ready_project(
    client: fastapi.testclient.TestClient, visibility: str = "private"
) -> tuple[dict, dict]:
    project = client.post(
        "/v1/publications/projects",
        headers=OWNER_HEADERS,
        json={"title": "Habte Book", "visibility": visibility},
    ).json()
    section_response: httpx.Response = client.post(
        f"/v1/publications/projects/{project['id']}/sections",
        headers=OWNER_HEADERS,
        json={"title": "Chapter 1", "body_ref": "objects/drafts/chapter-1.md"},
    )
    assert section_response.status_code == 201
    return project, section_response.json()


def test_publication_project_requires_owner(client: fastapi.testclient.TestClient) -> None:
    response: httpx.Response = client.post("/v1/publications/projects", json={"title": "Book"})

    assert response.status_code == 401


def test_publication_project_is_owner_scoped(client: fastapi.testclient.TestClient) -> None:
    create_response: httpx.Response = client.post(
        "/v1/publications/projects",
        headers=OWNER_HEADERS,
        json={"title": "Habte Book"},
    )
    assert create_response.status_code == 201
    project_id = create_response.json()["id"]

    forbidden_response: httpx.Response = client.get(
        f"/v1/publications/projects/{project_id}",
        headers=OTHER_OWNER_HEADERS,
    )
    assert forbidden_response.status_code == 404


def test_publication_release_requires_valid_sections(client: fastapi.testclient.TestClient) -> None:
    project = client.post(
        "/v1/publications/projects",
        headers=OWNER_HEADERS,
        json={"title": "Habte Book"},
    ).json()

    invalid_release: httpx.Response = client.post(
        f"/v1/publications/projects/{project['id']}/releases",
        headers=OWNER_HEADERS,
        json={},
    )
    assert invalid_release.status_code == 409

    section_response: httpx.Response = client.post(
        f"/v1/publications/projects/{project['id']}/sections",
        headers=OWNER_HEADERS,
        json={"title": "Chapter 1", "body_ref": "objects/drafts/chapter-1.md"},
    )
    assert section_response.status_code == 201

    valid_release: httpx.Response = client.post(
        f"/v1/publications/projects/{project['id']}/releases",
        headers=OWNER_HEADERS,
        json={},
    )
    assert valid_release.status_code == 201
    assert valid_release.json()["version"] == 1
    assert valid_release.json()["status"] == "published"


def test_publication_release_writes_immutable_manifest(
    client: fastapi.testclient.TestClient,
) -> None:
    project, section = create_ready_project(client)

    response: httpx.Response = client.post(
        f"/v1/publications/projects/{project['id']}/releases",
        headers=OWNER_HEADERS,
        json={},
    )

    assert response.status_code == 201
    release = response.json()
    manifest_response: httpx.Response = client.get(
        f"/v1/publications/projects/{project['id']}/releases/1/manifest",
        headers=OWNER_HEADERS,
    )
    assert manifest_response.status_code == 200
    assert manifest_response.json()["schema_version"] == "publication.release.v1"
    assert manifest_response.json()["project"]["id"] == project["id"]
    assert manifest_response.json()["project"]["slug"] == "habte-book"
    assert manifest_response.json()["release"]["id"] == release["id"]
    assert manifest_response.json()["release"]["manifest_key"] == release["manifest_key"]
    manifest_sections = manifest_response.json()["sections"]
    assert len(manifest_sections) == 1
    snapshot = manifest_sections[0]
    assert snapshot["id"] == section["id"]
    assert snapshot["parent_id"] is None
    assert snapshot["order"] == 0
    assert snapshot["title"] == "Chapter 1"
    assert snapshot["status"] == "draft"
    # Bodies are snapshotted into the immutable release namespace.
    assert snapshot["body_ref"].startswith("releases/owner_1/habte-book/v1/sections/")
    body_response: httpx.Response = client.get(
        f"/v1/publications/delivery/body/{snapshot['body_ref']}"
    )
    assert body_response.status_code == 200
    assert body_response.headers["cache-control"] == "public, max-age=86400, immutable"


def test_publication_release_is_idempotent(client: fastapi.testclient.TestClient) -> None:
    project, _section = create_ready_project(client)
    headers: dict[str, str] = {**OWNER_HEADERS, "Idempotency-Key": "publish-habte-book-v1"}

    first_response: httpx.Response = client.post(
        f"/v1/publications/projects/{project['id']}/releases",
        headers=headers,
        json={},
    )
    second_response: httpx.Response = client.post(
        f"/v1/publications/projects/{project['id']}/releases",
        headers=headers,
        json={},
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert second_response.json()["id"] == first_response.json()["id"]
    assert second_response.json()["version"] == 1

    releases_response: httpx.Response = client.get(
        f"/v1/publications/projects/{project['id']}/releases",
        headers=OWNER_HEADERS,
    )
    assert releases_response.status_code == 200
    assert len(releases_response.json()) == 1


def test_publication_delivery_manifest_is_public_by_owner_and_slug(
    client: fastapi.testclient.TestClient,
) -> None:
    project, _section = create_ready_project(client, visibility="public")
    release_response: httpx.Response = client.post(
        f"/v1/publications/projects/{project['id']}/releases",
        headers=OWNER_HEADERS,
        json={},
    )
    assert release_response.status_code == 201

    manifest_response: httpx.Response = client.get(
        "/v1/publications/delivery/owner_1/habte-book/manifest"
    )

    assert manifest_response.status_code == 200
    assert manifest_response.json()["project"]["id"] == project["id"]
    assert manifest_response.json()["release"]["id"] == release_response.json()["id"]


def test_publication_delivery_manifest_hides_private_projects(
    client: fastapi.testclient.TestClient,
) -> None:
    project, _section = create_ready_project(client, visibility="private")
    release_response: httpx.Response = client.post(
        f"/v1/publications/projects/{project['id']}/releases",
        headers=OWNER_HEADERS,
        json={},
    )
    assert release_response.status_code == 201

    manifest_response: httpx.Response = client.get(
        "/v1/publications/delivery/owner_1/habte-book/manifest"
    )

    assert manifest_response.status_code == 404


def test_publication_delivery_manifest_requires_published_release(
    client: fastapi.testclient.TestClient,
) -> None:
    project_response: httpx.Response = client.post(
        "/v1/publications/projects",
        headers=OWNER_HEADERS,
        json={"title": "Unpublished Book"},
    )
    assert project_response.status_code == 201

    manifest_response: httpx.Response = client.get(
        "/v1/publications/delivery/owner_1/unpublished-book/manifest"
    )

    assert manifest_response.status_code == 404


def test_section_body_upload_and_release_snapshot(
    client: fastapi.testclient.TestClient,
) -> None:
    project = client.post(
        "/v1/publications/projects",
        headers=OWNER_HEADERS,
        json={
            "title": "Meta Book",
            "visibility": "public",
            "meta": {"author": "Habte", "reader_contract": {"finite": True}},
        },
    ).json()
    assert project["meta"]["author"] == "Habte"

    section = client.post(
        f"/v1/publications/projects/{project['id']}/sections",
        headers=OWNER_HEADERS,
        json={
            "title": "Preface",
            "meta": {"kind": "preface", "part": "Opening", "word_count": 3},
        },
    ).json()
    assert section["meta"]["kind"] == "preface"

    upload: httpx.Response = client.put(
        f"/v1/publications/sections/{section['id']}/body",
        headers={**OWNER_HEADERS, "Content-Type": "text/markdown"},
        content="# Preface\n\nThe observer belongs in the inquiry.",
    )
    assert upload.status_code == 200
    assert upload.json()["body_ref"].startswith("drafts/")

    release: httpx.Response = client.post(
        f"/v1/publications/projects/{project['id']}/releases",
        headers=OWNER_HEADERS,
        json={},
    )
    assert release.status_code == 201

    manifest = client.get(
        f"/v1/publications/delivery/owner_1/{project['slug']}/manifest"
    ).json()
    assert manifest["project"]["meta"]["author"] == "Habte"
    manifest_section = manifest["sections"][0]
    assert manifest_section["meta"]["kind"] == "preface"
    assert manifest_section["body_ref"].startswith(
        f"releases/owner_1/{project['slug']}/v1/sections/"
    )

    body: httpx.Response = client.get(
        f"/v1/publications/delivery/body/{manifest_section['body_ref']}"
    )
    assert body.status_code == 200
    assert "observer belongs in the inquiry" in body.text

    # Draft namespace must never be publicly readable.
    draft_leak: httpx.Response = client.get(
        f"/v1/publications/delivery/body/{upload.json()['body_ref']}"
    )
    assert draft_leak.status_code == 404
