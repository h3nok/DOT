import re
import typing
import uuid

import fastapi
import pydantic
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.db.session
import app.domains.graph.schemas
import app.domains.graph.service
import app.domains.knowledge.service
import app.integrations.object_store
from app.db.models import FootprintNode

router = fastapi.APIRouter(
    prefix="/v1/vault",
    tags=["vault"],
    # Binds every request in this router to the caller's tenant (ADR-0011).
    dependencies=[fastapi.Depends(app.db.session.get_tenant_session)],
)

MAX_UPLOAD_BYTES = 64 * 1024 * 1024
_SAFE_EXT: re.Pattern[str] = re.compile(r"^[A-Za-z0-9]{1,12}$")


class UploadUrlRequest(pydantic.BaseModel):
    filename: str = pydantic.Field(min_length=1, max_length=512)
    content_type: str = pydantic.Field(min_length=1, max_length=255)
    size: int = pydantic.Field(ge=0, le=MAX_UPLOAD_BYTES)


class UploadUrlResponse(pydantic.BaseModel):
    url: str
    key: str


def _vault_prefix(owner_id: str) -> str:
    return f"vault/{owner_id}/"


def _require_own_key(key: str, owner: app.auth.dependencies.OwnerContext) -> str:
    """Reject keys outside the caller's vault prefix, and any traversal attempt."""

    if ".." in key or key.startswith("/") or "\\" in key:
        raise fastapi.HTTPException(status_code=400, detail="Invalid object key.")
    if not key.startswith(_vault_prefix(owner.owner_id)):
        raise fastapi.HTTPException(status_code=403, detail="Object key is outside your vault.")
    return key


@router.post("/upload-url", response_model=UploadUrlResponse)
async def generate_upload_url(
    payload: UploadUrlRequest,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
) -> UploadUrlResponse:
    app.auth.dependencies.ensure_write_scope(owner)

    raw_ext: str = payload.filename.rsplit(".", 1)[-1] if "." in payload.filename else ""
    ext: str = raw_ext.lower() if _SAFE_EXT.match(raw_ext) else ""
    file_id: str = uuid.uuid4().hex
    key: str = f"{_vault_prefix(owner.owner_id)}{file_id}" + (f".{ext}" if ext else "")

    # Filesystem store has no presigned URLs, so uploads proxy back through this
    # service. The S3 path should be swapped for a real presigned PUT.
    return UploadUrlResponse(url=f"/api/v1/vault/upload/{key}", key=key)


@router.put("/upload/{key:path}")
async def upload_file(
    key: str,
    request: fastapi.Request,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
) -> dict[str, str]:
    app.auth.dependencies.ensure_write_scope(owner)
    safe_key: str = _require_own_key(key, owner)

    declared: str = request.headers.get("content-length", "")
    if declared.isdigit() and int(declared) > MAX_UPLOAD_BYTES:
        raise fastapi.HTTPException(status_code=413, detail="Upload exceeds the size limit.")

    body: bytes = await request.body()
    if len(body) > MAX_UPLOAD_BYTES:
        raise fastapi.HTTPException(status_code=413, detail="Upload exceeds the size limit.")

    store: (
        app.integrations.object_store.FilesystemObjectStore
        | app.integrations.object_store.S3ObjectStore
    ) = app.integrations.object_store.get_object_store()
    await store.put_bytes(safe_key, body)
    return {"key": safe_key}


class RegisterNodeRequest(pydantic.BaseModel):
    key: str = pydantic.Field(min_length=1, max_length=1024)
    filename: str = pydantic.Field(min_length=1, max_length=512)
    metadata: dict[str, typing.Any] | None = None


@router.post("/nodes", response_model=app.domains.graph.schemas.FootprintNodeRead, status_code=201)
async def register_node(
    payload: RegisterNodeRequest,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> FootprintNode:
    """Land an uploaded file in the member's footprint graph as a source node."""

    app.auth.dependencies.ensure_write_scope(owner)
    safe_key: str = _require_own_key(payload.key, owner)
    metadata: dict[str, typing.Any] = dict(payload.metadata or {})

    # Ingest inline: a file the twin cannot read yet is a file the member has to
    # wonder about. Bounded by the upload limit, so this stays a short request.
    try:
        result = await app.domains.knowledge.service.ingest_object(
            session,
            owner,
            object_store_key=safe_key,
            filename=payload.filename,
            mime_type=str(metadata.get("content_type") or ""),
            size_bytes=int(metadata.get("size") or 0),
        )
        metadata["ingest_status"] = result.status
        metadata["chunk_count"] = result.chunk_count
        if result.source_version_id:
            metadata["source_version_id"] = result.source_version_id
    except app.domains.knowledge.service.IngestError as exc:
        metadata["ingest_status"] = app.domains.knowledge.service.STATUS_FAILED
        metadata["ingest_error"] = str(exc)
        metadata["chunk_count"] = 0

    return await app.domains.graph.service.create_node(
        session,
        owner,
        app.domains.graph.schemas.FootprintNodeCreate(
            kind="source",
            label=payload.filename,
            platform="vault",
            external_id=safe_key,
            source_ref={"object_store_key": safe_key},
            properties=metadata,
            visibility="private",
        ),
    )
