from __future__ import annotations

import asyncio
import logging
import time
from enum import Enum
from typing import Any
from urllib.parse import urlparse

import httpx

logger = logging.getLogger("dot_orchestrator.http")


class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 30.0) -> None:
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time = 0.0

    @property
    def state(self) -> CircuitState:
        if (
            self._state == CircuitState.OPEN
            and time.monotonic() - self._last_failure_time >= self.recovery_timeout
        ):
            self._state = CircuitState.HALF_OPEN
        return self._state

    @property
    def allow_request(self) -> bool:
        return self.state in {CircuitState.CLOSED, CircuitState.HALF_OPEN}

    def record_success(self) -> None:
        self._failure_count = 0
        self._state = CircuitState.CLOSED

    def record_failure(self) -> None:
        self._failure_count += 1
        self._last_failure_time = time.monotonic()
        if self._failure_count >= self.failure_threshold:
            self._state = CircuitState.OPEN


class CircuitOpenError(Exception):
    def __init__(self, host: str) -> None:
        super().__init__(f"Circuit breaker OPEN for {host}")
        self.host = host


_breakers: dict[str, CircuitBreaker] = {}
_RETRYABLE_STATUS_CODES = {429, 502, 503, 504}


def create_service_client(
    service_name: str,
    *,
    base_url: str | None = None,
    timeout: float = 30.0,
    max_connections: int = 100,
) -> httpx.AsyncClient:
    headers = {"User-Agent": f"{service_name}/0.1.0"}
    return httpx.AsyncClient(
        base_url=base_url or "",
        timeout=timeout,
        limits=httpx.Limits(max_connections=max_connections),
        headers=headers,
    )


def _extract_host(url: str) -> str:
    parsed = urlparse(url)
    return parsed.netloc or parsed.hostname or url


def _breaker_for(host: str) -> CircuitBreaker:
    if host not in _breakers:
        _breakers[host] = CircuitBreaker()
    return _breakers[host]


async def resilient_request(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    *,
    max_retries: int = 3,
    backoff_base: float = 0.5,
    backoff_max: float = 8.0,
    **kwargs: Any,
) -> httpx.Response:
    host = _extract_host(url)
    breaker = _breaker_for(host)
    if not breaker.allow_request:
        raise CircuitOpenError(host)

    last_exc: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            response = await client.request(method, url, **kwargs)
            if response.status_code in _RETRYABLE_STATUS_CODES:
                breaker.record_failure()
                if attempt < max_retries:
                    await asyncio.sleep(min(backoff_base * (2**attempt), backoff_max))
                    continue
            else:
                breaker.record_success()
            return response
        except (httpx.ConnectError, httpx.ConnectTimeout) as exc:
            breaker.record_failure()
            last_exc = exc
            if attempt < max_retries:
                await asyncio.sleep(min(backoff_base * (2**attempt), backoff_max))
                continue
            raise

    if last_exc:
        raise last_exc
    raise RuntimeError("Exhausted retries with no response")
