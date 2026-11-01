from __future__ import annotations

import datetime
import typing

import pydantic


class OtpRequestPayload(pydantic.BaseModel):
    email: pydantic.EmailStr
    invite_token: str | None = pydantic.Field(default=None, min_length=16, max_length=256)


class OtpVerifyPayload(pydantic.BaseModel):
    email: pydantic.EmailStr
    code: str = pydantic.Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    display_name: str | None = pydantic.Field(default=None, max_length=128)
    invite_token: str | None = pydantic.Field(default=None, min_length=16, max_length=256)


class SessionUser(pydantic.BaseModel):
    id: str
    display_name: str | None
    role: str
    is_owner: bool

    model_config = pydantic.ConfigDict(from_attributes=True)


class OtpRequestResponse(pydantic.BaseModel):
    expires_in: int
    # Only present in dev when no email provider is configured.
    dev_code: str | None = None


class SessionResponse(pydantic.BaseModel):
    user: SessionUser | None


class InviteIssueResponse(pydantic.BaseModel):
    id: str
    token: str
    expires_at: str


class InviteOut(pydantic.BaseModel):
    """One invitation, as its issuer reads it. The token is shown only at issue."""

    id: str
    status: typing.Literal["open", "accepted", "revoked", "expired"]
    accepted_by: str | None
    created_at: datetime.datetime
    expires_at: datetime.datetime


class InviteList(pydantic.BaseModel):
    invites: list[InviteOut]


class MemberOut(pydantic.BaseModel):
    """One member, as the steward reads them. Owner-only, and holds no address."""

    id: str
    display_name: str | None
    role: str
    status: str
    invited_by: str | None
    joined_at: datetime.datetime


class MemberList(pydantic.BaseModel):
    members: list[MemberOut]


class MemberLookup(pydantic.BaseModel):
    """Sent in a body so the address never reaches a URL or an access log."""

    email: pydantic.EmailStr


class MemberStatusIn(pydantic.BaseModel):
    status: typing.Literal["active", "suspended"]


class InviteTokenPayload(pydantic.BaseModel):
    token: str = pydantic.Field(min_length=16, max_length=256)


class InviteCheckResponse(pydantic.BaseModel):
    valid: bool
    # Display name of the member who issued it. Never the recipient's address.
    invited_by: str | None = None
    expires_at: str | None = None


class CircleMember(pydantic.BaseModel):
    display_name: str | None
    joined_at: str | None


class CircleResponse(pydantic.BaseModel):
    owner_id: str
    count: int
    members: list[CircleMember]
