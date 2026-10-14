"""Validated first-party artwork for private revisions and public releases."""

from __future__ import annotations

import base64
import binascii
import hashlib
import io
import pathlib
import typing
import warnings

import fastapi
import markdown_it
import PIL.Image

import app.domains.academy.models as models
import app.domains.academy.writing_schemas as schemas
import app.integrations.object_store

MAX_IMAGE_BYTES = 750_000
MAX_TOTAL_BYTES = 4_000_000
_TYPES = {"PNG": "image/png", "JPEG": "image/jpeg", "WEBP": "image/webp"}
_EXTENSIONS = {".png": "PNG", ".jpg": "JPEG", ".jpeg": "JPEG", ".webp": "WEBP"}


def invalid(message: str) -> typing.NoReturn:
    raise fastapi.HTTPException(status_code=422, detail=message)


def inspect_image(data: bytes, path: str) -> dict:
    if not data or len(data) > MAX_IMAGE_BYTES:
        invalid(f"{path}: each image must be under 750 KB.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", PIL.Image.DecompressionBombWarning)
            with PIL.Image.open(io.BytesIO(data)) as image:
                kind, width, height = image.format, image.width, image.height
                if kind != _EXTENSIONS[pathlib.PurePosixPath(path).suffix]:
                    invalid(f"{path}: image bytes do not match the file extension.")
                if not 1 <= width <= 6000 or not 1 <= height <= 6000:
                    invalid(f"{path}: image dimensions must be at most 6000 pixels.")
                if getattr(image, "is_animated", False):
                    invalid(f"{path}: use a still image.")
                image.verify()
    except fastapi.HTTPException:
        raise
    except (
        OSError,
        ValueError,
        KeyError,
        PIL.Image.DecompressionBombError,
        PIL.Image.DecompressionBombWarning,
    ) as exc:
        raise fastapi.HTTPException(
            status_code=422, detail=f"{path}: the image could not be verified."
        ) from exc
    return {
        "width": width,
        "height": height,
        "media_type": _TYPES[kind],
        "sha256": hashlib.sha256(data).hexdigest(),
        "bytes": len(data),
    }


def decode_upload(asset: schemas.DraftAsset) -> bytes:
    try:
        return base64.b64decode(asset.data_base64 or "", validate=True)
    except (ValueError, binascii.Error) as exc:
        raise fastapi.HTTPException(
            status_code=422, detail=f"{asset.path}: invalid image upload."
        ) from exc


async def store_assets(work: models.AcademyWork, uploads: list[tuple[str, bytes]]) -> list[dict]:
    if sum(len(data) for _, data in uploads) > MAX_TOTAL_BYTES:
        invalid("Images must total at most 4 MB per post.")
    if len({path for path, _ in uploads}) != len(uploads):
        invalid("Two images use the same path. Rename one before saving.")
    verified = [(path, data, inspect_image(data, path)) for path, data in uploads]
    store = app.integrations.object_store.get_object_store()
    result = []
    for path, data, info in verified:
        asset_id = hashlib.sha256(f"{path}:{info['sha256']}".encode()).hexdigest()[:32]
        suffix = pathlib.PurePosixPath(path).suffix
        key = f"academy/{work.academy_space_id}/artwork/{work.id}/{asset_id}{suffix}"
        await store.put_bytes(key, data)
        result.append({"id": asset_id, "path": path, "object_key": key, **info})
    return result


def referenced_images(body: str) -> list[tuple[str, str]]:
    parser = markdown_it.MarkdownIt("commonmark")
    result = []

    def walk(tokens: list) -> None:
        for token in tokens:
            if token.type == "image":
                result.append((token.attrGet("src") or "", token.content.strip()))
            elif token.children:
                walk(token.children)

    walk(parser.parse(body))
    return result


def release_assets(body: str, metadata: dict) -> list[dict]:
    """Only explicit manuscript references can cross the publication boundary."""
    assets = {asset["path"]: asset for asset in metadata.get("assets", [])}
    needed: set[str] = set()
    for path, alt in referenced_images(body):
        path = path.removeprefix("./")
        if path not in assets:
            invalid(
                f"Attach the image referenced by {path}, or remove its image markup. "
                "Remote embeds are not supported."
            )
        if not alt:
            invalid(f"{path}: add a description inside ![...].")
        needed.add(path)
    cover = metadata.get("presentation", {}).get("cover")
    if cover:
        path = cover["path"]
        if path not in assets:
            invalid(f"Attach the banner image {path} before publishing.")
        if not cover["alt"].strip():
            invalid("Describe the banner image before publishing.")
        asset = assets[path]
        if asset["width"] < 1200 or not 1.5 <= asset["width"] / asset["height"] <= 2.2:
            invalid(
                "Use a banner at least 1200 pixels wide, "
                "with a landscape ratio between 1.5:1 and 2.2:1."
            )
        needed.add(path)
    return [assets[path] for path in sorted(needed)]


async def copy_release_assets(
    *,
    body: str,
    metadata: dict,
    work_id: str,
    number: int,
    prefix: str,
) -> dict:
    store = app.integrations.object_store.get_object_store()
    public_assets = []
    for asset in release_assets(body, metadata):
        data = await store.get_bytes(asset["object_key"])
        if hashlib.sha256(data).hexdigest() != asset["sha256"]:
            raise app.integrations.object_store.ObjectStoreError("Saved artwork hash changed.")
        key = f"{prefix}/media/{asset['id']}{pathlib.PurePosixPath(asset['path']).suffix}"
        await store.put_bytes(key, data)
        public_assets.append(
            {
                **{name: value for name, value in asset.items() if name != "object_key"},
                "src": (
                    f"/v1/academy/delivery/works/{work_id}/releases/{number}/media/{asset['id']}"
                ),
            }
        )
    return {"presentation": metadata.get("presentation", {}), "assets": public_assets}


def editor_assets(revision: models.AcademyRevision) -> list[dict]:
    return [
        {
            "id": asset["id"],
            "path": asset["path"],
            "width": asset["width"],
            "height": asset["height"],
            "bytes": asset["bytes"],
            "source_revision_id": revision.id,
            "src": f"/v1/academy/revisions/{revision.id}/media/{asset['id']}",
        }
        for asset in (revision.editor_metadata or {}).get("assets", [])
    ]


def public_artwork(manifest: dict) -> dict:
    """Expose display metadata, never arbitrary object-store read instructions."""
    presentation = manifest.get("presentation", {})
    images = {
        asset["path"]: {
            "src": asset["src"],
            "width": asset["width"],
            "height": asset["height"],
        }
        for asset in manifest.get("assets", [])
    }
    cover = presentation.get("cover")
    return {
        "presentation": presentation,
        "images": images,
        "cover": {**images[cover["path"]], "alt": cover["alt"], "caption": cover["caption"]}
        if cover and cover["path"] in images
        else None,
    }
