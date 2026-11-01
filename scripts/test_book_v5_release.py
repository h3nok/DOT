"""Regression checks for publication boundaries; no rendering or external services."""
from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest

import import_dot_book_v5 as exporter
import promote_book_v5 as promotion


class ReleaseBoundaries(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="dot-v5-release-test-")
        self.root = Path(self.temporary.name)

    def tearDown(self):
        self.temporary.cleanup()

    def test_preview_cannot_write_a_public_or_historical_edition(self):
        for version in (4, 5):
            path = exporter.ROOT / f"frontend/public/publications/henok/digital-organism-theory/v{version}"
            with self.assertRaisesRegex(ValueError, "proof may only"):
                exporter.safe_output(path)

    def test_release_export_must_stage_before_sealing(self):
        with self.assertRaisesRegex(ValueError, "staged under /tmp"):
            exporter.safe_output(promotion.PUBLIC, release=True)

    def test_export_modes_do_not_replace_each_others_outputs(self):
        (self.root / exporter.OWNER_MARKER).write_text("Proof")
        with self.assertRaisesRegex(ValueError, "not owned"):
            exporter.safe_output(self.root, release=True)
        (self.root / exporter.OWNER_MARKER).unlink()
        (self.root / exporter.RELEASE_OWNER_MARKER).write_text("Release")
        with self.assertRaisesRegex(ValueError, "not owned"):
            exporter.safe_output(self.root)

    def test_proof_cannot_pass_as_a_release_candidate(self):
        with self.assertRaisesRegex(ValueError, "release candidate"):
            exporter.require_release_candidate(
                self.root / (exporter.RELEASE_NAME + ".docx"),
                self.root / (exporter.RELEASE_NAME + ".pdf"),
                {"status": "author-review"},
            )

    def test_edit_manifest_drift_blocks_the_release(self):
        edits = self.root / "edits.json"
        edits.write_text("{}")
        with self.assertRaisesRegex(ValueError, "edit manifest changed"):
            exporter.require_release_candidate(
                self.root / (exporter.RELEASE_NAME + ".docx"),
                self.root / (exporter.RELEASE_NAME + ".pdf"),
                {"status": "release-candidate", "edition": 5, "edit_manifest_sha256": "stale"},
                edits,
            )

    def test_a_sealed_edition_can_only_be_repeated_byte_for_byte(self):
        sealed, stage = self.root / "sealed", self.root / "stage"
        sealed.mkdir()
        stage.mkdir()
        for directory in (sealed, stage):
            (directory / "chapter.md").write_text("The reviewed text.")
        self.assertTrue(promotion.require_identical_or_absent(sealed, stage))
        (stage / "chapter.md").write_text("An unreviewed replacement.")
        with self.assertRaisesRegex(ValueError, "different sealed edition"):
            promotion.require_identical_or_absent(sealed, stage)
        self.assertEqual((sealed / "chapter.md").read_text(), "The reviewed text.")

    def test_release_trees_reject_links_outside_the_edition(self):
        outside = self.root / "outside.txt"
        outside.write_text("Outside")
        stage = self.root / "stage"
        stage.mkdir()
        (stage / "link.txt").symlink_to(outside)
        with self.assertRaisesRegex(ValueError, "symbolic links"):
            promotion.tree_signature(stage)

    def staged_release(self, body="The reviewed chapter."):
        web = self.root / "web"
        web.mkdir()
        (web / exporter.RELEASE_OWNER_MARKER).write_text("Stage")
        (web / "sections").mkdir()
        (web / "sections/the-canvas.md").write_text(body)
        source = self.root / (exporter.RELEASE_NAME + ".docx")
        source.write_bytes(b"word bytes already validated by the candidate check")
        pdf = self.root / (exporter.RELEASE_NAME + ".pdf")
        pdf.write_bytes(b"%PDF- candidate bytes")
        (web / exporter.PUBLIC_PDF_NAME).write_bytes(pdf.read_bytes())
        manifest = {
            "project": {"visibility": "public"},
            "release": {"id": "dot-book-one-v5", "version": 5, "status": "published", "published_at": "2026-11-01"},
            "source": {"sha256": exporter.digest(source), "edit_manifest_sha256": "reviewed"},
            "artifacts": {"pdf": exporter.PUBLIC_PDF_NAME, "pdf_sha256": exporter.digest(pdf)},
            "reader_contract": {"claim_levels": exporter.CLAIM_LEVELS},
            "figures": [{"id": ident} for ident in sorted(exporter.EXPECTED_FIGURES)],
            "integrity": {"files": {"sections/the-canvas.md": exporter.digest(web / "sections/the-canvas.md"),
                                       exporter.PUBLIC_PDF_NAME: exporter.digest(pdf)}},
        }
        (web / "manifest.json").write_text(json.dumps(manifest))
        return web, source, pdf, {"edit_manifest_sha256": "reviewed"}

    def test_changed_staged_text_cannot_be_sealed(self):
        args = self.staged_release()
        promotion.validate_stage(*args)
        (args[0] / "sections/the-canvas.md").write_text("Unreviewed text.")
        with self.assertRaisesRegex(ValueError, "frozen export"):
            promotion.validate_stage(*args)

    def test_private_proof_urls_cannot_be_hidden_behind_matching_hashes(self):
        args = self.staged_release("See /_book-v5/figures/local.svg")
        with self.assertRaisesRegex(ValueError, "Private preview address"):
            promotion.validate_stage(*args)


if __name__ == "__main__":
    unittest.main()
