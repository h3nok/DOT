import datetime
import typing

import pydantic


class FootprintAccountCreate(pydantic.BaseModel):
    platform: str = pydantic.Field(min_length=1, max_length=64)
    handle: str = pydantic.Field(min_length=1, max_length=256)
    display_name: str | None = pydantic.Field(default=None, max_length=256)
    profile_url: str | None = pydantic.Field(default=None, max_length=1024)
    external_id: str | None = pydantic.Field(default=None, max_length=256)
    auth_mode: str = pydantic.Field(default="manual", max_length=32)
    status: str = pydantic.Field(default="active", max_length=32)
    sync_cursor: dict[str, typing.Any] | None = None


class FootprintAccountRead(pydantic.BaseModel):
    model_config: pydantic.ConfigDict = {"from_attributes": True}

    id: str
    owner_id: str
    platform: str
    handle: str
    display_name: str | None
    profile_url: str | None
    external_id: str | None
    auth_mode: str
    status: str
    sync_cursor: dict[str, typing.Any] | None
    last_synced_at: datetime.datetime | None
    revoked_at: datetime.datetime | None
    created_at: datetime.datetime
    updated_at: datetime.datetime | None


class FootprintNodeCreate(pydantic.BaseModel):
    kind: str = pydantic.Field(min_length=1, max_length=64)
    label: str = pydantic.Field(min_length=1, max_length=512)
    platform: str | None = pydantic.Field(default=None, max_length=64)
    external_id: str | None = pydantic.Field(default=None, max_length=256)
    source_ref: dict[str, typing.Any] | None = None
    properties: dict[str, typing.Any] | None = None
    visibility: str = pydantic.Field(default="private", max_length=32)
    confidence: float = pydantic.Field(default=1.0, ge=0.0, le=1.0)


class FootprintNodeRead(pydantic.BaseModel):
    model_config: pydantic.ConfigDict = {"from_attributes": True}

    id: str
    owner_id: str
    kind: str
    label: str
    platform: str | None
    external_id: str | None
    source_ref: dict[str, typing.Any] | None
    properties: dict[str, typing.Any] | None
    visibility: str
    confidence: float
    first_seen_at: datetime.datetime
    last_seen_at: datetime.datetime | None
    created_at: datetime.datetime
    updated_at: datetime.datetime | None


class FootprintEdgeCreate(pydantic.BaseModel):
    source_node_id: str = pydantic.Field(min_length=1, max_length=64)
    target_node_id: str = pydantic.Field(min_length=1, max_length=64)
    relation: str = pydantic.Field(min_length=1, max_length=64)
    platform: str | None = pydantic.Field(default=None, max_length=64)
    weight: float = pydantic.Field(default=1.0, ge=0.0)
    confidence: float = pydantic.Field(default=1.0, ge=0.0, le=1.0)
    evidence_ref: dict[str, typing.Any] | None = None


class FootprintEdgeRead(pydantic.BaseModel):
    model_config: pydantic.ConfigDict = {"from_attributes": True}

    id: str
    owner_id: str
    source_node_id: str
    target_node_id: str
    relation: str
    platform: str | None
    weight: float
    confidence: float
    evidence_ref: dict[str, typing.Any] | None
    first_seen_at: datetime.datetime
    last_seen_at: datetime.datetime | None
    created_at: datetime.datetime
    updated_at: datetime.datetime | None


class FootprintImportCreate(pydantic.BaseModel):
    connector: str = pydantic.Field(min_length=1, max_length=64)
    import_mode: str = pydantic.Field(default="manual", max_length=32)
    account_id: str | None = pydantic.Field(default=None, max_length=64)
    source_ref: dict[str, typing.Any] | None = None


class FootprintImportProcessRequest(pydantic.BaseModel):
    feed_xml: str | None = pydantic.Field(default=None, max_length=2_000_000)


class FootprintImportRead(pydantic.BaseModel):
    model_config: pydantic.ConfigDict = {"from_attributes": True}

    id: str
    owner_id: str
    account_id: str | None
    run_id: str | None
    connector: str
    import_mode: str
    status: str
    requested_by: str | None
    source_ref: dict[str, typing.Any] | None
    summary: dict[str, typing.Any] | None
    created_at: datetime.datetime
    completed_at: datetime.datetime | None


class FootprintGraphSnapshot(pydantic.BaseModel):
    owner_id: str
    accounts: list[FootprintAccountRead]
    nodes: list[FootprintNodeRead]
    edges: list[FootprintEdgeRead]


class ProfileMetaEntry(pydantic.BaseModel):
    label: str = pydantic.Field(max_length=64)
    value: str = pydantic.Field(max_length=256)


#: Closed unions, mirrored from the frontend's `DotNode`. Unknown values fail closed.
ProfileNodeKind = typing.Literal["self", "attribute", "page", "external"]
ProfileSurface = typing.Literal["publications", "circle", "vault", "support", "twin"]
#: How a node relates to its parent (doc 08 §4.2). Navigation is offered in these terms.
ProfileRelation = typing.Literal["depends-on", "leads-to", "contrasts", "defines", "applies"]

#: Ids become path segments in the stored `external_id`, so separators are excluded.
_ID_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$"
_LINK_SCHEMES: tuple[str, ...] = ("http://", "https://", "mailto:", "tel:")
_IMAGE_SCHEMES: tuple[str, ...] = ("https://",)


def _safe_link(value: str | None, field: str, schemes: tuple[str, ...]) -> str | None:
    """Allow internal paths and an explicit scheme list; reject everything else."""

    if value is None:
        return None
    candidate: str = value.strip()
    if not candidate:
        return None
    if candidate.startswith("//"):
        raise ValueError(f"{field} must not be protocol-relative")
    if candidate.startswith("/"):
        return candidate
    if candidate.lower().startswith(schemes):
        return candidate
    raise ValueError(f"{field} must be an internal path or one of: {', '.join(schemes)}")


class ProfileNode(pydantic.BaseModel):
    """One node of the member's public tree. Recursive by design."""

    id: str = pydantic.Field(min_length=1, max_length=128, pattern=_ID_PATTERN)
    label: str = pydantic.Field(min_length=1, max_length=512)
    kind: ProfileNodeKind | None = None
    surface: ProfileSurface | None = None
    relation: ProfileRelation | None = None
    href: str | None = pydantic.Field(default=None, max_length=1024)
    description: str | None = pydantic.Field(default=None, max_length=1024)
    body: str | None = pydantic.Field(default=None, max_length=100_000)
    meta: list[ProfileMetaEntry] | None = None
    image: str | None = pydantic.Field(default=None, max_length=1024)
    children: list["ProfileNode"] | None = None

    @pydantic.field_validator("href")
    @classmethod
    def _check_href(cls, value: str | None) -> str | None:
        return _safe_link(value, "href", _LINK_SCHEMES)

    @pydantic.field_validator("image")
    @classmethod
    def _check_image(cls, value: str | None) -> str | None:
        return _safe_link(value, "image", _IMAGE_SCHEMES)

    @pydantic.field_validator("children")
    @classmethod
    def _check_sibling_ids(cls, value: list["ProfileNode"] | None) -> list["ProfileNode"] | None:
        if value is None:
            return None
        seen: set[str] = set()
        for child in value:
            if child.id in seen:
                raise ValueError(f"duplicate child id: {child.id}")
            seen.add(child.id)
        return value


class ProfileGraphWrite(pydantic.BaseModel):
    graph: ProfileNode


class ProfileGraphRead(pydantic.BaseModel):
    owner_id: str
    graph: ProfileNode | None
    updated_at: datetime.datetime | None
