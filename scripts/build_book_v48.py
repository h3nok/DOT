"""Build Complete Book One v4.8 from the frozen v4.7 review manuscript.

One manuscript, two renderings (ADR-0036). This builder applies the exact v4.8
line-edit manifest, marks depth passages with paired bookmarks for the digital
reader, and applies a style-driven print design: Source Serif 4 optical sizes,
justified and hyphenated text, indented paragraphs, recto chapter openings,
roman-numbered front matter, ruled tables, and the shared ink-and-jade jacket
(ADR-0034). Every native equation, field, citation, and bookmark is preserved.
No release is published.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from xml.dom import minidom
from xml.sax.saxutils import escape

from revise_book_one_review import (
    BASE,
    ROOT,
    all_text,
    elements,
    ensure,
    invariant,
    prop,
    redline,
    remove,
    replace_text,
    style_id,
    text_of,
    write_package,
)

NAME = "DOT-Complete-Book-One-v4.8-Review"
EDITS = BASE / "editing/v4.8-edits.json"
DEPTH = BASE / "editing/v4.8-depth.json"
ASSETS = BASE / "assets/v4.8"
PRINT_FONTS = ROOT / "design/fonts/print"
IDENTITY = json.loads((ROOT / "frontend/src/content/identity.json").read_text())

BODY = "Source Serif 4 SmText"
SEMIBOLD = "Source Serif 4 SmText Semibold"
DISPLAY = "Source Serif 4 Display Semibold"
LABEL = "Space Grotesk"
INK = IDENTITY["light"]["ink"][1:].upper()
MUTED = IDENTITY["light"]["muted"][1:].upper()
ACCENT = IDENTITY["light"]["accent"][1:].upper()
RULE = "B9C4BC"
EDITION = "Complete Edition · Author Review v4.8"
# --release swaps review labels for the published edition's (see configure_release).
RELEASE = False
# Text measure on the 6 × 9 in page: 8640 − 1224 inside − 936 outside margins.
MEASURE = 6480
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

# Direct paragraph and run formatting that the styles now own.
PARAGRAPH_DIRECT = (
    "w:spacing",
    "w:ind",
    "w:jc",
    "w:suppressAutoHyphens",
    "w:widowControl",
    "w:contextualSpacing",
    "w:shd",
    "w:pBdr",
)
RUN_DIRECT = (
    "w:rFonts",
    "w:sz",
    "w:szCs",
    "w:color",
    "w:spacing",
    "w:kern",
    "w:caps",
    "w:smallCaps",
    "w:u",
)


def in_math(node):
    while node is not None:
        if node.nodeName in ("m:oMath", "m:oMathPara"):
            return True
        node = node.parentNode
    return False


def in_table(node):
    while node is not None:
        if node.nodeName == "w:tbl":
            return True
        node = node.parentNode
    return False


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# --- Manuscript changes -----------------------------------------------------


def check_links(edit, paragraph):
    links = [text_of(link) for link in paragraph.getElementsByTagName("w:hyperlink")]
    position = 0
    for link in links:
        found = edit["new"].find(link, position)
        if found < 0 or edit["new"].count(link) != 1:
            raise ValueError(f"Edit {edit['paragraph']} moves or repeats link {link!r}")
        position = found + len(link)


def apply_edits(paragraphs, edits):
    deleted = set()
    for edit in edits:
        paragraph = paragraphs[edit["paragraph"]]
        if all_text(paragraph) != edit["old"]:
            raise ValueError(f"Paragraph drift: {edit['paragraph']}")
        if style_id(paragraph) in ("Heading1", "DOTTOCChapter") or style_id(
            paragraph
        ).startswith(("DOTReference", "DOTEquation", "DOTFigure", "DOTBook")):
            raise ValueError(f"Edit targets protected style: {edit['paragraph']}")
        if edit["new"]:
            check_links(edit, paragraph)
            replace_text(paragraph, edit["new"])
            continue
        if any(
            paragraph.getElementsByTagName(tag)
            for tag in ("w:bookmarkStart", "w:hyperlink", "m:oMath", "w:instrText", "w:sectPr")
        ):
            raise ValueError("Deletion would remove structured content")
        paragraph.parentNode.removeChild(paragraph)
        deleted.add(edit["paragraph"])
    return deleted


def point_bookmark(doc, paragraph, ident, name, at_end):
    start = doc.createElement("w:bookmarkStart")
    start.setAttribute("w:id", str(ident))
    start.setAttribute("w:name", name)
    end = doc.createElement("w:bookmarkEnd")
    end.setAttribute("w:id", str(ident))
    if at_end:
        anchor = None
        for child in reversed(list(paragraph.childNodes)):
            if child.nodeName == "w:pPr":
                break
            if child.nodeName != "w:bookmarkEnd":
                anchor = child
                break
        reference = anchor.nextSibling if anchor is not None else None
        paragraph.insertBefore(start, reference)
        paragraph.insertBefore(end, reference)
    else:
        properties = elements(paragraph, "w:pPr")
        reference = properties[0].nextSibling if properties else paragraph.firstChild
        paragraph.insertBefore(end, reference)
        paragraph.insertBefore(start, end)


def mark_depth(doc, paragraphs, passages, deleted):
    ident = 1 + max(
        int(node.getAttribute("w:id")) for node in doc.getElementsByTagName("w:bookmarkStart")
    )
    previous_end = -1
    for passage in passages:
        start, end = passage["start"], passage["end"]
        if start <= previous_end or end < start:
            raise ValueError(f"Depth passages overlap: {passage['id']}")
        previous_end = end
        for boundary in (start, end):
            if boundary in deleted:
                raise ValueError(f"Depth boundary was deleted: {passage['id']}")
            if in_table(paragraphs[boundary]):
                raise ValueError(f"Depth boundary inside a table: {passage['id']}")
            if paragraphs[boundary].getElementsByTagName("w:sectPr") and boundary == start:
                raise ValueError(f"Depth starts at a section break: {passage['id']}")
        if any(style_id(paragraphs[i]) == "Heading1" for i in range(start, end + 1)):
            raise ValueError(f"Depth spans a chapter heading: {passage['id']}")
        point_bookmark(doc, paragraphs[start], ident, passage["id"] + "_start", False)
        point_bookmark(doc, paragraphs[end], ident + 1, passage["id"] + "_end", True)
        ident += 2


def relabel_captions(doc):
    """Captions under tables become Table N; captions under images stay Figure N."""
    counters = {"Table": 0, "Figure": 0}
    changes = []
    for paragraph in doc.getElementsByTagName("w:p"):
        if style_id(paragraph) != "DOTFigureCaption":
            continue
        match = re.match(r"Figure (\d+) ·", all_text(paragraph))
        if not match:
            continue
        sibling = paragraph.previousSibling
        while sibling is not None and sibling.nodeType != sibling.ELEMENT_NODE:
            sibling = sibling.previousSibling
        kind = "Table" if sibling is not None and sibling.nodeName == "w:tbl" else "Figure"
        counters[kind] += 1
        old_label, new_label = match.group(0), f"{kind} {counters[kind]} ·"
        holders = [
            node
            for node in paragraph.getElementsByTagName("w:t")
            if node.firstChild and old_label in node.firstChild.data
        ]
        if len(holders) != 1:
            raise ValueError("Caption label is split across runs: " + old_label)
        holders[0].firstChild.data = holders[0].firstChild.data.replace(old_label, new_label)
        changes.append((old_label, new_label))
    return changes


def qualify_equations(doc):
    """Set literal qualifiers as text after their formula.

    LibreOffice mis-measures a text run nested inside an OMML box and clips it.
    Moving the trailing qualifier out of the formula keeps every token and the
    reading order; only its typesetting changes.
    """
    for math in list(doc.getElementsByTagName("m:oMath")):
        runs = math.getElementsByTagName("m:r")
        qualifiers = [r for r in runs if re.fullmatch(r"\(DOT\W+(?:directional\W+)?hypothesis\)", all_text(r))]
        if not qualifiers:
            continue
        if len(qualifiers) != 1 or qualifiers[0] is not runs[-1]:
            raise ValueError("Review the formula qualifier before typesetting")
        moved = [qualifiers[0]]
        before = runs[-2] if len(runs) > 1 else None
        if before is not None and not all_text(before).strip():
            moved.insert(0, before)
        value = "".join(all_text(r) for r in moved)
        for r in moved:
            r.parentNode.removeChild(r)
        run = doc.createElement("w:r")
        text = doc.createElement("w:t")
        text.setAttribute("xml:space", "preserve")
        text.appendChild(doc.createTextNode(value))
        run.appendChild(text)
        anchor = math.parentNode if math.parentNode.nodeName == "m:oMathPara" else math
        anchor.parentNode.insertBefore(run, anchor.nextSibling)


def designed_invariant(document):
    copy = document.cloneNode(True)
    qualify_equations(copy)
    return invariant(copy)


# --- Typography ---------------------------------------------------------------


def node(doc, tag, **attrs):
    element = doc.createElement(tag)
    for key, value in attrs.items():
        element.setAttribute("w:" + key, str(value))
    return element


def define_style(styles, sid, name, *, based="Normal", kind="paragraph", ppr=(), rpr=(), next_style=None):
    root = styles.documentElement
    matches = [s for s in root.getElementsByTagName("w:style") if s.getAttribute("w:styleId") == sid]
    style = matches[0] if matches else styles.createElement("w:style")
    if not matches:
        style.setAttribute("w:type", kind)
        style.setAttribute("w:styleId", sid)
        root.appendChild(style)
        style.appendChild(node(styles, "w:name", val=name))
    numbering = []
    for child in list(style.childNodes):
        if child.nodeName == "w:pPr":
            numbering = elements(child, "w:numPr")
        if child.nodeName in ("w:pPr", "w:rPr", "w:basedOn", "w:next", "w:link"):
            style.removeChild(child)
    if based and sid != "Normal":
        style.appendChild(node(styles, "w:basedOn", val=based))
    if next_style:
        style.appendChild(node(styles, "w:next", val=next_style))
    style.appendChild(node(styles, "w:qFormat"))
    if kind == "paragraph":
        pp = styles.createElement("w:pPr")
        # List styles keep their link to the numbering definitions.
        for kept in numbering:
            pp.appendChild(kept)
        for tag, attrs in ppr:
            pp.appendChild(node(styles, tag, **attrs))
        style.appendChild(pp)
    rp = styles.createElement("w:rPr")
    for tag, attrs in rpr:
        rp.appendChild(node(styles, tag, **attrs))
    style.appendChild(rp)


def fonts(face):
    return ("w:rFonts", {"ascii": face, "hAnsi": face, "cs": face, "eastAsia": face})


def size(half_points):
    return [("w:sz", {"val": half_points}), ("w:szCs", {"val": half_points})]


def design_styles(styles):
    root = styles.documentElement
    for removed in root.getElementsByTagName("w:suppressAutoHyphens")[:]:
        removed.parentNode.removeChild(removed)
    normalize_fonts(styles)
    defaults = root.getElementsByTagName("w:docDefaults")[0]
    run_defaults = ensure(ensure(defaults, "w:rPrDefault"), "w:rPr")
    for theme in ("asciiTheme", "hAnsiTheme", "eastAsiaTheme", "cstheme"):
        for font in run_defaults.getElementsByTagName("w:rFonts"):
            if font.hasAttribute("w:" + theme):
                font.removeAttribute("w:" + theme)
    prop(run_defaults, "w:rFonts", ascii=BODY, hAnsi=BODY, cs=BODY, eastAsia=BODY)
    prop(run_defaults, "w:sz", val=21)
    prop(run_defaults, "w:szCs", val=21)
    prop(run_defaults, "w:lang", val="en-US", eastAsia="en-US", bidi="ar-SA")
    prop(ensure(ensure(defaults, "w:pPrDefault"), "w:pPr"), "w:spacing", before=0, after=0, line=276, lineRule="atLeast")

    text = [("w:spacing", {"before": 0, "after": 0, "line": 276, "lineRule": "atLeast"})]
    flush = [("w:ind", {"left": 0, "right": 0, "firstLine": 0})]
    keep = [("w:keepNext", {}), ("w:keepLines", {})]
    define_style(styles, "Normal", "Normal", based=None, ppr=[("w:widowControl", {}), *text, ("w:jc", {"val": "both"})], rpr=[fonts(BODY), *size(21), ("w:color", {"val": INK})])
    define_style(styles, "DOTBody", "DOT Body", ppr=[*text, ("w:ind", {"firstLine": 280}), ("w:jc", {"val": "both"})])
    define_style(styles, "DOTChapterLead", "DOT Chapter Lead", next_style="DOTBody", ppr=[("w:spacing", {"before": 0, "after": 160, "line": 320, "lineRule": "atLeast"}), *flush, ("w:jc", {"val": "left"})], rpr=[*size(24)])
    define_style(styles, "DOTChapterDeck", "DOT Chapter Deck", next_style="DOTChapterLead", ppr=[("w:spacing", {"before": 0, "after": 480, "line": 300, "lineRule": "auto"}), *flush, ("w:jc", {"val": "left"}), *keep], rpr=[("w:i", {}), *size(24), ("w:color", {"val": MUTED})])
    define_style(styles, "Heading1", "heading 1", next_style="DOTChapterDeck", ppr=[*keep, ("w:spacing", {"before": 1700, "after": 220, "line": 240, "lineRule": "auto"}), *flush, ("w:jc", {"val": "left"}), ("w:outlineLvl", {"val": 0})], rpr=[fonts(DISPLAY), *size(46), ("w:color", {"val": INK})])
    define_style(styles, "Heading2", "heading 2", next_style="DOTBody", ppr=[*keep, ("w:spacing", {"before": 380, "after": 120, "line": 260, "lineRule": "auto"}), *flush, ("w:jc", {"val": "left"}), ("w:outlineLvl", {"val": 1})], rpr=[fonts(SEMIBOLD), *size(24), ("w:color", {"val": INK})])
    define_style(styles, "Heading3", "heading 3", next_style="DOTBody", ppr=[*keep, ("w:spacing", {"before": 260, "after": 60, "line": 260, "lineRule": "auto"}), *flush, ("w:jc", {"val": "left"}), ("w:outlineLvl", {"val": 2})], rpr=[("w:i", {}), *size(22), ("w:color", {"val": INK})])
    for list_style, label in (("ListBullet", "List Bullet"), ("ListNumber", "List Number")):
        define_style(styles, list_style, label, ppr=[("w:spacing", {"before": 40, "after": 40, "line": 276, "lineRule": "atLeast"}), ("w:jc", {"val": "left"})])
    define_style(styles, "DOTTableHeader", "DOT Table Header", ppr=[("w:spacing", {"before": 70, "after": 70, "line": 240, "lineRule": "auto"}), *flush, ("w:jc", {"val": "left"})], rpr=[fonts(SEMIBOLD), *size(18)])
    define_style(styles, "DOTTableBody", "DOT Table Body", ppr=[("w:spacing", {"before": 70, "after": 70, "line": 240, "lineRule": "auto"}), *flush, ("w:jc", {"val": "left"})], rpr=[*size(18)])
    define_style(styles, "DOTEquation", "DOT Equation", ppr=[("w:spacing", {"before": 120, "after": 120, "line": 240, "lineRule": "auto"}), *flush, ("w:jc", {"val": "center"})])
    define_style(styles, "DOTEquationNumber", "DOT Equation Number", ppr=[("w:spacing", {"before": 120, "after": 120, "line": 240, "lineRule": "auto"}), *flush, ("w:jc", {"val": "right"})], rpr=[*size(19)])
    define_style(styles, "DOTFigure", "DOT Figure", ppr=[*keep, ("w:spacing", {"before": 240, "after": 80}), *flush, ("w:jc", {"val": "center"})])
    define_style(styles, "DOTFigureCaption", "DOT Figure Caption", ppr=[("w:spacing", {"before": 100, "after": 280, "line": 240, "lineRule": "auto"}), *flush, ("w:jc", {"val": "left"})], rpr=[("w:i", {}), *size(18), ("w:color", {"val": MUTED})])
    define_style(styles, "DOTReference", "DOT Reference", ppr=[("w:spacing", {"before": 0, "after": 90, "line": 240, "lineRule": "auto"}), ("w:jc", {"val": "left"})], rpr=[*size(18)])
    define_style(styles, "DOTReferenceNumber", "DOT Reference Number", ppr=[("w:spacing", {"before": 0, "after": 0, "line": 240, "lineRule": "auto"}), ("w:jc", {"val": "left"}), ("w:keepNext", {})], rpr=[fonts(SEMIBOLD), *size(18)])
    define_style(styles, "DOTTOCChapter", "DOT Contents Entry", ppr=[("w:spacing", {"before": 0, "after": 110, "line": 260, "lineRule": "auto"}), *flush, ("w:jc", {"val": "left"})], rpr=[*size(21)])
    define_style(styles, "DOTContentsTitle", "DOT Contents Title", ppr=[("w:spacing", {"before": 0, "after": 420}), *flush, ("w:jc", {"val": "left"})], rpr=[fonts(DISPLAY), *size(40)])
    define_style(styles, "DOTChapterLabel", "DOT Chapter Label", ppr=[("w:spacing", {"before": 1700, "after": 120}), *flush, ("w:jc", {"val": "left"})], rpr=[fonts(LABEL), *size(16), ("w:color", {"val": ACCENT}), ("w:spacing", {"val": 30})])
    define_style(styles, "DOTBookEyebrow", "DOT Book Eyebrow", ppr=[("w:spacing", {"before": 2000, "after": 360}), *flush, ("w:jc", {"val": "center"})], rpr=[fonts(LABEL), *size(15), ("w:color", {"val": ACCENT}), ("w:spacing", {"val": 30})])
    define_style(styles, "DOTBookTitle", "DOT Book Title", ppr=[("w:spacing", {"before": 0, "after": 280, "line": 240, "lineRule": "auto"}), *flush, ("w:jc", {"val": "center"})], rpr=[fonts(DISPLAY), *size(56)])
    define_style(styles, "DOTBookSubtitle", "DOT Book Subtitle", ppr=[("w:spacing", {"before": 0, "after": 1500}), *flush, ("w:jc", {"val": "center"})], rpr=[("w:i", {}), *size(26)])
    define_style(styles, "DOTBookAuthor", "DOT Book Author", ppr=[("w:spacing", {"before": 0, "after": 1700}), *flush, ("w:jc", {"val": "center"})], rpr=[*size(25)])
    define_style(styles, "DOTBookEdition", "DOT Book Edition", ppr=[("w:spacing", {"before": 0, "after": 0, "line": 300, "lineRule": "auto"}), *flush, ("w:jc", {"val": "center"})], rpr=[fonts(LABEL), *size(15), ("w:color", {"val": MUTED}), ("w:spacing", {"val": 20})])
    define_style(styles, "DOTColophon", "DOT Colophon", ppr=[("w:spacing", {"before": 0, "after": 140, "line": 250, "lineRule": "auto"}), *flush, ("w:jc", {"val": "left"})], rpr=[*size(16), ("w:color", {"val": MUTED})])
    define_style(styles, "Hyperlink", "Hyperlink", kind="character", based=None, rpr=[("w:color", {"val": INK})])


def normalize_fonts(xml):
    for font in xml.getElementsByTagName("w:rFonts"):
        if in_math(font):
            continue
        face = LABEL if font.getAttribute("w:ascii") == "Arial" else BODY
        for theme in ("asciiTheme", "hAnsiTheme", "eastAsiaTheme", "cstheme"):
            if font.hasAttribute("w:" + theme):
                font.removeAttribute("w:" + theme)
        for key in ("ascii", "hAnsi", "cs", "eastAsia"):
            font.setAttribute("w:" + key, face)


def paragraph_of(node):
    while node is not None and node.nodeName != "w:p":
        node = node.parentNode
    return node


def strip_direct(doc):
    for paragraph in doc.getElementsByTagName("w:p"):
        if in_math(paragraph):
            continue
        properties = elements(paragraph, "w:pPr")
        if properties:
            remove(properties[0], *PARAGRAPH_DIRECT)
            run_marks = elements(properties[0], "w:rPr")
            if run_marks:
                remove(run_marks[0], *RUN_DIRECT)
    for run in doc.getElementsByTagName("w:r"):
        if in_math(run):
            continue
        marks = elements(run, "w:rPr")
        if marks:
            remove(marks[0], *RUN_DIRECT)
            # Bold Arial equation numbers and heading runs become style-driven.
            owner = paragraph_of(run)
            if owner is not None and style_id(owner) in (
                "DOTEquationNumber",
                "Heading2",
                "Heading3",
                "DOTTOCChapter",
            ):
                remove(marks[0], "w:b", "w:bCs")


def first_after_heading(doc):
    for paragraph in doc.getElementsByTagName("w:p"):
        if style_id(paragraph) not in ("Heading1", "Heading2", "Heading3", "DOTChapterDeck"):
            continue
        sibling = paragraph.nextSibling
        while sibling is not None and sibling.nodeType != sibling.ELEMENT_NODE:
            sibling = sibling.nextSibling
        if sibling is not None and sibling.nodeName == "w:p" and style_id(sibling) == "DOTBody":
            prop(ensure(sibling, "w:pPr"), "w:ind", firstLine=0)


def chapter_headings(doc):
    for paragraph in doc.getElementsByTagName("w:p"):
        if style_id(paragraph) != "Heading1":
            continue
        runs = paragraph.getElementsByTagName("w:r")
        if not runs or not runs[0].getElementsByTagName("w:br"):
            raise ValueError("Chapter label structure changed: " + all_text(paragraph))
        label = ensure(runs[0], "w:rPr")
        for tag, attrs in (
            ("w:rFonts", {"ascii": LABEL, "hAnsi": LABEL, "cs": LABEL, "eastAsia": LABEL}),
            ("w:color", {"val": ACCENT}),
            ("w:sz", {"val": 17}),
            ("w:szCs", {"val": 17}),
            ("w:spacing", {"val": 30}),
        ):
            prop(label, tag, **attrs)
        remove(label, "w:b", "w:bCs")
        for run in runs[1:]:
            remove(ensure(run, "w:rPr"), "w:b", "w:bCs")
        # A little air between the label and the title.
        breaks = runs[0].getElementsByTagName("w:br")
        if len(breaks) == 1:
            runs[0].appendChild(doc.createElement("w:br"))


def borders(doc, parent, tag, sides):
    holder = ensure(parent, tag)
    for child in list(holder.childNodes):
        holder.removeChild(child)
    for side, (value, width, color) in sides.items():
        holder.appendChild(node(doc, "w:" + side, val=value, sz=width, space=0, color=color))


def design_tables(doc):
    none = ("nil", 0, "auto")
    for table in doc.getElementsByTagName("w:tbl"):
        for shade in table.getElementsByTagName("w:shd")[:]:
            shade.parentNode.removeChild(shade)
        properties = ensure(table, "w:tblPr")
        equation = bool(table.getElementsByTagName("m:oMath"))
        if equation:
            borders(doc, properties, "w:tblBorders", {s: none for s in ("top", "left", "bottom", "right", "insideH", "insideV")})
            for cell in table.getElementsByTagName("w:tcPr"):
                remove(cell, "w:tcBorders")
            # The v4.x grid gave every column 1.5 in, and LibreOffice clips any
            # formula wider than its grid column. Size the grid to the measure.
            widths = (720, MEASURE - 1440, 720)
            prop(properties, "w:tblW", w=MEASURE, type="dxa")
            prop(properties, "w:tblLayout", type="fixed")
            grid = elements(table, "w:tblGrid")[0]
            columns = elements(grid, "w:gridCol")
            cells = elements(elements(table, "w:tr")[0], "w:tc")
            if len(columns) != 3 or len(cells) != 3:
                raise ValueError("Equation layout table changed")
            for column, cell, width in zip(columns, cells, widths):
                column.setAttribute("w:w", str(width))
                prop(ensure(cell, "w:tcPr"), "w:tcW", w=width, type="dxa")
            continue
        borders(
            doc,
            properties,
            "w:tblBorders",
            {
                "top": ("single", 10, INK),
                "left": none,
                "bottom": ("single", 10, INK),
                "right": none,
                "insideH": ("single", 2, RULE),
                "insideV": none,
            },
        )
        margins = ensure(properties, "w:tblCellMar")
        for child in list(margins.childNodes):
            margins.removeChild(child)
        for side, width in (("top", 20), ("left", 60), ("bottom", 20), ("right", 60)):
            margins.appendChild(node(doc, "w:" + side, w=width, type="dxa"))
        rows = elements(table, "w:tr")
        header = ensure(rows[0], "w:trPr")
        prop(header, "w:tblHeader")
        prop(header, "w:cantSplit")
        for row in rows:
            prop(ensure(row, "w:trPr"), "w:cantSplit")
        for cell in table.getElementsByTagName("w:tcPr"):
            remove(cell, "w:tcBorders")
        for cell in elements(rows[0], "w:tc"):
            borders(doc, ensure(cell, "w:tcPr"), "w:tcBorders", {"bottom": ("single", 6, INK)})


# --- Front matter, sections, and cover ------------------------------------------


def front_matter(doc):
    paragraphs = list(doc.getElementsByTagName("w:p"))
    edition = [p for p in paragraphs if style_id(p) == "DOTBookEdition"]
    if len(edition) != 1:
        raise ValueError("Edition line changed")
    holders = [n for n in edition[0].getElementsByTagName("w:t") if n.firstChild and "Author Review Edition" in n.firstChild.data]
    if len(holders) != 1:
        raise ValueError("Edition label changed")
    holders[0].firstChild.data = re.sub(r"Author Review Edition v4\.7 · \w+ \d{4}", EDITION + " · October 2026", holders[0].firstChild.data)
    copyright_lines = [p for p in paragraphs[:40] if all_text(p).startswith(("©", "Author Review Edition.", "Claim levels are"))]
    if len(copyright_lines) != 3:
        raise ValueError("Copyright page changed")
    for paragraph in copyright_lines:
        prop(ensure(paragraph, "w:pPr"), "w:pStyle", val="DOTColophon")
    holder = [n for n in copyright_lines[1].getElementsByTagName("w:t") if n.firstChild and "Author Review Edition." in n.firstChild.data]
    if len(holder) != 1:
        raise ValueError("Copyright edition line changed")
    if RELEASE:
        if len([n for n in copyright_lines[1].getElementsByTagName("w:t") if n.firstChild]) != 1:
            raise ValueError("Copyright edition line has unexpected runs")
        holder[0].firstChild.data = f"{EDITION}. First published October 2026."
    else:
        holder[0].firstChild.data = holder[0].firstChild.data.replace("Author Review Edition.", EDITION + ".", 1)
    # Set the copyright block low on its page. LibreOffice drops space-before at
    # the top of a page, so an exact-height spacer carries the drop instead.
    spacer = doc.createElement("w:p")
    spacer_properties = ensure(spacer, "w:pPr")
    prop(spacer_properties, "w:pStyle", val="DOTColophon")
    prop(spacer_properties, "w:spacing", before=0, after=0, line=5600, lineRule="exact")
    copyright_lines[0].parentNode.insertBefore(spacer, copyright_lines[0])
    colophon = doc.createElement("w:p")
    prop(ensure(colophon, "w:pPr"), "w:pStyle", val="DOTColophon")
    run = doc.createElement("w:r")
    value = doc.createElement("w:t")
    value.appendChild(doc.createTextNode(
        "Set in Source Serif 4 and Space Grotesk, both under the SIL Open Font License. "
        "The digital edition at dotheory.org carries this text with its technical passages folded."
    ))
    run.appendChild(value)
    colophon.appendChild(run)
    copyright_lines[2].parentNode.insertBefore(colophon, copyright_lines[2].nextSibling)
    return colophon


def design_sections(doc):
    body = doc.getElementsByTagName("w:body")[0]
    sections = list(doc.getElementsByTagName("w:sectPr"))
    if len(sections) != 14:
        raise ValueError("Section structure changed")
    for index, section in enumerate(sections):
        prop(section, "w:pgSz", w=8640, h=12960)
        if index == 0:
            continue
        prop(section, "w:pgMar", top=1060, right=936, bottom=1080, left=1224, header=560, footer=560, gutter=0)
        remove(section, "w:pgNumType", "w:type")
        number = doc.createElement("w:pgNumType")
        if index in (1, 2):
            number.setAttribute("w:fmt", "lowerRoman")
            if index == 1:
                number.setAttribute("w:start", "1")
        else:
            number.setAttribute("w:fmt", "decimal")
            if index == 3:
                number.setAttribute("w:start", "1")
        section.appendChild(number)
        if index >= 1:
            section.insertBefore(node(doc, "w:type", val="oddPage"), section.firstChild)
    if sections[-1].parentNode is not body:
        raise ValueError("Final section properties moved")


def design_apparatus(parts):
    for name in list(parts):
        if not re.match(r"word/(header|footer)\d+\.xml$", name):
            continue
        xml = minidom.parseString(parts[name])
        normalize_fonts(xml)
        footer = "footer" in name
        for paragraph in xml.getElementsByTagName("w:p"):
            for run in paragraph.getElementsByTagName("w:r"):
                marks = ensure(run, "w:rPr")
                remove(marks, *RUN_DIRECT, "w:b", "w:bCs")
                face = BODY if footer else LABEL
                prop(marks, "w:rFonts", ascii=face, hAnsi=face, cs=face, eastAsia=face)
                prop(marks, "w:sz", val=18 if footer else 14)
                prop(marks, "w:szCs", val=18 if footer else 14)
                prop(marks, "w:color", val=MUTED)
                if not footer:
                    prop(marks, "w:spacing", val=24)
        parts[name] = xml.toxml(encoding="UTF-8")


def render_cover(path: Path):
    from PIL import Image, ImageDraw, ImageFont

    width, height = 1800, 2700
    background = Image.open(ROOT / "design/youtube/book-background.png").convert("RGB")
    scale = max(width / background.width, height / background.height)
    background = background.resize((round(background.width * scale), round(background.height * scale)), Image.LANCZOS)
    left = (background.width - width) // 2
    top = (background.height - height) // 2
    cover = background.crop((left, top, left + width, top + height))
    draw = ImageDraw.Draw(cover)
    ink = IDENTITY["dark"]["ink"]
    jade = IDENTITY["dark"]["accent"]
    muted = IDENTITY["dark"]["muted"]
    mono = ImageFont.truetype(str(ROOT / "design/fonts/jetbrains-mono-400-normal.ttf"), 34)
    grotesk = ImageFont.truetype(str(ROOT / "design/fonts/space-grotesk-500-normal.ttf"), 132)
    italic = ImageFont.truetype(str(PRINT_FONTS / "SourceSerif4SmText-It.ttf"), 54)
    author = ImageFont.truetype(str(ROOT / "design/fonts/space-grotesk-500-normal.ttf"), 58)
    margin = 150
    draw.text((margin, 210), "DIGITAL ORGANISM THEORY", font=mono, fill=muted)
    draw.text((margin, 420), "Consciousness:", font=grotesk, fill=ink)
    draw.text((margin, 580), "A Digital Organism", font=grotesk, fill=ink)
    draw.text((margin, 800), "BOOK ONE · COMPLETE EDITION", font=mono, fill=jade)
    draw.text((margin, 880), "Foundations, Agency, and Research", font=italic, fill=muted)
    draw.text((margin, 2340), "Henok Ghebrechristos", font=author, fill=ink)
    draw.text((margin, 2440), EDITION.upper(), font=mono, fill=muted)
    for x, y in ((margin, 2340), (margin, 580), (margin, 420)):
        if draw.textbbox((x, y), "A Digital Organism", font=grotesk)[2] > width - margin:
            raise ValueError("Cover title exceeds the safe area")
    path.parent.mkdir(parents=True, exist_ok=True)
    cover.save(path, optimize=True)


# --- Build, render, and validate ---------------------------------------------


def expected_text(source_doc, edits, captions):
    replaced = {edit["paragraph"]: edit["new"] for edit in edits}
    texts = []
    started = False
    for index, paragraph in enumerate(source_doc.getElementsByTagName("w:p")):
        started = started or style_id(paragraph) == "Heading1"
        if not started:
            continue
        value = replaced.get(index, all_text(paragraph))
        if index in replaced and not value:
            continue
        texts.append(value)
    joined = "\n".join(texts)
    for old, new in captions:
        joined = joined.replace(old, new, 1)
    return joined


def body_text(doc):
    texts, started = [], False
    for paragraph in doc.getElementsByTagName("w:p"):
        started = started or style_id(paragraph) == "Heading1"
        if started:
            texts.append(all_text(paragraph))
    return "\n".join(texts)


def embed_print_fonts(parts):
    from brand_book_one import embed_fonts

    faces = {
        (BODY, "Regular"): "SourceSerif4SmText-Regular.ttf",
        (BODY, "Italic"): "SourceSerif4SmText-It.ttf",
        (BODY, "Bold"): "SourceSerif4SmText-Bold.ttf",
        (BODY, "BoldItalic"): "SourceSerif4SmText-BoldIt.ttf",
        (SEMIBOLD, "Regular"): "SourceSerif4SmText-Semibold.ttf",
        (DISPLAY, "Regular"): "SourceSerif4Display-Semibold.ttf",
        (DISPLAY, "Italic"): "SourceSerif4Display-SemiboldIt.ttf",
    }
    data = {key: (PRINT_FONTS / name).read_bytes() for key, name in faces.items()}
    data[(LABEL, "Regular")] = (ROOT / "design/fonts/space-grotesk-500-normal.ttf").read_bytes()
    embed_fonts(parts, data)


def render_diagrams(parts):
    """Restyle the v4.7 diagrams in the book's faces and palette; keep their words."""
    source_dir = BASE / "assets/v4.7"
    ASSETS.mkdir(parents=True, exist_ok=True)
    colors = {"#242424": "#" + INK, "#555555": "#" + MUTED, "#285C57": "#" + ACCENT, "#285c57": "#" + ACCENT}
    for asset in ("architecture", "experience-loop"):
        svg = (source_dir / f"{asset}.svg").read_text()
        words = re.findall(r">([^<>]+)</text>", svg)
        svg = re.sub(r'font-family="Arial" (font-size="\d+") font-weight="bold"', rf'font-family="{SEMIBOLD}" \1 font-weight="normal"', svg)
        svg = svg.replace('font-family="Arial"', f'font-family="{BODY}"')
        for old, new in colors.items():
            svg = svg.replace(old, new)
        if "Arial" in svg or re.findall(r">([^<>]+)</text>", svg) != words:
            raise ValueError("Diagram restyling changed its words: " + asset)
        target = ASSETS / f"{asset}.svg"
        target.write_text(svg)
        png = convert(target, "png", ASSETS)
        for extension, data in (("svg", target.read_bytes()), ("png", png.read_bytes())):
            name = f"word/media/v47-{asset}.{extension}"
            if name not in parts:
                raise ValueError("Diagram media moved: " + name)
            parts[name] = data


def build(output: Path):
    manifest = json.loads(EDITS.read_text())
    depth = json.loads(DEPTH.read_text())
    source = BASE / manifest["source"]
    if sha256(source) != manifest["source_sha256"] or depth["source_sha256"] != manifest["source_sha256"]:
        raise ValueError("The v4.7 input changed; reconcile the v4.8 manifests first.")
    with zipfile.ZipFile(source) as archive:
        parts = {name: archive.read(name) for name in archive.namelist()}
    source_doc = minidom.parseString(parts["word/document.xml"])
    doc = minidom.parseString(parts["word/document.xml"])
    original = designed_invariant(doc)
    paragraphs = list(doc.getElementsByTagName("w:p"))
    deleted = apply_edits(paragraphs, manifest["edits"])
    mark_depth(doc, paragraphs, depth["passages"], deleted)
    captions = relabel_captions(doc)
    qualify_equations(doc)
    strip_direct(doc)
    normalize_fonts(doc)
    for removed in doc.getElementsByTagName("w:suppressAutoHyphens")[:]:
        removed.parentNode.removeChild(removed)
    first_after_heading(doc)
    chapter_headings(doc)
    design_tables(doc)
    front_matter(doc)
    design_sections(doc)

    if body_text(doc) != expected_text(source_doc, manifest["edits"], captions):
        raise ValueError("Body text differs from the approved manifest")
    protected = invariant(doc)
    original["bookmarks"].update(
        {f"{p['id']}_{edge}": 1 for p in depth["passages"] for edge in ("start", "end")}
    )
    for key in original:
        if protected[key] != original[key]:
            raise ValueError("Protected structure changed: " + key)

    styles = minidom.parseString(parts["word/styles.xml"])
    design_styles(styles)
    parts["word/styles.xml"] = styles.toxml(encoding="UTF-8")
    if "word/numbering.xml" in parts:
        numbering = minidom.parseString(parts["word/numbering.xml"])
        normalize_fonts(numbering)
        # Symbol-font bullets have no glyph in the book face; use a real bullet.
        for level in numbering.getElementsByTagName("w:lvl"):
            formats = elements(level, "w:numFmt")
            if formats and formats[0].getAttribute("w:val") == "bullet":
                prop(level, "w:lvlText", val="•")
        parts["word/numbering.xml"] = numbering.toxml(encoding="UTF-8")
    design_apparatus(parts)

    settings = minidom.parseString(parts["word/settings.xml"])
    root = settings.documentElement
    for tag, attrs in (
        ("w:autoHyphenation", {}),
        ("w:consecutiveHyphenLimit", {"val": 3}),
        ("w:hyphenationZone", {"val": 100}),
        ("w:doNotHyphenateCaps", {}),
    ):
        prop(root, tag, **attrs)
    parts["word/settings.xml"] = settings.toxml(encoding="UTF-8")

    cover = ASSETS / ("cover-release.png" if RELEASE else "cover.png")
    render_cover(cover)
    rels = minidom.parseString(parts["word/_rels/document.xml.rels"])
    first_image = paragraphs[0].getElementsByTagName("a:blip")
    if not first_image:
        raise ValueError("Cover image moved")
    target = [r for r in rels.getElementsByTagName("Relationship") if r.getAttribute("Id") == first_image[0].getAttribute("r:embed")]
    parts["word/" + target[0].getAttribute("Target")] = cover.read_bytes()
    render_diagrams(parts)

    parts["word/document.xml"] = doc.toxml(encoding="UTF-8")
    embed_print_fonts(parts)
    core = minidom.parseString(parts["docProps/core.xml"])
    for tag, value in (
        ("dc:description", f"{EDITION}: line edit, depth layer for the digital reader, and print design."),
        ("dcterms:modified", "2026-10-02T00:00:00Z"),
    ):
        holder = core.getElementsByTagName(tag)[0]
        while holder.firstChild:
            holder.removeChild(holder.firstChild)
        holder.appendChild(core.createTextNode(value))
    parts["docProps/core.xml"] = core.toxml(encoding="UTF-8")

    output.mkdir(parents=True, exist_ok=True)
    path = output / (NAME + ".docx")
    write_package(parts, path)
    record = output / (NAME + "-Redline.html")
    redline(manifest, record)
    record.write_text(
        record.read_text()
        .replace("v4.6 editorial redline", "v4.8 line edit")
        .replace("frozen v4.5 manuscript", "v4.7 review manuscript")
        .replace("native concept plates", "the depth layer")
    )
    return path, {
        "source_sha256": manifest["source_sha256"],
        "editorial_operations": len(manifest["edits"]),
        "depth_passages": len(depth["passages"]),
        "caption_labels": [new for _, new in captions],
        "native_equations_preserved": len(original["math"]),
        "equation_fields_preserved": len(original["instructions"]),
    }


def convert(source: Path, target_format: str, outdir: Path) -> Path:
    with tempfile.TemporaryDirectory(prefix="dot-v48-office-") as temp_dir:
        temp = Path(temp_dir)
        runtime = temp / "runtime"
        runtime.mkdir(mode=0o700)
        environment = {
            **os.environ,
            "HOME": str(temp),
            "XDG_CACHE_HOME": str(temp / "cache"),
            "XDG_CONFIG_HOME": str(temp / "config"),
            "XDG_RUNTIME_DIR": str(runtime),
        }
        if sys.platform.startswith("linux"):
            # Scope the bundled book fonts to this export, not the user's machine.
            config = temp / "fonts.conf"
            config.write_text(
                '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">'
                '<fontconfig><include ignore_missing="no">/etc/fonts/fonts.conf</include>'
                f"<dir>{escape(str(ROOT / 'design/fonts'))}</dir>"
                f"<cachedir>{escape(str(temp / 'font-cache'))}</cachedir></fontconfig>"
            )
            environment["FONTCONFIG_FILE"] = str(config)
        subprocess.run(
            [
                "libreoffice",
                f"-env:UserInstallation={(temp / 'profile').as_uri()}",
                "--headless",
                "--convert-to",
                target_format,
                "--outdir",
                str(temp),
                str(source),
            ],
            check=True,
            capture_output=True,
            env=environment,
            timeout=240,
        )
        extension = target_format.split(":")[0]
        generated = temp / f"{source.stem}.{extension}"
        if not generated.exists():
            raise RuntimeError(f"LibreOffice did not produce {generated.name}")
        target = outdir / generated.name
        target.write_bytes(generated.read_bytes())
        return target


def render(path: Path):
    # Keep the automatically inserted blank versos so the PDF pairs like the printed book.
    options = {
        "IsSkipEmptyPages": {"type": "boolean", "value": "false"},
        "UseTaggedPDF": {"type": "boolean", "value": "true"},
        "ExportBookmarks": {"type": "boolean", "value": "true"},
    }
    convert(path, "pdf:writer_pdf_Export:" + json.dumps(options, separators=(",", ":")), path.parent)


FOLIO = re.compile(r"^(?:\d+|[ivxlc]+)$")


def refresh_contents(path: Path):
    pages = subprocess.check_output(["pdftotext", "-layout", str(path.with_suffix(".pdf")), "-"], text=True).split("\f")
    normalized = [re.sub(r"\s+", " ", page).strip() for page in pages]
    with zipfile.ZipFile(path) as archive:
        parts = {name: archive.read(name) for name in archive.namelist()}
    doc = minidom.parseString(parts["word/document.xml"])
    titles = {}
    for paragraph in doc.getElementsByTagName("w:p"):
        if style_id(paragraph) == "Heading1":
            names = [b.getAttribute("w:name") for b in paragraph.getElementsByTagName("w:bookmarkStart")]
            title = " ".join(text_of(run) for run in paragraph.getElementsByTagName("w:r"))
            titles[names[0]] = re.sub(r"\s+", " ", title).strip()
    mapping = {}
    for paragraph in doc.getElementsByTagName("w:p"):
        if style_id(paragraph) != "DOTTOCChapter":
            continue
        anchor = paragraph.getElementsByTagName("w:hyperlink")[0].getAttribute("w:anchor")
        found = [i for i, text in enumerate(normalized) if titles[anchor] in text]
        if len(found) != 1:
            raise ValueError(f"Cannot locate {titles[anchor]}: {found}")
        folios = [line.strip() for line in pages[found[0]].splitlines() if FOLIO.match(line.strip())]
        if not folios:
            raise ValueError("Missing folio for " + titles[anchor])
        mapping[anchor] = folios[-1]
        fields = paragraph.getElementsByTagName("w:fldSimple")
        if not folios[-1].isdigit():
            # LibreOffice recomputes PAGEREF in arabic; front matter keeps its roman folio.
            for field in fields:
                for run in elements(field, "w:r"):
                    field.parentNode.insertBefore(run, field)
                field.parentNode.removeChild(field)
            paragraph.getElementsByTagName("w:t")[-1].firstChild.data = folios[-1]
            continue
        if len(fields) != 1:
            raise ValueError("Contents entry lost its page field")
        holder = fields[0].getElementsByTagName("w:t")[0]
        holder.firstChild.data = folios[-1]
    parts["word/document.xml"] = doc.toxml(encoding="UTF-8")
    write_package(parts, path)
    return mapping


def validate(path: Path, report: dict):
    pdf = path.with_suffix(".pdf")
    text = subprocess.check_output(["pdftotext", "-layout", str(pdf), "-"], text=True)
    pages = text.split("\f")[:-1]
    if re.findall(r"Table (\d) ·", text) != list("12345") or re.findall(r"Figure (\d) ·", text) != ["1"]:
        raise ValueError("Table or figure numbering changed")
    if re.search(r"Error!|Reference source not found|Bookmark not defined", text):
        raise ValueError("Broken field in PDF")
    fonts = subprocess.check_output(["pdffonts", str(pdf)], text=True)
    for unwanted in ("Georgia", "Arial"):
        if unwanted in fonts:
            raise ValueError(f"{unwanted} remains in the designed book")
    for wanted in ("SourceSerif4SmText-Regular", "SourceSerif4SmText-It", "SourceSerif4Display-Semibold", "SpaceGrotesk"):
        if wanted not in fonts:
            raise ValueError("Missing typeface in PDF: " + wanted)
    bounds = subprocess.run(["pdftotext", "-bbox", str(pdf), "-"], check=True, text=True, capture_output=True)
    for page in minidom.parseString(bounds.stdout).getElementsByTagName("page"):
        width, height = float(page.getAttribute("width")), float(page.getAttribute("height"))
        for word in page.getElementsByTagName("word"):
            x0, y0, x1, y1 = (float(word.getAttribute(k)) for k in ("xMin", "yMin", "xMax", "yMax"))
            if not (0 <= x0 < x1 <= width and 0 <= y0 < y1 <= height):
                raise ValueError("Text extends beyond the page")
    with zipfile.ZipFile(path) as archive:
        document = minidom.parseString(archive.read("word/document.xml"))
    anchors = {n.getAttribute("w:name") for n in document.getElementsByTagName("w:bookmarkStart")}
    for link in document.getElementsByTagName("w:hyperlink"):
        if link.getAttribute("w:anchor") and link.getAttribute("w:anchor") not in anchors:
            raise ValueError("Broken Word link: " + link.getAttribute("w:anchor"))
    references = {a for a in anchors if re.fullmatch(r"reference_\d+", a)}
    if len(references) != 51:
        raise ValueError("Reference count changed")
    if not re.search(r"Tagged:\s+yes", subprocess.check_output(["pdfinfo", str(pdf)], text=True)):
        raise ValueError("PDF structure tags missing")
    if b"/Outlines" not in pdf.read_bytes():
        raise ValueError("Missing PDF outline")
    blanks = [number for number, page in enumerate(pages, 1) if not page.strip()]
    if blanks[:2] != [1, 2]:
        raise ValueError("Cover and inside cover changed")
    for number in blanks[2:]:
        following = pages[number] if number < len(pages) else ""
        if not re.match(r"\s*(PREFACE|CHAPTER|CODA|APPENDIX|GLOSSARY|NOTES AND SOURCES)\b", following) and number != len(pages):
            raise ValueError(f"Unexpected blank page {number}")
    if RELEASE and re.search(r"Author Review|not the final publication", text):
        raise ValueError("Review labels remain in the release edition")
    report.update(
        {
            "pages": len(pages),
            "references_preserved": len(references),
            "depth_bookmarks": len([a for a in anchors if a.startswith("depth_")]),
            "tagged_pdf": True,
            "fonts": sorted({line.split()[0].split("+")[-1] for line in fonts.splitlines()[2:]}),
        }
    )


def configure_release():
    """Label the build as the published Complete Edition, version 4."""
    global RELEASE, NAME, EDITION
    RELEASE = True
    NAME = "DOT-Book-One-Complete-Edition-v4"
    EDITION = "Complete Edition · Version 4"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--render", action="store_true")
    parser.add_argument("--release", action="store_true", help="Build the published edition rather than the review proof")
    args = parser.parse_args()
    if args.release:
        configure_release()
    args.output = args.output or (BASE.parent / "release-v4" if args.release else BASE / "v4.8-review")
    path, report = build(args.output.resolve())
    if args.render:
        render(path)
        first = refresh_contents(path)
        render(path)
        second = refresh_contents(path)
        if first != second:
            render(path)
            third = refresh_contents(path)
            if third != second:
                raise ValueError("Contents pagination did not stabilize")
            second = third
        render(path)
        report["contents_pages"] = second
        validate(path, report)
        report["pdf_sha256"] = sha256(path.with_suffix(".pdf"))
    report["docx_sha256"] = sha256(path)
    (path.parent / (NAME + "-Validation.json")).write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
