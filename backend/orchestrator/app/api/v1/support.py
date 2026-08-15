from __future__ import annotations

from typing import Any

import fastapi
import sqlalchemy.ext.asyncio

import app.core.security
import app.db.session
import app.domains.commerce.service as commerce_service
import app.domains.support.models as models
import app.domains.support.schemas as schemas
import app.domains.support.service as support_service

# Support is deliberately public — anyone may fund the movement — so this router
# carries no tenant binding. It is rate limited instead.
router = fastapi.APIRouter(prefix="/v1/support", tags=["support"])

_limiter = app.core.security.make_limiter()


@router.get("/options", response_model=schemas.SupportOptions)
async def get_options() -> schemas.SupportOptions:
    return schemas.SupportOptions(
        tiers=[
            schemas.SupportTier(id=tier, amount_minor=amount)
            for tier, amount in models.SUPPORT_TIERS.items()
        ],
        purposes=[
            schemas.SupportPurpose(id=purpose, label=label)
            for purpose, label in models.SUPPORT_PURPOSES.items()
        ],
        min_custom_minor=models.MIN_CUSTOM_AMOUNT,
        max_custom_minor=models.MAX_CUSTOM_AMOUNT,
        available=support_service.is_configured(),
    )


@router.post("/checkout-sessions", response_model=schemas.SupportCheckoutResponse)
@_limiter.limit("10/minute")
async def create_checkout(
    request: fastapi.Request,
    payload: schemas.SupportCheckoutRequest,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.SupportCheckoutResponse:
    try:
        result: dict[str, Any] = await support_service.create_checkout(
            session,
            tier=payload.tier,
            custom_amount_minor=payload.custom_amount_minor,
            purpose=payload.purpose,
        )
    except ValueError as exc:
        raise fastapi.HTTPException(status_code=400, detail=str(exc)) from exc
    except support_service.SupportUnavailableError as exc:
        raise fastapi.HTTPException(status_code=503, detail=str(exc)) from exc
    return schemas.SupportCheckoutResponse(**result)


@router.get("/checkout-sessions/{session_id}", response_model=schemas.SupportCheckoutStatus)
@_limiter.limit("20/minute")
async def get_checkout_status(
    request: fastapi.Request,
    session_id: str,
) -> schemas.SupportCheckoutStatus:
    try:
        result: dict[str, str] = await support_service.checkout_status(session_id)
    except ValueError as exc:
        raise fastapi.HTTPException(status_code=400, detail=str(exc)) from exc
    except support_service.SupportUnavailableError as exc:
        raise fastapi.HTTPException(status_code=503, detail=str(exc)) from exc
    return schemas.SupportCheckoutStatus(**result)


@router.post("/webhook", include_in_schema=False)
@_limiter.limit("120/minute")
async def stripe_webhook(
    request: fastapi.Request,
    stripe_signature: str = fastapi.Header(default="", alias="Stripe-Signature"),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> dict[str, bool]:
    """The only writer of settled contributions. Unsigned payloads are rejected."""

    body: bytes = await request.body()
    try:
        event: dict[str, Any] = support_service.verify_webhook(body, stripe_signature)
    except support_service.WebhookVerificationError as exc:
        raise fastapi.HTTPException(status_code=400, detail="Invalid signature.") from exc
    except support_service.SupportUnavailableError as exc:
        raise fastapi.HTTPException(status_code=503, detail=str(exc)) from exc
    if await commerce_service.is_commerce_event(session, event):
        changed = await commerce_service.apply_event(session, event)
    else:
        changed = await support_service.apply_event(session, event)
    return {"applied": changed}


@router.get("/totals", response_model=schemas.SupportTotals)
async def get_totals(
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.SupportTotals:
    return schemas.SupportTotals(**await support_service.totals(session))
