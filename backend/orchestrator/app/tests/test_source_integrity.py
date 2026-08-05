"""Source integrity guard.

An external formatting pass has repeatedly rewritten this package into code that
does not parse — appending inferred types to `with`/`except` clauses and turning
imports into repo-rooted paths that only resolve from the monorepo root. Both
survive a green local run when the pass lands after the checks, so the damage is
asserted here and runs in CI.
"""

import ast
import pathlib
import re

import pytest

# `except E as exc: E:` / `async with f() as conn: T:` — an annotation the
# formatter appends to a clause that cannot carry one.
_PSEUDO_ANNOTATION = re.compile(r"\bas \w+: [A-Za-z_][\w.\[\]| ]*:\s*(#.*)?$")

# `from DOT.backend.orchestrator.app...` — resolves only from the repo root, so
# it breaks the container image, which copies this package as `app`.
_REPO_ROOTED_IMPORT = re.compile(r"^\s*(from|import) DOT\.")

_ROOT = pathlib.Path(__file__).resolve().parents[2]


def _python_sources() -> list[pathlib.Path]:
    roots = (_ROOT / "app", _ROOT / "migrations")
    return sorted(p for root in roots for p in root.rglob("*.py"))


@pytest.mark.parametrize("path", _python_sources(), ids=lambda p: str(p.relative_to(_ROOT)))
def test_source_file_is_intact(path: pathlib.Path) -> None:
    source = path.read_text(encoding="utf-8")
    rel = path.relative_to(_ROOT)

    try:
        ast.parse(source)
    except SyntaxError as exc:
        pytest.fail(f"{rel}:{exc.lineno} does not parse: {exc.msg}")

    for lineno, line in enumerate(source.splitlines(), start=1):
        assert not _PSEUDO_ANNOTATION.search(line), (
            f"{rel}:{lineno} has a formatter-injected pseudo-annotation: {line.strip()}"
        )
        assert not _REPO_ROOTED_IMPORT.match(line), (
            f"{rel}:{lineno} imports via the repo root, which breaks the image: {line.strip()}"
        )
