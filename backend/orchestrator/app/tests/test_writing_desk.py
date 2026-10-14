"""Real API boundaries for private artwork and immutable publication."""

from __future__ import annotations

import base64
import io
import uuid

import pytest
from PIL import Image

from app.tests.test_academy_kernel import _headers, _provision


def image_bytes(width=1600, height=900):
    output = io.BytesIO()
    Image.new("RGB", (width, height), "#4a6675").save(output, format="PNG")
    return output.getvalue()


def draft_payload():
    encoded = base64.b64encode(image_bytes()).decode()
    return {
        "request_id": str(uuid.uuid4()),
        "base_revision_id": None,
        "title": "Synthetic publication",
        "summary": "A fixture, never a real post.",
        "body": (
            "Fixture manuscript.\n\n![A test illustration][figure]\n\n[figure]: post/figure.png"
        ),
        "claims": [
            {
                "statement": "A synthetic claim.",
                "level": "Model",
                "origin": "author_originated",
                "source": "",
            }
        ],
        "presentation": {
            "format": "case-study",
            "series": "Fixture series",
            "cover": {
                "path": "post/banner.png",
                "alt": "A plain test banner",
                "caption": "Synthetic artwork",
            },
        },
        "assets": [
            {"path": f"post/{name}.png", "data_base64": encoded}
            for name in ("banner", "figure", "unused")
        ],
    }


async def work(client, session_factory):
    space = await _provision(session_factory)
    response = client.post(
        f"/v1/academy/spaces/{space.id}/works",
        headers=_headers(),
        json={"kind": "essay", "canonical_slug": f"fixture-{uuid.uuid4().hex[:12]}"},
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


async def test_private_then_only_referenced_artwork_is_published(client, session_factory):
    work_id = await work(client, session_factory)
    payload = draft_payload()
    saved = client.post(f"/v1/academy/works/{work_id}/drafts", headers=_headers(), json=payload)
    assert saved.status_code == 201, saved.text
    revision_id = saved.json()["id"]
    editor = client.get(
        f"/v1/academy/revisions/{revision_id}/body?include_claims=true", headers=_headers()
    ).json()
    assert editor["body"] == payload["body"]
    assert editor["claims"] == payload["claims"]
    assert len(editor["assets"]) == 3
    for asset in editor["assets"]:
        assert client.get(asset["src"]).status_code == 401
        assert client.get(asset["src"], headers=_headers("outsider")).status_code in {403, 404}
        private = client.get(asset["src"], headers=_headers())
        assert private.content == image_bytes()
        assert private.headers["Cache-Control"] == "private, no-store"
    assert client.get(f"/v1/academy/delivery/works/{work_id}").status_code == 404
    released = client.post(
        f"/v1/academy/works/{work_id}/releases",
        headers=_headers(),
        json={"revision_id": revision_id},
    )
    assert released.status_code == 201, released.text
    manifest = client.get(f"/v1/academy/delivery/works/{work_id}").json()["manifest"]
    assert {asset["path"] for asset in manifest["assets"]} == {"post/banner.png", "post/figure.png"}
    for asset in manifest["assets"]:
        assert "object_key" not in asset
        assert client.get(asset["src"]).content == image_bytes()
    unused = next(asset for asset in editor["assets"] if asset["path"] == "post/unused.png")
    assert (
        client.get(
            f"/v1/academy/delivery/works/{work_id}/releases/1/media/{unused['id']}"
        ).status_code
        == 404
    )
    catalog = client.get("/v1/academy/delivery/catalog").json()[0]
    assert catalog["cover"]["alt"] == "A plain test banner"
    assert catalog["presentation"]["series"] == "Fixture series"
    withdrawn = client.post(
        f"/v1/academy/releases/{released.json()['id']}/withdraw",
        headers=_headers(),
        json={"reason": "Test withdrawal"},
    )
    assert withdrawn.status_code == 200, withdrawn.text
    assert client.get(manifest["assets"][0]["src"]).status_code == 404


async def test_save_conflicts_retries_and_exact_revision_release(client, session_factory):
    work_id = await work(client, session_factory)
    payload = draft_payload()
    path = f"/v1/academy/works/{work_id}"
    first = client.post(f"{path}/drafts", headers=_headers(), json=payload).json()
    retry = client.post(f"{path}/drafts", headers=_headers(), json=payload)
    assert retry.json()["id"] == first["id"]
    assert (
        client.post(
            f"{path}/drafts", headers=_headers(), json={**payload, "title": "Changed"}
        ).status_code
        == 409
    )
    newer = {**payload, "request_id": str(uuid.uuid4()), "body": "A later manuscript."}
    assert client.post(f"{path}/drafts", headers=_headers(), json=newer).status_code == 409
    newer["base_revision_id"] = first["id"]
    newer["assets"] = [
        {"path": asset["path"], "source_revision_id": first["id"]} for asset in payload["assets"]
    ]
    second = client.post(f"{path}/drafts", headers=_headers(), json=newer)
    assert second.status_code == 201, second.text
    assert second.json()["revision_number"] == 2
    for _ in range(2):
        release = client.post(
            f"{path}/releases", headers=_headers(), json={"revision_id": first["id"]}
        )
        assert release.status_code == 201, release.text
        assert release.json()["release_number"] == 1
    public = client.get(f"/v1/academy/delivery/works/{work_id}").json()
    assert client.get(f"/v1/academy/delivery/body/{public['body_ref']}").text == payload["body"]
    assert public["manifest"]["revision"]["id"] == first["id"]
    assert (
        client.post(
            f"{path}/releases", headers=_headers(), json={"revision_id": second.json()["id"]}
        ).json()["release_number"]
        == 2
    )


@pytest.mark.parametrize(
    "problem", ["incomplete-claim", "missing-image", "remote-image", "missing-alt", "banner-alt"]
)
async def test_incomplete_drafts_save_but_cannot_release(client, session_factory, problem):
    work_id = await work(client, session_factory)
    payload = draft_payload()
    if problem == "incomplete-claim":
        payload["claims"][0]["level"] = ""
    elif problem == "missing-image":
        payload["assets"] = []
    elif problem == "remote-image":
        payload["body"] = "![Remote tracker](https://external.example/image.png)"
    elif problem == "missing-alt":
        payload["body"] = "![](post/figure.png)"
    else:
        payload["presentation"]["cover"]["alt"] = ""
    saved = client.post(f"/v1/academy/works/{work_id}/drafts", headers=_headers(), json=payload)
    assert saved.status_code == 201, saved.text
    released = client.post(
        f"/v1/academy/works/{work_id}/releases",
        headers=_headers(),
        json={"revision_id": saved.json()["id"]},
    )
    assert released.status_code in {409, 422}, released.text
    assert client.get("/v1/academy/delivery/catalog").json() == []


@pytest.mark.parametrize(
    "problem", ["bad-bytes", "too-large", "too-wide", "wrong-extension", "duplicate", "bad-base64"]
)
async def test_invalid_artwork_never_saves_a_revision(client, session_factory, problem):
    work_id = await work(client, session_factory)
    payload = draft_payload()
    asset = payload["assets"][0]
    if problem == "bad-bytes":
        asset["data_base64"] = base64.b64encode(b"not an image").decode()
    elif problem == "too-large":
        asset["data_base64"] = base64.b64encode(b"x" * 750_001).decode()
    elif problem == "too-wide":
        asset["data_base64"] = base64.b64encode(image_bytes(6001, 10)).decode()
    elif problem == "wrong-extension":
        asset["path"] = "banner.jpg"
    elif problem == "duplicate":
        payload["assets"].append(asset.copy())
    else:
        asset["data_base64"] = "not base64!"
    response = client.post(f"/v1/academy/works/{work_id}/drafts", headers=_headers(), json=payload)
    assert response.status_code == 422, response.text
    assert client.get(f"/v1/academy/works/{work_id}/revisions", headers=_headers()).json() == []


async def test_failed_annotation_rolls_back_entire_private_revision(
    client, session_factory, monkeypatch
):
    import fastapi

    import app.domains.academy.service as service

    work_id = await work(client, session_factory)

    async def fail(*args, **kwargs):
        raise fastapi.HTTPException(status_code=503, detail="Fixture annotation failure")

    monkeypatch.setattr(service, "add_claim", fail)
    response = client.post(
        f"/v1/academy/works/{work_id}/drafts", headers=_headers(), json=draft_payload()
    )
    assert response.status_code == 503
    assert client.get(f"/v1/academy/works/{work_id}/revisions", headers=_headers()).json() == []
    assert client.get("/v1/academy/delivery/catalog").json() == []


async def test_image_references_cannot_cross_work_boundaries(client, session_factory):
    first_work = await work(client, session_factory)
    payload = draft_payload()
    saved = client.post(
        f"/v1/academy/works/{first_work}/drafts", headers=_headers(), json=payload
    ).json()
    second_work = await work(client, session_factory)
    payload["request_id"] = str(uuid.uuid4())
    payload["assets"] = [{"path": "post/banner.png", "source_revision_id": saved["id"]}]
    response = client.post(
        f"/v1/academy/works/{second_work}/drafts", headers=_headers(), json=payload
    )
    assert response.status_code == 404
    assert client.get(f"/v1/academy/works/{second_work}/revisions", headers=_headers()).json() == []


async def test_invalid_upload_bytes_never_enter_validation_logs(client, session_factory, caplog):
    work_id = await work(client, session_factory)
    payload = draft_payload()
    payload["assets"][0]["data_base64"] = "private-image-sentinel-" + "x" * 1_000_000
    response = client.post(f"/v1/academy/works/{work_id}/drafts", headers=_headers(), json=payload)
    assert response.status_code == 422
    assert "private-image-sentinel" not in caplog.text
    assert "Fixture manuscript" not in caplog.text


async def test_artwork_release_failure_does_not_make_a_draft_public(
    client, session_factory, monkeypatch
):
    import app.domains.academy.writing_media as media
    import app.integrations.object_store as storage

    work_id = await work(client, session_factory)
    saved = client.post(
        f"/v1/academy/works/{work_id}/drafts", headers=_headers(), json=draft_payload()
    ).json()

    async def fail(**kwargs):
        raise storage.ObjectStoreError("Fixture artwork copy failure")

    monkeypatch.setattr(media, "copy_release_assets", fail)
    response = client.post(
        f"/v1/academy/works/{work_id}/releases",
        headers=_headers(),
        json={"revision_id": saved["id"]},
    )
    assert response.status_code == 502
    assert client.get(f"/v1/academy/delivery/works/{work_id}").status_code == 404
    assert client.get("/v1/academy/delivery/catalog").json() == []
    assert len(client.get(f"/v1/academy/works/{work_id}/revisions", headers=_headers()).json()) == 1
