from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

import jwt
from fastapi import Header, HTTPException, Request, status

from app.settings import Settings, get_settings


@dataclass(frozen=True)
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
    settings: Settings | None = None,
    ttl_seconds: int = 300,
) -> str:
    """Mint a short-lived JWT for tests/local gateway smoke checks."""

    resolved = settings or get_settings()
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


def _extract_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("X-Service-Auth", "") or request.headers.get(
        "Authorization",
        "",
    )
    if not auth_header.startswith("Bearer "):
        return ""
    return auth_header[7:]


def _verify_jwt(request: Request, settings: Settings) -> OwnerContext:
    token = _extract_bearer_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization bearer token.",
        )
    if not settings.SERVICE_AUTH_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT auth secret is not configured.",
        )

    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.SERVICE_AUTH_SECRET,
            algorithms=[ALGORITHM],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
            options={"require": ["exp", "iss", "aud", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Request token expired.",
        ) from None
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid request token: {exc}",
        ) from None

    owner_id = str(payload.get("owner_id") or payload.get("sub") or "").strip()
    if not owner_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Request token is missing owner_id.",
        )
    actor_id = str(payload.get("sub") or owner_id).strip()
    scopes = tuple(str(scope) for scope in payload.get("scopes", []) if str(scope).strip())
    return OwnerContext(
        owner_id=owner_id,
        actor_id=actor_id,
        role=str(payload.get("role", "member")),
        scopes=scopes,
    )


def _resolve_local_or_gateway_context(
    *,
    x_owner_id: str | None,
    x_actor_id: str | None,
) -> OwnerContext:
    owner_id = (x_owner_id or "").strip()
    if not owner_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing owner context.",
        )
    if len(owner_id) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Owner context is too long.",
        )

    actor_id = (x_actor_id or owner_id).strip()
    return OwnerContext(owner_id=owner_id, actor_id=actor_id)


async def require_owner(
    request: Request,
    x_owner_id: str | None = Header(default=None, alias="X-Owner-Id"),
    x_actor_id: str | None = Header(default=None, alias="X-Actor-Id"),
) -> OwnerContext:
    """Resolve the member context for private orchestrator routes."""

    settings = get_settings()
    if not settings.AUTH_ENABLED:
        return OwnerContext(owner_id="dev-owner", actor_id="dev-owner", role="admin")

    if settings.AUTH_MODE == "jwt":
        return _verify_jwt(request, settings)

    if settings.AUTH_MODE in {"local_header", "gateway"}:
        return _resolve_local_or_gateway_context(x_owner_id=x_owner_id, x_actor_id=x_actor_id)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unsupported orchestrator auth mode.",
    )


def ensure_write_scope(owner: OwnerContext) -> None:
    accepted_write_scopes = {
        "member",
        "publication:write",
        "graph:write",
        "sources:write",
        "connectors:write",
    }
    if owner.scopes and accepted_write_scopes.isdisjoint(owner.scopes):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner context does not include write scope.",
        )
