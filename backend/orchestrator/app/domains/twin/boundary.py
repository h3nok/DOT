"""The Model Context Protocol boundary (HKI-2, HKI-4).

Everything crossing between the reasoning loop and the runtime passes through
here. The model may emit exactly two shapes and nothing else; retrieved content
enters only inside an envelope that is declared untrusted.
"""

from __future__ import annotations

import json
import typing

import pydantic

MAX_MODEL_OUTPUT_BYTES = 16_384
MAX_ANSWER_CHARS = 8_000
MAX_CITATIONS = 32

UNTRUSTED_OPEN = "<untrusted-context>"
UNTRUSTED_CLOSE = "</untrusted-context>"


class BoundaryViolation(Exception):
    """The model emitted something outside the permitted union."""


class ToolCall(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")

    tool: str = pydantic.Field(min_length=1, max_length=64)
    args: dict[str, typing.Any] = pydantic.Field(default_factory=dict)


class FinalAnswer(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid")

    answer: str = pydantic.Field(min_length=1, max_length=MAX_ANSWER_CHARS)
    cites: list[str] = pydantic.Field(default_factory=list, max_length=MAX_CITATIONS)


ModelOutput = ToolCall | FinalAnswer


def parse_model_output(raw: str) -> ModelOutput:
    """Parse model output into the closed union, or refuse.

    A malformed emission is a refusal, never a repair-and-retry loop: retrying
    on malformed output is the path injected instructions use to negotiate.
    """

    if len(raw.encode("utf-8")) > MAX_MODEL_OUTPUT_BYTES:
        raise BoundaryViolation("Model output exceeded the boundary size limit.")
    try:
        payload: typing.Any = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise BoundaryViolation("Model output was not valid JSON.") from exc
    if not isinstance(payload, dict):
        raise BoundaryViolation("Model output was not a JSON object.")

    keys: set[str] = set(payload)
    if keys <= {"tool", "args"} and "tool" in keys:
        try:
            return ToolCall.model_validate(payload)
        except pydantic.ValidationError as exc:
            raise BoundaryViolation("Tool call did not match the boundary schema.") from exc
    if keys <= {"answer", "cites"} and "answer" in keys:
        try:
            return FinalAnswer.model_validate(payload)
        except pydantic.ValidationError as exc:
            raise BoundaryViolation("Answer did not match the boundary schema.") from exc
    raise BoundaryViolation("Model output did not match any permitted shape.")


def wrap_untrusted(fragments: list[dict[str, typing.Any]]) -> str:
    """Envelope retrieved content as data (HKI-4).

    Content is never concatenated into the system prompt. Anything inside this
    envelope that looks like an instruction is data about the member, not a
    request from them.
    """

    body: str = json.dumps(fragments, ensure_ascii=False, separators=(",", ":"))
    # Strip any attempt to close the envelope early and resume as trusted text.
    body = body.replace(UNTRUSTED_CLOSE, "")
    return f"{UNTRUSTED_OPEN}\n{body}\n{UNTRUSTED_CLOSE}"
