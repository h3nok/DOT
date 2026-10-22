"""The academy seed script runs in production as a Cloud Run job after every deploy.

Import it the way the job does (by path) so a broken reference fails here, not in the
deploy.
"""

from __future__ import annotations

import importlib.util
import pathlib
import types

import pytest

SCRIPT = pathlib.Path(__file__).resolve().parents[2] / "scripts" / "seed_academy_space.py"


def _load_seed_script() -> types.ModuleType:
    spec = importlib.util.spec_from_file_location("seed_academy_space", SCRIPT)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_configured_steward_comes_first_then_every_owner_once(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("DOT_OWNER_EMAILS", raising=False)
    seed = _load_seed_script()
    assert seed.steward_emails("NKenok@gmail.com") == ["nkenok@gmail.com", "henok@sullix.com"]


def test_owner_addresses_follow_the_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DOT_OWNER_EMAILS", "a@example.org, b@example.org")
    seed = _load_seed_script()
    assert seed.steward_emails("b@example.org") == ["b@example.org", "a@example.org"]


def test_no_configured_address_keeps_the_local_handle(monkeypatch: pytest.MonkeyPatch) -> None:
    seed = _load_seed_script()
    assert seed.steward_emails("") == []

