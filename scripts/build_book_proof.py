"""Build a reversible publication proof from the authoritative Book One DOCX.

The source manuscript remains untouched. This script edits OOXML in a copy, then
uses LibreOffice to render the corresponding PDF. It exists to make typography,
pagination, and front-matter decisions inspectable before a new public edition is
released.
"""

from __future__ import annotations

import argparse
import datetime
import os
import pathlib
import re
import shutil
import subprocess
import tempfile
import zipfile
from xml.dom import Node, minidom

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
DC_NS = "http://purl.org/dc/elements/1.1/"
DCTERMS_NS = "http://purl.org/dc/terms/"
CP_NS = "http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
VT_NS = "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"

DEFAULT_SOURCE = pathlib.Path("docs/blueprint/DOT-Book-One-Digital-Edition-v3.docx")
DEFAULT_OUTPUT = pathlib.Path("artifacts/book-proof")
PROOF_DOCX = "DOT-Book-One-Publication-Proof.docx"
PROOF_PDF = "DOT-Book-One-Publication-Proof.pdf"

# The fixed publication palette mirrors the default digital-edition theme while
# remaining legible on an uncalibrated screen and economical in print.
DOT_INK = "172522"
DOT_ACCENT = "16706F"
DOT_MUTED = "5F6F6C"
DOT_HAIRLINE = "A8C7C2"

SECTION_DEFINITIONS = (
    ("PREFACE", "The Observer Belongs in the Inquiry", "Preface", "dot_preface"),
    ("CHAPTER 1", "The Digital Organism", "1 · The Digital Organism", "dot_chapter_1"),
    (
        "CHAPTER 2",
        "The Decoupling Principle",
        "2 · The Decoupling Principle",
        "dot_chapter_2",
    ),
    (
        "CHAPTER 3",
        "Architecture of Continuity",
        "3 · Architecture of Continuity",
        "dot_chapter_3",
    ),
    ("CHAPTER 4", "Reality Frames", "4 · Reality Frames", "dot_chapter_4"),
    ("CHAPTER 5", "The Canvas", "5 · The Canvas", "dot_chapter_5"),
    ("CHAPTER 6", "The Painting", "6 · The Painting", "dot_chapter_6"),
    (
        "APPENDIX",
        "Equation and Notation Guide",
        "Appendix · Equation and Notation Guide",
        "dot_appendix",
    ),
    ("NOTES AND SOURCES", "References", "References", "dot_references"),
)
CODA = "Freedom becomes collective when we make better options real for one another."


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=pathlib.Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=pathlib.Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--libreoffice", default="libreoffice")
    return parser.parse_args()


def parse_xml(data: bytes) -> minidom.Document:
    return minidom.parseString(data)


def serialize_xml(document: minidom.Document) -> bytes:
    return document.toxml(encoding="UTF-8")


def child(parent: Node, tag: str) -> Node | None:
    for candidate in parent.childNodes:
        if candidate.nodeType == Node.ELEMENT_NODE and candidate.nodeName == tag:
            return candidate
    return None


def children(parent: Node, tag: str) -> list[Node]:
    return [
        candidate
        for candidate in parent.childNodes
        if candidate.nodeType == Node.ELEMENT_NODE and candidate.nodeName == tag
    ]


def ensure_child(parent: Node, tag: str, *, first: bool = False) -> Node:
    existing = child(parent, tag)
    if existing is not None:
        return existing
    created = parent.ownerDocument.createElement(tag)
    if first and parent.firstChild is not None:
        parent.insertBefore(created, parent.firstChild)
    else:
        parent.appendChild(created)
    return created


def set_w_attr(element: Node, name: str, value: str) -> None:
    element.setAttributeNS(W_NS, f"w:{name}", value)


def remove_children(parent: Node, tag: str) -> None:
    for candidate in list(children(parent, tag)):
        parent.removeChild(candidate)


def paragraph_text(paragraph: Node) -> str:
    return "".join(
        node.firstChild.data if node.firstChild is not None else ""
        for node in paragraph.getElementsByTagName("w:t")
    ).strip()


def add_text_run(paragraph: Node, text: str, **properties: str | bool) -> Node:
    document = paragraph.ownerDocument
    run = document.createElement("w:r")
    if properties:
        run_properties = document.createElement("w:rPr")
        run.appendChild(run_properties)
        if font := properties.get("font"):
            fonts = document.createElement("w:rFonts")
            set_w_attr(fonts, "ascii", str(font))
            set_w_attr(fonts, "hAnsi", str(font))
            set_w_attr(fonts, "cs", str(font))
            run_properties.appendChild(fonts)
        if size := properties.get("size"):
            for tag in ("w:sz", "w:szCs"):
                sizing = document.createElement(tag)
                set_w_attr(sizing, "val", str(size))
                run_properties.appendChild(sizing)
        if color := properties.get("color"):
            colored = document.createElement("w:color")
            set_w_attr(colored, "val", str(color))
            run_properties.appendChild(colored)
        for name, tag in (("bold", "w:b"), ("italic", "w:i")):
            if properties.get(name):
                run_properties.appendChild(document.createElement(tag))
    text_node = document.createElement("w:t")
    text_node.appendChild(document.createTextNode(text))
    run.appendChild(text_node)
    paragraph.appendChild(run)
    return run


def make_paragraph(
    document: minidom.Document,
    text: str = "",
    *,
    style: str | None = None,
    alignment: str | None = None,
    before: int | None = None,
    after: int | None = None,
    page_break_before: bool = False,
    run_properties: dict[str, str | bool] | None = None,
) -> Node:
    paragraph = document.createElement("w:p")
    paragraph_properties = document.createElement("w:pPr")
    paragraph.appendChild(paragraph_properties)
    if style:
        style_node = document.createElement("w:pStyle")
        set_w_attr(style_node, "val", style)
        paragraph_properties.appendChild(style_node)
    if before is not None or after is not None:
        spacing = document.createElement("w:spacing")
        if before is not None:
            set_w_attr(spacing, "before", str(before))
        if after is not None:
            set_w_attr(spacing, "after", str(after))
        paragraph_properties.appendChild(spacing)
    if alignment:
        justification = document.createElement("w:jc")
        set_w_attr(justification, "val", alignment)
        paragraph_properties.appendChild(justification)
    if page_break_before:
        paragraph_properties.appendChild(document.createElement("w:pageBreakBefore"))
    if text:
        add_text_run(paragraph, text, **(run_properties or {}))
    return paragraph


def make_page_break(document: minidom.Document) -> Node:
    paragraph = make_paragraph(document)
    run = document.createElement("w:r")
    page_break = document.createElement("w:br")
    set_w_attr(page_break, "type", "page")
    run.appendChild(page_break)
    paragraph.appendChild(run)
    return paragraph


def make_contents_entry(
    document: minidom.Document,
    label: str,
    anchor: str,
    page: int | None,
) -> Node:
    paragraph = make_paragraph(document, after=130)
    properties = ensure_child(paragraph, "w:pPr", first=True)
    tabs = document.createElement("w:tabs")
    tab = document.createElement("w:tab")
    set_w_attr(tab, "val", "right")
    set_w_attr(tab, "leader", "dot")
    set_w_attr(tab, "pos", "6600")
    tabs.appendChild(tab)
    properties.appendChild(tabs)

    hyperlink = document.createElement("w:hyperlink")
    set_w_attr(hyperlink, "anchor", anchor)
    set_w_attr(hyperlink, "history", "1")
    paragraph.appendChild(hyperlink)
    add_text_run(hyperlink, label, font="Noto Serif", size="20", color=DOT_INK)
    if page is not None:
        tab_run = document.createElement("w:r")
        tab_run.appendChild(document.createElement("w:tab"))
        hyperlink.appendChild(tab_run)
        add_text_run(
            hyperlink,
            str(page),
            font="Noto Sans",
            size="18",
            color=DOT_MUTED,
        )
    return paragraph


def copy_page_geometry(source_section: Node, target_section: Node) -> None:
    for tag in ("w:pgSz", "w:pgMar", "w:cols", "w:docGrid"):
        existing = child(source_section, tag)
        if existing is not None:
            target_section.appendChild(existing.cloneNode(deep=True))


def make_front_matter_section(document: minidom.Document, source_section: Node) -> Node:
    paragraph = make_paragraph(document)
    properties = ensure_child(paragraph, "w:pPr", first=True)
    section = document.createElement("w:sectPr")
    copy_page_geometry(source_section, section)
    properties.appendChild(section)
    return paragraph


def set_run_font(run_properties: Node, family: str, size: int | None = None) -> None:
    fonts = ensure_child(run_properties, "w:rFonts", first=True)
    for name in ("asciiTheme", "hAnsiTheme", "cstheme", "eastAsiaTheme"):
        if fonts.hasAttributeNS(W_NS, name):
            fonts.removeAttributeNS(W_NS, name)
    for name in ("ascii", "hAnsi", "cs", "eastAsia"):
        set_w_attr(fonts, name, family)
    if size is not None:
        for tag in ("w:sz", "w:szCs"):
            sizing = ensure_child(run_properties, tag)
            set_w_attr(sizing, "val", str(size))


def set_run_color(run_properties: Node, value: str) -> None:
    color = ensure_child(run_properties, "w:color")
    for name in ("themeColor", "themeTint", "themeShade"):
        if color.hasAttributeNS(W_NS, name):
            color.removeAttributeNS(W_NS, name)
    set_w_attr(color, "val", value)


def set_paragraph_border(
    paragraph_properties: Node,
    side: str,
    *,
    color: str,
    size: int,
    space: int,
) -> None:
    borders = ensure_child(paragraph_properties, "w:pBdr")
    border = ensure_child(borders, f"w:{side}")
    set_w_attr(border, "val", "single")
    set_w_attr(border, "color", color)
    set_w_attr(border, "sz", str(size))
    set_w_attr(border, "space", str(space))


def set_paragraph_justification(paragraph: Node, value: str) -> None:
    properties = ensure_child(paragraph, "w:pPr", first=True)
    justification = ensure_child(properties, "w:jc")
    set_w_attr(justification, "val", value)


def paragraph_style_id(paragraph: Node) -> str | None:
    style = child(ensure_child(paragraph, "w:pPr", first=True), "w:pStyle")
    return style.getAttributeNS(W_NS, "val") if style is not None else None


def restyle_runs(
    paragraph: Node,
    *,
    font: str,
    size: int,
    color: str,
    bold: bool = False,
) -> None:
    for run in paragraph.getElementsByTagName("w:r"):
        properties = ensure_child(run, "w:rPr", first=True)
        set_run_font(properties, font, size)
        set_run_color(properties, color)
        if bold:
            ensure_child(properties, "w:b")


def set_paragraph_spacing(
    paragraph_properties: Node,
    *,
    before: int,
    after: int,
    line: int,
) -> None:
    spacing = ensure_child(paragraph_properties, "w:spacing")
    set_w_attr(spacing, "before", str(before))
    set_w_attr(spacing, "after", str(after))
    set_w_attr(spacing, "line", str(line))
    set_w_attr(spacing, "lineRule", "auto")


def find_style(styles: minidom.Document, style_id: str) -> Node:
    for style in styles.getElementsByTagName("w:style"):
        if style.getAttributeNS(W_NS, "styleId") == style_id:
            return style
    raise ValueError(f"Missing Word style: {style_id}")


def set_style_outline(style: Node, level: int) -> None:
    properties = ensure_child(style, "w:pPr")
    outline = ensure_child(properties, "w:outlineLvl")
    set_w_attr(outline, "val", str(level))


def style_book(styles: minidom.Document) -> None:
    normal = find_style(styles, "Normal")
    normal_p = ensure_child(normal, "w:pPr")
    set_paragraph_spacing(normal_p, before=0, after=100, line=288)
    justification = ensure_child(normal_p, "w:jc")
    set_w_attr(justification, "val", "both")
    ensure_child(normal_p, "w:widowControl")
    suppress = ensure_child(normal_p, "w:suppressAutoHyphens")
    set_w_attr(suppress, "val", "false")
    set_run_font(ensure_child(normal, "w:rPr"), "Noto Serif", 21)
    set_run_color(ensure_child(normal, "w:rPr"), DOT_INK)

    heading_one = find_style(styles, "Heading1")
    heading_one_p = ensure_child(heading_one, "w:pPr")
    set_paragraph_spacing(heading_one_p, before=300, after=140, line=288)
    heading_one_alignment = ensure_child(heading_one_p, "w:jc")
    set_w_attr(heading_one_alignment, "val", "center")
    ensure_child(heading_one_p, "w:keepNext")
    ensure_child(heading_one_p, "w:keepLines")
    set_paragraph_border(
        heading_one_p,
        "bottom",
        color=DOT_HAIRLINE,
        size=5,
        space=5,
    )
    set_style_outline(heading_one, 1)
    heading_one_r = ensure_child(heading_one, "w:rPr")
    set_run_font(heading_one_r, "Noto Serif", 29)
    set_run_color(heading_one_r, DOT_INK)

    heading_two = find_style(styles, "Heading2")
    heading_two_p = ensure_child(heading_two, "w:pPr")
    set_paragraph_spacing(heading_two_p, before=240, after=100, line=276)
    heading_two_alignment = ensure_child(heading_two_p, "w:jc")
    set_w_attr(heading_two_alignment, "val", "center")
    ensure_child(heading_two_p, "w:keepNext")
    set_style_outline(heading_two, 2)
    heading_two_r = ensure_child(heading_two, "w:rPr")
    set_run_font(heading_two_r, "Noto Sans", 23)
    set_run_color(heading_two_r, DOT_ACCENT)

    heading_three = find_style(styles, "Heading3")
    heading_three_p = ensure_child(heading_three, "w:pPr")
    set_paragraph_spacing(heading_three_p, before=200, after=80, line=264)
    heading_three_alignment = ensure_child(heading_three_p, "w:jc")
    set_w_attr(heading_three_alignment, "val", "center")
    ensure_child(heading_three_p, "w:keepNext")
    set_style_outline(heading_three, 3)
    heading_three_r = ensure_child(heading_three, "w:rPr")
    set_run_font(heading_three_r, "Noto Sans", 21)
    set_run_color(heading_three_r, DOT_ACCENT)

    cadence = find_style(styles, "Cadence")
    cadence_p = ensure_child(cadence, "w:pPr")
    set_paragraph_spacing(cadence_p, before=40, after=90, line=276)
    cadence_r = ensure_child(cadence, "w:rPr")
    set_run_font(cadence_r, "Noto Serif", 21)
    set_run_color(cadence_r, DOT_ACCENT)

    epigraph = find_style(styles, "Epigraph")
    epigraph_p = ensure_child(epigraph, "w:pPr")
    set_paragraph_spacing(epigraph_p, before=150, after=180, line=288)
    epigraph_r = ensure_child(epigraph, "w:rPr")
    set_run_font(epigraph_r, "Noto Serif", 21)
    set_run_color(epigraph_r, DOT_MUTED)

    equation = find_style(styles, "Equation")
    equation_p = ensure_child(equation, "w:pPr")
    set_paragraph_border(equation_p, "top", color=DOT_HAIRLINE, size=4, space=8)
    set_paragraph_border(equation_p, "bottom", color=DOT_HAIRLINE, size=4, space=8)
    equation_r = ensure_child(equation, "w:rPr")
    set_run_font(equation_r, "Noto Sans Math", 20)
    set_run_color(equation_r, DOT_INK)

    for style_id in ("ListBullet", "ListNumber"):
        list_style = find_style(styles, style_id)
        list_p = ensure_child(list_style, "w:pPr")
        list_alignment = ensure_child(list_p, "w:jc")
        set_w_attr(list_alignment, "val", "both")
        suppress = ensure_child(list_p, "w:suppressAutoHyphens")
        set_w_attr(suppress, "val", "false")
        list_r = ensure_child(list_style, "w:rPr")
        set_run_font(list_r, "Noto Serif", 21)
        set_run_color(list_r, DOT_INK)

    reference = find_style(styles, "Reference")
    reference_p = ensure_child(reference, "w:pPr")
    set_paragraph_spacing(reference_p, before=0, after=80, line=226)
    reference_alignment = ensure_child(reference_p, "w:jc")
    set_w_attr(reference_alignment, "val", "both")
    reference_hyphenation = ensure_child(reference_p, "w:suppressAutoHyphens")
    set_w_attr(reference_hyphenation, "val", "false")
    reference_r = ensure_child(reference, "w:rPr")
    set_run_font(reference_r, "Noto Serif", 18)
    set_run_color(reference_r, DOT_INK)


def replace_missing_fonts(parts: dict[str, bytes]) -> None:
    replacements = {
        b"Calibri": b"Noto Sans",
        b"Cambria Math": b"Noto Sans Math",
        b"Courier New": b"Noto Sans Mono",
        b"Courier": b"Noto Sans Mono",
    }
    for name in list(parts):
        if not name.startswith("word/") or not name.endswith(".xml"):
            continue
        data = parts[name]
        for old, new in replacements.items():
            data = data.replace(old, new)
        parts[name] = data


def set_page_geometry(document: minidom.Document) -> list[Node]:
    sections = list(document.getElementsByTagName("w:sectPr"))
    for section in sections:
        size = ensure_child(section, "w:pgSz")
        set_w_attr(size, "w", "8640")
        # LibreOffice 26 rounds 12960 twips to 229 mm on DOCX import. The
        # compensated value exports at the intended 9 in / 648 pt trim height.
        set_w_attr(size, "h", "12937")
        margins = ensure_child(section, "w:pgMar")
        for name, value in {
            "top": "900",
            "right": "900",
            "bottom": "900",
            "left": "900",
            "header": "450",
            "footer": "500",
            "gutter": "0",
        }.items():
            set_w_attr(margins, name, value)
        remove_children(section, "w:headerReference")
    if sections:
        remove_children(sections[0], "w:footerReference")
    if len(sections) > 1:
        numbering = ensure_child(sections[1], "w:pgNumType")
        set_w_attr(numbering, "start", "1")
        set_w_attr(numbering, "fmt", "decimal")
    return sections


def add_outline_level(paragraph: Node, level: int) -> None:
    properties = ensure_child(paragraph, "w:pPr", first=True)
    outline = ensure_child(properties, "w:outlineLvl")
    set_w_attr(outline, "val", str(level))


def clear_paragraph_content(paragraph: Node) -> None:
    for node in list(paragraph.childNodes):
        if node.nodeType == Node.ELEMENT_NODE and node.nodeName == "w:pPr":
            continue
        paragraph.removeChild(node)


def append_run_break(run: Node) -> None:
    line_break = run.ownerDocument.createElement("w:br")
    run.appendChild(line_break)


def restyle_title_page(document: minidom.Document) -> None:
    body = document.getElementsByTagName("w:body")[0]
    paragraphs = children(body, "w:p")
    title_index = next(
        (
            index
            for index, paragraph in enumerate(paragraphs)
            if paragraph_text(paragraph) == "DIGITAL ORGANISM THEORY"
        ),
        None,
    )
    if title_index is None:
        raise ValueError("Could not locate the Book One title page")

    if title_index > 0 and not paragraph_text(paragraphs[title_index - 1]):
        motif = paragraphs[title_index - 1]
        clear_paragraph_content(motif)
        properties = ensure_child(motif, "w:pPr", first=True)
        set_paragraph_spacing(properties, before=720, after=280, line=220)
        set_paragraph_justification(motif, "center")
        mark = add_text_run(
            motif,
            ".",
            font="Noto Sans Mono",
            size="34",
            color=DOT_ACCENT,
            bold=True,
        )
        append_run_break(mark)
        for index, line in enumerate(("0 1 0", "0 1 1 0 1", "1 0 1 1 0 1 0")):
            run = add_text_run(
                motif,
                line,
                font="Noto Sans Mono",
                size="13",
                color=DOT_MUTED if index < 2 else DOT_ACCENT,
            )
            if index < 2:
                append_run_break(run)

    title_treatments = {
        "DIGITAL ORGANISM THEORY": ("Noto Sans", 18, DOT_ACCENT, True, 40, 180),
        "Consciousness: A Digital Organism": (
            "Noto Serif",
            39,
            DOT_INK,
            True,
            0,
            180,
        ),
        "BOOK ONE · THE PAINTING AND THE PAINTER": (
            "Noto Sans",
            17,
            DOT_ACCENT,
            True,
            0,
            130,
        ),
        "A Framework for Consciousness, Conditioning, and Conscious Authorship": (
            "Noto Serif",
            20,
            DOT_MUTED,
            False,
            0,
            420,
        ),
        "Henok Ghebrechristos": ("Noto Serif", 21, DOT_INK, True, 0, 90),
        "Digital Edition · Version 2": (
            "Noto Sans Mono",
            14,
            DOT_MUTED,
            False,
            0,
            0,
        ),
    }
    for paragraph in paragraphs:
        title_text = paragraph_text(paragraph)
        treatment = title_treatments.get(title_text)
        if treatment is None:
            continue
        font, size, color, bold, before, after = treatment
        properties = ensure_child(paragraph, "w:pPr", first=True)
        set_paragraph_spacing(properties, before=before, after=after, line=260)
        set_paragraph_justification(paragraph, "center")
        suppress = ensure_child(properties, "w:suppressAutoHyphens")
        set_w_attr(suppress, "val", "true")
        if title_text == (
            "A Framework for Consciousness, Conditioning, and Conscious Authorship"
        ):
            clear_paragraph_content(paragraph)
            first_line = add_text_run(
                paragraph,
                "A Framework for Consciousness,",
                font=font,
                size=size,
                color=color,
                italic=True,
            )
            append_run_break(first_line)
            add_text_run(
                paragraph,
                "Conditioning, and Conscious Authorship",
                font=font,
                size=size,
                color=color,
                italic=True,
            )
        restyle_runs(
            paragraph,
            font=font,
            size=size,
            color=color,
            bold=bold,
        )


def add_bookmark(paragraph: Node, bookmark_id: int, name: str) -> None:
    document = paragraph.ownerDocument
    start = document.createElement("w:bookmarkStart")
    set_w_attr(start, "id", str(bookmark_id))
    set_w_attr(start, "name", name)
    properties = child(paragraph, "w:pPr")
    if properties is not None and properties.nextSibling is not None:
        paragraph.insertBefore(start, properties.nextSibling)
    else:
        paragraph.appendChild(start)
    end = document.createElement("w:bookmarkEnd")
    set_w_attr(end, "id", str(bookmark_id))
    paragraph.appendChild(end)


def restyle_section_title(paragraph: Node) -> None:
    properties = ensure_child(paragraph, "w:pPr", first=True)
    set_paragraph_spacing(properties, before=0, after=240, line=300)
    set_paragraph_justification(paragraph, "center")
    set_paragraph_border(
        properties,
        "bottom",
        color=DOT_HAIRLINE,
        size=6,
        space=10,
    )
    suppress = ensure_child(properties, "w:suppressAutoHyphens")
    set_w_attr(suppress, "val", "true")
    restyle_runs(
        paragraph,
        font="Noto Serif",
        size=44,
        color=DOT_INK,
        bold=True,
    )


def restyle_section_marker(paragraph: Node) -> None:
    properties = ensure_child(paragraph, "w:pPr", first=True)
    set_paragraph_spacing(properties, before=0, after=130, line=240)
    set_paragraph_justification(paragraph, "center")
    restyle_runs(
        paragraph,
        font="Noto Sans Mono",
        size=15,
        color=DOT_ACCENT,
        bold=True,
    )


def restyle_section_opener(paragraph: Node) -> None:
    properties = ensure_child(paragraph, "w:pPr", first=True)
    set_paragraph_spacing(properties, before=0, after=150, line=300)
    set_paragraph_justification(paragraph, "both")
    suppress = ensure_child(properties, "w:suppressAutoHyphens")
    set_w_attr(suppress, "val", "false")
    for run in paragraph.getElementsByTagName("w:r"):
        run_properties = ensure_child(run, "w:rPr", first=True)
        set_run_font(run_properties, "Noto Serif", 23)
        set_run_color(run_properties, DOT_INK)


def restyle_reference(paragraph: Node) -> None:
    properties = ensure_child(paragraph, "w:pPr", first=True)
    alignment = ensure_child(properties, "w:jc")
    set_w_attr(alignment, "val", "both")
    suppress = ensure_child(properties, "w:suppressAutoHyphens")
    set_w_attr(suppress, "val", "false")
    for run in paragraph.getElementsByTagName("w:r"):
        properties = ensure_child(run, "w:rPr", first=True)
        set_run_font(properties, "Noto Serif", 18)
        set_run_color(properties, DOT_INK)


def restyle_coda(paragraph: Node) -> None:
    properties = ensure_child(paragraph, "w:pPr", first=True)
    ensure_child(properties, "w:pageBreakBefore")
    ensure_child(properties, "w:keepLines")
    suppress = ensure_child(properties, "w:suppressAutoHyphens")
    set_w_attr(suppress, "val", "true")
    justification = ensure_child(properties, "w:jc")
    set_w_attr(justification, "val", "center")
    set_paragraph_spacing(properties, before=3000, after=800, line=360)
    for run in paragraph.getElementsByTagName("w:r"):
        run_properties = ensure_child(run, "w:rPr", first=True)
        set_run_font(run_properties, "Noto Serif", 30)
        ensure_child(run_properties, "w:b")
        set_run_color(run_properties, DOT_ACCENT)


def insert_front_matter(
    document: minidom.Document,
    sections: list[Node],
    contents_pages: dict[str, int] | None,
) -> None:
    if not sections:
        raise ValueError("The manuscript has no Word sections")
    body = document.getElementsByTagName("w:body")[0]
    first_break_paragraph: Node | None = None
    for paragraph in children(body, "w:p"):
        if paragraph.getElementsByTagName("w:sectPr"):
            first_break_paragraph = paragraph
            break
    if first_break_paragraph is None:
        raise ValueError("Could not find the title-page section break")

    front_matter = [
        make_paragraph(document, before=3900, after=240),
        make_paragraph(
            document,
            "Consciousness: A Digital Organism",
            after=200,
            run_properties={
                "font": "Noto Serif",
                "size": "28",
                "color": DOT_INK,
                "bold": True,
            },
        ),
        make_paragraph(
            document,
            "Copyright © 2026 Henok Ghebrechristos",
            after=100,
            run_properties={"font": "Noto Sans", "size": "18", "color": DOT_MUTED},
        ),
        make_paragraph(
            document,
            "Digital Edition · Version 2",
            after=100,
            run_properties={"font": "Noto Sans", "size": "18", "color": DOT_ACCENT},
        ),
        make_paragraph(
            document,
            "Published by Digital Organism Theory · dotheory.org",
            after=100,
            run_properties={"font": "Noto Sans", "size": "18", "color": DOT_MUTED},
        ),
        make_paragraph(
            document,
            "This edition presents a developing philosophical model. Claim levels and evidence boundaries are stated in the text.",
            after=100,
            run_properties={
                "font": "Noto Serif",
                "size": "17",
                "color": DOT_MUTED,
                "italic": True,
            },
        ),
        make_page_break(document),
        make_paragraph(
            document,
            "Contents",
            alignment="center",
            before=700,
            after=500,
            run_properties={
                "font": "Noto Serif",
                "size": "38",
                "color": DOT_INK,
                "bold": True,
            },
        ),
    ]

    for _marker, _title, label, anchor in SECTION_DEFINITIONS:
        front_matter.append(
            make_contents_entry(
                document,
                label,
                anchor,
                contents_pages.get(anchor) if contents_pages else None,
            )
        )
    front_matter.append(make_front_matter_section(document, sections[0]))

    for paragraph in reversed(front_matter):
        body.insertBefore(paragraph, first_break_paragraph.nextSibling)


def style_document(
    document: minidom.Document,
    contents_pages: dict[str, int] | None,
) -> None:
    sections = set_page_geometry(document)
    restyle_title_page(document)
    body = document.getElementsByTagName("w:body")[0]
    pending_section: tuple[str, str, str, str] | None = None
    awaiting_section_opener = False
    in_title_page = True
    bookmark_id = 100
    definitions_by_marker = {
        definition[0]: definition for definition in SECTION_DEFINITIONS
    }
    for paragraph in children(body, "w:p"):
        text = paragraph_text(paragraph)
        has_section_break = bool(paragraph.getElementsByTagName("w:sectPr"))
        preserves_editorial_alignment = False
        if text in definitions_by_marker:
            pending_section = definitions_by_marker[text]
            restyle_section_marker(paragraph)
            preserves_editorial_alignment = True
        elif pending_section is not None and text == pending_section[1]:
            add_outline_level(paragraph, 0)
            add_bookmark(paragraph, bookmark_id, pending_section[3])
            restyle_section_title(paragraph)
            bookmark_id += 1
            pending_section = None
            awaiting_section_opener = True
            preserves_editorial_alignment = True
        elif (
            awaiting_section_opener
            and text
            and paragraph_style_id(paragraph) in (None, "Normal")
        ):
            restyle_section_opener(paragraph)
            awaiting_section_opener = False
        if text == CODA:
            restyle_coda(paragraph)
            preserves_editorial_alignment = True
        style_id = paragraph_style_id(paragraph)
        if (
            not in_title_page
            and not preserves_editorial_alignment
            and style_id in (None, "Normal", "ListBullet", "ListNumber")
            and text
        ):
            set_paragraph_justification(paragraph, "both")
            suppress = ensure_child(
                ensure_child(paragraph, "w:pPr", first=True),
                "w:suppressAutoHyphens",
            )
            set_w_attr(suppress, "val", "false")
        if style_id == "Reference":
            restyle_reference(paragraph)
        if has_section_break:
            in_title_page = False
    insert_front_matter(document, sections, contents_pages)


def update_settings(settings: minidom.Document) -> None:
    root = settings.documentElement
    auto_hyphenation = ensure_child(root, "w:autoHyphenation")
    set_w_attr(auto_hyphenation, "val", "true")
    hyphen_limit = ensure_child(root, "w:consecutiveHyphenLimit")
    set_w_attr(hyphen_limit, "val", "2")
    update_fields = ensure_child(root, "w:updateFields")
    set_w_attr(update_fields, "val", "true")


def set_element_text(document: minidom.Document, tag: str, value: str) -> None:
    elements = document.getElementsByTagName(tag)
    if not elements:
        return
    element = elements[0]
    while element.firstChild is not None:
        element.removeChild(element.firstChild)
    element.appendChild(document.createTextNode(value))


def update_core_properties(core: minidom.Document) -> None:
    timestamp = (
        datetime.datetime.now(datetime.UTC)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )
    set_element_text(core, "dcterms:created", timestamp)
    set_element_text(core, "dcterms:modified", timestamp)
    set_element_text(core, "cp:lastModifiedBy", "Henok Ghebrechristos")
    set_element_text(core, "cp:revision", "2")


def document_word_count(document: minidom.Document) -> int:
    text = " ".join(
        paragraph_text(paragraph) for paragraph in document.getElementsByTagName("w:p")
    )
    return len(re.findall(r"\b[\w’'-]+\b", text, flags=re.UNICODE))


def update_app_properties(
    app: minidom.Document,
    *,
    pages: int | None = None,
    words: int | None = None,
) -> None:
    if pages is not None:
        set_element_text(app, "Pages", str(pages))
    if words is not None:
        set_element_text(app, "Words", str(words))
    set_element_text(app, "Application", "Digital Organism Theory publication pipeline")


def write_docx(parts: dict[str, bytes], target: pathlib.Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in parts.items():
            archive.writestr(name, data)


def transform_docx(
    source: pathlib.Path,
    target: pathlib.Path,
    *,
    stage: str = "complete",
    contents_pages: dict[str, int] | None = None,
) -> None:
    with zipfile.ZipFile(source) as archive:
        parts = {name: archive.read(name) for name in archive.namelist()}

    replace_missing_fonts(parts)
    if stage == "fonts":
        write_docx(parts, target)
        return
    document = parse_xml(parts["word/document.xml"])
    styles = parse_xml(parts["word/styles.xml"])
    settings = parse_xml(parts["word/settings.xml"])
    core = parse_xml(parts["docProps/core.xml"])
    app = parse_xml(parts["docProps/app.xml"])

    style_book(styles)
    if stage == "styles":
        parts["word/styles.xml"] = serialize_xml(styles)
        write_docx(parts, target)
        return
    style_document(document, contents_pages)
    if stage == "document":
        parts["word/document.xml"] = serialize_xml(document)
        parts["word/styles.xml"] = serialize_xml(styles)
        write_docx(parts, target)
        return
    update_settings(settings)
    update_core_properties(core)
    update_app_properties(app, words=document_word_count(document))

    parts["word/document.xml"] = serialize_xml(document)
    parts["word/styles.xml"] = serialize_xml(styles)
    parts["word/settings.xml"] = serialize_xml(settings)
    parts["docProps/core.xml"] = serialize_xml(core)
    parts["docProps/app.xml"] = serialize_xml(app)
    write_docx(parts, target)


def pdf_page_count(pdf: pathlib.Path) -> int:
    result = subprocess.run(
        ["pdfinfo", str(pdf)],
        check=True,
        capture_output=True,
        text=True,
    )
    match = re.search(r"^Pages:\s+(\d+)$", result.stdout, flags=re.MULTILINE)
    if match is None:
        raise RuntimeError("pdfinfo did not report a page count")
    return int(match.group(1))


def contents_page_map(pdf: pathlib.Path) -> dict[str, int]:
    result = subprocess.run(
        ["pdftotext", "-layout", str(pdf), "-"],
        check=True,
        capture_output=True,
        text=True,
    )
    pages = result.stdout.split("\f")
    mapped: dict[str, int] = {}
    for marker, _title, _label, anchor in SECTION_DEFINITIONS:
        for page_number, page in enumerate(pages, start=1):
            lines = [line.strip() for line in page.splitlines() if line.strip()]
            if marker not in lines:
                continue
            printed_number = next(
                (int(line) for line in reversed(lines) if line.isdigit()),
                page_number,
            )
            mapped[anchor] = printed_number
            break
    missing = {definition[3] for definition in SECTION_DEFINITIONS} - mapped.keys()
    if missing:
        raise RuntimeError(f"Could not locate proof sections: {sorted(missing)}")
    return mapped


def update_docx_page_count(target: pathlib.Path, pages: int) -> None:
    with zipfile.ZipFile(target) as archive:
        parts = {name: archive.read(name) for name in archive.namelist()}
    app = parse_xml(parts["docProps/app.xml"])
    update_app_properties(app, pages=pages)
    parts["docProps/app.xml"] = serialize_xml(app)
    write_docx(parts, target)


def render_pdf(docx: pathlib.Path, target: pathlib.Path, libreoffice: str) -> None:
    with tempfile.TemporaryDirectory(prefix="dot-book-proof-") as temp_dir:
        temp = pathlib.Path(temp_dir)
        runtime = temp / "runtime"
        runtime.mkdir(mode=0o700)
        environment = {
            **os.environ,
            "HOME": str(temp),
            "XDG_CACHE_HOME": str(temp / "cache"),
            "XDG_CONFIG_HOME": str(temp / "config"),
            "XDG_RUNTIME_DIR": str(runtime),
        }
        command = [
            libreoffice,
            f"-env:UserInstallation={(temp / 'profile').resolve().as_uri()}",
            "--headless",
            "--convert-to",
            "pdf:writer_pdf_Export",
            "--outdir",
            str(temp),
            str(docx.resolve()),
        ]
        subprocess.run(command, check=True, env=environment)
        generated = temp / f"{docx.stem}.pdf"
        if not generated.exists():
            raise RuntimeError("LibreOffice completed without producing the proof PDF")
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(generated, target)


def main() -> None:
    args = parse_args()
    source = args.input.resolve()
    output = args.output.resolve()
    if not source.is_file():
        raise SystemExit(f"Book manuscript not found: {source}")
    libreoffice = shutil.which(args.libreoffice)
    if libreoffice is None:
        raise SystemExit(f"LibreOffice not found: {args.libreoffice}")

    proof_docx = output / PROOF_DOCX
    proof_pdf = output / PROOF_PDF
    transform_docx(source, proof_docx)
    render_pdf(proof_docx, proof_pdf, libreoffice)
    contents_pages = contents_page_map(proof_pdf)
    transform_docx(source, proof_docx, contents_pages=contents_pages)
    render_pdf(proof_docx, proof_pdf, libreoffice)
    pages = pdf_page_count(proof_pdf)
    update_docx_page_count(proof_docx, pages)

    print("Built Book One publication proof (source manuscript unchanged):")
    print(f"  DOCX: {proof_docx}")
    print(f"  PDF:  {proof_pdf}")
    print(f"  Pages: {pages}")


if __name__ == "__main__":
    main()
