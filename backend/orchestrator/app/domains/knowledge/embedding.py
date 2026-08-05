"""Embeddings for retrieval.

Zero retention (HKI-6) applies here too: chunk text is sent to the embedding
endpoint but never logged, and failures report a count rather than content.

Absence of a key is a supported state, not an error. The twin degrades to
keyword scoring rather than returning nothing, because a member who has not
configured a model should still be able to search their own vault.
"""

from __future__ import annotations

import logging
import math
import typing

import httpx

import app.settings

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models"

logger = logging.getLogger(__name__)


class EmbeddingUnavailableError(RuntimeError):
    """The embedding model could not be reached or is not configured."""


class EmbeddingClient(typing.Protocol):
    @property
    def model(self) -> str: ...

    async def embed(self, texts: list[str]) -> list[list[float]]: ...


class NullEmbeddingClient:
    """Used when no key is configured. Callers fall back to keyword scoring."""

    @property
    def model(self) -> str:
        return ""

    async def embed(self, texts: list[str]) -> list[list[float]]:
        raise EmbeddingUnavailableError("Embedding model is not configured.")


class GeminiEmbeddingClient:
    def __init__(self, api_key: str, model: str, dimensions: int, timeout: float) -> None:
        self._api_key: str = api_key
        self._model: str = model
        self._dimensions: int = dimensions
        self._timeout: float = timeout

    @property
    def model(self) -> str:
        return self._model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        payload: dict[str, typing.Any] = {
            "requests": [
                {
                    "model": f"models/{self._model}",
                    "content": {"parts": [{"text": text}]},
                    "outputDimensionality": self._dimensions,
                }
                for text in texts
            ]
        }
        url: str = f"{GEMINI_ENDPOINT}/{self._model}:batchEmbedContents"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response: httpx.Response = await client.post(
                    url, json=payload, headers={"x-goog-api-key": self._api_key}
                )
                response.raise_for_status()
                data: dict[str, typing.Any] = response.json()
        except httpx.HTTPError as exc:
            # Deliberately excludes the response body, which may echo content.
            raise EmbeddingUnavailableError("Embedding request failed.") from exc

        try:
            vectors: list[list[float]] = [
                [float(value) for value in item["values"]] for item in data["embeddings"]
            ]
        except (KeyError, TypeError, ValueError) as exc:
            raise EmbeddingUnavailableError("Embedding response was malformed.") from exc

        if len(vectors) != len(texts):
            raise EmbeddingUnavailableError("Embedding response did not match the request.")
        return [normalize(vector) for vector in vectors]


def get_embedding_client() -> EmbeddingClient:
    settings: app.settings.Settings = app.settings.get_settings()
    if not settings.TWIN_ENABLED or not settings.TWIN_API_KEY:
        return NullEmbeddingClient()
    return GeminiEmbeddingClient(
        settings.TWIN_API_KEY,
        settings.EMBEDDING_MODEL,
        settings.EMBEDDING_DIMENSIONS,
        settings.TWIN_TIMEOUT_SECONDS,
    )


def normalize(vector: list[float]) -> list[float]:
    """Unit-length vectors reduce cosine similarity to a dot product."""

    magnitude: float = math.sqrt(sum(value * value for value in vector))
    if magnitude == 0.0:
        return vector
    return [value / magnitude for value in vector]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    """Similarity of two vectors. Mismatched lengths score zero, never partially."""

    if not left or not right or len(left) != len(right):
        return 0.0
    return sum(a * b for a, b in zip(left, right, strict=True))
