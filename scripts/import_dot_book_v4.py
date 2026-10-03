#!/usr/bin/env python3
"""Release the Complete Edition Word manuscript to the digital reader.

One manuscript, two renderings (ADR-0036). The Word file is the editorial
source of truth for both the printed Complete Edition and the free digital
edition. This importer derives finite Markdown reading units from it. Depth
passages, marked in Word with paired ``depth_NN_start``/``depth_NN_end``
bookmarks, become ``::: depth`` containers that the reader folds into
on-request disclosures; their text is never removed. The designed PDF comes
from ``build_book_v48.py`` and is copied unchanged.

The v3 Digital Edition importer (``import_dot_book.py``) stays as it was so the
current public release remains reproducible.
"""

from __future__ import annotations

import argparse
import dataclasses
import datetime
import hashlib
import html
import json
import pathlib
import re
import shutil
import subprocess
import tempfile
import zipfile
from html.parser import HTMLParser
from xml.dom import minidom

from import_dot_book import (
    BOOK_ROUTE,
    PDF_NAME,
    display_equation_count,
    resolve_executable,
    word_count,
)

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = (
    ROOT
    / "docs/blueprint/book-one-complete/v4-working/v4.8-review/DOT-Complete-Book-One-v4.8-Review.docx"
)
DEFAULT_DEPTH = ROOT / "docs/blueprint/book-one-complete/v4-working/editing/v4.8-depth.json"
FIGURES = ROOT / "docs/blueprint/book-one-complete/v4-working/assets/v4.8"
MARK = "DOTMARK"
SUPERSCRIPT = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")
WORDS_PER_MINUTE = 220


@dataclasses.dataclass(frozen=True)
class SectionSpec:
    anchor: str
    slug: str
    kind: str
    number: int | None
    part: str
    related_concepts: tuple[str, ...]


ARCHITECTURE = "The Proposed Architecture"
HUMAN = "The Human Instance"
INQUIRY = "The Inquiry Ahead"
NOTES = "Notes and Sources"

SECTIONS: tuple[SectionSpec, ...] = (
    SectionSpec("the_observer_belongs_in_the_inquiry", "preface", "preface", None, ARCHITECTURE, ("subjective-data", "fear", "love")),
    SectionSpec("the_digital_organism", "the-digital-organism", "chapter", 1, ARCHITECTURE, ("digital-organism", "big-c", "little-c", "reality-frame", "canvas", "intent")),
    SectionSpec("the_decoupling_principle", "the-decoupling-principle", "chapter", 2, ARCHITECTURE, ("little-c", "body-interface", "rendering-latency", "intent")),
    SectionSpec("architecture_of_continuity", "architecture-of-continuity", "chapter", 3, ARCHITECTURE, ("continuity", "reality-frame", "reality-stream", "big-c")),
    SectionSpec("reality_frames", "reality-frames", "chapter", 4, ARCHITECTURE, ("reality-frame", "reality-stream", "world-invariants", "agency", "intent")),
    SectionSpec("the_canvas", "the-canvas", "chapter", 5, HUMAN, ("canvas", "painting", "character", "fear")),
    SectionSpec("the_painting", "the-painting", "chapter", 6, HUMAN, ("painting", "character", "culture", "fear", "love")),
    SectionSpec("the_research_program", "the-research-program", "chapter", 7, INQUIRY, ("research-program", "decoupling-principle", "rendering-latency")),
    SectionSpec("the_theory_returns_to_one_life", "coda", "coda", None, INQUIRY, ("little-c", "love")),
    SectionSpec("equation_and_notation_guide", "equation-guide", "appendix", None, NOTES, ("notation",)),
    SectionSpec("core_terms", "glossary", "glossary", None, NOTES, ("terms",)),
    SectionSpec("references", "references", "references", None, NOTES, ("sources", "evidence")),
)


# --- Word preparation -----------------------------------------------------------


def marker_paragraph(doc, value: str):
    paragraph = doc.createElement("w:p")
    run = doc.createElement("w:r")
    text = doc.createElement("w:t")
    text.appendChild(doc.createTextNode(value))
    run.appendChild(text)
    paragraph.appendChild(run)
    return paragraph


def paragraph_style(paragraph) -> str:
    styles = paragraph.getElementsByTagName("w:pStyle")
    return styles[0].getAttribute("w:val") if styles else ""


def paragraph_text(paragraph) -> str:
    return "".join(
        node.firstChild.data if node.firstChild else ""
        for node in paragraph.getElementsByTagName("*")
        if node.tagName in ("w:t", "m:t")
    )


def prepare(source: pathlib.Path, target: pathlib.Path) -> dict[str, dict[str, str]]:
    """Copy the manuscript with visible section and depth markers for Pandoc.

    Bookmarks carry the structure in Word, but Pandoc's GFM writer drops them.
    Marker paragraphs survive conversion and are consumed by this importer.
    """

    with zipfile.ZipFile(source) as archive:
        parts = {name: archive.read(name) for name in archive.namelist()}
    doc = minidom.parseString(parts["word/document.xml"])
    headings: dict[str, dict[str, str]] = {}
    depth_starts: list[str] = []
    depth_ends: list[str] = []
    for paragraph in list(doc.getElementsByTagName("w:p")):
        names = [b.getAttribute("w:name") for b in paragraph.getElementsByTagName("w:bookmarkStart")]
        if paragraph_style(paragraph) == "Heading1":
            anchor = names[0]
            runs = paragraph.getElementsByTagName("w:r")
            label = "".join(t.firstChild.data for t in runs[0].getElementsByTagName("w:t") if t.firstChild)
            title = "".join(
                t.firstChild.data for r in runs[1:] for t in r.getElementsByTagName("w:t") if t.firstChild
            )
            deck = paragraph.nextSibling
            while deck is not None and deck.nodeType != deck.ELEMENT_NODE:
                deck = deck.nextSibling
            headings[anchor] = {
                "label": label.strip(),
                "title": title.strip(),
                "subtitle": paragraph_text(deck).strip() if deck is not None and paragraph_style(deck) == "DOTChapterDeck" else "",
            }
            paragraph.parentNode.insertBefore(marker_paragraph(doc, f"{MARK} section {anchor}"), paragraph)
        for name in names:
            match = re.fullmatch(r"(depth_\d+)_(start|end)", name)
            if not match:
                continue
            ident, edge = match.groups()
            marker = marker_paragraph(doc, f"{MARK} depth {edge} {ident}")
            if edge == "start":
                depth_starts.append(ident)
                paragraph.parentNode.insertBefore(marker, paragraph)
            else:
                depth_ends.append(ident)
                paragraph.parentNode.insertBefore(marker, paragraph.nextSibling)
    if depth_starts != depth_ends:
        raise ValueError("Depth bookmarks are unpaired or out of order")
    parts["word/document.xml"] = doc.toxml(encoding="UTF-8")
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in parts.items():
            archive.writestr(name, data)
    return headings


def pandoc_markdown(source: pathlib.Path, pandoc: str) -> str:
    with tempfile.TemporaryDirectory(prefix="dot-complete-") as temp_dir:
        output = pathlib.Path(temp_dir) / "book.md"
        subprocess.run(
            [pandoc, str(source), "--from=docx", "--to=gfm", "--wrap=none", f"--output={output}"],
            check=True,
        )
        return output.read_text(encoding="utf-8")


# --- Markdown cleanup -------------------------------------------------------------


class TableParser(HTMLParser):
    """Collect rows of a Pandoc HTML table as Markdown-formatted cell strings."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.rows: list[tuple[bool, list[tuple[str, int]]]] = []
        self.cell: list[str] | None = None
        self.colspan = 1
        self.header = False

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "tr":
            self.rows.append((False, []))
        elif tag in ("td", "th"):
            self.cell = []
            self.colspan = int(attributes.get("colspan") or 1)
            self.header = tag == "th"
        elif tag == "strong" and self.cell is not None:
            self.cell.append("**")
        elif tag == "em" and self.cell is not None:
            self.cell.append("*")
        elif tag == "br" and self.cell is not None:
            self.cell.append(" ")

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.cell is not None:
            value = re.sub(r"\s+", " ", "".join(self.cell)).strip()
            is_header, cells = self.rows[-1]
            cells.append((value, self.colspan))
            self.rows[-1] = (is_header or self.header, cells)
            self.cell = None
        elif tag == "strong" and self.cell is not None:
            self.cell.append("**")
        elif tag == "em" and self.cell is not None:
            self.cell.append("*")

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)


def html_table(match: re.Match[str]) -> str:
    parser = TableParser()
    parser.feed(match.group(0))
    rows = parser.rows
    if not rows:
        raise ValueError("Empty table in manuscript")
    blocks = []
    first_header, first_cells = rows[0]
    if len(first_cells) == 1 and first_cells[0][1] > 1:
        # A titled two-column comparison reads better on a phone as a list.
        title = first_cells[0][0].strip("*")
        items = []
        for _, cells in rows[1:]:
            if len(cells) != 2:
                raise ValueError("Comparison table has an unexpected shape")
            term = cells[0][0] if cells[0][0].startswith("**") else f"**{cells[0][0]}**"
            items.append(f"- {term} — {cells[1][0]}")
        blocks.append(f"**{title}**\n\n" + "\n".join(items))
    else:
        width = max(sum(span for _, span in cells) for _, cells in rows)
        header = [value for value, _ in first_cells] if first_header else [""] * width
        body = rows[1:] if first_header else rows
        lines = ["| " + " | ".join(header) + " |", "|" + "---|" * width]
        for _, cells in body:
            values = [value.replace("|", "\\|") for value, _ in cells]
            lines.append("| " + " | ".join(values + [""] * (width - len(values))) + " |")
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


EQUATION_ROW = re.compile(
    r"^\|\s*\|\s*\$`(?P<tex>.+?)`\$(?P<rest>[^|]*)\|\s*"
    r"<span id=\"equation_\d+_\d+\" class=\"anchor\"></span>\((?P<number>\d+\.\d+)\)\s*\|\s*\n\|-+\|-+\|-+\|",
    re.MULTILINE,
)


def display_equation(match: re.Match[str]) -> str:
    tex = match.group("tex").strip()
    # KaTeX rejects non-breaking spaces from Word inside TeX.
    rest = match.group("rest").replace("\u00a0", " ").strip()
    if rest:
        tex += rf" \quad \text{{{rest}}}"
    return f"$$\n{tex} \\tag{{{match.group('number')}}}\n$$"


def pandoc_identifier(heading: str) -> str:
    """Pandoc's auto_identifiers rule for GFM headings."""

    value = re.sub(r"[^\w\s-]", "", heading.lower())
    return re.sub(r"\s+", "-", value.strip())


def citation(match: re.Match[str]) -> str:
    number = match.group(2)
    return f"[{number.translate(SUPERSCRIPT)}]({BOOK_ROUTE}/references#reference-{number})"


def clean_section(raw: str, spec: SectionSpec, heading: dict[str, str], depth_labels: dict[str, str], routes: dict[str, str], figures_url: str) -> str:
    text = raw.strip()
    # The reader page supplies the chapter label, title, and deck.
    text = re.sub(r"\A.*?\n=+\n", "", text, count=1, flags=re.DOTALL).lstrip()
    if heading["subtitle"] and text.startswith(heading["subtitle"]):
        text = text[len(heading["subtitle"]) :].lstrip()

    text = EQUATION_ROW.sub(display_equation, text)
    if "equation_" in text and "<span id=\"equation_" in text:
        raise ValueError(f"Unconverted equation in {spec.slug}")
    text = re.sub(r"<table.*?</table>", html_table, text, flags=re.DOTALL)

    # Citations: Word hyperlinks to reference bookmarks, with or without <sup>.
    text = re.sub(r"</?sup>", "", text)
    text = re.sub(r"\[([⁰¹²³⁴⁵⁶⁷⁸⁹]+)\]\(#reference_(\d+)\)", citation, text)
    text = re.sub(
        r"\[([^\]]+)\]\(#([A-Za-z0-9_-]+)\)",
        lambda m: f"[{m.group(1)}]({routes[m.group(2)]})" if m.group(2) in routes else m.group(1),
        text,
    )
    text = re.sub(
        r'<img src="media/v47-([a-z-]+)\.svg"[^>]*alt="([^"]*)"\s*/>',
        lambda m: f"![{html.unescape(m.group(2))}]({figures_url}/{m.group(1)}.svg)",
        text,
    )
    text = re.sub(r'<span id="[^"]*" class="anchor"></span>', "", text)
    text = re.sub(r"</?u>", "", text)

    # Pandoc writes inline Word math as $`…`$; the reader uses remark-math.
    text = re.sub(r"\$`([^`\n]+)`\$", r"$\1$", text)

    def depth_marker(match: re.Match[str]) -> str:
        edge, ident = match.groups()
        if edge == "end":
            return ":::"
        return f"::: depth {depth_labels[ident]}"

    text = re.sub(rf"^{MARK} depth (start|end) (depth_\d+)$", depth_marker, text, flags=re.MULTILINE)
    if spec.kind == "references":
        text = re.sub(r"^\*\*Reference (\d+)\*\*\s*$", r"### Reference \1\n", text, flags=re.MULTILINE)
        text = re.sub(r"^Reference (\d+)\s*$", r"### Reference \1\n", text, flags=re.MULTILINE)

    leftover = re.findall(r"<(?!/?br\b)(?!https?://)[a-zA-Z/][^>]*>", text)
    if leftover or MARK in text:
        raise ValueError(f"Unconverted markup in {spec.slug}: {leftover[:3]}")
    if text.count("::: depth ") != len(re.findall(r"^:::$", text, flags=re.MULTILINE)):
        raise ValueError(f"Unbalanced depth passages in {spec.slug}")
    return text.strip() + "\n"


def depth_words(markdown: str) -> int:
    inside = re.findall(r"^::: depth .*?$(.*?)^:::$", markdown, flags=re.MULTILINE | re.DOTALL)
    return sum(word_count(block) for block in inside)


def minutes(words: int) -> int:
    return max(1, round(words / WORDS_PER_MINUTE))


# --- Release -------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=pathlib.Path, default=DEFAULT_SOURCE)
    parser.add_argument("--depth", type=pathlib.Path, default=DEFAULT_DEPTH)
    parser.add_argument("--output", type=pathlib.Path, required=True, help="Release directory, e.g. frontend/public/publications/henok/digital-organism-theory/v4")
    parser.add_argument("--pdf", type=pathlib.Path, help="Designed Complete Edition PDF to publish unchanged")
    parser.add_argument("--artifacts-output", type=pathlib.Path, default=ROOT / "backend/orchestrator/private/books")
    parser.add_argument("--release-version", type=int, default=4)
    parser.add_argument("--release-date", default=datetime.datetime.now(datetime.UTC).date().isoformat())
    parser.add_argument("--release-status", default="published")
    parser.add_argument("--pandoc", default="pandoc")
    args = parser.parse_args()

    source = args.input.resolve()
    output = args.output.resolve()
    depth = json.loads(args.depth.read_text())
    labels = {passage["id"]: passage["label"] for passage in depth["passages"]}
    public_base = f"/publications/henok/digital-organism-theory/v{args.release_version}"
    routes = {spec.anchor: f"{BOOK_ROUTE}/{spec.slug}" for spec in SECTIONS}

    with tempfile.TemporaryDirectory(prefix="dot-complete-docx-") as temp_dir:
        marked = pathlib.Path(temp_dir) / source.name
        headings = prepare(source, marked)
        markdown = pandoc_markdown(marked, resolve_executable(args.pandoc))
    # Pandoc rewrites Word cross-references to its own heading identifiers.
    for spec in SECTIONS:
        heading = headings[spec.anchor]
        routes[pandoc_identifier(f"{heading['label']} {heading['title']}")] = routes[spec.anchor]

    if [spec.anchor for spec in SECTIONS] != list(headings):
        raise ValueError(f"Manuscript sections changed: {list(headings)}")
    pieces = re.split(rf"^{MARK} section (\S+)$", markdown, flags=re.MULTILINE)
    raw_sections = dict(zip(pieces[1::2], pieces[2::2]))

    sections_dir = output / "sections"
    if sections_dir.exists():
        shutil.rmtree(sections_dir)
    sections_dir.mkdir(parents=True)
    figures_dir = output / "figures"
    figures_dir.mkdir(exist_ok=True)
    for figure in ("architecture", "experience-loop"):
        shutil.copyfile(FIGURES / f"{figure}.svg", figures_dir / f"{figure}.svg")

    manifest_sections = []
    released = []
    for index, spec in enumerate(SECTIONS):
        heading = headings[spec.anchor]
        content = clean_section(raw_sections[spec.anchor], spec, heading, labels, routes, public_base + "/figures")
        released.append(content)
        (sections_dir / f"{spec.slug}.md").write_text(content, encoding="utf-8")
        words = word_count(re.sub(r"^:::.*$", "", content, flags=re.MULTILINE))
        folded = depth_words(content)
        manifest_sections.append(
            {
                "id": f"dot-book-one-{spec.slug}",
                "order": index,
                "slug": spec.slug,
                "kind": spec.kind,
                "number": spec.number,
                "title": heading["title"],
                "subtitle": heading["subtitle"] or None,
                "part": spec.part,
                "content_path": f"sections/{spec.slug}.md",
                "word_count": words,
                "core_word_count": words - folded,
                "depth_passages": content.count("::: depth "),
                "reading_time_minutes": minutes(words - folded),
                "complete_reading_time_minutes": minutes(words),
                "related_concepts": list(spec.related_concepts),
            }
        )

    references = len(re.findall(r"^### Reference \d+$", released[-1], flags=re.MULTILINE))
    if references != 51:
        raise ValueError(f"Expected 51 references, found {references}")
    equations = sum(display_equation_count(content) for content in released)
    if equations != 24:
        raise ValueError(f"Expected 24 display equations, found {equations}")
    manifest = {
        "schema_version": "publication.release.v2",
        "generated_at": f"{args.release_date}T00:00:00Z",
        "source": {"format": "docx", "name": source.name, "sha256": hashlib.sha256(source.read_bytes()).hexdigest()},
        "project": {
            "id": "dot-book-one",
            "owner_id": "henok",
            "type": "book",
            "series_title": "Digital Organism Theory",
            "title": "Consciousness: A Digital Organism",
            "subtitle": "Foundations, Agency, and Research",
            "author": "Henok Ghebrechristos",
            "slug": "digital-organism-theory",
            "visibility": "public",
        },
        "release": {
            "id": f"dot-book-one-v{args.release_version}",
            "version": args.release_version,
            "status": args.release_status,
            "label": "Digital edition",
            "published_at": args.release_date if args.release_status == "published" else None,
            "updated_at": args.release_date,
        },
        "extent": {
            "chapters": sum(1 for spec in SECTIONS if spec.kind == "chapter"),
            "words": sum(s["word_count"] for s in manifest_sections),
            "core_words": sum(s["core_word_count"] for s in manifest_sections),
            "depth_passages": sum(s["depth_passages"] for s in manifest_sections),
            "equations": equations,
            "references": references,
        },
        "reader_contract": {
            "finite": True,
            "autoplay": False,
            "depth": "folded-on-request",
            "claim_levels": ["Observation", "External model", "DOT derivation", "Speculative extension"],
        },
        "sections": manifest_sections,
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if args.pdf:
        for destination in (output / PDF_NAME, args.artifacts_output.resolve() / PDF_NAME):
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(args.pdf, destination)
    print(json.dumps(manifest["extent"], indent=2))


if __name__ == "__main__":
    main()
