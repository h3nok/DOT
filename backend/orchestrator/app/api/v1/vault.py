import typing
import uuid
import datetime

import fastapi
import pydantic

import app.auth.dependencies
import app.integrations.object_store

router = fastapi.APIRouter(prefix="/v1/vault", tags=["vault"])


class UploadUrlRequest(pydantic.BaseModel):
    filename: str
    content_type: str
    size: int


class UploadUrlResponse(pydantic.BaseModel):
    url: str
    key: str
    

@router.post("/upload-url", response_model=UploadUrlResponse)
async def generate_upload_url(
    payload: UploadUrlRequest,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
) -> UploadUrlResponse:
    app.auth.dependencies.ensure_write_scope(owner)
    
    ext = payload.filename.split(".")[-1] if "." in payload.filename else ""
    file_id = str(uuid.uuid4())
    key = f"vault/{owner.owner_id}/{file_id}.{ext}" if ext else f"vault/{owner.owner_id}/{file_id}"
    
    # In a full S3 setup, we would call s3.generate_presigned_url('put_object', Params={'Bucket': bucket, 'Key': key})
    # Since we support local FilesystemObjectStore, we provide a proxy route.
    
    # Let's assume the API is hosted at localhost:8000 for local, and behind a proxy in prod.
    # The frontend is configured to proxy /api -> orchestrator.
    url = f"/api/v1/vault/upload/{key}"
    
    return UploadUrlResponse(url=url, key=key)


@router.put("/upload/{key:path}")
async def upload_file(
    key: str,
    request: fastapi.Request,
):
    """
    Local proxy for putting files into the object store. 
    This acts as a replacement for a direct-to-S3 presigned URL when using local filesystem.
    """
    store = app.integrations.object_store.get_object_store()
    
    # Read the raw body
    body = await request.body()
    
    # Write to store
    if hasattr(store, "put_bytes"):
        # For S3 we could pass content type, but local doesn't care
        await store.put_bytes(key, body)
    else:
        raise fastapi.HTTPException(status_code=500, detail="Object store does not support put_bytes")
        
    return {"message": "Success", "key": key}


class RegisterNodeRequest(pydantic.BaseModel):
    key: str
    filename: str
    metadata: typing.Optional[dict[str, typing.Any]] = None

@router.post("/nodes")
async def register_node(
    payload: RegisterNodeRequest,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
):
    """
    Registers an uploaded file in the vault. 
    For MVP, we just return the node info. In a full graph implementation, 
    this would insert a DotNode into the database.
    """
    app.auth.dependencies.ensure_write_scope(owner)
    
    # We could insert into a DB here.
    # For now, just return success so the frontend knows it's processed.
    return {
        "id": f"node_{uuid.uuid4().hex[:8]}",
        "key": payload.key,
        "filename": payload.filename,
        "status": "ready"
    }
