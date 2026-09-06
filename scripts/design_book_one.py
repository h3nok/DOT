"""Build the reader-focused v4.7 book from the frozen v4.6 review manuscript.

The design pass preserves equations and citation/navigation structures, applies
an exact prose manifest, and embeds vector diagrams with PNG fallbacks. Shared
OOXML and proof helpers live in revise_book_one_review.py; no release is published.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path
from xml.dom import minidom
from xml.sax.saxutils import escape

from revise_book_one_review import (
    BASE,
    all_text,
    elements,
    ensure,
    invariant,
    paragraph,
    pformat,
    prop,
    refresh_contents,
    render,
    replace_text,
    run,
    style_id,
    text_of,
    write_package,
)

NAME = "DOT-Complete-Book-One-v4.7-Review"
ASSETS = BASE / "assets/v4.7"
INK = "242424"
GRAY = "555555"
TEAL = "285C57"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
DRAW_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
WP_NS = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
PIC_NS = "http://schemas.openxmlformats.org/drawingml/2006/picture"
SVG_NS = "http://schemas.microsoft.com/office/drawing/2016/SVG/main"


def relationship(rels, ident, target):
    node = rels.createElement("Relationship")
    for name, value in [("Id", ident), ("Type", REL_TYPE), ("Target", target)]:
        node.setAttribute(name, value)
    rels.documentElement.appendChild(node)


def illustration(doc, parts, rels, asset, ident, height, description):
    png_id, svg_id = f"rIdV47{ident}PNG", f"rIdV47{ident}SVG"
    for extension, rid in [("png", png_id), ("svg", svg_id)]:
        target = f"media/v47-{asset}.{extension}"
        parts["word/" + target] = (ASSETS / f"{asset}.{extension}").read_bytes()
        relationship(rels, rid, target)
    # Standard Office SVG extension with an interoperable bitmap fallback.
    # Text remains editable in the repository SVG; the book carries alt text.
    xml = f'''<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="{R_NS}" xmlns:wp="{WP_NS}" xmlns:a="{DRAW_NS}" xmlns:pic="{PIC_NS}" xmlns:asvg="{SVG_NS}">
    <w:pPr><w:pStyle w:val="DOTFigure"/><w:keepNext/><w:keepLines/><w:spacing w:before="260" w:after="100"/><w:ind w:firstLine="0"/><w:jc w:val="center"/></w:pPr>
    <w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="4114800" cy="{height}"/>
    <wp:docPr id="{100 + ident}" name="{asset}" descr="{escape(description, {'"': "&quot;"})}"/>
    <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
    <a:graphic><a:graphicData uri="{PIC_NS}"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="{asset}.svg"/><pic:cNvPicPr/></pic:nvPicPr>
    <pic:blipFill><a:blip r:embed="{png_id}"><a:extLst><a:ext uri="{{96DAC541-7B7A-43D3-8B79-37D633B846F1}}"><asvg:svgBlip r:embed="{svg_id}"/></a:ext></a:extLst></a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
    <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="4114800" cy="{height}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
    </pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'''
    return doc.importNode(minidom.parseString(xml).documentElement, True)


def normalize_palette(xml):
    # Keep the content and semantic styles. Neutralize every inherited green tint.
    for node in xml.getElementsByTagName("w:color"):
        value = node.getAttribute("w:val").upper()
        if value not in ("AUTO", "FFFFFF", "000000"):
            node.setAttribute(
                "w:val",
                GRAY if value in ("435B53", "43534C", "5F6F6C", "536663") else INK,
            )
    for node in xml.getElementsByTagName("w:shd"):
        if node.getAttribute("w:fill") not in ("auto", "FFFFFF"):
            node.setAttribute("w:fill", "F2F1EE")
    for node in xml.getElementsByTagName("w:pBdr"):
        node.parentNode.removeChild(node)
    return xml


def edit_record(manifest, path):
    # Reuse the existing word-level diff, then set the correct comparison labels.
    from revise_book_one_review import redline

    redline(manifest, path)
    source = (
        path.read_text()
        .replace("v4.6 editorial redline", "v4.7 design and reading revision")
        .replace("frozen v4.5 manuscript", "v4.6 review manuscript")
        .replace(
            "Layout changes and native concept plates",
            "Layout changes and new diagrams",
        )
    )
    path.write_text(source)


def build(output):
    manifest = json.loads((BASE / "editing/v4.7-edits.json").read_text())
    source = BASE / manifest["source"]
    if hashlib.sha256(source.read_bytes()).hexdigest() != manifest["source_sha256"]:
        raise ValueError("The v4.6 input changed; reconcile the design manifest first.")
    with zipfile.ZipFile(source) as z:
        parts = {n: z.read(n) for n in z.namelist()}
    doc = minidom.parseString(parts["word/document.xml"])
    original = invariant(doc)
    ps = list(doc.getElementsByTagName("w:p"))
    for edit in manifest["edits"]:
        p = ps[edit["paragraph"]]
        if all_text(p) != edit["old"]:
            raise ValueError(f"Paragraph drift: {edit['paragraph']}")
        if edit["new"]:
            replace_text(p, edit["new"])
        else:
            if any(
                p.getElementsByTagName(tag)
                for tag in ("w:bookmarkStart", "w:hyperlink", "m:oMath", "w:instrText")
            ):
                raise ValueError("Deletion would remove structured content")
            p.parentNode.removeChild(p)
    rels = minidom.parseString(parts["word/_rels/document.xml.rels"])
    tables = list(doc.getElementsByTagName("w:tbl"))
    targets = {}
    for table in tables:
        first = table.getElementsByTagName("w:p")[0]
        if text_of(first) in ("A reading key", "The Experience Loop"):
            targets[text_of(first)] = table
    if set(targets) != {"A reading key", "The Experience Loop"}:
        raise ValueError("Missing diagram placement")
    drawing = illustration(
        doc,
        parts,
        rels,
        "architecture",
        1,
        4457700,
        "DOT’s proposed architecture. Big C and Little c share a fundamental kind of self-awareness at different scopes. The Canvas carries state; the Painting is its organization and Character its expression. Body and world participate within a Reality Frame. Carried state shapes access and experience updates it.",
    )
    old = targets["A reading key"]
    old.parentNode.removeChild(old)
    # A dedicated map after the contents gives readers an early reference
    # without leaving a half-empty page in the opening argument.
    front_break = ps[26]
    if not front_break.getElementsByTagName("w:sectPr"):
        raise ValueError("Front-matter section boundary changed")
    prop(ensure(drawing, "w:pPr"), "w:pageBreakBefore", val=1)
    front_break.parentNode.insertBefore(drawing, front_break)
    bookmark_id = str(
        1
        + max(
            int(n.getAttribute("w:id"))
            for n in doc.getElementsByTagName("w:bookmarkStart")
        )
    )
    start = doc.createElement("w:bookmarkStart")
    start.setAttribute("w:id", bookmark_id)
    start.setAttribute("w:name", "architecture_map")
    drawing.insertBefore(start, elements(drawing, "w:r")[0])
    end = doc.createElement("w:bookmarkEnd")
    end.setAttribute("w:id", bookmark_id)
    drawing.appendChild(end)
    original["bookmarks"]["architecture_map"] += 1
    map_link = paragraph(doc, "")
    link = doc.createElement("w:hyperlink")
    link.setAttribute("w:anchor", "architecture_map")
    run(link, "Architecture map →")
    map_link.appendChild(link)
    pformat(map_link, size=20, before=220, after=0, indent=0, color=GRAY)
    front_break.parentNode.insertBefore(map_link, drawing)
    caption = paragraph(
        doc,
        "A reading map. In DOT’s proposed architecture, Big C and Little c share the same fundamental kind of self-awareness at different scopes. The Canvas carries a distinctive history; its state shapes what becomes available to awareness and action. Return to this map as the chapters develop each role.",
        "DOTFigureCaption",
    )
    drawing.parentNode.insertBefore(caption, drawing.nextSibling)
    drawing = illustration(
        doc,
        parts,
        rels,
        "experience-loop",
        2,
        4371975,
        "A clockwise loop: Reality Stream, interpretation through the Painting, pre-Intent drafts, Intent, embodied action, consequence, and Canvas state update. Retained change participates in the next interpretation.",
    )
    old = targets["The Experience Loop"]
    old.parentNode.replaceChild(drawing, old)
    # Calmer paragraph rhythm. Definitions stay visible through spacing, not labels.
    for p in doc.getElementsByTagName("w:p"):
        sid = style_id(p)
        if sid in ("DOTSideNote", "DOTBookCallout"):
            prop(ensure(p, "w:pPr"), "w:pStyle", val="DOTBody")
            pformat(
                p,
                size=22,
                before=110,
                after=110,
                indent=0,
                line=290,
                bold=False,
                color=INK,
            )
            prop(ensure(p, "w:pPr"), "w:keepNext", val=0)
            prop(ensure(p, "w:pPr"), "w:keepLines", val=1)
        elif sid == "DOTFigureCaption":
            pformat(
                p,
                size=20,
                before=100,
                after=220,
                indent=0,
                line=270,
                bold=False,
                color=GRAY,
            )
        elif sid in ("Heading2", "Heading3", "Heading4"):
            for r in p.getElementsByTagName("w:r"):
                prop(ensure(r, "w:rPr"), "w:color", val=INK)
        if sid in ("Heading1", "Heading2", "Heading3", "Heading4", "DOTChapterDeck"):
            # First body paragraph after a heading begins at the text edge.
            sibling = p.nextSibling
            while sibling and sibling.nodeType != sibling.ELEMENT_NODE:
                sibling = sibling.nextSibling
            if sibling and sibling.nodeName == "w:p" and style_id(sibling) == "DOTBody":
                prop(ensure(sibling, "w:pPr"), "w:ind", left=0, right=0, firstLine=0)
    # Every ordinary paragraph uses the neutral palette, including title/header text.
    for name in list(parts):
        if name in ("word/styles.xml",) or re.match(
            r"word/(header|footer)\d+\.xml$", name
        ):
            xml = normalize_palette(minidom.parseString(parts[name]))
            parts[name] = xml.toxml(encoding="UTF-8")
    normalize_palette(doc)
    # One small accent per chapter; headings and body text remain neutral.
    for p in doc.getElementsByTagName("w:p"):
        if style_id(p) == "Heading1":
            label = p.getElementsByTagName("w:r")[0]
            prop(ensure(label, "w:rPr"), "w:color", val=TEAL)
        for node in p.getElementsByTagName("w:t"):
            if node.firstChild:
                node.firstChild.data = node.firstChild.data.replace(
                    "Author Review Edition v4.6", "Author Review Edition v4.7"
                )
    parts["word/media/image1.png"] = (ASSETS / "cover.png").read_bytes()
    # The cover's typography is selectable on the following native title page.
    for p in doc.getElementsByTagName("w:p"):
        if style_id(p) == "DOTBookEdition":
            value = text_of(p)
            if "v4.6" in value:
                replace_text(p, value.replace("v4.6", "v4.7"))
    protected = invariant(doc)
    for key in original:
        if protected[key] != original[key]:
            raise ValueError("Protected structure changed: " + key)
    parts["word/document.xml"] = doc.toxml(encoding="UTF-8")
    parts["word/_rels/document.xml.rels"] = rels.toxml(encoding="UTF-8")
    types = minidom.parseString(parts["[Content_Types].xml"])
    if not any(
        n.getAttribute("Extension") == "svg"
        for n in types.getElementsByTagName("Default")
    ):
        node = types.createElement("Default")
        node.setAttribute("Extension", "svg")
        node.setAttribute("ContentType", "image/svg+xml")
        types.documentElement.appendChild(node)
    parts["[Content_Types].xml"] = types.toxml(encoding="UTF-8")
    core = minidom.parseString(parts["docProps/core.xml"])
    for tag, value in [
        (
            "dc:description",
            "Author Review Edition v4.7: neutral typography, reader-focused diagrams, and continuous prose.",
        ),
        ("dcterms:modified", "2026-09-06T00:00:00Z"),
    ]:
        node = core.getElementsByTagName(tag)[0]
        while node.firstChild:
            node.removeChild(node.firstChild)
        node.appendChild(core.createTextNode(value))
    parts["docProps/core.xml"] = core.toxml(encoding="UTF-8")
    app = minidom.parseString(parts["docProps/app.xml"])
    for tag, value in [
        ("Words", len(re.findall(r"\b[\w’'-]+\b", text_of(doc)))),
        ("Paragraphs", len(doc.getElementsByTagName("w:p"))),
    ]:
        node = app.getElementsByTagName(tag)[0]
        while node.firstChild:
            node.removeChild(node.firstChild)
        node.appendChild(app.createTextNode(str(value)))
    parts["docProps/app.xml"] = app.toxml(encoding="UTF-8")
    output.mkdir(parents=True, exist_ok=True)
    path = output / (NAME + ".docx")
    write_package(parts, path)
    edit_record(manifest, output / (NAME + "-Redline.html"))
    return path, {
        "source_sha256": manifest["source_sha256"],
        "editorial_operations": len(manifest["edits"]),
        "native_equations_preserved": len(original["math"]),
        "equation_fields_preserved": len(original["instructions"]),
        "svg_diagrams": 2,
    }


def render_assets():
    with tempfile.TemporaryDirectory(prefix="dot-v47-assets-") as temp:
        profile = (Path(temp) / "profile").as_uri()
        for asset in ["architecture", "experience-loop", "cover"]:
            subprocess.run(
                [
                    "libreoffice",
                    f"-env:UserInstallation={profile}",
                    "--headless",
                    "--convert-to",
                    "png",
                    "--outdir",
                    temp,
                    str(ASSETS / (asset + ".svg")),
                ],
                check=True,
                timeout=60,
                capture_output=True,
            )
            png = Path(temp) / (asset + ".png")
            if not png.exists():
                raise RuntimeError("Missing rendered asset: " + asset)
            (ASSETS / (asset + ".png")).write_bytes(png.read_bytes())


def validate_pdf(path, report):
    pdf = path.with_suffix(".pdf")
    text = subprocess.check_output(["pdftotext", "-layout", str(pdf), "-"], text=True)
    pages = text.split("\f")[:-1]
    if re.findall(r"Figure ([1-6]) ·", text) != list("123456"):
        raise ValueError("Figure reading order changed")
    if re.search(r"Error!|Reference source not found|Bookmark not defined", text):
        raise ValueError("Broken field in PDF")
    data = pdf.read_bytes()
    objects = {
        m[1]: m[2] for m in re.finditer(rb"(\d+) 0 obj\s*(.*?)endobj", data, re.DOTALL)
    }
    destinations = re.findall(rb"/Dest\s*\[\s*(\d+) 0 R", data)
    for dest in destinations:
        if not re.search(rb"/Type\s*/Page\b", objects[dest]):
            raise ValueError("Invalid PDF link destination")
    if b"/Outlines" not in data:
        raise ValueError("Missing PDF outline")
    with zipfile.ZipFile(path) as archive:
        document = minidom.parseString(archive.read("word/document.xml"))
    anchors = {
        n.getAttribute("w:name")
        for n in document.getElementsByTagName("w:bookmarkStart")
    }
    for link in document.getElementsByTagName("w:hyperlink"):
        target = link.getAttribute("w:anchor")
        if target and target not in anchors:
            raise ValueError("Broken Word link: " + target)
    references = {a for a in anchors if re.fullmatch(r"reference_\d+", a)}
    if len(references) != 51:
        raise ValueError("Reference count changed")
    metadata = subprocess.check_output(["pdfinfo", str(pdf)], text=True)
    if not re.search(r"Tagged:\s+yes", metadata):
        raise ValueError("PDF structure tags missing")
    bounds = subprocess.run(
        ["pdftotext", "-bbox", str(pdf), "-"],
        check=True,
        text=True,
        capture_output=True,
    )
    page_xml = minidom.parseString(bounds.stdout)
    for page in page_xml.getElementsByTagName("page"):
        width, height = (
            float(page.getAttribute("width")),
            float(page.getAttribute("height")),
        )
        for word in page.getElementsByTagName("word"):
            x0, y0, x1, y1 = (
                float(word.getAttribute(k)) for k in ("xMin", "yMin", "xMax", "yMax")
            )
            if not (0 <= x0 < x1 <= width and 0 <= y0 < y1 <= height):
                raise ValueError("Text extends beyond the page")
    normalized = re.sub(r"\s+", " ", text)
    for label in ("One architecture, distinct roles", "Carry forward change"):
        if label not in normalized:
            raise ValueError("Diagram text is missing from the PDF: " + label)
    report.update(
        {
            "pages": len(pages),
            "pdf_destinations_checked": len(destinations),
            "figure_sequence": [1, 2, 3, 4, 5, 6],
            "references_preserved": len(references),
            "tagged_pdf": True,
            "diagram_text_selectable": True,
            "page_bounds_checked": True,
            "pdf_sha256": hashlib.sha256(data).hexdigest(),
        }
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=BASE / "v4.7-review")
    parser.add_argument("--render", action="store_true")
    parser.add_argument("--render-assets", action="store_true")
    args = parser.parse_args()
    if args.render_assets:
        render_assets()
    path, report = build(args.output.resolve())
    if args.render:
        render(path)
        first = refresh_contents(path)
        render(path)
        second = refresh_contents(path)
        if first != second:
            raise ValueError("Contents pagination did not stabilize")
        report["contents_pages"] = second
        validate_pdf(path, report)
    report["docx_sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    (path.parent / (NAME + "-Validation.json")).write_text(
        json.dumps(report, indent=2) + "\n"
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
