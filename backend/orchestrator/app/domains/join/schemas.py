from __future__ import annotations

import datetime

import pydantic


class JoinRequestIn(pydantic.BaseModel):
    """Someone asking to be let in. Reason is optional — a bare address is a
    legitimate request, and demanding an essay is its own kind of gate."""

    email: pydantic.EmailStr
    reason: str | None = pydantic.Field(default=None, max_length=600)


class JoinVerifyIn(pydantic.BaseModel):
    email: pydantic.EmailStr
    code: str = pydantic.Field(min_length=4, max_length=12)


class JoinRequestAccepted(pydantic.BaseModel):
    """Deliberately says nothing about position or timing.

    No queue length, no rank, no estimate: ADR-0004 bans manufactured scarcity,
    and every one of those numbers is a lever for it.
    """

    status: str = "awaiting_verification"
    expires_in: int
    #: Present only when no mail provider is configured, so local development
    #: can complete the loop without inventing a second code path.
    dev_code: str | None = None


class JoinVerified(pydantic.BaseModel):
    status: str = "verified"


class JoinRequestOut(pydantic.BaseModel):
    """One request, as the steward reads it. Owner-only."""

    id: str
    email: str | None
    reason: str | None
    status: str
    verified_at: datetime.datetime | None
    created_at: datetime.datetime


class JoinQueue(pydantic.BaseModel):
    requests: list[JoinRequestOut]
