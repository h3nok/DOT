from __future__ import annotations

import hashlib
import json
from pathlib import Path
from unittest import mock

import pytest

import app.core.tenancy
import app.db.session
import app.domains.canon.service as canon
from scripts import ingest_canon


def test_local_canon_path_resolves_from_the_repository_root(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("ORCHESTRATOR_CANON_ROOT", raising=False)
    repository = Path(__file__).resolve().parents[4]
    assert ingest_canon.edition_root() == (
        repository / "frontend/public/publications/henok/digital-organism-theory/v5"
    )


def test_deployed_canon_path_uses_the_configured_release(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ORCHESTRATOR_CANON_ROOT", "/canon/digital-organism-theory/v5")
    assert ingest_canon.edition_root() == Path("/canon/digital-organism-theory/v5")


def _write_release(
    root: Path, *, status="published", body="Core.\n::: depth Detail\nFull text.\n:::\n"
) -> Path:
    (root / "sections").mkdir()
    section = root / "sections/the-canvas.md"
    section.write_text(body)
    manifest = {
        "project": {"slug": "digital-organism-theory", "title": "Book One", "visibility": "public"},
        "release": {"status": status, "version": 5},
        "sections": [
            {
                "slug": "the-canvas",
                "kind": "chapter",
                "number": 5,
                "title": "The Canvas",
                "part": "The Human Instance",
            }
        ],
        "integrity": {
            "files": {"sections/the-canvas.md": hashlib.sha256(section.read_bytes()).hexdigest()}
        },
    }
    (root / "manifest.json").write_text(json.dumps(manifest))
    return section


def test_canon_keeps_the_complete_validated_text_without_reader_markers(tmp_path: Path) -> None:
    _write_release(tmp_path)
    slug, _, sections = ingest_canon.load_sections(tmp_path)
    assert slug == "digital-organism-theory"
    assert sections[0].text == "Core.\nFull text.\n"
    assert sections[0].claim_level is None


def test_canon_rejects_text_changed_after_release(tmp_path: Path) -> None:
    section = _write_release(tmp_path)
    section.write_text("A different account.")
    with pytest.raises(ValueError, match="no longer matches"):
        ingest_canon.load_sections(tmp_path)


def test_canon_rejects_draft_metadata(tmp_path: Path) -> None:
    _write_release(tmp_path, status="draft")
    with pytest.raises(ValueError, match="published public edition"):
        ingest_canon.load_sections(tmp_path)


def test_canon_rejects_private_preview_links_even_with_a_matching_hash(tmp_path: Path) -> None:
    _write_release(tmp_path, body="Read [the proof](/_preview/book-v5/the-canvas).")
    with pytest.raises(ValueError, match="private proof"):
        ingest_canon.load_sections(tmp_path)


def test_canon_keeps_the_manuscript_caption_beside_its_illustration(tmp_path: Path) -> None:
    _write_release(
        tmp_path,
        body=(
            "Before.\n\n![A local process.]"
            "(/publications/henok/digital-organism-theory/v5/figures/local.svg)\n\nAfter.\n"
        ),
    )
    path = tmp_path / "manifest.json"
    manifest = json.loads(path.read_text())
    manifest["figures"] = [
        {
            "id": "local",
            "section": "the-canvas",
            "number": 1,
            "title": "Local scope",
            "claimLevel": "DOT model",
            "caption": "Access and action remain distinct.",
            "alt": "A local process.",
            "src": "figures/local.svg",
        }
    ]
    path.write_text(json.dumps(manifest))
    _, _, sections = ingest_canon.load_sections(tmp_path)
    assert sections[0].text == (
        "Before.\n\nFigure 1 · Local scope. DOT model. Access and action remain distinct.\n\n"
        "Illustration description: A local process.\n\nAfter.\n"
    )


async def test_ingestion_job_binds_the_owner_tenant(
    session_factory, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: dict[str, str | None] = {}

    async def capture_tenant(session, owner, **kwargs):
        seen["owner"] = owner.owner_id
        seen["tenant"] = app.core.tenancy.current_tenant(session)
        return []

    monkeypatch.setattr(app.db.session, "AsyncSessionLocal", session_factory)
    monkeypatch.setattr(
        ingest_canon,
        "load_sections",
        lambda root: ("digital-organism-theory", "Digital Organism Theory", []),
    )
    monkeypatch.setattr(canon, "ingest_edition", capture_tenant)
    monkeypatch.setattr(app.db.session, "engine", mock.AsyncMock())

    await ingest_canon.main("henok", dry_run=False)

    assert seen == {"owner": "henok", "tenant": "henok"}
