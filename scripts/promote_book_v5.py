#!/usr/bin/env python3
"""Seal a validated v5 candidate and its derived public pages without deploying.

The archive and public edition are immutable. Identical reruns are safe; a changed
candidate must never replace a sealed edition. The backend's current PDF is the
only replaceable artifact. Serves L7, L8 and L10; violates no manifesto law.
"""
from __future__ import annotations

import argparse
from contextlib import ExitStack
import json
import os
from pathlib import Path
import shutil
import tempfile

from import_dot_book_v5 import (
    CLAIM_LEVELS, EXPECTED_FIGURES, PUBLIC_ASSET_URL, PUBLIC_PDF_NAME,
    RELEASE_OWNER_MARKER, ROOT, WORKING,
    asset_file, digest, load_figures, require_release_candidate,
)

ARCHIVE = ROOT / "docs/blueprint/book-one-complete/release-v5"
PUBLIC = ROOT / "frontend/public" / PUBLIC_ASSET_URL.lstrip("/")
BACKEND_PDF = ROOT / "backend/orchestrator/private/books" / PUBLIC_PDF_NAME


def tree_signature(root: Path) -> dict[str, str]:
    if not root.is_dir() or root.is_symlink():
        raise ValueError(f"Not an ordinary release directory: {root}")
    result = {}
    for path in sorted(root.rglob("*")):
        if path.is_symlink():
            raise ValueError(f"Release directories cannot contain symbolic links: {path}")
        if path.is_file():
            result[path.relative_to(root).as_posix()] = digest(path)
    return result


def validate_stage(web: Path, source: Path, pdf: Path, report: dict) -> dict:
    web = web.resolve()
    if not web.is_relative_to(Path(tempfile.gettempdir()).resolve()) or not (web / RELEASE_OWNER_MARKER).is_file():
        raise ValueError("A public edition must come from an owned temporary v5 release stage")
    manifest = json.loads((web / "manifest.json").read_text())
    release = manifest.get("release", {})
    if (release.get("version"), release.get("status"), release.get("id")) != (5, "published", "dot-book-one-v5"):
        raise ValueError("The staged web edition is not a final v5 publication")
    if manifest.get("project", {}).get("visibility") != "public" or not release.get("published_at"):
        raise ValueError("The staged edition needs public publication metadata")
    if manifest.get("source", {}).get("sha256") != digest(source):
        raise ValueError("The staged web text comes from a different Word manuscript")
    if manifest["source"].get("edit_manifest_sha256") != report["edit_manifest_sha256"]:
        raise ValueError("The staged web edition has a different editorial manifest")
    if manifest.get("artifacts", {}) != {"pdf": PUBLIC_PDF_NAME, "pdf_sha256": digest(pdf)}:
        raise ValueError("The staged PDF differs from the validated candidate")
    if manifest.get("reader_contract", {}).get("claim_levels") != CLAIM_LEVELS:
        raise ValueError("Claim levels must match the book's Table 1")
    figures = manifest.get("figures", [])
    if len(figures) != len(EXPECTED_FIGURES) or {f.get("id") for f in figures} != EXPECTED_FIGURES:
        raise ValueError("The staged edition lost an illustration")
    signature = tree_signature(web)
    expected = manifest.get("integrity", {}).get("files", {})
    actual = {name: value for name, value in signature.items() if name not in {"manifest.json", RELEASE_OWNER_MARKER}}
    if not expected or actual != expected:
        raise ValueError("The staged web files no longer match the frozen export")
    for name in actual:
        if name.endswith((".md", ".svg", ".json")):
            text = asset_file(web, name).read_text()
            if "/_preview/book-v5" in text or "/_book-v5" in text:
                raise ValueError(f"Private preview address in public artifact: {name}")
    return manifest


def require_identical_or_absent(destination: Path, stage: Path) -> bool:
    """Return True only for a byte-identical already sealed edition."""
    if destination.is_symlink():
        raise ValueError(f"A sealed edition cannot be a symbolic link: {destination}")
    if not destination.exists():
        return False
    if tree_signature(destination) != tree_signature(stage):
        raise ValueError(f"Refusing to overwrite a different sealed edition: {destination}")
    return True


def promote(source: Path, pdf: Path, web: Path, figures_path: Path, *, check_only=False) -> dict:
    source, pdf, web, figures_path = (path.resolve() for path in (source, pdf, web, figures_path))
    report_path = source.with_name(source.stem + "-Validation.json")
    report = json.loads(report_path.read_text())
    require_release_candidate(source, pdf, report)
    figures = load_figures(figures_path)
    hashes = report.get("assets_sha256", {})
    required_assets = {figures_path.name} | {
        f[key] for f in figures for key in ("print_svg", "print_png", "web_svg", "mobile_svg")
    }
    cover = report.get("cover", {})
    if not required_assets.issubset(hashes) or cover.get("src") not in hashes:
        raise ValueError("The candidate must freeze every illustration and the final cover")
    for name, expected in hashes.items():
        if digest(asset_file(figures_path.parent, name)) != expected:
            raise ValueError(f"Artwork changed since candidate validation: {name}")
    manifest = validate_stage(web, source, pdf, report)
    redline = source.with_name(source.stem + "-Redline.html")
    if not redline.is_file() or report.get("redline_sha256") != digest(redline):
        raise ValueError("The candidate needs its exact validated editorial redline")
    edits = WORKING / "editing/v5-edits.json"
    precision_review = WORKING / "editing/v5-precision-review.json"
    if not precision_review.is_file():
        raise ValueError("The final edition needs its line-by-line editorial review record")
    result = {"edition": 5, "source_sha256": digest(source), "pdf_sha256": digest(pdf),
              "archive": str(ARCHIVE), "public": str(PUBLIC), "backend_pdf": str(BACKEND_PDF)}
    with ExitStack() as stack:
        for parent in (ARCHIVE.parent, PUBLIC.parent):
            parent.mkdir(parents=True, exist_ok=True)
        archive_container = Path(stack.enter_context(tempfile.TemporaryDirectory(prefix=".v5-seal-", dir=ARCHIVE.parent)))
        public_container = Path(stack.enter_context(tempfile.TemporaryDirectory(prefix=".v5-seal-", dir=PUBLIC.parent)))
        archive_stage, public_stage = archive_container / "edition", public_container / "edition"
        archive_stage.mkdir()
        for path in (source, pdf, report_path, redline):
            shutil.copyfile(path, archive_stage / path.name)
        (archive_stage / "editing").mkdir()
        shutil.copyfile(edits, archive_stage / "editing/v5-edits.json")
        shutil.copyfile(precision_review, archive_stage / "editing/v5-precision-review.json")
        (archive_stage / "assets").mkdir()
        for name in hashes:
            destination = archive_stage / "assets" / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(asset_file(figures_path.parent, name), destination)
        (archive_stage / "Web-Manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        seal = {"edition": 5, "publication_date": manifest["release"]["published_at"],
                "files": tree_signature(archive_stage)}
        (archive_stage / "Seal.json").write_text(json.dumps(seal, ensure_ascii=False, indent=2) + "\n")
        shutil.copytree(web, public_stage, ignore=shutil.ignore_patterns(RELEASE_OWNER_MARKER))
        # Validate the copied bytes before touching any active artifact.
        if digest(archive_stage / source.name) != report["docx_sha256"] or digest(archive_stage / pdf.name) != report["pdf_sha256"]:
            raise ValueError("Candidate files changed while the release was staged")
        if digest(archive_stage / "editing/v5-edits.json") != report["edit_manifest_sha256"]:
            raise ValueError("Editorial input changed while the release was staged")
        if digest(archive_stage / redline.name) != report["redline_sha256"]:
            raise ValueError("The reviewed redline changed while the release was staged")
        for name, expected in hashes.items():
            if digest(archive_stage / "assets" / name) != expected:
                raise ValueError(f"Artwork changed while the release was staged: {name}")
        if tree_signature(public_stage) != {name: sha for name, sha in tree_signature(web).items() if name != RELEASE_OWNER_MARKER}:
            raise ValueError("Web files changed while the release was staged")
        archive_exists = require_identical_or_absent(ARCHIVE, archive_stage)
        public_exists = require_identical_or_absent(PUBLIC, public_stage)
        if check_only:
            return {**result, "status": "validated-for-sealing"}
        # A partial interrupted run is resumable: both immutable destinations
        # were checked before mutation, and an identical destination is a no-op.
        if not archive_exists:
            os.replace(archive_stage, ARCHIVE)
        if not public_exists:
            os.replace(public_stage, PUBLIC)
        BACKEND_PDF.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(prefix=".v5-pdf-", dir=BACKEND_PDF.parent, delete=False) as stream:
            mirror = Path(stream.name)
            stream.write((ARCHIVE / pdf.name).read_bytes())
        try:
            if digest(mirror) != report["pdf_sha256"]:
                raise ValueError("Backend PDF mirror failed its checksum")
            os.replace(mirror, BACKEND_PDF)
        finally:
            mirror.unlink(missing_ok=True)
    return {**result, "status": "sealed-local-release"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--web", type=Path, required=True)
    parser.add_argument("--figures", type=Path, default=WORKING / "assets/figures.json")
    parser.add_argument("--check", action="store_true", help="Validate all destinations without sealing or changing the backend PDF")
    args = parser.parse_args()
    print(json.dumps(promote(args.input, args.pdf, args.web, args.figures, check_only=args.check), indent=2))


if __name__ == "__main__":
    main()
