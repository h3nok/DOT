import fastapi.testclient
import pytest
from fastapi.testclient import TestClient

import app.main
import app.settings


def test_healthz(client: TestClient) -> None:
    response = client.get("/healthz")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_health_alias(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["service"] == "dot-orchestrator"


def _app_in(monkeypatch: pytest.MonkeyPatch, environment: str) -> TestClient:
    # Set the environment explicitly: a developer's .env must not decide the outcome.
    monkeypatch.setenv("ORCHESTRATOR_ENVIRONMENT", environment)
    monkeypatch.setenv("ORCHESTRATOR_AUTH_ENABLED", "true")
    monkeypatch.setenv("ORCHESTRATOR_AUTH_MODE", "jwt")
    monkeypatch.setenv(
        "ORCHESTRATOR_SERVICE_AUTH_SECRET", "test-session-signing-secret-at-least-32-bytes"
    )
    app.settings.get_settings.cache_clear()
    return fastapi.testclient.TestClient(app.main.create_app())


def test_api_schema_is_served_in_development(monkeypatch: pytest.MonkeyPatch) -> None:
    try:
        local = _app_in(monkeypatch, "development")
        for path in ("/docs", "/redoc", "/openapi.json"):
            assert local.get(path).status_code == 200
    finally:
        app.settings.get_settings.cache_clear()


@pytest.mark.parametrize("environment", ["production", "staging"])
def test_public_deployments_do_not_publish_the_api_schema(
    monkeypatch: pytest.MonkeyPatch, environment: str
) -> None:
    try:
        deployed = _app_in(monkeypatch, environment)
        for path in ("/docs", "/redoc", "/openapi.json"):
            assert deployed.get(path).status_code == 404
    finally:
        app.settings.get_settings.cache_clear()
