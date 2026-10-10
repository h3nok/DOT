"""Security primitives shared by every public router."""

from __future__ import annotations

import fastapi.testclient
import pytest
import starlette.applications
import starlette.requests
import starlette.responses
import starlette.routing

import app.core.security as security


def test_rate_limiters_share_one_store(monkeypatch) -> None:
    monkeypatch.setattr(security, "_shared_limiter", None)

    router_limiter = security.make_limiter()
    app_limiter = security.make_limiter("memory://")

    assert router_limiter is app_limiter


def _request(forwarded: str | None, peer: str = "169.254.1.1") -> starlette.requests.Request:
    headers = [] if forwarded is None else [(b"x-forwarded-for", forwarded.encode())]
    return starlette.requests.Request({"type": "http", "headers": headers, "client": (peer, 40000)})


@pytest.mark.parametrize(
    ("forwarded", "expected"),
    [
        (None, "169.254.1.1"),
        ("81.2.69.160", "81.2.69.160"),
        # A client can only write to the left of what Google appends.
        ("81.2.69.142, 81.2.69.160", "81.2.69.160"),
        ("not-an-address, 81.2.69.160", "81.2.69.160"),
        # Load-balancer and link-local hops to the right are not the visitor.
        ("81.2.69.160, 35.191.10.4", "81.2.69.160"),
        ("81.2.69.160, 130.211.0.9, 169.254.1.1", "81.2.69.160"),
        ("2a02:c7c:abcd:12:1:2:3:4", "2a02:c7c:abcd:12::/64"),
        ("10.0.0.3, 169.254.1.1", "169.254.1.1"),
    ],
)
def test_rate_limits_count_the_visitor_not_the_proxy(forwarded: str | None, expected: str) -> None:
    assert security.client_address(_request(forwarded)) == expected


@pytest.mark.parametrize(
    ("origin", "with_cookie", "require_origin", "expected"),
    [
        ("https://dotheory.org", True, True, 200),
        ("http://testserver", True, True, 200),
        ("https://dotheory.org.attacker.test", True, True, 403),
        ("https://attacker.test", True, True, 403),
        ("null", True, True, 403),
        (None, True, True, 403),
        (None, True, False, 200),
        ("https://attacker.test", False, True, 200),
    ],
)
def test_session_origin_guard(
    origin: str | None, with_cookie: bool, require_origin: bool, expected: int
) -> None:
    called = False

    async def write(request: starlette.requests.Request) -> starlette.responses.Response:
        nonlocal called
        called = True
        return starlette.responses.JSONResponse({"ok": True})

    app = starlette.applications.Starlette(
        routes=[starlette.routing.Route("/write", write, methods=["POST"])],
    )
    app.add_middleware(
        security.SessionOriginMiddleware,
        allowed_origins=["https://dotheory.org"],
        require_origin=require_origin,
    )
    headers = {"Origin": origin} if origin is not None else {}
    if with_cookie:
        headers["Cookie"] = "dot_session=opaque-test-fixture"
    with fastapi.testclient.TestClient(app) as client:
        response = client.post("/write", headers=headers)
    assert response.status_code == expected
    assert called is (expected == 200)
