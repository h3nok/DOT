from __future__ import annotations

import datetime

import pydantic

import app.domains.sitecontent.models as models


class SiteContentValue(pydantic.BaseModel):
    """One block as the steward sees it: both values, plus what is live."""

    key: str
    published_value: str | None = None
    draft_value: str | None = None
    updated_at: datetime.datetime | None = None
    published_at: datetime.datetime | None = None

    @property
    def has_unpublished_edit(self) -> bool:
        return self.draft_value is not None and self.draft_value != self.published_value


class SiteContentPublic(pydantic.BaseModel):
    """The public read model: published overrides only, keyed by block key."""

    blocks: dict[str, str]


class SiteContentDrafts(pydantic.BaseModel):
    blocks: list[SiteContentValue]


class SiteContentWrite(pydantic.BaseModel):
    """A steward edit. Empty string is meaningful — it clears the override."""

    value: str = pydantic.Field(max_length=models.MAX_VALUE_LENGTH)
    #: Publish in the same call. The inline editor uses this; the studio does not.
    publish: bool = False

    @pydantic.field_validator("value")
    @classmethod
    def _strip(cls, value: str) -> str:
        # Copy is trimmed on the way in so a stray newline cannot make a block
        # differ from its default in a way no reader can see.
        return value.strip()
