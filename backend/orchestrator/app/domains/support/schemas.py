from __future__ import annotations

import pydantic

import app.domains.support.models as models


class SupportTier(pydantic.BaseModel):
    id: str
    amount_minor: int
    currency: str = "usd"


class SupportOptions(pydantic.BaseModel):
    tiers: list[SupportTier]
    min_custom_minor: int
    max_custom_minor: int
    currency: str = "usd"
    #: Empty when support is not configured; the UI hides the surface.
    publishable_key: str = ""


class SupportIntentRequest(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")

    tier: str = pydantic.Field(max_length=32)
    #: Only honoured when tier == "custom", and only inside the permitted range.
    custom_amount_minor: int | None = pydantic.Field(
        default=None, ge=models.MIN_CUSTOM_AMOUNT, le=models.MAX_CUSTOM_AMOUNT
    )
    cadence: str = pydantic.Field(default="one_time", pattern="^(one_time|recurring)$")
    email: pydantic.EmailStr | None = None


class SupportIntentResponse(pydantic.BaseModel):
    client_secret: str
    amount_minor: int
    currency: str
    tier: str
    cadence: str


class SupportTotals(pydantic.BaseModel):
    """Aggregate only. Individual supporters are never listed."""

    supporters: int
    total_minor: int
    currency: str = "usd"
