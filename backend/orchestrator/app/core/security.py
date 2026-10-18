"""Security headers middleware and rate-limiter factory."""

from __future__ import annotations

import ipaddress

import slowapi
import slowapi.util
import starlette.middleware.base
import starlette.requests
import starlette.responses
import starlette.types

# ── Rate limiter (Redis-backed in prod; memory-backed in dev) ─────────────────


_shared_limiter: slowapi.Limiter | None = None

# Google's front-end and load-balancer source ranges. They can appear to the
# right of the visitor in X-Forwarded-For, but are never the visitor.
_GOOGLE_FRONT_END = (
    ipaddress.ip_network("35.191.0.0/16"),
    ipaddress.ip_network("130.211.0.0/22"),
)


def _is_infrastructure(address: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    return (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or any(address in network for network in _GOOGLE_FRONT_END)
    )


def client_address(request: starlette.requests.Request) -> str:
    """The visitor a rate limit counts, as Google's front end recorded them.

    Cloud Run proxies every request, so the socket peer is Google's proxy and
    is shared by all visitors: keyed on it, five strangers would exhaust the
    contact form for everyone. The front end appends the caller's address to
    X-Forwarded-For. A client can put anything to the left of it, so read from
    the right and skip infrastructure. IPv6 visitors count per /64, the block a
    single subscriber is usually assigned.
    """
    forwarded = request.headers.get("x-forwarded-for", "")
    for entry in reversed(forwarded.split(",")):
        try:
            address = ipaddress.ip_address(entry.strip())
        except ValueError:
            continue
        if _is_infrastructure(address):
            continue
        if address.version == 6:
            return str(ipaddress.ip_network(f"{address}/64", strict=False))
        return str(address)
    return slowapi.util.get_remote_address(request)


def make_limiter(redis_url: str | None = None) -> slowapi.Limiter:
    """Return the process-wide limiter using the configured storage.

    Routers are imported before ``create_app`` runs, so decorators must receive
    one deterministic object immediately. The current Cloud Run release is
    deliberately single-instance and configures ``memory://``; a distributed
    store requires constructing routers after settings resolution rather than
    silently swapping the storage beneath already-bound decorators.
    """
    global _shared_limiter  # noqa: PLW0603
    if _shared_limiter is None:
        _shared_limiter = slowapi.Limiter(
            key_func=client_address,
            storage_uri=redis_url or "memory://",
        )
    return _shared_limiter


# ── Security headers ──────────────────────────────────────────────────────────

_SECURITY_HEADERS: dict[str, str] = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "0",  # modern browsers ignore; CSP is the real guard
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": ("default-src 'none'; frame-ancestors 'none'; base-uri 'none';"),
}


class SessionOriginMiddleware(starlette.middleware.base.BaseHTTPMiddleware):
    """Reject foreign-origin mutations carrying an ambient session cookie."""

    def __init__(
        self,
        app: starlette.types.ASGIApp,
        *,
        allowed_origins: list[str],
        require_origin: bool,
    ) -> None:
        super().__init__(app)
        self.allowed_origins = frozenset(origin.rstrip("/") for origin in allowed_origins)
        self.require_origin = require_origin

    async def dispatch(
        self,
        request: starlette.requests.Request,
        call_next: starlette.middleware.base.RequestResponseEndpoint,
    ) -> starlette.responses.Response:
        if request.method not in {"GET", "HEAD", "OPTIONS"} and request.cookies.get("dot_session"):
            origin = request.headers.get("origin")
            if (not origin and self.require_origin) or (
                origin
                and origin not in self.allowed_origins
                and origin != str(request.base_url).rstrip("/")
            ):
                return starlette.responses.JSONResponse(
                    {"detail": "This sign-in session cannot be used from that origin."},
                    status_code=403,
                )
        return await call_next(request)


class SecurityHeadersMiddleware(starlette.middleware.base.BaseHTTPMiddleware):
    """Attach security headers to every response."""

    async def dispatch(
        self, request: starlette.requests.Request, call_next: object
    ) -> starlette.responses.Response:
        response: starlette.responses.Response = await call_next(request)
        for header, value in _SECURITY_HEADERS.items():
            response.headers[header] = value
        return response
