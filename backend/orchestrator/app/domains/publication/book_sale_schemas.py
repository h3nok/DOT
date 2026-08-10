from __future__ import annotations

import typing

import pydantic


class BookProduct(pydantic.BaseModel):
    id: str
    title: str
    edition: str
    format: str
    amount_minor: int
    currency: str
    available: bool


class BookCheckoutRequest(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")

    product_id: str = pydantic.Field(max_length=64)


class BookCheckoutResponse(pydantic.BaseModel):
    checkout_url: str
    product: BookProduct


class BookCheckoutStatus(pydantic.BaseModel):
    status: typing.Literal["paid", "processing", "expired"]
    product_id: str
