import time

import fastapi
import fastapi.testclient
import jwt
import pytest

import app.auth.dependencies
import app.core.config

TEST_SECRET = "test-secret-for-dot-orchestrator"


def make_token(
    *,
    owner_id: str = "owner_jwt",
    subject: str = "actor_jwt",
    secret: str = TEST_SECRET,
    issuer: str = "dot-bff",
    audience: str = "dot-orchestrator",
    exp_offset: int = 300,
    scopes: list[str] | None = None,
) -> str:
    now = int(time.time())
    return jwt.encode(
        {
            "sub": subject,
            "owner_id": owner_id,
            "role": "member",
            "scopes": scopes or ["member"],
            "iss": issuer,
            "aud": audience,
            "iat": now,
            "exp": now + exp_offset,
        },
        secret,
        algorithm=app.auth.dependencies.ALGORITHM,
    )


@pytest.fixture()
def jwt_client(monkeypatch: pytest.MonkeyPatch) -> fastapi.testclient.TestClient:
    test_app = fastapi.FastAPI()

    @test_app.get("/protected")
    async def protected(
        owner: app.auth.dependencies.OwnerContext = fastapi.Depends(
            app.auth.dependencies.require_owner
        ),
    ):
        return {
            "owner_id": owner.owner_id,
            "actor_id": owner.actor_id,
            "role": owner.role,
            "scopes": list(owner.scopes),
        }

    jwt_settings = app.core.config.Settings(
        AUTH_MODE="jwt",
        SERVICE_AUTH_SECRET=TEST_SECRET,
        JWT_ISSUER="dot-bff",
        JWT_AUDIENCE="dot-orchestrator",
    )
    monkeypatch.setattr("app.settings.get_settings", lambda: jwt_settings)
    return fastapi.testclient.TestClient(test_app)


def test_jwt_auth_accepts_valid_token(jwt_client: fastapi.testclient.TestClient) -> None:
    token: str = make_token(owner_id="owner_abc", subject="actor_123")

    response = jwt_client.get("/protected", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["owner_id"] == "owner_abc"
    assert response.json()["actor_id"] == "actor_123"


def test_jwt_auth_rejects_missing_token(jwt_client: fastapi.testclient.TestClient) -> None:
    response = jwt_client.get("/protected")

    assert response.status_code == 401


def test_jwt_auth_rejects_wrong_audience(jwt_client: fastapi.testclient.TestClient) -> None:
    token: str = make_token(audience="wrong-audience")

    response = jwt_client.get("/protected", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
