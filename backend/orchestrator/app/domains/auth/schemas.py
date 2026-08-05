from __future__ import annotations

import pydantic


class OtpRequestPayload(pydantic.BaseModel):
    email: pydantic.EmailStr


class OtpVerifyPayload(pydantic.BaseModel):
    email: pydantic.EmailStr
    code: str = pydantic.Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    display_name: str | None = pydantic.Field(default=None, max_length=128)


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
    token: str
    expires_at: str


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
