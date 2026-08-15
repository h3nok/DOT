from __future__ import annotations

import fastapi
import fastapi.responses
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.core.security
import app.db.session
import app.domains.commerce.models as models
import app.domains.commerce.schemas as schemas
import app.domains.commerce.service as service

router = fastapi.APIRouter(prefix="/v1/commerce", tags=["commerce"])
_limiter = app.core.security.make_limiter()


@router.get("/products/book-one-pdf", response_model=schemas.ProductResponse)
async def get_book_one_product() -> schemas.ProductResponse:
    return schemas.ProductResponse(
        id=models.BOOK_ONE_PDF_PRODUCT_ID,
        title="Digital Organism Theory — Book One PDF",
        amount_minor=models.BOOK_ONE_PDF_PRICE_MINOR,
        currency=models.BOOK_ONE_PDF_CURRENCY,
        available=service.is_configured(),
    )


@router.get("/products/book-one-pdf/entitlement", response_model=schemas.EntitlementResponse)
async def get_book_one_entitlement(
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.EntitlementResponse:
    entitled = await service.has_entitlement(session, owner)
    return schemas.EntitlementResponse(
        product_id=models.BOOK_ONE_PDF_PRODUCT_ID,
        entitled=entitled,
        status="active" if entitled else "not_owned",
    )


@router.post("/products/book-one-pdf/checkout", response_model=schemas.CheckoutResponse)
@_limiter.limit("5/minute")
async def create_book_one_checkout(
    request: fastapi.Request,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.CheckoutResponse:
    try:
        result = await service.create_checkout(session, owner)
    except ValueError as exc:
        raise fastapi.HTTPException(status_code=409, detail=str(exc)) from exc
    except service.CommerceUnavailableError as exc:
        raise fastapi.HTTPException(status_code=503, detail=str(exc)) from exc
    return schemas.CheckoutResponse(**result)


@router.get("/products/book-one-pdf/download")
@_limiter.limit("20/hour")
async def download_book_one_pdf(
    request: fastapi.Request,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> fastapi.responses.FileResponse:
    if not await service.has_entitlement(session, owner):
        raise fastapi.HTTPException(status_code=403, detail="Purchase required.")
    path = service.pdf_path()
    if not path.is_file():
        raise fastapi.HTTPException(status_code=503, detail="Digital edition is unavailable.")
    return fastapi.responses.FileResponse(
        path,
        media_type="application/pdf",
        filename="Digital-Organism-Theory-Book-One-Digital-Edition.pdf",
        headers={"Cache-Control": "private, no-store"},
    )
