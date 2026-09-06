"""Build the reversible v4.6 review book from the frozen v4.5 Word manuscript.

Uses only the standard library. Native math, citations, bookmarks, and section
structure stay in the original OOXML package. Run --render with LibreOffice
installed to refresh page references and export a tagged PDF. No public release
or website files are touched.
"""

from __future__ import annotations

import argparse
import difflib
import hashlib
import html
import json
import re
import subprocess
import tempfile
import zipfile
from collections import Counter
from pathlib import Path
from xml.dom import Node, minidom

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/blueprint/book-one-complete/v4-working"
NAME = "DOT-Complete-Book-One-v4.6-Review"
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML = "http://www.w3.org/XML/1998/namespace"


def elements(parent, tag):
    return [
        n
        for n in parent.childNodes
        if n.nodeType == Node.ELEMENT_NODE and n.tagName == tag
    ]


def ensure(parent, tag):
    nodes = elements(parent, tag)
    if nodes:
        return nodes[0]
    n = parent.ownerDocument.createElement(tag)
    if tag in ("w:pPr", "w:rPr", "w:tblPr", "w:tcPr", "w:trPr") and parent.firstChild:
        parent.insertBefore(n, parent.firstChild)
    else:
        parent.appendChild(n)
    return n


def prop(parent, tag, **attrs):
    n = ensure(parent, tag)
    for k, v in attrs.items():
        n.setAttributeNS(W, "w:" + k, str(v))
    return n


def remove(parent, *tags):
    for n in list(parent.childNodes):
        if n.nodeName in tags:
            parent.removeChild(n)


def text_of(node):
    return "".join(
        n.firstChild.data if n.firstChild else ""
        for n in node.getElementsByTagName("w:t")
    )


def all_text(node):
    return "".join(
        n.firstChild.data if n.firstChild else ""
        for n in node.getElementsByTagName("*")
        if n.tagName in ("w:t", "m:t")
    )


def run(parent, value, bold=False):
    r = parent.ownerDocument.createElement("w:r")
    if bold:
        prop(ensure(r, "w:rPr"), "w:b")
    t = parent.ownerDocument.createElement("w:t")
    t.setAttributeNS(XML, "xml:space", "preserve")
    t.appendChild(parent.ownerDocument.createTextNode(value))
    r.appendChild(t)
    parent.appendChild(r)
    return r


def replace_text(p, value):
    # Keep exact link nodes and their destinations, and both ends of bookmarks.
    # Mathematical paragraphs are changed only through separate text substitutions.
    if (
        p.getElementsByTagName("m:oMath")
        or p.getElementsByTagName("w:instrText")
        or p.getElementsByTagName("w:drawing")
    ):
        raise ValueError("Refusing to flatten structured content: " + text_of(p)[:80])
    links = list(p.getElementsByTagName("w:hyperlink"))
    starts = list(p.getElementsByTagName("w:bookmarkStart"))
    ends = list(p.getElementsByTagName("w:bookmarkEnd"))
    for link in links:
        if text_of(link) not in value:
            raise ValueError("Edit removes a link: " + text_of(link))
    for n in list(p.childNodes):
        if n.nodeName != "w:pPr":
            p.removeChild(n)
    for n in starts:
        p.appendChild(n)
    rest = value
    for link in links:
        before, _, rest = rest.partition(text_of(link))
        run(p, before)
        p.appendChild(link)
    run(p, rest)
    for n in ends:
        p.appendChild(n)


def style_id(p):
    pp = elements(p, "w:pPr")
    s = elements(pp[0], "w:pStyle") if pp else []
    return s[0].getAttribute("w:val") if s else ""


def pformat(
    p,
    size=22,
    before=0,
    after=70,
    indent=230,
    line=290,
    font="Georgia",
    bold=None,
    color="222C29",
):
    pp = ensure(p, "w:pPr")
    remove(pp, "w:pBdr", "w:shd", "w:contextualSpacing")
    prop(pp, "w:spacing", before=before, after=after, line=line, lineRule="auto")
    prop(pp, "w:ind", left=0, right=0, firstLine=indent)
    prop(pp, "w:jc", val="left")
    prop(pp, "w:widowControl", val=1)
    prop(pp, "w:suppressAutoHyphens", val=1)
    for r in p.getElementsByTagName("w:r"):
        rp = ensure(r, "w:rPr")
        prop(rp, "w:rFonts", ascii=font, hAnsi=font, cs=font, eastAsia=font)
        prop(rp, "w:sz", val=size)
        prop(rp, "w:szCs", val=size)
        prop(rp, "w:color", val=color)
        if bold is not None:
            prop(rp, "w:b", val=int(bold))
        remove(rp, "w:smallCaps", "w:caps", "w:spacing")


def paragraph(doc, value, sid="DOTBody"):
    p = doc.createElement("w:p")
    prop(ensure(p, "w:pPr"), "w:pStyle", val=sid)
    run(p, value)
    return p


def plate(doc, title, rows):
    # Native Word tables replace raster diagrams: editable and selectable at a
    # legible size, with reading order preserved in the tagged PDF.
    table = doc.createElement("w:tbl")
    tp = ensure(table, "w:tblPr")
    prop(tp, "w:tblW", w=6480, type="dxa")
    prop(tp, "w:tblLayout", type="fixed")
    margins = ensure(tp, "w:tblCellMar")
    for side, val in [("top", 110), ("bottom", 110), ("left", 140), ("right", 140)]:
        prop(margins, "w:" + side, w=val, type="dxa")
    borders = ensure(tp, "w:tblBorders")
    for side in ["top", "left", "bottom", "right", "insideH", "insideV"]:
        prop(borders, "w:" + side, val="nil")
    grid = ensure(table, "w:tblGrid")
    for width in [2100, 4380]:
        n = doc.createElement("w:gridCol")
        n.setAttribute("w:w", str(width))
        grid.appendChild(n)
    for i, (label, description) in enumerate([(title, "")] + rows):
        tr = doc.createElement("w:tr")
        table.appendChild(tr)
        prop(ensure(tr, "w:trPr"), "w:cantSplit")
        if i == 0:
            prop(ensure(tr, "w:trPr"), "w:tblHeader")
        values = [label] if i == 0 else [label, description]
        for j, value in enumerate(values):
            tc = doc.createElement("w:tc")
            tr.appendChild(tc)
            tcp = ensure(tc, "w:tcPr")
            prop(tcp, "w:tcW", w=6480 if i == 0 else [2100, 4380][j], type="dxa")
            if i == 0:
                prop(tcp, "w:gridSpan", val=2)
            prop(
                tcp,
                "w:shd",
                fill="EDF3F1" if i == 0 else ("F5F7F6" if i % 2 else "FFFFFF"),
                val="clear",
            )
            p = paragraph(
                doc, value, "DOTTableHeader" if i == 0 or j == 0 else "DOTTableBody"
            )
            pformat(
                p,
                size=21 if i == 0 else 20,
                after=0,
                indent=0,
                line=270,
                font="Arial" if i == 0 or j == 0 else "Georgia",
                bold=i == 0 or j == 0,
                color="164E48" if i == 0 else "222C29",
            )
            prop(ensure(p, "w:pPr"), "w:keepNext")
            tc.appendChild(p)
    return table


PLATES = [
    (
        "Four levels of claim",
        [
            ("Observation", "What is encountered or measured without accepting DOT."),
            (
                "External model",
                "An account developed in another field, used within its scope.",
            ),
            (
                "DOT derivation",
                "An inference from declared postulates and bridge premises.",
            ),
            (
                "Speculative extension",
                "A possibility not yet adequately derived or tested.",
            ),
        ],
    ),
    (
        "The Experience Loop",
        [
            (
                "1 · Reality Stream",
                "A situated moment arrives through the body and world.",
            ),
            ("2 · Painting", "Accumulated organization shapes its interpretation."),
            ("3 · Drafts", "Possible interpretations and responses become available."),
            ("4 · Intent", "Little c commits to or stabilizes a direction."),
            ("5 · Action", "The body carries that direction into the Frame."),
            ("6 · Consequence", "A result returns through experience."),
            (
                "7 · State update",
                "The Canvas carries a changed Painting into the next loop.",
            ),
        ],
    ),
    (
        "Frame, Stream, Painting",
        [
            (
                "Reality Frame",
                "The lawful environment: available states, constraints, and consequences.",
            ),
            (
                "Reality Stream",
                "What reaches this embodied observer from within that environment.",
            ),
            (
                "Painting",
                "The accumulated organization used to interpret what arrives.",
            ),
        ],
    ),
    (
        "Capacity, organization, expression",
        [
            ("Canvas · carries", "The capacity for state to persist and change."),
            (
                "Painting · interprets",
                "The organization of that state: expectations, meanings, skills, and habits.",
            ),
            (
                "Character · acts",
                "The relatively stable policy expressed through repeated action.",
            ),
        ],
    ),
    (
        "How civilization becomes Painting",
        [
            ("Civilization", "Historical foundations and inherited structures."),
            (
                "Status quo",
                "Present institutions, incentives, authorities, and technologies.",
            ),
            (
                "Culture",
                "Daily transmission through narrative, incentive, exposure, and affordance.",
            ),
            ("Painting", "Accumulated meanings and policies carried by individuals."),
            (
                "Character and action",
                "Repeated responses sustain or revise the shared world.",
            ),
        ],
    ),
    (
        "A staged research program",
        [
            (
                "1 · Definition",
                "Fix working terms, postulates, dependencies, and rival accounts.",
            ),
            ("2 · Measurement", "Validate narrow constructs and first-person methods."),
            (
                "3 · Practical prediction",
                "Test Experience Loop models across time and contexts.",
            ),
            (
                "4 · Mechanism",
                "Compare neural and Decoupling accounts through differing predictions.",
            ),
            (
                "5 · Frame constraints",
                "Derive restrictions on possible lawful environments.",
            ),
            (
                "6 · Continuity",
                "Investigate claims beyond the interface with mature controls.",
            ),
        ],
    ),
]


def invariant(document):
    return {
        "math": [n.toxml() for n in document.getElementsByTagName("m:oMath")],
        "instructions": [
            n.toxml() for n in document.getElementsByTagName("w:instrText")
        ],
        "citations": Counter(
            (n.getAttribute("w:anchor"), text_of(n))
            for n in document.getElementsByTagName("w:hyperlink")
            if n.getAttribute("w:anchor").startswith(("ref_", "reference_"))
        ),
        "bookmarks": Counter(
            n.getAttribute("w:name")
            for n in document.getElementsByTagName("w:bookmarkStart")
        ),
    }


def write_package(parts, path):
    for name, data in parts.items():
        if name.endswith((".xml", ".rels")):
            minidom.parseString(data)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in parts.items():
            z.writestr(name, data)


def redline(manifest, target):
    cards = []
    for e in manifest["edits"]:
        diff = []
        a = re.findall(r"\s+|\S+", e["old"])
        b = re.findall(r"\s+|\S+", e["new"])
        for tag, i, j, k, l in difflib.SequenceMatcher(
            None, a, b, autojunk=False
        ).get_opcodes():
            if tag == "equal":
                diff.append(html.escape("".join(a[i:j])))
            else:
                if tag in ("delete", "replace"):
                    diff.append("<del>" + html.escape("".join(a[i:j])) + "</del>")
                if tag in ("insert", "replace"):
                    diff.append("<ins>" + html.escape("".join(b[k:l])) + "</ins>")
        cards.append(
            f'<article id="p{e["paragraph"]}"><h2>{html.escape(e["section"])} · paragraph {e["paragraph"]}</h2><p class="reason">{html.escape(e["reason"])}</p><p>{"".join(diff)}</p></article>'
        )
    target.write_text(
        '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Book One · v4.6 editorial redline</title><style>body{max-width:760px;margin:4rem auto;padding:0 1.3rem;font:18px/1.7 Georgia,serif;color:#222c29;background:#fafbf9}h1,h2,.reason{font-family:Arial,sans-serif}h1{line-height:1.2}h2{font-size:14px;color:#164e48}article{margin:3.5rem 0}del{background:#ffe4df;text-decoration:line-through}ins{background:#d8f1e2;text-decoration:underline}.reason{font-size:14px;color:#47544e}@media print{body{font-size:11pt}article{break-inside:avoid}}</style><h1>Book One · v4.6 editorial redline</h1><p>Exact prose changes from the frozen v4.5 manuscript. Deletions are struck through; additions are underlined. Layout changes and native concept plates are visible in the review PDF. The JSON manifest records the source hash and text substitutions.</p>'
        + "".join(cards)
        + "</html>"
    )


def build(output):
    manifest = json.loads((BASE / "editing/v4.6-edits.json").read_text())
    source = BASE / manifest["source"]
    if hashlib.sha256(source.read_bytes()).hexdigest() != manifest["source_sha256"]:
        raise ValueError(
            "Source manuscript changed; reconcile the editorial manifest first."
        )
    with zipfile.ZipFile(source) as z:
        parts = {n: z.read(n) for n in z.namelist()}
    doc = minidom.parseString(parts["word/document.xml"])
    original = invariant(doc)
    ps = list(doc.getElementsByTagName("w:p"))
    # A page-relative cover avoids clipping by inherited body/header margins.
    inline = ps[0].getElementsByTagName("wp:inline")[0]
    anchor = doc.createElement("wp:anchor")
    for name, value in inline.attributes.items():
        if name.startswith("xmlns:"):
            anchor.setAttribute(name, value)
    for key, value in {
        "simplePos": "0",
        "relativeHeight": "0",
        "behindDoc": "1",
        "locked": "0",
        "layoutInCell": "1",
        "allowOverlap": "1",
        "distT": "0",
        "distB": "0",
        "distL": "0",
        "distR": "0",
    }.items():
        anchor.setAttribute(key, value)
    position = doc.createElement("wp:simplePos")
    position.setAttribute("x", "0")
    position.setAttribute("y", "0")
    anchor.appendChild(position)
    for axis in ("H", "V"):
        position = doc.createElement("wp:position" + axis)
        position.setAttribute("relativeFrom", "page")
        offset = doc.createElement("wp:posOffset")
        offset.appendChild(doc.createTextNode("0"))
        position.appendChild(offset)
        anchor.appendChild(position)
    extent = doc.createElement("wp:extent")
    extent.setAttribute("cx", "5486400")
    extent.setAttribute("cy", "8229600")
    anchor.appendChild(extent)
    anchor.appendChild(doc.createElement("wp:wrapNone"))
    for tag in ("wp:docPr", "wp:cNvGraphicFramePr", "a:graphic"):
        anchor.appendChild(inline.getElementsByTagName(tag)[0])
    inline.parentNode.replaceChild(anchor, inline)
    for extent in ps[0].getElementsByTagName("a:ext"):
        extent.setAttribute("cx", "5486400")
        extent.setAttribute("cy", "8229600")
    for e in manifest["edits"]:
        p = ps[e["paragraph"]]
        if all_text(p) != e["old"]:
            raise ValueError(f"Paragraph {e['paragraph']} drifted")
        if e["new"]:
            replace_text(p, e["new"])
        else:
            if p.getElementsByTagName("w:bookmarkStart") or p.getElementsByTagName(
                "w:hyperlink"
            ):
                raise ValueError("Deletion would remove navigation")
            p.parentNode.removeChild(p)
    ps[106].parentNode.insertBefore(
        plate(
            doc,
            "A reading key",
            [
                ("Big C", "Self-awareness at the encompassing scope proposed by DOT."),
                (
                    "Little c",
                    "The same fundamental kind of self-awareness at a local scope.",
                ),
                ("Canvas", "The capacity to carry and update a distinctive history."),
                ("Painting", "The accumulated organization of that carried state."),
                ("Character", "Its expression through repeated action."),
                (
                    "Reality Frame",
                    "The lawful environment in which action meets consequence.",
                ),
                (
                    "Reality Stream",
                    "The situated experience available within that environment.",
                ),
            ],
        ),
        ps[106],
    )
    for substitution in manifest.get("text_substitutions", []):
        count = 0
        for n in doc.getElementsByTagName("w:t"):
            if n.firstChild and substitution["old"] in n.firstChild.data:
                n.firstChild.data = n.firstChild.data.replace(
                    substitution["old"], substitution["new"]
                )
                count += 1
        if not count:
            raise ValueError("Unmatched substitution: " + substitution["old"])
    # Experience Loop belongs beside its first full explanation in Chapter 2.
    for n in [ps[1171], ps[1172]]:
        ps[622].parentNode.insertBefore(n, ps[622])
    image_paras = [
        p for p in doc.getElementsByTagName("w:p") if style_id(p) == "DOTFigure"
    ]
    if len(image_paras) != 6:
        raise ValueError("Expected six concept figures")
    for p, (title, rows) in zip(image_paras, PLATES):
        p.parentNode.replaceChild(plate(doc, title, rows), p)
    # Update the visible heading in the manual navigation without changing its anchor.
    for p in doc.getElementsByTagName("w:p"):
        if style_id(p).startswith("DOTTOC"):
            for t in p.getElementsByTagName("w:t"):
                if t.firstChild:
                    t.firstChild.data = t.firstChild.data.replace(
                        "The Derivation from First Principles",
                        "The Foundational Architecture",
                    )
    # One calm typographic system, with direct formatting normalized as well as styles.
    for i, p in enumerate(list(doc.getElementsByTagName("w:p"))):
        sid = style_id(p)
        if sid in ("DOTBody", "Normal"):
            pformat(p)
            if p.parentNode.nodeName == "w:tc":
                pformat(p, size=20, indent=0, after=55, line=275)
        elif sid in ("ListBullet", "ListNumber"):
            pformat(p, size=22, after=85, indent=0, line=285)
            pp = ensure(p, "w:pPr")
            remove(pp, "w:ind")
            prop(pp, "w:ind", left=270, hanging=240)
        elif sid in ("DOTTableHeader", "DOTTableBody"):
            pformat(
                p, size=20, after=40, indent=0, line=275, bold=sid == "DOTTableHeader"
            )
        elif sid == "Heading1":
            pformat(p, size=52, before=380, after=280, indent=0, line=255, bold=True)
            rs = p.getElementsByTagName("w:r")
            if rs:
                rp = ensure(rs[0], "w:rPr")
                prop(rp, "w:sz", val=19)
                prop(rp, "w:szCs", val=19)
                prop(rp, "w:rFonts", ascii="Arial", hAnsi="Arial")
                prop(rp, "w:color", val="164E48")
        elif sid in ("Heading2", "Heading3", "Heading4"):
            level = int(sid[-1])
            pformat(
                p,
                size={2: 30, 3: 25, 4: 23}[level],
                before={2: 340, 3: 250, 4: 210}[level],
                after=120,
                indent=0,
                line=265,
                bold=True,
                color="164E48" if level == 2 else "222C29",
            )
            prop(ensure(p, "w:pPr"), "w:keepNext", val=1)
        elif sid == "DOTChapterDeck":
            pformat(p, size=25, after=210, indent=0, line=275, color="435B53")
        elif sid == "DOTChapterLead":
            pformat(p, size=24, after=150, indent=0, line=285, bold=False)
        elif sid in ("DOTBookCallout", "DOTSideNote", "DOTSideNoteLabel"):
            label = sid == "DOTSideNoteLabel" or len(text_of(p)) < 35
            pformat(
                p,
                size=19 if label else 21,
                before=90 if label else 0,
                after=80,
                indent=0,
                line=275,
                font="Arial" if label else "Georgia",
                bold=label,
                color="164E48" if label else "33473F",
            )
        elif sid == "DOTFigureCaption":
            pformat(
                p,
                size=20,
                before=100,
                after=260,
                indent=0,
                line=270,
                bold=False,
                color="43534C",
            )
            prop(ensure(p, "w:pPr"), "w:keepLines", val=1)
        elif sid in ("DOTReference", "DOTReferenceNumber"):
            pformat(
                p,
                size=20,
                before=90 if sid == "DOTReferenceNumber" else 0,
                after=100,
                indent=0,
                line=275,
                font="Arial" if sid == "DOTReferenceNumber" else "Georgia",
                bold=sid == "DOTReferenceNumber",
            )
        elif sid.startswith("DOTTOC"):
            chapter = sid == "DOTTOCChapter"
            pformat(
                p,
                size=22 if chapter else 20,
                before=180 if chapter else 0,
                after=70,
                indent=0,
                line=265,
                bold=chapter,
            )
            pp = ensure(p, "w:pPr")
            tabs = ensure(pp, "w:tabs")
            while tabs.firstChild:
                tabs.removeChild(tabs.firstChild)
            prop(tabs, "w:tab", pos=6480, val="right", leader="none")
            if not chapter:
                prop(pp, "w:ind", left=220, firstLine=0)
            if chapter:
                prop(pp, "w:keepNext")
        elif sid in ("DOTChapterLabel", "DOTContentsTitle"):
            pformat(
                p,
                size=19 if sid == "DOTChapterLabel" else 50,
                before=0,
                after=280,
                indent=0,
                bold=True,
                color="164E48" if sid == "DOTChapterLabel" else "222C29",
            )
    # Definitions remain skimmable even when the source paragraph was replaced.
    for p in ps[2150:2187]:
        if p.parentNode and style_id(p) == "DOTBody":
            value = text_of(p)
            term, sep, rest = value.partition(". ")
            if sep:
                replace_text(p, "")
                run(p, term + ". ", bold=True)
                run(p, rest)
                pformat(p, indent=0, after=140)
                prop(ensure(p, "w:pPr"), "w:keepLines", val=1)
    # Reader-directed contents: 12 entries rather than three crowded pages of microheadings.
    for p in list(doc.getElementsByTagName("w:p")):
        if style_id(p) == "DOTTOCSection":
            p.parentNode.removeChild(p)
    # The chapter bookmarks remain; section navigation is available in the PDF outline.
    for p in doc.getElementsByTagName("w:p"):
        for n in p.getElementsByTagName("w:t"):
            if n.firstChild:
                n.firstChild.data = n.firstChild.data.replace(
                    "Author Review Edition v4.5", "Author Review Edition v4.6"
                )
    # Keep the same trim and readable mirrored margins. First cover has special geometry.
    sections = list(doc.getElementsByTagName("w:sectPr"))
    for section in sections[1:]:
        prop(section, "w:pgSz", w=8640, h=12960)
        prop(
            section,
            "w:pgMar",
            top=1080,
            right=936,
            bottom=1080,
            left=1152,
            header=440,
            footer=440,
            gutter=72,
        )
    styles = minidom.parseString(parts["word/styles.xml"])
    for s in styles.getElementsByTagName("w:style"):
        pp = ensure(s, "w:pPr")
        remove(pp, "w:pBdr", "w:shd")
        remove(ensure(s, "w:rPr"), "w:smallCaps", "w:caps", "w:spacing")
        prop(pp, "w:suppressAutoHyphens")
        if s.getAttribute("w:styleId") in ("Normal", "DOTBody"):
            prop(pp, "w:spacing", line=290, lineRule="auto", after=70)
            prop(ensure(s, "w:rPr"), "w:sz", val=22)
    settings = minidom.parseString(parts["word/settings.xml"])
    prop(settings.documentElement, "w:autoHyphenation", val=0)
    prop(settings.documentElement, "w:updateFields", val=1)
    for key, value in parts.items():
        if re.match(r"word/(header|footer)\d+\.xml$", key):
            d = minidom.parseString(value)
            for pp in d.getElementsByTagName("w:pPr"):
                remove(pp, "w:pBdr", "w:shd")
            parts[key] = d.toxml(encoding="UTF-8")
    after = invariant(doc)
    # Removing section rows from the contents changes link counts, not destinations.
    for key in original:
        if original[key] != after[key]:
            raise ValueError("Structured content changed: " + key)
    anchors = {
        n.getAttribute("w:name") for n in doc.getElementsByTagName("w:bookmarkStart")
    }
    broken = {
        n.getAttribute("w:anchor")
        for n in doc.getElementsByTagName("w:hyperlink")
        if n.getAttribute("w:anchor") and n.getAttribute("w:anchor") not in anchors
    }
    if broken:
        raise ValueError("Broken internal links: " + str(broken))
    parts["word/document.xml"] = doc.toxml(encoding="UTF-8")
    parts["word/styles.xml"] = styles.toxml(encoding="UTF-8")
    parts["word/settings.xml"] = settings.toxml(encoding="UTF-8")
    parts["word/media/image1.png"] = (
        BASE / "assets/complete-book-one-v4.6-cover.png"
    ).read_bytes()
    core = minidom.parseString(parts["docProps/core.xml"])
    for tag, value in [
        (
            "dc:description",
            "Author Review Edition v4.6: revised definitions, prose, navigation, and book design.",
        ),
        ("dcterms:modified", "2026-09-06T00:00:00Z"),
    ]:
        node = core.getElementsByTagName(tag)[0]
        while node.firstChild:
            node.removeChild(node.firstChild)
        node.appendChild(core.createTextNode(value))
    parts["docProps/core.xml"] = core.toxml(encoding="UTF-8")
    # Removed raster figures must not leave stale copies inside the review file.
    rels = minidom.parseString(parts["word/_rels/document.xml.rels"])
    used_images = {
        n.getAttribute("r:embed") for n in doc.getElementsByTagName("a:blip")
    }
    for relationship in list(rels.getElementsByTagName("Relationship")):
        if (
            relationship.getAttribute("Type").endswith("/image")
            and relationship.getAttribute("Id") not in used_images
        ):
            parts.pop("word/" + relationship.getAttribute("Target"), None)
            relationship.parentNode.removeChild(relationship)
    parts["word/_rels/document.xml.rels"] = rels.toxml(encoding="UTF-8")
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
    redline(manifest, output / (NAME + "-Redline.html"))
    return path, {
        "source_sha256": manifest["source_sha256"],
        "edits": len(manifest["edits"]),
        "native_equations": len(original["math"]),
        "equation_fields": len(original["instructions"]),
        "concept_plates": 6,
        "internal_links_checked": len(doc.getElementsByTagName("w:hyperlink")),
    }


def render(path):
    with tempfile.TemporaryDirectory(prefix="dot-v46-render-") as temp:
        profile = Path(temp) / "profile"
        result = subprocess.run(
            [
                "libreoffice",
                f"-env:UserInstallation={profile.as_uri()}",
                "--headless",
                "--convert-to",
                "pdf:writer_pdf_Export",
                "--outdir",
                temp,
                str(path),
            ],
            capture_output=True,
            text=True,
            check=True,
            timeout=120,
        )
        generated = Path(temp) / (path.stem + ".pdf")
        if not generated.exists():
            raise RuntimeError(result.stdout + result.stderr)
        path.with_suffix(".pdf").write_bytes(generated.read_bytes())


def refresh_contents(path):
    # Use headings in the rendered text, then replace stale literal page caches
    # with native PAGEREF fields. Word can refresh these after subsequent edits.
    pdf = path.with_suffix(".pdf")
    pages = subprocess.check_output(
        ["pdftotext", "-layout", str(pdf), "-"], text=True
    ).split("\f")
    normalized = [re.sub(r"\s+", " ", p).strip() for p in pages]
    with zipfile.ZipFile(path) as z:
        parts = {n: z.read(n) for n in z.namelist()}
    d = minidom.parseString(parts["word/document.xml"])
    by_anchor = {}
    for p in d.getElementsByTagName("w:p"):
        if style_id(p) == "Heading1":
            names = p.getElementsByTagName("w:bookmarkStart")
            rs = p.getElementsByTagName("w:r")
            if names:
                by_anchor[names[0].getAttribute("w:name")] = " ".join(
                    text_of(r) for r in rs
                )
    mapping = {}
    for p in d.getElementsByTagName("w:p"):
        if style_id(p) != "DOTTOCChapter":
            continue
        link = p.getElementsByTagName("w:hyperlink")[0]
        anchor = link.getAttribute("w:anchor")
        title = re.sub(r"\s+", " ", by_anchor[anchor]).strip()
        found = [i for i, t in enumerate(normalized) if title in t]
        if len(found) != 1:
            raise ValueError(f"Cannot locate {title}: {found}")
        page_text = pages[found[0]]
        numeric = [
            line.strip() for line in page_text.splitlines() if line.strip().isdigit()
        ]
        if not numeric:
            raise ValueError("Missing folio for " + title)
        value = numeric[-1]
        mapping[anchor] = int(value)
        for n in list(p.childNodes):
            if n.nodeName not in ("w:pPr", "w:hyperlink"):
                p.removeChild(n)
        rr = d.createElement("w:r")
        rr.appendChild(d.createElement("w:tab"))
        p.appendChild(rr)
        field = d.createElement("w:fldSimple")
        field.setAttribute("w:instr", f" PAGEREF {anchor} \\h ")
        run(field, value)
        p.appendChild(field)
    parts["word/document.xml"] = d.toxml(encoding="UTF-8")
    app = minidom.parseString(parts["docProps/app.xml"])
    node = app.getElementsByTagName("Pages")[0]
    while node.firstChild:
        node.removeChild(node.firstChild)
    node.appendChild(app.createTextNode(str(len(pages) - 1)))
    parts["docProps/app.xml"] = app.toxml(encoding="UTF-8")
    write_package(parts, path)
    return mapping


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=BASE / "v4.6-review")
    parser.add_argument("--render", action="store_true")
    args = parser.parse_args()
    path, report = build(args.output.resolve())
    if args.render:
        render(path)
        first = refresh_contents(path)
        render(path)
        second = refresh_contents(path)
        if first != second:
            raise ValueError("Contents pagination did not stabilize")
        report["contents_pages"] = second
        report["pdf_sha256"] = hashlib.sha256(
            path.with_suffix(".pdf").read_bytes()
        ).hexdigest()
    report["docx_sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    (path.parent / (NAME + "-Validation.json")).write_text(
        json.dumps(report, indent=2) + "\n"
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
