from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import APIRouter

ReadinessCheck = Callable[[], Awaitable[str]]


def create_health_router(
    *,
    service_name: str,
    version: str,
    readiness_checks: dict[str, ReadinessCheck] | None = None,
) -> APIRouter:
    router = APIRouter(tags=["health"])
    checks = readiness_checks or {}

    @router.get("/health")
    @router.get("/healthz")
    async def liveness() -> dict[str, str]:
        return {"status": "healthy", "service": service_name, "version": version}

    @router.get("/ready")
    @router.get("/readyz")
    @router.get("/health/ready")
    async def readiness() -> dict[str, Any]:
        results: dict[str, str] = {}
        for name, fn in checks.items():
            try:
                results[name] = await fn()
            except Exception as exc:
                results[name] = f"error:{exc}"
        all_ok = all(value == "ok" for value in results.values())
        return {
            "status": "ready" if all_ok else "degraded",
            "service": service_name,
            "version": version,
            "checks": results,
        }

    return router
