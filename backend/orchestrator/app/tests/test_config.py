"""Production configuration fails closed around identity and email delivery."""

from __future__ import annotations

import pytest

import app.core.config


def test_production_requires_email_delivery(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("RESEND_API_KEY", raising=False)

    with pytest.raises(ValueError, match="RESEND_API_KEY is required"):
        app.core.config.Settings(
            ENVIRONMENT="production",
            AUTH_MODE="jwt",
            SERVICE_AUTH_SECRET="production-session-secret",
        )


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
