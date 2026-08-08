from __future__ import annotations

import typing

import pydantic

import app.domains.support.models as models


class SupportTier(pydantic.BaseModel):
    id: str
    amount_minor: int
    currency: str = "usd"


class SupportPurpose(pydantic.BaseModel):
    id: str
    label: str


class SupportOptions(pydantic.BaseModel):
    tiers: list[SupportTier]
    purposes: list[SupportPurpose]
    min_custom_minor: int
    max_custom_minor: int
    currency: str = "usd"
    available: bool = False


class SupportCheckoutRequest(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")

    tier: str = pydantic.Field(max_length=32)
    purpose: str = pydantic.Field(max_length=32)
    #: Only honoured when tier == "custom", and only inside the permitted range.
    custom_amount_minor: int | None = pydantic.Field(
        default=None, ge=models.MIN_CUSTOM_AMOUNT, le=models.MAX_CUSTOM_AMOUNT
    )


class SupportCheckoutResponse(pydantic.BaseModel):
    checkout_url: str
    amount_minor: int
    currency: str
    tier: str
    purpose: str


class SupportCheckoutStatus(pydantic.BaseModel):
    status: typing.Literal["paid", "processing", "expired"]


class SupportTotals(pydantic.BaseModel):
    """Aggregate only. Individual supporters are never listed."""

    supporters: int
    total_minor: int
    currency: str = "usd"
