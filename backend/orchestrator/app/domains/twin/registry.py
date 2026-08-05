"""Signed-domain tool runtime (HKI-1, HKI-5).

A tool is dispatchable only if its manifest verifies against the runtime secret.
There is no dynamic registration path: manifests are declared in code, signed at
build or boot, and the registry refuses anything it cannot verify.
"""

from __future__ import annotations

import collections.abc
import dataclasses
import hmac
import json
import typing

import app.core.errors


class ToolSignatureError(app.core.errors.ServiceError):
    def __init__(self, message: str = "Tool manifest signature is invalid") -> None:
        super().__init__(message, code="TOOL_SIGNATURE_INVALID", status_code=500)


class ToolNotFoundError(app.core.errors.ServiceError):
    def __init__(self, message: str = "Unknown tool") -> None:
        super().__init__(message, code="TOOL_NOT_FOUND", status_code=400)


@dataclasses.dataclass(frozen=True)
class ToolManifest:
    name: str
    description: str
    #: JSON Schema for the argument object. The boundary validates against it
    #: before the handler is ever reached.
    args_schema: dict[str, typing.Any]
    #: Hosts this tool may reach. Empty means the tool performs no egress.
    egress_hosts: tuple[str, ...] = ()


ToolHandler = collections.abc.Callable[..., collections.abc.Awaitable[typing.Any]]


def canonical_manifest_bytes(manifest: ToolManifest) -> bytes:
    """Stable byte form of a manifest, so a signature covers exactly one shape."""

    return json.dumps(
        {
            "name": manifest.name,
            "description": manifest.description,
            "args_schema": manifest.args_schema,
            "egress_hosts": sorted(manifest.egress_hosts),
        },
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
    ).encode("utf-8")


def sign_manifest(manifest: ToolManifest, secret: str) -> str:
    return hmac.new(
        secret.encode("utf-8"), canonical_manifest_bytes(manifest), "sha256"
    ).hexdigest()


@dataclasses.dataclass(frozen=True)
class _RegisteredTool:
    manifest: ToolManifest
    handler: ToolHandler
    signature: str


class ToolRegistry:
    """Holds the closed set of tools the twin may call."""

    def __init__(self, secret: str) -> None:
        if not secret:
            raise ToolSignatureError("Tool runtime secret is not configured.")
        self._secret: str = secret
        self._tools: dict[str, _RegisteredTool] = {}

    def register(self, manifest: ToolManifest, handler: ToolHandler) -> None:
        signature: str = sign_manifest(manifest, self._secret)
        self._tools[manifest.name] = _RegisteredTool(manifest, handler, signature)

    def manifests(self) -> list[ToolManifest]:
        return [tool.manifest for tool in self._tools.values()]

    def egress_allow_list(self) -> frozenset[str]:
        """Union of hosts declared across signed manifests (HKI-5)."""

        return frozenset(
            host for tool in self._tools.values() for host in tool.manifest.egress_hosts
        )

    def verify(self, name: str) -> ToolManifest:
        tool: _RegisteredTool | None = self._tools.get(name)
        if tool is None:
            raise ToolNotFoundError(f"Unknown tool: {name}")
        expected: str = sign_manifest(tool.manifest, self._secret)
        if not hmac.compare_digest(expected, tool.signature):
            raise ToolSignatureError(f"Tool manifest signature mismatch: {name}")
        return tool.manifest

    async def dispatch(self, name: str, args: dict[str, typing.Any], **context: typing.Any):
        self.verify(name)
        return await self._tools[name].handler(args=args, **context)
