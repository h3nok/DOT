from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class FootprintAccountCreate(BaseModel):
    platform: str = Field(min_length=1, max_length=64)
    handle: str = Field(min_length=1, max_length=256)
    display_name: str | None = Field(default=None, max_length=256)
    profile_url: str | None = Field(default=None, max_length=1024)
    external_id: str | None = Field(default=None, max_length=256)
    auth_mode: str = Field(default="manual", max_length=32)
    status: str = Field(default="active", max_length=32)
    sync_cursor: dict[str, Any] | None = None


class FootprintAccountRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    owner_id: str
    platform: str
    handle: str
    display_name: str | None
    profile_url: str | None
    external_id: str | None
    auth_mode: str
    status: str
    sync_cursor: dict[str, Any] | None
    last_synced_at: datetime | None
    revoked_at: datetime | None
    created_at: datetime
    updated_at: datetime | None


class FootprintNodeCreate(BaseModel):
    kind: str = Field(min_length=1, max_length=64)
    label: str = Field(min_length=1, max_length=512)
    platform: str | None = Field(default=None, max_length=64)
    external_id: str | None = Field(default=None, max_length=256)
    source_ref: dict[str, Any] | None = None
    properties: dict[str, Any] | None = None
    visibility: str = Field(default="private", max_length=32)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class FootprintNodeRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    owner_id: str
    kind: str
    label: str
    platform: str | None
    external_id: str | None
    source_ref: dict[str, Any] | None
    properties: dict[str, Any] | None
    visibility: str
    confidence: float
    first_seen_at: datetime
    last_seen_at: datetime | None
    created_at: datetime
    updated_at: datetime | None


class FootprintEdgeCreate(BaseModel):
    source_node_id: str = Field(min_length=1, max_length=64)
    target_node_id: str = Field(min_length=1, max_length=64)
    relation: str = Field(min_length=1, max_length=64)
    platform: str | None = Field(default=None, max_length=64)
    weight: float = Field(default=1.0, ge=0.0)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    evidence_ref: dict[str, Any] | None = None


class FootprintEdgeRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    owner_id: str
    source_node_id: str
    target_node_id: str
    relation: str
    platform: str | None
    weight: float
    confidence: float
    evidence_ref: dict[str, Any] | None
    first_seen_at: datetime
    last_seen_at: datetime | None
    created_at: datetime
    updated_at: datetime | None


class FootprintImportCreate(BaseModel):
    connector: str = Field(min_length=1, max_length=64)
    import_mode: str = Field(default="manual", max_length=32)
    account_id: str | None = Field(default=None, max_length=64)
    source_ref: dict[str, Any] | None = None


class FootprintImportProcessRequest(BaseModel):
    feed_xml: str | None = Field(default=None, max_length=2_000_000)


class FootprintImportRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    owner_id: str
    account_id: str | None
    run_id: str | None
    connector: str
    import_mode: str
    status: str
    requested_by: str | None
    source_ref: dict[str, Any] | None
    summary: dict[str, Any] | None
    created_at: datetime
    completed_at: datetime | None


class FootprintGraphSnapshot(BaseModel):
    owner_id: str
    accounts: list[FootprintAccountRead]
    nodes: list[FootprintNodeRead]
    edges: list[FootprintEdgeRead]
