"""Bounded input for one private, portable Markdown revision."""

from __future__ import annotations

import datetime
import typing
import uuid

import pydantic

AssetPath = typing.Annotated[
    str,
    pydantic.Field(
        min_length=1,
        max_length=240,
        pattern=r"^(?:[a-z0-9][a-z0-9_-]*/)*[a-z0-9][a-z0-9_-]*\.(?:png|jpg|jpeg|webp)$",
    ),
]
ClaimLevel = typing.Literal["Observation", "Model", "Hypothesis", "Speculation"]


class DraftClaim(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")
    statement: str = pydantic.Field(default="", max_length=10000)
    level: typing.Literal["", "Observation", "Model", "Hypothesis", "Speculation"] = ""
    origin: typing.Literal["author_originated", "sourced", "no_external_source"] = (
        "author_originated"
    )
    source: str = pydantic.Field(default="", max_length=2048)


class Cover(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")
    path: AssetPath
    alt: str = pydantic.Field(default="", max_length=300)
    caption: str = pydantic.Field(default="", max_length=400)


class Presentation(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")
    format: typing.Literal["essay", "case-study", "letter"] = "essay"
    series: str = pydantic.Field(default="", max_length=100)
    cover: Cover | None = None
    levels: list[ClaimLevel] = pydantic.Field(default_factory=list, max_length=4)
    concepts: list[
        typing.Annotated[str, pydantic.Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=120)]
    ] = pydantic.Field(default_factory=list, max_length=50)
    # File dates are provenance; they never schedule or approve a release.
    published: datetime.date | None = None
    updated: datetime.date | None = None


class DraftAsset(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")
    path: AssetPath
    data_base64: str | None = pydantic.Field(default=None, max_length=1_000_000)
    source_revision_id: str | None = pydantic.Field(default=None, max_length=64)

    @pydantic.model_validator(mode="after")
    def one_source(self) -> DraftAsset:
        if (self.data_base64 is None) == (self.source_revision_id is None):
            raise ValueError("Provide uploaded image bytes or a saved revision reference.")
        return self


class DraftSave(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")
    request_id: uuid.UUID
    base_revision_id: str | None = pydantic.Field(default=None, max_length=64)
    title: str = pydantic.Field(min_length=1, max_length=256)
    summary: str = pydantic.Field(default="", max_length=280)
    body: str = pydantic.Field(min_length=1, max_length=2_000_000)
    claims: list[DraftClaim] = pydantic.Field(default_factory=list, max_length=100)
    presentation: Presentation = pydantic.Field(default_factory=Presentation)
    assets: list[DraftAsset] = pydantic.Field(default_factory=list, max_length=16)

    @pydantic.field_validator("title", "body")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 2_000_000:
            raise ValueError("Keep the manuscript under 2 MB.")
        if not value.strip():
            raise ValueError("A title and manuscript are required to save.")
        return value
