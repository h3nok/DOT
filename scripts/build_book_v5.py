#!/usr/bin/env python3
"""Build illustrated version 5 review and publication files from frozen v4.9.

Building prepares local artifacts; it never publishes or edits an older release,
the public reader, or the backend's published PDF (ADR-0018/0036/0057).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path
from xml.dom import minidom
from xml.sax.saxutils import escape

import build_book_v48 as design
from import_dot_book_v5 import EXPECTED_FIGURES
from edit_book_v49 import check_depth, load_package, revise_segment
from revise_book_one_review import (
    ROOT, all_text, elements, ensure, paragraph, prop, redline, style_id, write_package,
)

BASE = ROOT / "docs/blueprint/book-one-complete/v5-working"
EDITS = BASE / "editing/v5-edits.json"
ASSETS = BASE / "assets"
NAME = "DOT-Book-One-Version-5-Review"
RELEASE_NAME = "DOT-Book-One-Complete-Edition-v5"
PROTECTED = ("w:hyperlink", "m:oMath", "w:fldSimple")
SHORT_INTRODUCTIONS = (
    "To prevent that overreach, Book One uses four levels of claim.",
    "Little c need not understand the Frame to participate through its bodily interface.",
    "Fear is not merely an emotion in DOT. It can become a gate.",
    "DOT may fail in more than one way.",
)


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def inside(node, names):
    parent = node.parentNode
    while parent is not None:
        if parent.nodeName in names:
            return True
        parent = parent.parentNode
    return False


def revise_prose(p, edit):
    """Preserve native math, citation links, fields, and all surviving run styles."""
    if p.getElementsByTagName("w:drawing") or p.getElementsByTagName("w:sectPr"):
        raise ValueError("Prose edit targets drawing or section structure")
    tokens = [n for n in p.getElementsByTagName("*")
              if n.nodeName in PROTECTED and not inside(n, PROTECTED)]
    labels = [all_text(n) for n in tokens]
    groups = [[] for _ in range(len(tokens) + 1)]
    group = 0
    for node in p.getElementsByTagName("*"):
        if node in tokens:
            group += 1
        elif node.nodeName == "w:t" and not inside(node, PROTECTED):
            groups[group].append(node)
    segments = edit.get("segments")
    if segments is None:
        segments, rest = [], edit["new"]
        for label in labels:
            if not label:
                raise ValueError("Empty protected token needs explicit segments")
            pattern = re.escape(label)
            if label.isalnum():
                pattern = r"(?<!\w)" + pattern + r"(?!\w)"
            match = re.search(pattern, rest)
            if not match:
                raise ValueError(f"Edit removes/reorders a protected token: {label!r}")
            segments.append(rest[:match.start()])
            rest = rest[match.end():]
        segments.append(rest)
    if len(segments) != len(groups):
        raise ValueError("Structured edit segment count does not match native objects")
    frozen = [token.toxml() for token in tokens]
    for nodes, value in zip(groups, segments):
        if not nodes and not value:
            continue
        revise_segment(nodes, value)
    if frozen != [token.toxml() for token in tokens] or all_text(p) != edit["new"]:
        raise ValueError("Edit changed a protected object or did not produce exact text")


def source_signature(doc):
    return {
        "references": [all_text(p) for p in doc.getElementsByTagName("w:p")
                       if style_id(p).startswith("DOTReference")],
        "fields": [n.toxml() for n in doc.getElementsByTagName("w:instrText")],
        "field_instructions": [n.getAttribute("w:instr") for n in doc.getElementsByTagName("w:fldSimple")],
        "equations": len(doc.getElementsByTagName("m:oMath")),
        "depth": sorted(n.getAttribute("w:name") for n in doc.getElementsByTagName("w:bookmarkStart")
                        if n.getAttribute("w:name").startswith("depth_")),
    }


def apply_manifest(doc, manifest):
    paragraphs = list(doc.getElementsByTagName("w:p"))
    edits = manifest["edits"]
    if len({e["paragraph"] for e in edits}) != len(edits):
        raise ValueError("Duplicate prose edit target")
    for edit in edits:
        if all_text(paragraphs[edit["paragraph"]]) != edit["old"]:
            raise ValueError(f"Source paragraph {edit['paragraph']} has drifted")
    nodes = []
    for edit in manifest.get("node_edits", []):
        if edit["paragraph"] in {e["paragraph"] for e in edits}:
            raise ValueError("Prose and native-node edits overlap")
        candidates = [n for n in paragraphs[edit["paragraph"]].getElementsByTagName(edit["tag"])
                      if (n.firstChild.data if n.firstChild else "") == edit["old"]]
        occurrence = edit.get("occurrence")
        if occurrence is None and len(candidates) != 1:
            raise ValueError("Native-node edit is ambiguous")
        target = candidates[occurrence or 0]
        if any(target is previous for previous, _ in nodes):
            raise ValueError("Native-node edit targets a node twice")
        nodes.append((target, edit))
    for node, edit in nodes:
        while node.firstChild:
            node.removeChild(node.firstChild)
        node.appendChild(doc.createTextNode(edit["new"]))
    for edit in edits:
        p = paragraphs[edit["paragraph"]]
        if not edit["new"]:
            raise ValueError("Version 5 prose deletion must be explicitly implemented")
        revise_prose(p, edit)
        anchor = p
        for value in edit.get("insert_after", []):
            added = paragraph(doc, value)
            anchor.parentNode.insertBefore(added, anchor.nextSibling)
            anchor = added
    return paragraphs


def bookmark(doc, p, name, ident):
    start = doc.createElement("w:bookmarkStart")
    start.setAttribute("w:id", str(ident))
    start.setAttribute("w:name", name)
    end = doc.createElement("w:bookmarkEnd")
    end.setAttribute("w:id", str(ident))
    first_run = next((n for n in p.childNodes if n.nodeName == "w:r"), None)
    p.insertBefore(start, first_run)
    p.appendChild(end)


def insert_figures(doc, parts, originals, figures):
    by_text = {}
    for p in originals:
        # The manifest may have updated a placement paragraph; use its source index
        # via a source-text map prepared by the caller.
        by_text.setdefault(getattr(p, "source_text", all_text(p)), []).append(p)
    template = next(p for p in originals if style_id(p) == "DOTFigure" and
                    any(n.getAttribute("name") == "experience-loop" for n in p.getElementsByTagName("wp:docPr"))).cloneNode(True)
    old_map = next(p for p in originals if any(n.getAttribute("w:name") == "architecture_map"
                                              for n in p.getElementsByTagName("w:bookmarkStart")))
    map_marks = [n.cloneNode(True) for n in old_map.childNodes if n.nodeName in ("w:bookmarkStart", "w:bookmarkEnd")]
    old_images = [p for p in originals if style_id(p) == "DOTFigure"]
    old_captions = []
    for p in old_images:
        following = p.nextSibling
        while following is not None and following.nodeType != following.ELEMENT_NODE:
            following = following.nextSibling
        if following is not None and style_id(following) == "DOTFigureCaption":
            # Retain as a temporary placement anchor for its replacement figure.
            old_captions.append(following)
        p.parentNode.removeChild(p)
    for p in originals:
        if getattr(p, "source_text", "") == "Architecture map →" and p.parentNode is not None:
            p.parentNode.removeChild(p)
    rels = minidom.parseString(parts["word/_rels/document.xml.rels"])
    existing_ids = {n.getAttribute("Id") for n in rels.getElementsByTagName("Relationship")}
    ident = max(int(n.getAttribute("w:id")) for n in doc.getElementsByTagName("w:bookmarkStart")) + 1
    inserted = []
    for index, figure in enumerate(figures):
        matches = by_text.get(figure["after_text"], [])
        if len(matches) != 1 or matches[0].parentNode is None:
            raise ValueError(f"Figure placement is missing/ambiguous: {figure['id']}")
        anchor = matches[0]
        p = template.cloneNode(True)
        for n in list(p.getElementsByTagName("w:bookmarkStart")) + list(p.getElementsByTagName("w:bookmarkEnd")):
            n.parentNode.removeChild(n)
        pp = ensure(p, "w:pPr")
        for old in elements(pp, "w:pageBreakBefore"):
            pp.removeChild(old)
        prop(pp, "w:keepNext")
        prop(pp, "w:keepLines")
        prop(pp, "w:jc", val="center")
        prop(pp, "w:spacing", before=200, after=90)
        from PIL import Image
        print_png = ASSETS / figure["print_png"]
        with Image.open(print_png) as image:
            ratio = image.height / image.width
        inches_w = min(4.5, 4.7 / ratio)
        cx, cy = round(inches_w * 914400), round(inches_w * ratio * 914400)
        for n in list(p.getElementsByTagName("wp:extent")) + list(p.getElementsByTagName("a:ext")):
            if n.hasAttribute("cx"):
                n.setAttribute("cx", str(cx))
                n.setAttribute("cy", str(cy))
        for n in p.getElementsByTagName("wp:docPr"):
            n.setAttribute("id", str(200 + index))
            n.setAttribute("name", figure["id"])
            n.setAttribute("descr", figure["alt"])
        for n in p.getElementsByTagName("pic:cNvPr"):
            n.setAttribute("name", figure["id"] + ".svg")
        for ext, source in (("PNG", print_png), ("SVG", ASSETS / figure["print_svg"])):
            rid = f"rIdV5{index + 1}{ext}"
            if rid in existing_ids:
                raise ValueError("Duplicate figure relationship")
            target = f"media/v5-{figure['id']}.{ext.lower()}"
            parts["word/" + target] = source.read_bytes()
            relation = rels.createElement("Relationship")
            relation.setAttribute("Id", rid)
            relation.setAttribute("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image")
            relation.setAttribute("Target", target)
            rels.documentElement.appendChild(relation)
            tag = "a:blip" if ext == "PNG" else "asvg:svgBlip"
            for n in p.getElementsByTagName(tag):
                n.setAttribute("r:embed", rid)
        marker = "figure_" + figure["id"].replace("-", "_")
        bookmark(doc, p, marker, ident)
        ident += 1
        if figure["id"] == "architecture":
            for mark in map_marks:
                p.appendChild(mark)
        caption = paragraph(doc, "", "DOTFigureCaption")
        bookmark(doc, caption, marker + "_caption", ident)
        ident += 1
        prop(ensure(caption, "w:pPr"), "w:keepLines")
        prop(ensure(caption, "w:pPr"), "w:spacing", before=0, after=180)
        anchor.parentNode.insertBefore(p, anchor.nextSibling)
        p.parentNode.insertBefore(caption, p.nextSibling)
        inserted.append((p, caption, figure))
    for caption in old_captions:
        caption.parentNode.removeChild(caption)
    order = {id(p): i for i, p in enumerate(doc.getElementsByTagName("w:p"))}
    ordered = sorted(inserted, key=lambda entry: order[id(entry[0])])
    for number, (_, caption, figure) in enumerate(ordered, 1):
        value = f"Figure {number} · {figure['title']}. {figure['claim']}. {figure['caption']}"
        # The blank paragraph has a single ordinary text run, with bookmarks retained.
        revise_segment(list(caption.getElementsByTagName("w:t")), value)
    parts["word/_rels/document.xml.rels"] = rels.toxml(encoding="UTF-8")
    return [{"number": i, "id": f["id"], "title": f["title"], "claim": f["claim"]}
            for i, (_, _, f) in enumerate(ordered, 1)]


def configure_cover(parts, doc, *, release=False):
    from book_v5_cover import render_cover
    cover = ASSETS / ("cover-v5-release.png" if release else "cover-v5.png")
    artwork = render_cover(cover, review=not release)
    for node in doc.getElementsByTagName("w:p")[0].getElementsByTagName("wp:docPr"):
        node.setAttribute("descr", artwork["alt"])
    blip = doc.getElementsByTagName("w:p")[0].getElementsByTagName("a:blip")[0]
    rels = minidom.parseString(parts["word/_rels/document.xml.rels"])
    target = next(n.getAttribute("Target") for n in rels.getElementsByTagName("Relationship")
                  if n.getAttribute("Id") == blip.getAttribute("r:embed"))
    parts["word/" + target] = cover.read_bytes()
    return artwork


def publication_labels(originals, manifest):
    """Change only edition labels; the reviewed book body is identical."""
    labels = {
        7: "Complete Edition · Version 5 · November 2026dotheory.org",
        11: "Complete Edition · Version 5 · November 2026. A corrected and illustrated edition.",
        13: "Set in Source Serif 4 and Space Grotesk, both under the SIL Open Font License. The digital edition at dotheory.org presents the same book, with technical passages available on request.",
    }
    changes = []
    for index, text in labels.items():
        p = originals[index]
        change = {"paragraph": index, "old": all_text(p), "new": text,
                  "reason": "Identify the final illustrated edition consistently in the title page and colophon."}
        if index == 7:
            change["segments"] = ["Complete Edition · Version 5 · November 2026", ""]
        revise_prose(p, change)
        changes.append(change)
    return changes


def refine_pagination(doc, originals):
    paragraphs = list(doc.getElementsByTagName("w:p"))
    for text in SHORT_INTRODUCTIONS:
        matches = [p for p in paragraphs if all_text(p) == text]
        if len(matches) != 1:
            raise ValueError("A pagination anchor has changed: " + text)
        prop(ensure(matches[0], "w:pPr"), "w:keepNext")
    # Each closing section fits comfortably on one page. Keep its argument
    # together instead of leaving four or seven final lines on a separate page.
    for start, end, title in ((1760, 1764, "The Research Contract"),
                              (1804, 1811, "The Next Stroke")):
        if all_text(originals[start]) != title or style_id(originals[start]) != "Heading2":
            raise ValueError("A closing-section pagination anchor has changed: " + title)
        for index in range(start, end + 1):
            pp = ensure(originals[index], "w:pPr")
            prop(pp, "w:keepLines")
            if index < end:
                prop(pp, "w:keepNext")


def render(path):
    with tempfile.TemporaryDirectory(prefix="dot-v5-office-") as directory:
        temporary = Path(directory)
        runtime = temporary / "runtime"
        runtime.mkdir(mode=0o700)
        fontconfig = temporary / "fonts.conf"
        fontconfig.write_text(
            '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">'
            '<fontconfig><include ignore_missing="no">/etc/fonts/fonts.conf</include>'
            f'<dir>{escape(str(ROOT / "design/fonts"))}</dir>'
            f'<cachedir>{escape(str(temporary / "font-cache"))}</cachedir></fontconfig>'
        )
        options = {"IsSkipEmptyPages": {"type": "boolean", "value": "false"},
                   "UseTaggedPDF": {"type": "boolean", "value": "true"},
                   "ExportBookmarks": {"type": "boolean", "value": "true"}}
        # LibreOffice mistakes OMML's spacing circumflex for an acute accent.
        # Its combining equivalent renders the intended B-hat in equation 5.7.
        # This normalization belongs only to the disposable rendering copy.
        parts, rendering_doc = load_package(path)
        accents = [n for accent in rendering_doc.getElementsByTagName("m:acc")
                   for n in accent.getElementsByTagName("m:chr")
                   if n.getAttribute("m:val") == "\u02c6"]
        if len(accents) != 1:
            raise ValueError("Expected the single reviewed B-hat rendering correction")
        accents[0].setAttribute("m:val", "\u0302")
        parts["word/document.xml"] = rendering_doc.toxml(encoding="UTF-8")
        rendering_source = temporary / "input" / path.name
        rendering_source.parent.mkdir()
        write_package(parts, rendering_source)
        result = subprocess.run([
            "libreoffice", f"-env:UserInstallation={(temporary / 'profile').as_uri()}",
            "--headless", "--convert-to", "pdf:writer_pdf_Export:" + json.dumps(options, separators=(",", ":")),
            "--outdir", str(temporary), str(rendering_source),
        ], check=True, capture_output=True, text=True, timeout=240,
            env={**os.environ, "FONTCONFIG_FILE": str(fontconfig), "XDG_RUNTIME_DIR": str(runtime)})
        generated = temporary / path.with_suffix(".pdf").name
        if not generated.exists():
            raise RuntimeError("PDF export failed: " + result.stdout + result.stderr)
        path.with_suffix(".pdf").write_bytes(generated.read_bytes())


def finish_pdf(path, figures):
    from pypdf import PdfReader, PdfWriter
    from pypdf.generic import ArrayObject, NameObject, NullObject
    from book_v5_pdf_accessibility import remove_offpage_inside_cover_duplicate
    pdf = path.with_suffix(".pdf")
    pages = subprocess.check_output(["pdftotext", "-layout", str(pdf), "-"], text=True).split("\f")[:-1]
    first = next(i for i, text in enumerate(pages)
                 if re.match(r"\s*CHAPTER 1\s+The Digital Organism", text))
    writer = PdfWriter(clone_from=str(pdf))
    # LibreOffice can leave a null sibling before its tagged Document node.
    # Preserve the actual structure tree while removing that invalid placeholder.
    structure = writer._root_object["/StructTreeRoot"].get_object()
    children = structure.get("/K")
    if isinstance(children, ArrayObject):
        valid = [child for child in children if not isinstance(child.get_object(), NullObject)]
        if not valid:
            raise ValueError("PDF has no usable document structure")
        structure[NameObject("/K")] = valid[0] if len(valid) == 1 else ArrayObject(valid)
    remove_offpage_inside_cover_duplicate(writer)
    for page in writer.pages:
        page.mediabox.upper_right = (432, 648)
        page.cropbox.upper_right = (432, 648)
    writer.set_page_label(0, 0, prefix="Cover")
    writer.set_page_label(1, 1, prefix="Inside cover")
    writer.set_page_label(2, first - 1, style="/r", start=1)
    writer.set_page_label(first, len(writer.pages) - 1, style="/D", start=1)
    illustrations = None
    for figure in figures:
        matches = [i for i, text in enumerate(pages)
                   if re.search(rf"Figure {figure['number']} ·", text)]
        if len(matches) != 1:
            raise ValueError(f"Cannot locate figure {figure['number']} in the PDF")
        index = matches[0]
        if illustrations is None:
            illustrations = writer.add_outline_item("Illustrations", index)
        writer.add_outline_item(f"Figure {figure['number']} · {figure['title']}", index, parent=illustrations)
        figure.update(pdf_page=index + 1, printed_page=index - first + 1)
    temporary = pdf.with_suffix(".finishing.pdf")
    with temporary.open("wb") as stream:
        writer.write(stream)
    temporary.replace(pdf)
    check = PdfReader(pdf)
    if check.page_labels[first] != "1" or not check.trailer["/Root"].get("/StructTreeRoot"):
        raise ValueError("PDF finishing lost labels or structure tags")
    return first


def validate(path, report, *, include_pdf=False):
    _, doc = load_package(path)
    names = [n.getAttribute("w:name") for n in doc.getElementsByTagName("w:bookmarkStart")]
    for link in doc.getElementsByTagName("w:hyperlink"):
        anchor = link.getAttribute("w:anchor")
        if anchor and anchor not in names:
            raise ValueError("Broken native Word anchor: " + anchor)
    if check_depth(doc) != 26 or len([n for n in names if re.fullmatch(r"reference_\d+", n)]) != 51:
        raise ValueError("Source apparatus was not preserved")
    text = all_text(doc)
    for forbidden in ("Big C[T,E]", "two capacities within", "not born from an external Time", "Author Review v4.9"):
        if forbidden in text:
            raise ValueError("Superseded wording remains: " + forbidden)
    if report["status"] == "release-candidate":
        for label in ("Author Review", "author-review proof", "not yet the final publication edition", "separate, unpublished edition"):
            if label in text:
                raise ValueError("Review label remains in publication manuscript: " + label)
    pdf = path.with_suffix(".pdf")
    if include_pdf:
        from pypdf import PdfReader
        from book_v5_pdf_accessibility import figure_alt_texts
        if not pdf.exists():
            raise ValueError("The requested PDF proof was not rendered")
        text = subprocess.check_output(["pdftotext", "-layout", str(pdf), "-"], text=True)
        if re.findall(r"Figure (\d+) ·", text) != [str(n) for n in range(1, len(report["figures"]) + 1)]:
            raise ValueError("PDF figure numbering/order mismatch")
        if re.search(r"Error!|Reference source not found|Bookmark not defined", text):
            raise ValueError("PDF contains broken fields")
        equation = text[:text.index("(5.7)")][-160:]
        if not any(hat in equation for hat in ("^", "\u0302", "\u02c6")) or "\u0301" in equation:
            raise ValueError("Equation 5.7 lost its B-hat accent during rendering")
        pdf_reader = PdfReader(pdf)
        structure = pdf_reader.trailer["/Root"]["/StructTreeRoot"]
        expected_alt = [n.getAttribute("descr") for n in doc.getElementsByTagName("wp:docPr")]
        if figure_alt_texts(structure) != expected_alt:
            raise ValueError("PDF figure descriptions/order do not match the manuscript")
        bounds = subprocess.check_output(["pdftotext", "-bbox", str(pdf), "-"], text=True)
        for page in minidom.parseString(bounds).getElementsByTagName("page"):
            width, height = float(page.getAttribute("width")), float(page.getAttribute("height"))
            for word in page.getElementsByTagName("word"):
                x0, y0, x1, y1 = (float(word.getAttribute(k)) for k in ("xMin", "yMin", "xMax", "yMax"))
                if not (0 <= x0 < x1 <= width and 0 <= y0 < y1 <= height):
                    raise ValueError("Text extends beyond a PDF page")
        info = subprocess.check_output(["pdfinfo", str(pdf)], text=True)
        if not re.search(r"Tagged:\s+yes", info) or b"/Outlines" not in pdf.read_bytes():
            raise ValueError("PDF tags or outline missing")
        report.update(pages=len(text.split("\f")) - 1, tagged_pdf=True,
                      pdf_page_labels=True, trim_inches=[6, 9], pdf_sha256=digest(pdf),
                      tagged_figures=len(expected_alt), equation_5_7_hat_verified=True,
                      render_adjustments=["Normalize B-hat accent in the temporary LibreOffice input only",
                                          "Remove null structure child and verified invisible cover duplicate"])
    report.update(docx_sha256=digest(path), references_preserved=51,
                  depth_passages=26, native_equations=len(doc.getElementsByTagName("m:oMath")))


def build(output, *, release=False):
    output = output.resolve()
    if not (output.is_relative_to(BASE) or output.is_relative_to(Path("/tmp"))):
        raise ValueError("Proof output must be inside v5-working/ or /tmp")
    manifest = json.loads(EDITS.read_text())
    source = ROOT / manifest["source"]
    if digest(source) != manifest["source_sha256"]:
        raise ValueError("Frozen v4.9 source has changed")
    figures = json.loads((ASSETS / "figures.json").read_text())
    if len(figures) != len(EXPECTED_FIGURES) or {f["id"] for f in figures} != EXPECTED_FIGURES:
        raise ValueError("The proof must include every reviewed teaching figure exactly once")
    parts, doc = load_package(source)
    signature = source_signature(doc)
    original_paragraphs = list(doc.getElementsByTagName("w:p"))
    sections, section = {}, "Front matter"
    for index, p in enumerate(original_paragraphs):
        if style_id(p) == "Heading1":
            section = all_text(p)
        sections[index] = section
    for p in original_paragraphs:
        p.source_text = all_text(p)
    apply_manifest(doc, manifest)
    label_changes = publication_labels(original_paragraphs, manifest) if release else []
    edited_math = [n.toxml() for n in doc.getElementsByTagName("m:oMath")]
    figure_inventory = insert_figures(doc, parts, original_paragraphs, figures)
    if source_signature(doc) != signature:
        raise ValueError("References, native math count, fields, or depth bookmarks changed")
    if edited_math != [n.toxml() for n in doc.getElementsByTagName("m:oMath")]:
        raise ValueError("Illustration layout changed a native equation")
    cover = configure_cover(parts, doc, release=release)
    refine_pagination(doc, original_paragraphs)
    parts["word/document.xml"] = doc.toxml(encoding="UTF-8")
    core = minidom.parseString(parts["docProps/core.xml"])
    description = (f"Complete Edition · Version 5. {len(figures)} teaching illustrations."
                   if release else f"Version 5 illustrated author-review proof. {len(figures)} teaching illustrations. Not published.")
    for name, value in (("dc:description", description),
                        ("dcterms:modified", "2026-11-01T12:00:00Z")):
        node = core.getElementsByTagName(name)[0]
        while node.firstChild:
            node.removeChild(node.firstChild)
        node.appendChild(core.createTextNode(value))
    parts["docProps/core.xml"] = core.toxml(encoding="UTF-8")
    output.mkdir(parents=True, exist_ok=True)
    edition_name = RELEASE_NAME if release else NAME
    path = output / (edition_name + ".docx")
    write_package(parts, path)
    review = output / (edition_name + "-Redline.html")
    final_labels = {e["paragraph"]: e for e in label_changes}
    redline({**manifest, "edits": [
        {**e, "section": sections[e["paragraph"]],
         "new": " ¶ ".join([final_labels.get(e["paragraph"], e)["new"], *e.get("insert_after", [])])}
        for e in manifest["edits"]]}, review)
    review.write_text(review.read_text().replace("v4.6 editorial redline", "Version 5 editorial redline")
                     .replace("frozen v4.5 manuscript", "frozen v4.9 manuscript")
                     .replace("Layout changes and native concept plates are visible in the review PDF.",
                              f"{len(figures)} teaching illustrations, corrected edition artwork, and final pagination are visible in the review PDF."))
    native_review = "<h2>Native notation correction</h2>"
    for index in sorted({e["paragraph"] for e in manifest.get("node_edits", [])}):
        p = original_paragraphs[index]
        native_review += (f"<article><h2>{escape(sections[index])}</h2>"
                          f"<p><del>{escape(p.source_text)}</del></p>"
                          f"<p><ins>{escape(all_text(p))}</ins></p></article>")
    native_review += ("<details><summary>Exact native-node substitutions</summary><pre>"
                      + escape(json.dumps(manifest.get("node_edits", []), ensure_ascii=False, indent=2))
                      + "</pre></details><h2>Illustration and layout changes</h2>"
                      + f"<p>{len(figures)} numbered teaching illustrations replace the two earlier plates. "
                      + "The architecture now appears beside its explanation in Chapter 3. "
                      + "Chapter 4 includes dedicated figures for RF₀’s Reality Stream and Little c’s scope. "
                      + "Four short section introductions stay with their following paragraph, "
                      + "and the short closing sections of Chapter 7 and the Coda each stay on one page. "
                      + "The cover, page labels, and contents identify Version 5.</p>")
    review.write_text(review.read_text().replace("</html>", native_review + "</html>"))
    return path, {"edition": 5, "status": "release-candidate" if release else "author-review", "source": manifest["source"],
                  "source_sha256": manifest["source_sha256"], "editorial_operations": len(manifest["edits"]),
                  "redline_sha256": digest(review),
                  "edit_manifest_sha256": digest(EDITS), "publication_label_changes": label_changes,
                  "native_node_edits": len(manifest.get("node_edits", [])),
                  "figures": figure_inventory, "manifesto": manifest["manifesto"],
                  "cover": {"src": Path(cover["web"]).name, "width": cover["web_width"],
                            "height": cover["web_height"], "alt": cover["alt"]},
                  "assets_sha256": {name: digest(ASSETS / name) for name in sorted({
                      "figures.json", *(Path(cover[key]).name for key in ("png", "svg", "web")), *(f[key] for f in figures
                                        for key in ("print_svg", "print_png", "web_svg", "mobile_svg"))
                  })}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--render", action="store_true")
    parser.add_argument("--release", action="store_true", help="Prepare publication labels in a local release candidate; does not publish")
    args = parser.parse_args()
    output = args.output or BASE / ("release-candidate" if args.release else "proof")
    path, report = build(output, release=args.release)
    if args.render:
        prior = None
        for _ in range(4):
            render(path)
            mapping = design.refresh_contents(path)
            if mapping == prior:
                break
            prior = mapping
        else:
            raise ValueError("Contents pagination did not stabilize")
        render(path)
        report["contents_pages"] = mapping
        report["first_body_pdf_page"] = finish_pdf(path, report["figures"]) + 1
    validate(path, report, include_pdf=args.render)
    (path.parent / (path.stem + "-Validation.json")).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"word": str(path), **report}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
