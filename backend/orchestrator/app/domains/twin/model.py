"""Model transport for the twin.

Zero retention (HKI-6): prompts and completions are never logged, traced, or
persisted. Only the outcome code and token counts are safe to emit.
"""

from __future__ import annotations

import typing

import httpx

import app.settings

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models"


class ModelUnavailableError(RuntimeError):
    """The model could not be reached or is not configured."""


class ModelClient(typing.Protocol):
    async def complete(self, *, system: str, user: str) -> str: ...


class NullModelClient:
    """Used when no API key is configured. Refuses rather than inventing."""

    async def complete(self, *, system: str, user: str) -> str:
        raise ModelUnavailableError("Twin model is not configured.")


class GeminiModelClient:
    def __init__(self, api_key: str, model: str, timeout: float) -> None:
        self._api_key: str = api_key
        self._model: str = model
        self._timeout: float = timeout

    async def complete(self, *, system: str, user: str) -> str:
        payload: dict[str, typing.Any] = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
            },
        }
        url: str = f"{GEMINI_ENDPOINT}/{self._model}:generateContent"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client: httpx.AsyncClient:
                response: httpx.Response = await client.post(
                    url, json=payload, headers={"x-goog-api-key": self._api_key}
                )
                response.raise_for_status()
                data: dict[str, typing.Any] = response.json()
        except httpx.HTTPError as exc: httpx.HTTPError:
            # Deliberately excludes the response body, which may echo content.
            raise ModelUnavailableError("Twin model request failed.") from exc

        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc: KeyError | IndexError | TypeError:
            raise ModelUnavailableError("Twin model returned no usable candidate.") from exc


def get_model_client() -> ModelClient:
    settings: app.settings.Settings = app.settings.get_settings()
    if not settings.TWIN_ENABLED or not settings.TWIN_API_KEY:
        return NullModelClient()
    return GeminiModelClient(
        settings.TWIN_API_KEY, settings.TWIN_MODEL, settings.TWIN_TIMEOUT_SECONDS
    )
