"""Production configuration fails closed around identity."""

from __future__ import annotations

import pytest

import app.core.config


def test_auth_requires_a_session_signing_secret() -> None:
    with pytest.raises(ValueError, match="SERVICE_AUTH_SECRET is required"):
        app.core.config.Settings(
            ENVIRONMENT="development",
            AUTH_ENABLED=True,
            AUTH_MODE="local_header",
            SERVICE_AUTH_SECRET="",
        )


def test_production_can_serve_public_routes_without_email_delivery(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("RESEND_API_KEY", raising=False)

    settings = app.core.config.Settings(
        ENVIRONMENT="production",
        AUTH_MODE="jwt",
        SERVICE_AUTH_SECRET="production-session-secret",
    )

    assert settings.ENVIRONMENT == "production"


def test_production_accepts_configured_email_delivery(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("RESEND_API_KEY", "re_test_delivery_key")

    settings = app.core.config.Settings(
        ENVIRONMENT="production",
        AUTH_MODE="jwt",
        SERVICE_AUTH_SECRET="production-session-secret",
    )

    assert settings.ENVIRONMENT == "production"
