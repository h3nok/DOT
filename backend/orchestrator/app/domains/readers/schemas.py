from __future__ import annotations

import datetime

import pydantic

#: Coarse labels for where someone subscribed. A closed set, because a free-text
#: field here would become a per-person trail through the site (ADR-0025).
SOURCES = frozenset({"book", "front", "talk", "concept", "unknown"})


class ReaderSubscribeIn(pydantic.BaseModel):
    """An address, and roughly where it was offered. Nothing else is asked.

    There is no name field. A mailing list does not need one, and asking makes
    the reader supply an identifier the list promised not to keep.
    """

    email: pydantic.EmailStr
    source: str = pydantic.Field(default="unknown", max_length=32)

    @pydantic.field_validator("source")
    @classmethod
    def _known_source(cls, value: str) -> str:
        return value if value in SOURCES else "unknown"


class ReaderConfirmIn(pydantic.BaseModel):
    email: pydantic.EmailStr
    code: str = pydantic.Field(min_length=4, max_length=12)


class ReaderSubscribeAccepted(pydantic.BaseModel):
    """Says only that a code is on its way.

    Deliberately reports no list size and no member number: ADR-0004 L5 bans
    public counters, and either of those would be one wearing a friendlier name.
    """

    status: str = "awaiting_confirmation"
    expires_in: int
    #: Present only when no mail provider is configured, so local development can
    #: complete the loop without a second code path.
    dev_code: str | None = None


class ReaderConfirmed(pydantic.BaseModel):
    status: str = "subscribed"
    #: Returned once so the surface can show the reader how to leave immediately,
    #: rather than making them wait for the first mailing to learn they can.
    unsubscribe_token: str


class ReaderUnsubscribed(pydantic.BaseModel):
    """Identical whether or not the token matched anything.

    Distinguishing the two would turn the endpoint into an oracle for which
    addresses are on the list.
    """

    status: str = "unsubscribed"


class ReaderOut(pydantic.BaseModel):
    """One subscriber, as the steward's sending tool reads them. Owner-only."""

    id: str
    email: str | None
    source: str | None
    confirmed_at: datetime.datetime | None
    created_at: datetime.datetime
    #: Rebuilt per read so every message can carry a working link (ADR-0025).
    unsubscribe_token: str


class ReaderList(pydantic.BaseModel):
    readers: list[ReaderOut]
