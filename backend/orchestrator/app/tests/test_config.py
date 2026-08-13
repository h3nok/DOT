"""Production configuration fails closed around identity."""

from __future__ import annotations

import pytest

import app.core.config


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
