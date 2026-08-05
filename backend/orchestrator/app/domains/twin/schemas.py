from __future__ import annotations

import pydantic


class TwinAskRequest(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")

    question: str = pydantic.Field(min_length=1, max_length=2_000)
    #: Whose graph to ask. Defaults to the caller's own twin.
    owner_id: str | None = pydantic.Field(default=None, max_length=128)


class Citation(pydantic.BaseModel):
    node_id: str
    kind: str
    label: str


class TwinAskResponse(pydantic.BaseModel):
    answer: str
    citations: list[Citation]
    grounded: bool
    #: Set when the twin declined. Never contains model or member content.
    refusal_code: str | None = None
