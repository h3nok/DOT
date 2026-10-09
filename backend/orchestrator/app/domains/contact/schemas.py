from __future__ import annotations

import typing

import pydantic

Purpose = typing.Literal["project", "collaboration", "writing", "speaking", "general", "privacy"]
InquiryStatus = typing.Literal["new", "replied", "archived"]


class InquiryIn(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(str_strip_whitespace=True, extra="forbid")

    purpose: Purpose
    name: str = pydantic.Field(min_length=1, max_length=120)
    email: pydantic.EmailStr
    message: str = pydantic.Field(min_length=10, max_length=6000)
    organization: str = pydantic.Field(default="", max_length=160)
    timeline: str = pydantic.Field(default="", max_length=120)
    budget: str = pydantic.Field(default="", max_length=120)
    consent: typing.Literal[True]
    website: str = pydantic.Field(default="", max_length=200)


class ReplyIn(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(str_strip_whitespace=True, extra="forbid")

    message: str = pydantic.Field(min_length=1, max_length=6000)


class StatusIn(pydantic.BaseModel):
    status: InquiryStatus
