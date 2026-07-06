from __future__ import annotations

import json
import pathlib
import typing

import aioboto3
from botocore.exceptions import ClientError

import app.settings


class ObjectStoreError(RuntimeError):
    """Raised when an object store operation fails."""


class ObjectNotFoundError(ObjectStoreError):
    """Raised when an object key does not exist."""


class FilesystemObjectStore:
    def __init__(self, root: str | pathlib.Path, bucket: str) -> None:
        self.root: pathlib.Path = pathlib.Path(root).expanduser()
        self.bucket: str = bucket

    def _path_for(self, key: str) -> pathlib.Path:
        bucket_root: pathlib.Path = (self.root / self.bucket).resolve()
        path: pathlib.Path = (bucket_root / key).resolve()
        try:
            path.relative_to(bucket_root)
        except ValueError as exc:
            raise ObjectStoreError(f"Object key escapes storage root: {key}") from exc
        return path

    async def put_json(self, key: str, payload: dict[str, typing.Any]) -> None:
        path: pathlib.Path = self._path_for(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path: pathlib.Path = path.with_name(f".{path.name}.tmp")
        try:
            tmp_path.write_text(
                json.dumps(payload, indent=2, sort_keys=True) + "\n",
                encoding="utf-8",
            )
            tmp_path.replace(path)
        except OSError as exc:
            raise ObjectStoreError(f"Could not write object: {key}") from exc

    async def put_bytes(self, key: str, data: bytes) -> None:
        path: pathlib.Path = self._path_for(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path: pathlib.Path = path.with_name(f".{path.name}.tmp")
        try:
            tmp_path.write_bytes(data)
            tmp_path.replace(path)
        except OSError as exc:
            raise ObjectStoreError(f"Could not write object: {key}") from exc

    async def get_json(self, key: str) -> dict[str, typing.Any]:
        path: pathlib.Path = self._path_for(key)
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError as exc:
            raise ObjectNotFoundError(f"Object not found: {key}") from exc
        except (OSError, json.JSONDecodeError) as exc:
            raise ObjectStoreError(f"Could not read object: {key}") from exc


class S3ObjectStore:
    def __init__(
        self,
        bucket: str,
        endpoint_url: str | None,
        region_name: str,
        aws_access_key_id: str | None,
        aws_secret_access_key: str | None,
    ) -> None:
        self.bucket = bucket
        self.session = aioboto3.Session(
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region_name,
        )
        self.endpoint_url = endpoint_url

    async def put_json(self, key: str, payload: dict[str, typing.Any]) -> None:
        body = json.dumps(payload, indent=2, sort_keys=True)
        try:
            async with self.session.client("s3", endpoint_url=self.endpoint_url) as s3:
                await s3.put_object(
                    Bucket=self.bucket,
                    Key=key,
                    Body=body.encode("utf-8"),
                    ContentType="application/json",
                )
        except Exception as exc:
            raise ObjectStoreError(f"Could not write object: {key}") from exc

    async def put_bytes(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
        try:
            async with self.session.client("s3", endpoint_url=self.endpoint_url) as s3:
                await s3.put_object(
                    Bucket=self.bucket,
                    Key=key,
                    Body=data,
                    ContentType=content_type,
                )
        except Exception as exc:
            raise ObjectStoreError(f"Could not write object: {key}") from exc

    async def get_json(self, key: str) -> dict[str, typing.Any]:
        try:
            async with self.session.client("s3", endpoint_url=self.endpoint_url) as s3:
                response = await s3.get_object(Bucket=self.bucket, Key=key)
                body = await response["Body"].read()
                return json.loads(body.decode("utf-8"))
        except ClientError as exc:
            if exc.response["Error"]["Code"] == "NoSuchKey":
                raise ObjectNotFoundError(f"Object not found: {key}") from exc
            raise ObjectStoreError(f"Could not read object: {key}") from exc
        except (OSError, json.JSONDecodeError) as exc:
            raise ObjectStoreError(f"Could not read object: {key}") from exc


def get_object_store() -> FilesystemObjectStore | S3ObjectStore:
    settings = app.settings.get_settings()
    
    if settings.object_store_backend == "s3":
        return S3ObjectStore(
            bucket=settings.object_store_bucket,
            endpoint_url=settings.object_store_endpoint if settings.object_store_endpoint else None,
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

    return FilesystemObjectStore(
        root=settings.local_object_store_root,
        bucket=settings.object_store_bucket,
    )
