from __future__ import annotations

import datetime
import typing

import pydantic

TwinLens = typing.Literal["orient", "ground", "test"]


class TwinHistoryTurn(pydantic.BaseModel):
    """A visitor turn replayed as untrusted, non-persistent context."""

    model_config = pydantic.ConfigDict(extra="forbid")

    role: typing.Literal["member", "twin"]
    content: str = pydantic.Field(min_length=1, max_length=4_000)


class ReadingPosition(pydantic.BaseModel):
    """Where the reader is when they ask.

    "What is this guy talking about?" has an obvious answer to anyone looking at
    the page and none at all to a companion that receives only the sentence. The
    section the reader has open is therefore part of the question.

    Client-supplied, so it is constrained here and treated as untrusted
    everywhere after: it seeds retrieval terms and enters the prompt inside the
    untrusted envelope, never as instruction.
    """

    model_config = pydantic.ConfigDict(extra="forbid")

    #: Released section slug, matching the publication manifest.
    section: str = pydantic.Field(min_length=1, max_length=64, pattern=r"^[a-z0-9-]+$")
    #: The section's title as the reader sees it, for retrieval terms.
    title: str | None = pydantic.Field(default=None, max_length=200)


class TwinAskRequest(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")

    question: str = pydantic.Field(min_length=1, max_length=2_000)
    lens: TwinLens = "ground"
    #: Whose graph to ask. Defaults to the caller's own twin.
    owner_id: str | None = pydantic.Field(default=None, max_length=128)
    #: What the reader has open, when the question came from inside the book.
    reading: ReadingPosition | None = None


class TwinPublicAskRequest(pydantic.BaseModel):
    """A visitor's question. The owner is required because there is no session."""

    model_config = pydantic.ConfigDict(extra="forbid")

    question: str = pydantic.Field(min_length=1, max_length=2_000)
    owner_id: str = pydantic.Field(min_length=1, max_length=128)
    lens: TwinLens = "ground"
    history: list[TwinHistoryTurn] = pydantic.Field(default_factory=list, max_length=6)
    reading: ReadingPosition | None = None


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
    lens: TwinLens = "ground"
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


TwinFeedbackRating = typing.Literal["helpful", "not_helpful"]


class TwinFeedbackRequest(pydantic.BaseModel):
    """A member's verdict on one answer. Carries no prompt or answer text (HKI-6)."""

    model_config = pydantic.ConfigDict(extra="forbid")

    rating: TwinFeedbackRating
    lens: TwinLens = "ground"
    #: Whose twin produced the answer being judged.
    subject_owner_id: str = pydantic.Field(min_length=1, max_length=128)


class TwinFeedbackResponse(pydantic.BaseModel):
    id: str
    rating: TwinFeedbackRating
