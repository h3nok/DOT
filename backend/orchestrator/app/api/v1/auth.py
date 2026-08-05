from __future__ import annotations

import fastapi
import sqlalchemy.ext.asyncio

import app.auth.dependencies
import app.core.security
import app.db.models
import app.db.session
import app.domains.auth.schemas as schemas
import app.domains.auth.service as auth_service

router = fastapi.APIRouter(prefix="/v1/auth", tags=["auth"])

# Aggressive per-IP limits on OTP endpoints to prevent brute force.
_limiter = app.core.security.make_limiter()


@router.post("/otp/request", response_model=schemas.OtpRequestResponse)
@_limiter.limit("5/minute")
async def request_otp(
    request: fastapi.Request,
    payload: schemas.OtpRequestPayload,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> fastapi.Response:
    result = await auth_service.request_otp(session, str(payload.email))
    if not result["ok"]:
        raise fastapi.HTTPException(status_code=result["status"], detail=result["error"])
    return schemas.OtpRequestResponse(
        expires_in=result["expires_in"],
        dev_code=result.get("dev_code"),
    )


@router.post("/otp/verify")
@_limiter.limit("10/minute")
async def verify_otp(
    request: fastapi.Request,
    payload: schemas.OtpVerifyPayload,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> fastapi.Response:
    result = await auth_service.verify_otp(
        session, str(payload.email), payload.code, payload.display_name
    )
    if not result["ok"]:
        raise fastapi.HTTPException(status_code=result["status"], detail=result["error"])

    response = fastapi.Response(
        content=fastapi.responses.JSONResponse(
            content={"user": result["user"]}
        ).body,
        media_type="application/json",
    )
    # httpOnly session cookie — JS cannot read the token.
    response.set_cookie(
        key="dot_session",
        value=result["token"],
        max_age=7 * 24 * 3600,
        httponly=True,
        samesite="lax",
        secure=True,  # enforced in prod; Cloud Run always serves HTTPS
    )
    return response


@router.get("/session", response_model=schemas.SessionResponse)
async def get_session(
    request: fastapi.Request,
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.SessionResponse:
    owner: app.auth.dependencies.OwnerContext | None = app.auth.dependencies.resolve_session_optional(request)
    if owner is None:
        return schemas.SessionResponse(user=None)
    member: app.db.models.Member | None = await session.get(app.db.models.Member, owner.owner_id)
    if not member:
        return schemas.SessionResponse(user=None)
    return schemas.SessionResponse(
        user=schemas.SessionUser(
            id=member.id,
            display_name=member.display_name,
            role=member.role,
            is_owner=owner.role == "owner",
        )
    )


@router.post("/logout")
async def logout() -> fastapi.Response:
    response = fastapi.Response(content='{"ok":true}', media_type="application/json")
    response.delete_cookie("dot_session", httponly=True, samesite="lax", secure=True)
    return response


@router.post("/invites", status_code=201, response_model=schemas.InviteIssueResponse)
@_limiter.limit("10/hour")
async def issue_invite(
    request: fastapi.Request,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.InviteIssueResponse:
    # Every member holds their own circle, so every member may invite into it.
    # Growth is bounded by the rate limit rather than by role.
    result = await auth_service.issue_invite(session, owner.owner_id)
    return schemas.InviteIssueResponse(**result)


@router.get("/invites/check", response_model=schemas.InviteCheckResponse)
@_limiter.limit("20/minute")
async def check_invite(
    request: fastapi.Request,
    token: str = fastapi.Query(min_length=16, max_length=256),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.InviteCheckResponse:
    """Report whether an invite is still open. Rate limited: tokens are secrets."""

    return schemas.InviteCheckResponse(**await auth_service.check_invite(session, token))


@router.post("/invites/accept")
@_limiter.limit("10/minute")
async def accept_invite(
    request: fastapi.Request,
    payload: schemas.InviteTokenPayload,
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> dict[str, bool]:
    accepted: bool = await auth_service.accept_invite(session, payload.token, owner.owner_id)
    if not accepted:
        raise fastapi.HTTPException(status_code=404, detail="Invite is not valid.")
    return {"accepted": True}


@router.get("/circle", response_model=schemas.CircleResponse)
async def get_circle(
    owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
        app.auth.dependencies.require_owner
    ),
    session: sqlalchemy.ext.asyncio.AsyncSession = fastapi.Depends(app.db.session.get_session),
) -> schemas.CircleResponse:
    """A member's own circle. Circles are never listed to anyone else."""

    return schemas.CircleResponse(**await auth_service.list_circle(session, owner.owner_id))
