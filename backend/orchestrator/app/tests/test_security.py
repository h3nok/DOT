"""Security primitives shared by every public router."""

from __future__ import annotations

import app.core.security as security


def test_rate_limiters_share_one_store(monkeypatch) -> None:
    monkeypatch.setattr(security, "_shared_limiter", None)

    router_limiter = security.make_limiter()
    app_limiter = security.make_limiter("memory://")

    assert router_limiter is app_limiter
