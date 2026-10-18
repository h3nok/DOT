"""Apply the author's v4.9 prose revision to the native v4.8 Word package.

Only document text and review metadata change. Unchanged runs retain their
formatting; equations, fields, links, bookmarks, design, and references remain
native. This produces a private review revision, never a public release.
"""

from __future__ import annotations

import argparse
import datetime
import difflib
import hashlib
import html
import json
import os
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path
from xml.dom import minidom
from xml.sax.saxutils import escape

from build_book_v48 import refresh_contents, validate
from revise_book_one_review import BASE, ROOT, all_text, invariant, redline, style_id, text_of, write_package

NAME = "DOT-Complete-Book-One-v4.9-Review"
MANIFEST = BASE / "editing/v4.9-edits.json"
XML = "http://www.w3.org/XML/1998/namespace"


def digest(value):
    return hashlib.sha256(value).hexdigest()


def is_in(node, tag):
    while node.parentNode:
        node = node.parentNode
        if node.nodeName == tag:
            return True
    return False


def revise_segment(nodes, value):
    """Apply a text diff within existing runs without flattening their properties."""
    old = "".join(n.firstChild.data if n.firstChild else "" for n in nodes)
    if old == value:
        return
    if not nodes:
        raise ValueError("No ordinary text run is available for an insertion")
    owners = [i for i, n in enumerate(nodes) for _ in (n.firstChild.data if n.firstChild else "")]
    output = ["" for _ in nodes]
    for tag, a, b, c, d in difflib.SequenceMatcher(None, old, value, autojunk=False).get_opcodes():
        if tag == "equal":
            for offset, char in enumerate(old[a:b], a):
                output[owners[offset]] += char
        elif tag in ("insert", "replace"):
            # New text inherits the surrounding run, with all other runs intact.
            owner = owners[min(a, len(owners) - 1)] if owners else 0
            output[owner] += value[c:d]
    for n, replacement in zip(nodes, output):
        while n.firstChild:
            n.removeChild(n.firstChild)
        n.appendChild(n.ownerDocument.createTextNode(replacement))
        n.setAttributeNS(XML, "xml:space", "preserve")


def revise_paragraph(paragraph, value):
    for tag in ("m:oMath", "w:instrText", "w:fldSimple", "w:drawing", "w:sectPr"):
        if paragraph.getElementsByTagName(tag):
            raise ValueError(f"Refusing to edit structured paragraph: {tag}")
    links = list(paragraph.getElementsByTagName("w:hyperlink"))
    remaining = value
    segments = []
    for link in links:
        label = text_of(link)
        if not label or remaining.count(label) != 1:
            raise ValueError("Link text missing, duplicated, or reordered")
        before, _, remaining = remaining.partition(label)
        segments.append(before)
    segments.append(remaining)
    groups = [[] for _ in segments]
    group = 0
    for n in paragraph.getElementsByTagName("*"):
        if n.nodeName == "w:hyperlink":
            group += 1
        elif n.nodeName == "w:t" and not is_in(n, "w:hyperlink"):
            groups[group].append(n)
    for nodes, segment in zip(groups, segments):
        revise_segment(nodes, segment)
    if all_text(paragraph) != value:
        raise ValueError("Run-preserving edit did not produce the exact approved text")


def protected(document):
    result = invariant(document)
    for tag in ("w:bookmarkStart", "w:bookmarkEnd", "w:sectPr", "w:drawing", "w:fldChar"):
        result[tag] = [n.toxml() for n in document.getElementsByTagName(tag)]
    result["simple_fields"] = [n.getAttribute("w:instr") for n in document.getElementsByTagName("w:fldSimple")]
    result["link_destinations"] = [
        (n.getAttribute("w:anchor"), n.getAttribute("r:id"))
        for n in document.getElementsByTagName("w:hyperlink")
    ]
    result["reference_paragraphs"] = [
        n.toxml() for n in document.getElementsByTagName("w:p") if style_id(n).startswith("DOTReference")
    ]
    return result


def check_depth(document):
    opened = None
    count = 0
    for n in document.getElementsByTagName("w:bookmarkStart"):
        match = re.fullmatch(r"(depth_\d+)_(start|end)", n.getAttribute("w:name"))
        if not match:
            continue
        ident, edge = match.groups()
        if edge == "start":
            if opened:
                raise ValueError("Depth passages overlap")
            opened = ident
        else:
            if opened != ident:
                raise ValueError("Depth bookmark pair is broken")
            opened = None
            count += 1
    if opened or count != 26:
        raise ValueError("Depth passages missing or unclosed")
    return count


def load_package(path):
    with zipfile.ZipFile(path) as archive:
        if archive.testzip():
            raise ValueError("Corrupt Word package")
        parts = {name: archive.read(name) for name in archive.namelist()}
    return parts, minidom.parseString(parts["word/document.xml"])


def build(output):
    manifest = json.loads(MANIFEST.read_text())
    source = BASE / manifest["source"]
    if digest(source.read_bytes()) != manifest["source_sha256"]:
        raise ValueError("v4.8 source has drifted")
    parts, doc = load_package(source)
    before = protected(doc)
    paragraphs = list(doc.getElementsByTagName("w:p"))
    indexed = {e["paragraph"]: e for e in manifest["edits"]}
    if len(indexed) != len(manifest["edits"]):
        raise ValueError("Duplicate edit target")
    expected = []
    for i, p in enumerate(paragraphs):
        if i not in indexed:
            expected.append(all_text(p))
            continue
        edit = indexed[i]
        if all_text(p) != edit["old"]:
            raise ValueError(f"Paragraph {i} has drifted")
        if style_id(p) not in ("DOTBody", "DOTChapterLead", "DOTBookEdition", "DOTColophon"):
            raise ValueError(f"Protected paragraph style at {i}")
        if edit["new"]:
            revise_paragraph(p, edit["new"])
            expected.append(edit["new"])
        else:
            for tag in ("w:bookmarkStart", "w:bookmarkEnd", "w:hyperlink", "m:oMath", "w:instrText", "w:fldSimple", "w:sectPr", "w:drawing"):
                if p.getElementsByTagName(tag):
                    raise ValueError(f"Deletion would remove protected content at {i}")
            p.parentNode.removeChild(p)
    if expected != [all_text(p) for p in doc.getElementsByTagName("w:p")]:
        raise ValueError("Unrecorded body-text change")
    if before != protected(doc):
        raise ValueError("Native manuscript structure changed")
    depth = check_depth(doc)
    parts["word/document.xml"] = doc.toxml(encoding="UTF-8")
    core = minidom.parseString(parts["docProps/core.xml"])
    updates = {
        "dc:description": "Complete Edition, author review v4.9: prose revision of v4.8. Native math, references, and design preserved. Not published.",
        "cp:revision": "2",
        "dcterms:modified": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    for tag, value in updates.items():
        holder = core.getElementsByTagName(tag)[0]
        while holder.firstChild:
            holder.removeChild(holder.firstChild)
        holder.appendChild(core.createTextNode(value))
    parts["docProps/core.xml"] = core.toxml(encoding="UTF-8")
    output.mkdir(parents=True, exist_ok=True)
    path = output / f"{NAME}.docx"
    write_package(parts, path)
    review = output / f"{NAME}-Redline.html"
    redline(manifest, review)
    review.write_text(review.read_text().replace("v4.6 editorial redline", "v4.9 editorial revision")
                      .replace("frozen v4.5 manuscript", "v4.8 review manuscript")
                      .replace("Layout changes and native concept plates are visible in the review PDF.", "The print design and native manuscript structures are preserved.")
                      .replace("</html>", "<h2>Author review question</h2><p>" + html.escape(manifest["author_review_questions"][0]["question"]) + "</p></html>"))
    report = {
        "source_sha256": manifest["source_sha256"],
        "editorial_operations": len(indexed),
        "paragraphs_removed": sum(not e["new"] for e in indexed.values()),
        "words_removed_net": sum(len(e["old"].split()) - len(e["new"].split()) for e in indexed.values()),
        "native_equations_preserved": len(before["math"]),
        "equation_fields_preserved": len(before["instructions"]),
        "depth_passages": depth,
        "protected_structure_unchanged": True,
        "edits_preserve_existing_runs": True,
        "changed_package_parts": ["word/document.xml", "docProps/core.xml"],
        "author_review_questions": manifest["author_review_questions"],
        "manifesto": manifest["manifesto"],
    }
    return path, source, report


def render(path):
    options = {name: {"type": "boolean", "value": value} for name, value in
               (("IsSkipEmptyPages", "false"), ("UseTaggedPDF", "true"), ("ExportBookmarks", "true"))}
    with tempfile.TemporaryDirectory(prefix="dot-v49-office-") as directory:
        temp = Path(directory)
        runtime = temp / "runtime"
        runtime.mkdir(mode=0o700)
        config = temp / "fonts.conf"
        config.write_text('<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">'
                          '<fontconfig><include ignore_missing="no">/etc/fonts/fonts.conf</include>'
                          f'<dir>{escape(str(ROOT / "design/fonts"))}</dir>'
                          f'<cachedir>{escape(str(temp / "font-cache"))}</cachedir></fontconfig>')
        environment = {**os.environ, "XDG_CACHE_HOME": str(temp / "cache"),
                       "XDG_CONFIG_HOME": str(temp / "config"), "XDG_RUNTIME_DIR": str(runtime),
                       "FONTCONFIG_FILE": str(config)}
        subprocess.run(["libreoffice", f"-env:UserInstallation={(temp / 'profile').as_uri()}",
                        "--headless", "--convert-to", "pdf:writer_pdf_Export:" + json.dumps(options),
                        "--outdir", str(temp), str(path)], check=True, capture_output=True,
                       env=environment, timeout=240)
        generated = temp / f"{path.stem}.pdf"
        if not generated.exists():
            raise RuntimeError("LibreOffice did not produce the PDF proof")
        path.with_suffix(".pdf").write_bytes(generated.read_bytes())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=BASE / "v4.9-review")
    parser.add_argument("--render", action="store_true")
    args = parser.parse_args()
    path, source, report = build(args.output)
    if args.render:
        render(path)
        report["contents_pages"] = refresh_contents(path)
        render(path)
        validate(path, report)
    original_parts, original = load_package(source)
    final_parts, final = load_package(path)
    if protected(original) != protected(final):
        raise ValueError("Protected content changed during proof generation")
    changed = sorted(name for name in original_parts if original_parts[name] != final_parts[name])
    if changed != sorted(report["changed_package_parts"]):
        raise ValueError("Unexpected package-part mutation")
    report["output_sha256"] = digest(path.read_bytes())
    (args.output / f"{NAME}-Validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"word": str(path), "operations": report["editorial_operations"],
                      "native_equations": report["native_equations_preserved"],
                      "pages": report.get("pages")}, indent=2))


if __name__ == "__main__":
    main()
