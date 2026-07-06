from datetime import datetime

from pydantic import BaseModel, Field


class PublicationProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=256)
    slug: str | None = Field(default=None, max_length=256)
    type: str = Field(default="book", max_length=32)
    visibility: str = Field(default="private", max_length=32)


class PublicationProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=256)
    status: str | None = Field(default=None, max_length=32)
    visibility: str | None = Field(default=None, max_length=32)


class PublicationProjectRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    owner_id: str
    type: str
    title: str
    slug: str
    status: str
    visibility: str
    created_at: datetime
    updated_at: datetime | None


class PublicationSectionCreate(BaseModel):
    parent_id: str | None = None
    order: int = Field(default=0, ge=0)
    title: str = Field(min_length=1, max_length=256)
    body_ref: str | None = Field(default=None, max_length=512)


class PublicationSectionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=256)
    body_ref: str | None = Field(default=None, max_length=512)
    status: str | None = Field(default=None, max_length=32)
    order: int | None = Field(default=None, ge=0)


class PublicationSectionRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    project_id: str
    parent_id: str | None
    section_order: int
    title: str
    body_ref: str | None
    status: str
    created_at: datetime
    updated_at: datetime | None


class PublicationRevisionCreate(BaseModel):
    body_ref: str = Field(min_length=1, max_length=512)
    message: str | None = Field(default=None, max_length=1000)


class PublicationRevisionRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    section_id: str
    editor_id: str
    body_ref: str
    message: str | None
    created_at: datetime


class PublicationReleaseCreate(BaseModel):
    slug: str | None = Field(default=None, max_length=256)


class PublicationReleaseRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    project_id: str
    version: int
    slug: str
    status: str
    manifest_key: str
    rendered_at: datetime | None
    published_at: datetime | None
    revoked_at: datetime | None


class PublicationValidationRead(BaseModel):
    valid: bool
    errors: list[str]
