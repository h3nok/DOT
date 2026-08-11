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


class StreamChunk(typing.NamedTuple):
    """One incremental piece of the model's emission.

    `text` carries a raw delta of the JSON payload the model is producing. The
    caller — not the model — decides how much of that JSON is safe to show before
    the whole object has been validated at the boundary (HKI-2).
    """

    text: str


class NullModelClient:
    """Used when no API key is configured. Refuses rather than inventing."""

    async def complete(self, *, system: str, user: str) -> str:
        raise ModelUnavailableError("Twin model is not configured.")

    async def stream(self, *, system: str, user: str) -> typing.AsyncGenerator[StreamChunk, None]:
        raise ModelUnavailableError("Twin model is not configured.")
        yield  # pragma: no cover - marks this an async generator


class GeminiModelClient:
    def __init__(self, api_key: str, model: str, timeout: float) -> None:
        self._api_key: str = api_key
        self._model: str = model
        self._timeout: float = timeout

    async def complete(self, *, system: str, user: str) -> str:
        url: str = f"{GEMINI_ENDPOINT}/{self._model}:generateContent"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response: httpx.Response = await client.post(
                    url,
                    json=self._payload(system, user),
                    headers={"x-goog-api-key": self._api_key},
                )
                response.raise_for_status()
                data: dict[str, typing.Any] = response.json()
        except httpx.HTTPError as exc:
            # Deliberately excludes the response body, which may echo content.
            raise ModelUnavailableError("Twin model request failed.") from exc

        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ModelUnavailableError("Twin model returned no usable candidate.") from exc

    def _payload(self, system: str, user: str) -> dict[str, typing.Any]:
        return {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
            },
        }

    async def stream(self, *, system: str, user: str) -> typing.AsyncGenerator[StreamChunk, None]:
        """Yield raw text deltas as Gemini produces them (SSE).

        Each `data:` frame is a JSON object; we surface only the inner text delta
        and let the caller accumulate and validate the full payload at the
        boundary. No frame content is logged (HKI-6).
        """

        url: str = f"{GEMINI_ENDPOINT}/{self._model}:streamGenerateContent"
        try:
            async with (
                httpx.AsyncClient(timeout=self._timeout) as client,
                client.stream(
                    "POST",
                    url,
                    params={"alt": "sse"},
                    json=self._payload(system, user),
                    headers={"x-goog-api-key": self._api_key},
                ) as response,
            ):
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    frame = line[len("data:") :].strip()
                    if not frame:
                        continue
                    try:
                        data: typing.Any = httpx.Response(200, content=frame).json()
                        delta = data["candidates"][0]["content"]["parts"][0]["text"]
                    except (ValueError, KeyError, IndexError, TypeError):
                        # A partial/keep-alive frame is not content; skip it.
                        continue
                    if delta:
                        yield StreamChunk(text=delta)
        except httpx.HTTPError as exc:
            raise ModelUnavailableError("Twin model stream failed.") from exc


def get_model_client() -> ModelClient:
    settings: app.settings.Settings = app.settings.get_settings()
    if not settings.TWIN_ENABLED or not settings.TWIN_API_KEY:
        return NullModelClient()
    return GeminiModelClient(
        settings.TWIN_API_KEY, settings.TWIN_MODEL, settings.TWIN_TIMEOUT_SECONDS
    )
