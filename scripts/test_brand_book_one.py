from __future__ import annotations

import json
import unittest
import zipfile
from xml.dom import minidom

from brand_book_one import (
    ROOT,
    align_edition,
    brand_document,
    designed_invariant,
)
from revise_book_one_review import all_text, elements, invariant, text_of


class BookIdentityTests(unittest.TestCase):
    def setUp(self) -> None:
        with zipfile.ZipFile(
            ROOT / "docs/blueprint/DOT-Book-One-Digital-Edition-v3.docx"
        ) as archive:
            self.document = minidom.parseString(archive.read("word/document.xml"))
        self.identity = json.loads((ROOT / "frontend/src/content/identity.json").read_text())

    def test_preserves_every_word_equation_field_citation_and_bookmark(self) -> None:
        before = all_text(self.document), designed_invariant(self.document)
        brand_document(self.document, self.identity)
        self.assertEqual((all_text(self.document), invariant(self.document)), before)
        self.assertEqual(len(self.document.getElementsByTagName("m:oMath")), 53)
        self.assertEqual(len(self.document.getElementsByTagName("w:hyperlink")), 25)

    def test_sets_the_seven_by_ten_layout_and_reuses_the_shared_type_roles(
        self,
    ) -> None:
        brand_document(self.document, self.identity)
        page = self.document.getElementsByTagName("w:pgSz")[-1]
        self.assertEqual((page.getAttribute("w:w"), page.getAttribute("w:h")), ("10080", "14400"))
        fonts = {
            node.getAttribute("w:ascii") for node in self.document.getElementsByTagName("w:rFonts")
        }
        self.assertTrue(set(self.identity["fonts"].values()).issubset(fonts))

    def test_repeated_design_keeps_the_text_and_only_one_jacket(self) -> None:
        before = all_text(self.document), designed_invariant(self.document)
        brand_document(self.document, self.identity)
        brand_document(self.document, self.identity)
        self.assertEqual((all_text(self.document), invariant(self.document)), before)
        jackets = [
            node
            for node in self.document.getElementsByTagName("wp:docPr")
            if node.getAttribute("name") == "DOTIdentityJacket"
        ]
        self.assertEqual(len(jackets), 1)

    def test_fails_when_the_cover_boundary_has_drifted(self) -> None:
        for paragraph in self.document.getElementsByTagName("w:p"):
            for node in paragraph.getElementsByTagName("w:t"):
                if node.firstChild and node.firstChild.data == "PREFACE":
                    node.firstChild.data = "Changed boundary"
        with self.assertRaisesRegex(ValueError, "cover structure changed"):
            brand_document(self.document, self.identity)

    def test_keeps_inline_equation_prose_left_aligned(self) -> None:
        brand_document(self.document, self.identity)
        for paragraph in self.document.getElementsByTagName("w:p"):
            if (
                paragraph.getElementsByTagName("m:oMath")
                and not paragraph.getElementsByTagName("m:oMathPara")
                and text_of(paragraph).strip()
            ):
                alignment = paragraph.getElementsByTagName("w:jc")[0]
                self.assertEqual(alignment.getAttribute("w:val"), "left")

    def test_only_the_long_display_formula_uses_two_native_rows(self) -> None:
        brand_document(self.document, self.identity)
        arrays = self.document.getElementsByTagName("m:eqArr")
        self.assertEqual(len(arrays), 1)
        rows = elements(arrays[0], "m:e")
        self.assertEqual(len(rows), 2)
        self.assertEqual(all_text(rows[1]).strip(), "(DOT directional hypothesis)")
        brand_document(self.document, self.identity)
        self.assertEqual(len(self.document.getElementsByTagName("m:eqArr")), 1)

    def test_edition_alignment_changes_only_the_approved_cover_label(self) -> None:
        before = all_text(self.document), invariant(self.document)
        with zipfile.ZipFile(
            ROOT / "docs/blueprint/DOT-Book-One-Digital-Edition-v3.docx"
        ) as archive:
            metadata = minidom.parseString(archive.read("docProps/core.xml"))
        align_edition(self.document, metadata, 3)
        self.assertEqual(
            (all_text(self.document), invariant(self.document)),
            (
                before[0].replace("Digital Edition · Version 2", "Digital Edition · Version 3", 1),
                before[1],
            ),
        )
        cover = elements(self.document.getElementsByTagName("w:body")[0], "w:p")
        self.assertEqual(text_of(cover[7]), "Digital Edition · Version 3")
        self.assertIn("Version 3", metadata.getElementsByTagName("dc:subject")[0].toxml())
        with self.assertRaisesRegex(ValueError, "must be positive"):
            align_edition(self.document, metadata, 0)


if __name__ == "__main__":
    unittest.main()
