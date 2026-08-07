from __future__ import annotations

import dataclasses
import time
import typing

import fastapi
import jwt

import app.settings

_SESSION_COOKIE = "dot_session"


@dataclasses.dataclass(frozen=True)
class OwnerContext:
    owner_id: str
    actor_id: str
    role: str = "member"
    scopes: tuple[str, ...] = ()


ALGORITHM = "HS256"


def mint_test_token(
    *,
    owner_id: str,
    actor_id: str | None = None,
    role: str = "member",
    scopes: list[str] | None = None,
    settings: app.settings.Settings | None = None,
    ttl_seconds: int = 300,
) -> str:
    """Mint a short-lived JWT for tests/local gateway smoke checks."""

    resolved: app.settings.Settings = settings or app.settings.get_settings()
    now = int(time.time())
    payload = {
        "sub": actor_id or owner_id,
        "owner_id": owner_id,
        "role": role,
        "scopes": scopes or ["member"],
        "iss": resolved.JWT_ISSUER,
        "aud": resolved.JWT_AUDIENCE,
        "iat": now,
        "exp": now + ttl_seconds,
    }
    return jwt.encode(payload, resolved.SERVICE_AUTH_SECRET, algorithm=ALGORITHM)


def _extract_bearer_token(request: fastapi.Request) -> str:
    auth_header: str = request.headers.get("X-Service-Auth", "") or request.headers.get(
        "Authorization",
        "",
    )
    if not auth_header.startswith("Bearer "):
        return ""
    return auth_header[7:]


def _resolve_local_or_gateway_context(
    *,
    x_owner_id: str | None,
    x_actor_id: str | None,
) -> OwnerContext:
    owner_id: str = (x_owner_id or "").strip()
    if not owner_id:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="Missing owner context.",
        )
    if len(owner_id) > 128:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Owner context is too long.",
        )

    actor_id: str = (x_actor_id or owner_id).strip()
    return OwnerContext(owner_id=owner_id, actor_id=actor_id)


def _verify_jwt_token(token: str, settings: app.settings.Settings) -> OwnerContext:
    """Verify a raw JWT string and return an OwnerContext."""
    if not settings.SERVICE_AUTH_SECRET:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT auth secret is not configured.",
        )
    try:
        payload: dict[str, typing.Any] = jwt.decode(
            token,
            settings.SERVICE_AUTH_SECRET,
            algorithms=[ALGORITHM],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
            options={"require": ["exp", "iss", "aud", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED, detail="Token expired."
        ) from None
    except jwt.InvalidTokenError as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {exc}"
        ) from None

    owner_id: str = str(payload.get("owner_id") or payload.get("sub") or "").strip()
    if not owner_id:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED, detail="Token missing owner_id."
        )
    actor_id: str = str(payload.get("sub") or owner_id).strip()
    scopes: tuple[str, ...] = tuple(str(s) for s in payload.get("scopes", []) if str(s).strip())
    return OwnerContext(
        owner_id=owner_id,
        actor_id=actor_id,
        role=str(payload.get("role", "member")),
        scopes=scopes,
    )


def resolve_session_optional(request: fastapi.Request) -> OwnerContext | None:
    """Resolve the session cookie or Bearer token without raising on missing auth."""
    settings: app.settings.Settings = app.settings.get_settings()
    if not settings.AUTH_ENABLED:
        return OwnerContext(owner_id="dev-owner", actor_id="dev-owner", role="admin")

    # Prefer session cookie (issued by /v1/auth/otp/verify).
    cookie_token: str = request.cookies.get(_SESSION_COOKIE, "")
    if cookie_token:
        try:
            return _verify_jwt_token(cookie_token, settings)
        except fastapi.HTTPException:
            return None

    # Fall back to Bearer token for API clients / tests.
    bearer: str = _extract_bearer_token(request)
    if bearer:
        try:
            return _verify_jwt_token(bearer, settings)
        except fastapi.HTTPException:
            return None

    return None


async def require_owner(
    request: fastapi.Request,
    x_owner_id: str | None = fastapi.Header(default=None, alias="X-Owner-Id"),
    x_actor_id: str | None = fastapi.Header(default=None, alias="X-Actor-Id"),
) -> OwnerContext:
    """Resolve the member context for private orchestrator routes."""

    settings: app.settings.Settings = app.settings.get_settings()
    if not settings.AUTH_ENABLED:
        return OwnerContext(owner_id="dev-owner", actor_id="dev-owner", role="admin")

    if settings.AUTH_MODE == "jwt":
        # Accept session cookie first, then Bearer token.
        ctx: OwnerContext | None = resolve_session_optional(request)
        if ctx is not None:
            return ctx
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED, detail="Authentication required."
        )

    if settings.AUTH_MODE in {"local_header", "gateway"}:
        # A signed-in session is accepted here too, so a client that identifies
        # itself only by cookie (as production must) also works in development.
        if not (x_owner_id or "").strip():
            session_context: OwnerContext | None = resolve_session_optional(request)
            if session_context is not None:
                return session_context
        return _resolve_local_or_gateway_context(x_owner_id=x_owner_id, x_actor_id=x_actor_id)

    raise fastapi.HTTPException(
        status_code=fastapi.status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unsupported orchestrator auth mode.",
    )


def ensure_write_scope(owner: OwnerContext) -> None:
    accepted_write_scopes: set[str] = {
        "member",
        "publication:write",
        "graph:write",
        "sources:write",
        "connectors:write",
    }
    if owner.scopes and accepted_write_scopes.isdisjoint(owner.scopes):
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_403_FORBIDDEN,
            detail="Owner context does not include write scope.",
        )
