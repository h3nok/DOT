from __future__ import annotations

import fastapi
import fastapi.responses

import app.core.security
import app.domains.publication.book_sale_schemas as schemas
import app.domains.publication.book_sales as book_sales

router = fastapi.APIRouter(prefix="/v1/books/digital-organism-theory", tags=["book-sales"])
_limiter = app.core.security.make_limiter()


@router.get("/product", response_model=schemas.BookProduct)
async def get_product() -> schemas.BookProduct:
    return schemas.BookProduct(**book_sales.product())


@router.post("/checkout-sessions", response_model=schemas.BookCheckoutResponse)
@_limiter.limit("10/minute")
async def create_checkout(
    request: fastapi.Request,
    payload: schemas.BookCheckoutRequest,
) -> schemas.BookCheckoutResponse:
    try:
        result = await book_sales.create_checkout(payload.product_id)
    except ValueError as exc:
        raise fastapi.HTTPException(status_code=400, detail=str(exc)) from exc
    except book_sales.BookSaleUnavailableError as exc:
        raise fastapi.HTTPException(status_code=503, detail=str(exc)) from exc
    return schemas.BookCheckoutResponse(**result)


@router.get("/checkout-sessions/{session_id}", response_model=schemas.BookCheckoutStatus)
@_limiter.limit("20/minute")
async def get_checkout_status(
    request: fastapi.Request,
    response: fastapi.Response,
    session_id: str,
) -> schemas.BookCheckoutStatus:
    response.headers["Cache-Control"] = "private, no-store"
    try:
        result = await book_sales.checkout_status(session_id)
    except ValueError as exc:
        raise fastapi.HTTPException(status_code=400, detail=str(exc)) from exc
    except book_sales.BookDownloadDeniedError as exc:
        raise fastapi.HTTPException(status_code=403, detail=str(exc)) from exc
    except book_sales.BookSaleUnavailableError as exc:
        raise fastapi.HTTPException(status_code=503, detail=str(exc)) from exc
    return schemas.BookCheckoutStatus(**result)


@router.get("/checkout-sessions/{session_id}/download")
@_limiter.limit("10/minute")
async def download_book(
    request: fastapi.Request,
    session_id: str,
) -> fastapi.responses.FileResponse:
    try:
        artifact = await book_sales.paid_artifact(session_id)
    except ValueError as exc:
        raise fastapi.HTTPException(status_code=400, detail=str(exc)) from exc
    except book_sales.BookDownloadDeniedError as exc:
        raise fastapi.HTTPException(status_code=403, detail=str(exc)) from exc
    except book_sales.BookSaleUnavailableError as exc:
        raise fastapi.HTTPException(status_code=503, detail=str(exc)) from exc
    return fastapi.responses.FileResponse(
        artifact,
        media_type="application/pdf",
        filename=book_sales.ARTIFACT_NAME,
        headers={"Cache-Control": "private, no-store"},
    )
