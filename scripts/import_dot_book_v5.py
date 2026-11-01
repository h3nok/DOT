#!/usr/bin/env python3
"""Derive illustrated v5 web pages from their validated Word manuscript.

The default remains a private proof. Release mode stages canonical public pages
under /tmp; promote_book_v5.py seals the reviewed artifacts as a new edition.
Earlier releases are never outputs. Figures stay at their manuscript
bookmarks, and Word's paired depth passages, math and references go through the
existing Complete Edition converter. Serves L7, L8 and L10; violates no law.
"""

from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import pathlib
import re
import shutil
import subprocess
import tempfile
import zipfile
from xml.dom import minidom

import import_dot_book_v4 as complete

ROOT = pathlib.Path(__file__).resolve().parents[1]
WORKING = ROOT / "docs/blueprint/book-one-complete/v5-working"
DEFAULT_OUTPUT = ROOT / "frontend/.book-v5-preview"
PREVIEW_ROUTE = "/_preview/book-v5"
ASSET_URL = "/_book-v5"
PUBLIC_ASSET_URL = "/publications/henok/digital-organism-theory/v5"
PUBLIC_PDF_NAME = "digital-organism-theory-book-one.pdf"
RELEASE_NAME = "DOT-Book-One-Complete-Edition-v5"
FIGURE_TOKEN = "DOTV5FIGURE"
EXPECTED_FIGURES = {
    "avatar-canvas", "experience-loop", "canvas-painting-character",
    "connection-and-identification", "fear-and-choice", "architecture",
    "reality-stream", "little-c-scope",
}
OWNER_MARKER = ".dot-v5-preview"
RELEASE_OWNER_MARKER = ".dot-v5-release-stage"
CLAIM_LEVELS = ["Observation", "External Model", "DOT Derivation", "Speculative Extension"]


def safe_output(path: pathlib.Path, *, release: bool = False) -> pathlib.Path:
    resolved = path.resolve()
    temporary = pathlib.Path(tempfile.gettempdir()).resolve()
    is_temporary = resolved != temporary and resolved.is_relative_to(temporary)
    if release and not is_temporary:
        raise ValueError("Release pages must be staged under /tmp; promote_book_v5.py seals the publication")
    if not release and resolved != DEFAULT_OUTPUT.resolve() and not is_temporary:
        raise ValueError("A v5 proof may only be written to frontend/.book-v5-preview or a child of /tmp")
    marker = RELEASE_OWNER_MARKER if release else OWNER_MARKER
    if resolved.exists() and any(resolved.iterdir()) and not (resolved / marker).is_file():
        raise ValueError("Refusing to replace a nonempty directory not owned by this v5 export mode")
    return resolved


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require_release_candidate(source: pathlib.Path, pdf: pathlib.Path | None, validation: dict | None,
                              edits: pathlib.Path = WORKING / "editing/v5-edits.json") -> None:
    """Final publication labels and the complete reviewed inputs must agree."""
    if pdf is None or validation is None or validation.get("status") != "release-candidate":
        raise ValueError("A release requires a validated, final-labelled release candidate and matching PDF")
    if source.name != RELEASE_NAME + ".docx" or pdf.name != RELEASE_NAME + ".pdf" or validation.get("edition") != 5:
        raise ValueError("The release candidate must identify the complete version 5 manuscript")
    if validation.get("edit_manifest_sha256") != digest(edits):
        raise ValueError("The edit manifest changed after the release candidate was validated")
    editorial_source = json.loads(edits.read_text())
    if (validation.get("source_sha256") != editorial_source["source_sha256"]
            or digest(ROOT / editorial_source["source"]) != editorial_source["source_sha256"]):
        raise ValueError("The original manuscript no longer matches the frozen editorial source")
    if validation.get("docx_sha256") != digest(source) or validation.get("pdf_sha256") != digest(pdf):
        raise ValueError("The release candidate Word/PDF hashes no longer match validation")
    with zipfile.ZipFile(source) as archive:
        document = minidom.parseString(archive.read("word/document.xml"))
    manuscript_text = " ".join(complete.paragraph_text(p) for p in document.getElementsByTagName("w:p"))
    pdf_text = subprocess.check_output(["pdftotext", "-layout", str(pdf), "-"], text=True)
    for text in (manuscript_text, pdf_text):
        if re.search(r"author[ -]review|unpublished edition|not yet the final publication|/_preview/book-v5|/_book-v5", text, re.I):
            raise ValueError("The release candidate still contains review labels or private preview addresses")


def asset_file(base: pathlib.Path, value: str) -> pathlib.Path:
    candidate = (base / value).resolve()
    if not candidate.is_relative_to(base.resolve()) or not candidate.is_file():
        raise ValueError(f"Missing or unsafe figure asset: {value}")
    return candidate


def load_figures(path: pathlib.Path) -> list[dict]:
    value = json.loads(path.read_text(encoding="utf-8"))
    figures = value if isinstance(value, list) else value.get("figures", [])
    if len(figures) != len(EXPECTED_FIGURES) or {item.get("id") for item in figures} != EXPECTED_FIGURES:
        raise ValueError("The v5 proof requires every reviewed illustration record exactly once")
    for item in figures:
        for field in ("title", "caption", "alt", "claim", "web_svg", "mobile_svg"):
            if not isinstance(item.get(field), str) or not item[field].strip():
                raise ValueError(f"Figure {item['id']} needs {field}")
        for field in ("width", "height", "mobile_width", "mobile_height"):
            if not isinstance(item.get(field), (int, float)) or item[field] <= 0:
                raise ValueError(f"Figure {item['id']} needs positive {field}")
        for field in ("web_svg", "mobile_svg"):
            source = asset_file(path.parent, item[field])
            if source.suffix.lower() != ".svg":
                raise ValueError("Reader illustrations must be reviewed SVG files")
    return figures


def mark_figures(source: pathlib.Path, target: pathlib.Path, figures: list[dict]) -> tuple[list[str], dict[str, str]]:
    """Use temporary text tokens instead of pictures; never modify the source Word file."""
    with zipfile.ZipFile(source) as archive:
        parts = {name: archive.read(name) for name in archive.namelist()}
    document = minidom.parseString(parts["word/document.xml"])
    sections = {spec.anchor: spec.slug for spec in complete.SECTIONS}
    expected = {"figure_" + item["id"].replace("-", "_"): item["id"] for item in figures}
    current_section = None
    order: list[str] = []
    captions: list[str] = []
    caption_text: dict[str, str] = {}
    locations: dict[str, str] = {}
    for paragraph in list(document.getElementsByTagName("w:p")):
        names = [node.getAttribute("w:name") for node in paragraph.getElementsByTagName("w:bookmarkStart")]
        if complete.paragraph_style(paragraph) == "Heading1":
            current_section = next((sections[name] for name in names if name in sections), None)
        image_ids = [expected[name] for name in names if name in expected]
        caption_ids = [expected[name.removesuffix("_caption")] for name in names if name.endswith("_caption") and name.removesuffix("_caption") in expected]
        if image_ids:
            if len(image_ids) != 1 or not current_section:
                raise ValueError("Every figure must belong to one exported chapter or preface")
            if not paragraph.getElementsByTagName("w:drawing"):
                raise ValueError("A figure bookmark must identify an embedded manuscript illustration")
            ident = image_ids[0]
            if ident in order:
                raise ValueError(f"Duplicate figure bookmark: {ident}")
            order.append(ident)
            locations[ident] = current_section
            paragraph.parentNode.replaceChild(complete.marker_paragraph(document, f"{FIGURE_TOKEN} {ident}"), paragraph)
        elif caption_ids:
            if len(caption_ids) != 1:
                raise ValueError("A figure caption has more than one illustration bookmark")
            captions.extend(caption_ids)
            caption_text[caption_ids[0]] = " ".join(complete.paragraph_text(paragraph).split())
            paragraph.parentNode.removeChild(paragraph)
    if set(order) != EXPECTED_FIGURES or sorted(captions) != sorted(EXPECTED_FIGURES):
        raise ValueError("Each reviewed figure needs both an image bookmark and a caption bookmark")
    by_id = {figure["id"]: figure for figure in figures}
    for number, ident in enumerate(order, 1):
        item = by_id[ident]
        expected_caption = " ".join(f"Figure {number} · {item['title']}. {item['claim']}. {item['caption']}".split())
        if caption_text[ident] != expected_caption:
            raise ValueError(f"Figure {ident}'s website caption differs from the actual manuscript caption")
    parts["word/document.xml"] = document.toxml(encoding="UTF-8")
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, data in parts.items():
            archive.writestr(name, data)
    return order, locations


def markdown_alt(text: str) -> str:
    return " ".join(text.split()).replace("\\", "\\\\").replace("[", "\\[").replace("]", "\\]")


def require_core_figures(markdown: str, section: str, asset_url: str = ASSET_URL) -> None:
    """Introductory illustrations must remain visible in the core reading path."""
    depth = None
    for line in markdown.splitlines():
        if line.startswith("::: depth "):
            depth = line.removeprefix("::: depth ")
        elif line.strip() == ":::":
            depth = None
        elif depth and line.startswith("![") and f"]({asset_url}/figures/" in line:
            raise ValueError(f"An illustration in {section} is hidden inside the depth passage '{depth}'; move it into core reading")


def build(args: argparse.Namespace) -> dict:
    release = bool(getattr(args, "release", False))
    release_date = getattr(args, "release_date", None)
    if release:
        if not release_date or datetime.date.fromisoformat(release_date).isoformat() != release_date:
            raise ValueError("Release mode needs an explicit --release-date in YYYY-MM-DD form")
    output = safe_output(args.output, release=release)
    route = complete.BOOK_ROUTE if release else PREVIEW_ROUTE
    asset_url = PUBLIC_ASSET_URL if release else ASSET_URL
    pdf_name = PUBLIC_PDF_NAME if release else "book-one-v5-proof.pdf"
    source = args.input.resolve()
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    pdf_hash = None
    validation = None
    if args.pdf:
        report_path = source.with_name(source.stem + "-Validation.json")
        if not report_path.is_file():
            raise ValueError("A matching PDF requires the source manuscript's validation report")
        validation = json.loads(report_path.read_text(encoding="utf-8"))
        pdf_bytes = args.pdf.read_bytes()
        pdf_hash = hashlib.sha256(pdf_bytes).hexdigest()
        if pdf_bytes[:5] != b"%PDF-" or validation.get("docx_sha256") != source_hash or validation.get("pdf_sha256") != pdf_hash:
            raise ValueError("The DOCX and PDF do not match the same validated proof")
    if release:
        require_release_candidate(source, args.pdf, validation)
    figures_path = args.figures.resolve()
    figures = load_figures(figures_path)
    cover = None
    if validation is not None:
        asset_hashes = validation.get("assets_sha256")
        required_assets = {figures_path.name} | {
            figure[field] for figure in figures
            for field in ("print_svg", "print_png", "web_svg", "mobile_svg")
        }
        if not isinstance(asset_hashes, dict) or not required_assets.issubset(asset_hashes):
            raise ValueError("The matching PDF's validation report must freeze every illustration and its metadata")
        for name, expected_digest in asset_hashes.items():
            actual = hashlib.sha256(asset_file(figures_path.parent, name).read_bytes()).hexdigest()
            if expected_digest != actual:
                raise ValueError(f"Figure asset changed after the DOCX/PDF proof was validated: {name}")
        cover = validation.get("cover")
        if not isinstance(cover, dict) or cover.get("src") not in asset_hashes:
            raise ValueError("The cover must belong to the same validated manuscript and PDF")
        if not all(isinstance(cover.get(key), int) and cover[key] > 0 for key in ("width", "height")) or not cover.get("alt"):
            raise ValueError("The cover needs dimensions and an accessible description")
    by_id = {figure["id"]: figure for figure in figures}
    depth = json.loads(args.depth.read_text(encoding="utf-8"))
    depth_labels = {passage["id"]: passage["label"] for passage in depth["passages"]}
    pandoc = complete.resolve_executable(args.pandoc)
    with tempfile.TemporaryDirectory(prefix="dot-v5-conversion-") as temporary:
        temporary = pathlib.Path(temporary)
        illustrated = temporary / "illustrated.docx"
        marked = temporary / "marked.docx"
        order, locations = mark_figures(source, illustrated, figures)
        headings = complete.prepare(illustrated, marked)
        markdown = complete.pandoc_markdown(marked, pandoc)
    if [spec.anchor for spec in complete.SECTIONS] != list(headings):
        raise ValueError("The proof's chapter structure differs from the Complete Edition")
    routes = {spec.anchor: f"{route}/{spec.slug}" for spec in complete.SECTIONS}
    for spec in complete.SECTIONS:
        heading = headings[spec.anchor]
        routes[complete.pandoc_identifier(f"{heading['label']} {heading['title']}")] = routes[spec.anchor]
    for ident, section in locations.items():
        routes["figure_" + ident.replace("-", "_")] = f"{route}/{section}#figure-{ident}"
    pieces = re.split(rf"^{complete.MARK} section (\S+)$", markdown, flags=re.MULTILINE)
    raw_sections = dict(zip(pieces[1::2], pieces[2::2]))
    contents: dict[str, str] = {}
    sections: list[dict] = []
    for index, spec in enumerate(complete.SECTIONS):
        heading = headings[spec.anchor]
        content = complete.clean_section(raw_sections[spec.anchor], spec, heading, depth_labels, routes, asset_url + "/figures")
        content = re.sub(
            rf"^{FIGURE_TOKEN} ([a-z-]+)$",
            lambda match: f"![{markdown_alt(by_id[match[1]]['alt'])}]({asset_url}/figures/{match[1]}.svg)",
            content,
            flags=re.MULTILINE,
        )
        # v4's citation helper knows the live route; a proof's citations stay in its own edition.
        content = content.replace(complete.BOOK_ROUTE, route)
        if FIGURE_TOKEN in content:
            raise ValueError(f"Unconverted illustration marker in {spec.slug}")
        require_core_figures(content, spec.slug, asset_url)
        contents[spec.slug] = content
        words = complete.word_count(re.sub(r"^:::.*$", "", content, flags=re.MULTILINE))
        core = words - complete.depth_words(content)
        sections.append({
            "id": f"dot-book-one-v5-{spec.slug}", "order": index, "slug": spec.slug,
            "kind": spec.kind, "number": spec.number, "title": heading["title"],
            "subtitle": heading["subtitle"] or None, "part": spec.part,
            "content_path": f"sections/{spec.slug}.md", "word_count": words,
            "core_word_count": core, "depth_passages": content.count("::: depth "),
            "reading_time_minutes": complete.minutes(core),
            "complete_reading_time_minutes": complete.minutes(words),
            "related_concepts": list(spec.related_concepts),
        })
    joined = "\n".join(contents.values())
    illustration_urls = re.findall(r"!\[(?:\\.|[^\]])*\]\(([^\s)]+)\)", joined)
    if sorted(illustration_urls) != sorted(f"{asset_url}/figures/{ident}.svg" for ident in EXPECTED_FIGURES):
        raise ValueError("The web proof must contain each reviewed figure exactly once and no untracked images")
    if release and (PREVIEW_ROUTE in joined or ASSET_URL in joined):
        raise ValueError("Private proof links must not enter a public edition")
    references = len(re.findall(r"^### Reference \d+$", contents["references"], flags=re.MULTILINE))
    equations = sum(complete.display_equation_count(content) for content in contents.values())
    depth_count = sum(section["depth_passages"] for section in sections)
    if (references, equations, depth_count) != (51, 24, 26):
        raise ValueError(f"Protected apparatus changed: references={references}, equations={equations}, depth={depth_count}")
    normalized = []
    for index, ident in enumerate(order, 1):
        item = by_id[ident]
        normalized.append({
            "id": ident, "number": index, "title": item["title"], "alt": item["alt"],
            "caption": item["caption"], "claimLevel": item["claim"],
            "src": f"figures/{ident}.svg", "width": item["width"], "height": item["height"],
            "mobileSrc": f"figures/{ident}-mobile.svg", "mobileWidth": item["mobile_width"],
            "mobileHeight": item["mobile_height"], "section": locations[ident],
        })
    now = f"{release_date}T00:00:00Z" if release else datetime.datetime.now(datetime.UTC).isoformat()
    manifest = {
        "schema_version": "publication.release.v2", "generated_at": now,
        "source": {"format": "docx", "name": source.name, "sha256": source_hash,
                   **({"edit_manifest_sha256": validation["edit_manifest_sha256"]} if release else {})},
        "project": {"id": "dot-book-one", "owner_id": "henok", "type": "book",
                    "series_title": "Digital Organism Theory", "title": "Consciousness: A Digital Organism",
                    "subtitle": "Foundations, Agency, and Research", "author": "Henok Ghebrechristos",
                    "slug": "digital-organism-theory", "visibility": "public" if release else "private"},
        "release": {"id": "dot-book-one-v5" if release else "dot-book-one-v5-proof", "version": 5,
                    "status": "published" if release else "draft",
                    "label": "Digital edition" if release else "Illustrated editorial proof",
                    "published_at": release_date if release else None, "updated_at": now[:10]},
        "extent": {"chapters": 7, "words": sum(section["word_count"] for section in sections),
                   "core_words": sum(section["core_word_count"] for section in sections),
                   "depth_passages": depth_count, "equations": equations, "references": references,
                   "figures": len(normalized)},
        "reader_contract": {"finite": True, "autoplay": False, "depth": "folded-on-request",
                            "claim_levels": CLAIM_LEVELS},
        "sections": sections, "figures": normalized,
        **({"cover": {**cover, "src": "cover/" + cover["src"]}} if cover else {}),
        "artifacts": {"pdf": pdf_name, "pdf_sha256": pdf_hash} if args.pdf else {},
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".dot-v5-stage-", dir=output.parent) as stage:
        stage = pathlib.Path(stage)
        (stage / "sections").mkdir()
        (stage / "figures").mkdir()
        if cover:
            (stage / "cover").mkdir()
            shutil.copyfile(asset_file(figures_path.parent, cover["src"]), stage / "cover" / cover["src"])
        for slug, content in contents.items():
            (stage / "sections" / f"{slug}.md").write_text(content, encoding="utf-8")
        for item in figures:
            shutil.copyfile(asset_file(figures_path.parent, item["web_svg"]), stage / "figures" / f"{item['id']}.svg")
            shutil.copyfile(asset_file(figures_path.parent, item["mobile_svg"]), stage / "figures" / f"{item['id']}-mobile.svg")
        if args.pdf:
            shutil.copyfile(args.pdf, stage / pdf_name)
        manifest["integrity"] = {"files": {
            path.relative_to(stage).as_posix(): digest(path)
            for path in sorted(stage.rglob("*")) if path.is_file()
        }}
        (stage / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        marker = RELEASE_OWNER_MARKER if release else OWNER_MARKER
        (stage / marker).write_text("Staged v5 release. Seal with promote_book_v5.py.\n" if release
                                    else "Unpublished v5 proof. Generated content; never copy into public/.\n", encoding="utf-8")
        # Only an explicitly owned temporary proof is replaceable; sealed releases cannot reach here.
        if output.exists():
            shutil.rmtree(output)
        shutil.copytree(stage, output)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=pathlib.Path, required=True)
    parser.add_argument("--figures", type=pathlib.Path, default=WORKING / "assets/figures.json")
    parser.add_argument("--depth", type=pathlib.Path, default=complete.DEFAULT_DEPTH)
    parser.add_argument("--output", type=pathlib.Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--pdf", type=pathlib.Path)
    parser.add_argument("--pandoc", default="pandoc")
    parser.add_argument("--release", action="store_true", help="Stage final public pages under /tmp; does not deploy")
    parser.add_argument("--release-date", help="Publication date in YYYY-MM-DD form; required with --release")
    args = parser.parse_args()
    manifest = build(args)
    print(json.dumps({"output": str(args.output), "extent": manifest["extent"], "status": manifest["release"]["status"]}, indent=2))


if __name__ == "__main__":
    main()
