from __future__ import annotations

import datetime
import typing

import pydantic


class TwinAskRequest(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")

    question: str = pydantic.Field(min_length=1, max_length=2_000)
    #: Whose graph to ask. Defaults to the caller's own twin.
    owner_id: str | None = pydantic.Field(default=None, max_length=128)


class Citation(pydantic.BaseModel):
    #: The citable id. A graph node id, or a chunk id when the twin answered
    #: from a document in the member's vault.
    node_id: str
    kind: str
    label: str
    #: Where in the source the passage sits, so a citation can be opened.
    locator: dict[str, typing.Any] | None = None


class TwinAskResponse(pydantic.BaseModel):
    answer: str
    citations: list[Citation]
    grounded: bool
    #: Set when the twin declined. Never contains model or member content.
    refusal_code: str | None = None


class TwinMessageRequest(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")

    question: str = pydantic.Field(min_length=1, max_length=2_000)
    #: Omit to start a new thread.
    conversation_id: str | None = pydantic.Field(default=None, max_length=64)
    #: Whose twin to address. Ignored when continuing an existing thread, which
    #: keeps the subject it was opened with.
    owner_id: str | None = pydantic.Field(default=None, max_length=128)


class TwinConversation(pydantic.BaseModel):
    id: str
    title: str
    subject_owner_id: str
    message_count: int
    created_at: datetime.datetime
    last_message_at: datetime.datetime | None = None


class TwinMessage(pydantic.BaseModel):
    id: str
    role: str
    content: str
    citations: list[Citation] = pydantic.Field(default_factory=list)
    refusal_code: str | None = None
    created_at: datetime.datetime


class TwinConversationList(pydantic.BaseModel):
    conversations: list[TwinConversation]


class TwinMessageList(pydantic.BaseModel):
    conversation: TwinConversation
    messages: list[TwinMessage]


class TwinMessageResponse(pydantic.BaseModel):
    conversation: TwinConversation
    answer: TwinAskResponse
