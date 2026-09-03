"""Request/response contracts for the Academy kernel API."""

from __future__ import annotations

import datetime

import pydantic

import app.domains.academy.models as models


class WorkCreate(pydantic.BaseModel):
    kind: str
    canonical_slug: str = pydantic.Field(
        min_length=1, max_length=160, pattern=r"^[a-z0-9][a-z0-9-]*$"
    )
    program_slug: str | None = None

    @pydantic.field_validator("kind")
    @classmethod
    def _kind_closed_union(cls, value: str) -> str:
        if value not in models.WORK_KINDS:
            raise ValueError(f"kind must be one of {models.WORK_KINDS}")
        return value


class WorkUpdate(pydantic.BaseModel):
    """Identity/workflow metadata only — content changes are revisions."""

    canonical_slug: str | None = pydantic.Field(
        default=None, min_length=1, max_length=160, pattern=r"^[a-z0-9][a-z0-9-]*$"
    )
    program_slug: str | None = None


class WorkRead(pydantic.BaseModel):
    id: str
    academy_space_id: str
    kind: str
    canonical_slug: str
    program_id: str | None
    visibility: str
    lifecycle_state: str
    created_by: str
    created_at: datetime.datetime


class RevisionCreate(pydantic.BaseModel):
    title: str = pydantic.Field(min_length=1, max_length=256)
    body_markdown: str = pydantic.Field(min_length=1)
    summary: str | None = None
    language: str = "en"
    change_note: str | None = None
    schema_version: int = 1


class RevisionRead(pydantic.BaseModel):
    id: str
    work_id: str
    revision_number: int
    title: str
    summary: str | None
    body_ref: str
    body_media_type: str
    content_hash: str
    language: str
    change_note: str | None
    created_by: str
    created_at: datetime.datetime


class ClaimCreate(pydantic.BaseModel):
    canonical_key: str = pydantic.Field(min_length=1, max_length=160)
    statement: str = pydantic.Field(min_length=1)
    epistemic_level: str
    origin: str
    context_role: str = "academy_position"
    claim_state: str = "proposed"
    origin_note: str | None = None
    assumptions: list[str] | None = None
    failure_conditions: list[str] | None = None

    @pydantic.field_validator("epistemic_level")
    @classmethod
    def _level(cls, value: str) -> str:
        if value not in models.EPISTEMIC_LEVELS:
            raise ValueError(f"epistemic_level must be one of {models.EPISTEMIC_LEVELS}")
        return value

    @pydantic.field_validator("origin")
    @classmethod
    def _origin(cls, value: str) -> str:
        if value not in models.CLAIM_ORIGINS:
            raise ValueError(f"origin must be one of {models.CLAIM_ORIGINS}")
        return value

    @pydantic.field_validator("context_role")
    @classmethod
    def _role(cls, value: str) -> str:
        if value not in models.CLAIM_CONTEXT_ROLES:
            raise ValueError(f"context_role must be one of {models.CLAIM_CONTEXT_ROLES}")
        return value

    @pydantic.field_validator("claim_state")
    @classmethod
    def _state(cls, value: str) -> str:
        if value not in models.CLAIM_STATES:
            raise ValueError(f"claim_state must be one of {models.CLAIM_STATES}")
        return value


class ClaimRead(pydantic.BaseModel):
    claim_id: str
    claim_revision_id: str
    canonical_key: str
    statement: str
    epistemic_level: str
    claim_state: str
    context_role: str
    origin: str


class RelationCreate(pydantic.BaseModel):
    predicate: str
    source_claim_key: str | None = None
    target_work_id: str | None = None
    target_claim_id: str | None = None
    target_external: str | None = None
    note: str | None = None

    @pydantic.field_validator("predicate")
    @classmethod
    def _predicate(cls, value: str) -> str:
        if value not in models.RELATION_PREDICATES:
            raise ValueError(f"predicate must be one of {models.RELATION_PREDICATES}")
        return value


class SourceLinkCreate(pydantic.BaseModel):
    claim_key: str | None = None
    source_object_id: str | None = None
    source_version_id: str | None = None
    source_anchor_id: str | None = None
    external_uri: str | None = None
    external_identifier: str | None = None
    relation: str = "cites"
    locator: str | None = None

    @pydantic.model_validator(mode="after")
    def _exactly_one_mode(self) -> SourceLinkCreate:
        internal = bool(self.source_object_id or self.source_version_id or self.source_anchor_id)
        external = bool(self.external_uri or self.external_identifier)
        if internal == external:
            raise ValueError(
                "Exactly one source mode is valid: internal source reference or "
                "external identifier/URI (doc 14 P4)."
            )
        return self


class ContributionCreate(pydantic.BaseModel):
    display_name: str = pydantic.Field(min_length=1, max_length=256)
    role: str = pydantic.Field(min_length=1, max_length=64)
    member_id: str | None = None
    degree: str | None = None
    orcid: str | None = None
    affiliation: str | None = None


class ReleaseCreate(pydantic.BaseModel):
    revision_id: str
    visibility: str = "public"

    @pydantic.field_validator("visibility")
    @classmethod
    def _visibility(cls, value: str) -> str:
        if value not in models.VISIBILITIES:
            raise ValueError(f"visibility must be one of {models.VISIBILITIES}")
        return value


class ReleaseRead(pydantic.BaseModel):
    id: str
    work_id: str
    revision_id: str
    release_number: int
    release_status: str
    visibility: str
    manifest_hash: str | None
    policy_revision_id: str | None
    released_at: datetime.datetime | None
    withdrawn_at: datetime.datetime | None
    withdrawal_reason: str | None


class WithdrawRequest(pydantic.BaseModel):
    reason: str = pydantic.Field(min_length=1)


class DeliveryItem(pydantic.BaseModel):
    """One released work as the public sees it. Never draft state (P9)."""

    release_id: str
    work_id: str
    work_slug: str
    kind: str
    program_slug: str | None
    release_number: int
    title: str
    summary: str | None
    manifest_hash: str
    released_at: datetime.datetime
    withdrawn_at: datetime.datetime | None
    withdrawal_reason: str | None
