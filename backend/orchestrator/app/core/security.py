"""Security headers middleware and rate-limiter factory."""

from __future__ import annotations

import slowapi
import slowapi.util
import starlette.middleware.base
import starlette.requests
import starlette.responses

# ── Rate limiter (Redis-backed in prod; memory-backed in dev) ─────────────────


def make_limiter(redis_url: str | None = None) -> slowapi.Limiter:
    """Return a Limiter wired to Redis when a URL is provided."""
    storage_uri: str = redis_url if redis_url else "memory://"
    return slowapi.Limiter(key_func=slowapi.util.get_remote_address, storage_uri=storage_uri)


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


class SecurityHeadersMiddleware(starlette.middleware.base.BaseHTTPMiddleware):
    """Attach security headers to every response."""

    async def dispatch(
        self, request: starlette.requests.Request, call_next: object
    ) -> starlette.responses.Response:
        response: starlette.responses.Response = await call_next(request)
        for header, value in _SECURITY_HEADERS.items():
            response.headers[header] = value
        return response
