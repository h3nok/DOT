from __future__ import annotations

import pydantic


class ProductResponse(pydantic.BaseModel):
    id: str
    title: str
    amount_minor: int
    currency: str
    available: bool


class CheckoutResponse(pydantic.BaseModel):
    checkout_url: str


class EntitlementResponse(pydantic.BaseModel):
    product_id: str
    entitled: bool
    status: str
