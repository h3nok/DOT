import datetime

import pydantic


class PublicationProjectCreate(pydantic.BaseModel):
    title: str = pydantic.Field(min_length=1, max_length=256)
    slug: str | None = pydantic.Field(default=None, max_length=256)
    type: str = pydantic.Field(default="book", max_length=32)
    visibility: str = pydantic.Field(default="private", max_length=32)
    meta: dict | None = None


class PublicationProjectUpdate(pydantic.BaseModel):
    title: str | None = pydantic.Field(default=None, min_length=1, max_length=256)
    status: str | None = pydantic.Field(default=None, max_length=32)
    visibility: str | None = pydantic.Field(default=None, max_length=32)
    meta: dict | None = None


class PublicationProjectRead(pydantic.BaseModel):
    model_config: pydantic.ConfigDict = {"from_attributes": True}

    id: str
    owner_id: str
    type: str
    title: str
    slug: str
    status: str
    visibility: str
    meta: dict | None
    created_at: datetime.datetime
    updated_at: datetime.datetime | None


class PublicationSectionCreate(pydantic.BaseModel):
    parent_id: str | None = None
    order: int = pydantic.Field(default=0, ge=0)
    title: str = pydantic.Field(min_length=1, max_length=256)
    body_ref: str | None = pydantic.Field(default=None, max_length=512)
    meta: dict | None = None


class PublicationSectionUpdate(pydantic.BaseModel):
    title: str | None = pydantic.Field(default=None, min_length=1, max_length=256)
    body_ref: str | None = pydantic.Field(default=None, max_length=512)
    status: str | None = pydantic.Field(default=None, max_length=32)
    order: int | None = pydantic.Field(default=None, ge=0)
    meta: dict | None = None


class PublicationSectionRead(pydantic.BaseModel):
    model_config: pydantic.ConfigDict = {"from_attributes": True}

    id: str
    project_id: str
    parent_id: str | None
    section_order: int
    title: str
    body_ref: str | None
    status: str
    meta: dict | None
    created_at: datetime.datetime
    updated_at: datetime.datetime | None


class PublicationRevisionCreate(pydantic.BaseModel):
    body_ref: str = pydantic.Field(min_length=1, max_length=512)
    message: str | None = pydantic.Field(default=None, max_length=1000)


class PublicationRevisionRead(pydantic.BaseModel):
    model_config: pydantic.ConfigDict = {"from_attributes": True}

    id: str
    section_id: str
    editor_id: str
    body_ref: str
    message: str | None
    created_at: datetime.datetime


class PublicationReleaseCreate(pydantic.BaseModel):
    slug: str | None = pydantic.Field(default=None, max_length=256)


class PublicationReleaseRead(pydantic.BaseModel):
    model_config: pydantic.ConfigDict = {"from_attributes": True}

    id: str
    project_id: str
    version: int
    slug: str
    status: str
    manifest_key: str
    rendered_at: datetime.datetime | None
    published_at: datetime.datetime | None
    revoked_at: datetime.datetime | None


class PublicationValidationRead(pydantic.BaseModel):
    valid: bool
    errors: list[str]
