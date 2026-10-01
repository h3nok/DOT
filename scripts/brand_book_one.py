"""Apply DOT's shared identity to the released Word edition without rewriting it."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import uuid
import zipfile
from pathlib import Path
from xml.dom import minidom

from fontTools.ttLib import TTFont
from revise_book_one_review import (
    all_text,
    elements,
    ensure,
    invariant,
    pformat,
    prop,
    text_of,
    write_package,
)

ROOT = Path(__file__).resolve().parents[1]
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL = "http://schemas.openxmlformats.org/package/2006/relationships"
FONT_DIR = ROOT / "design/fonts"
FONTS = (
    ("space-grotesk", "Space Grotesk", 500, "normal", "Regular"),
    ("source-serif-4", "Source Serif 4", 400, "normal", "Regular"),
    ("source-serif-4", "Source Serif 4", 400, "italic", "Italic"),
    ("source-serif-4", "Source Serif 4", 700, "normal", "Bold"),
    ("jetbrains-mono", "JetBrains Mono", 400, "normal", "Regular"),
)


def export_fonts() -> dict[tuple[str, str], bytes]:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    result = {}
    notices = {}
    for package, family, weight, slant, role in FONTS:
        directory = ROOT / "frontend/node_modules/@fontsource" / package
        source = directory / "files" / f"{package}-latin-{weight}-{slant}.woff2"
        destination = FONT_DIR / f"{package}-{weight}-{slant}.ttf"
        with TTFont(source, recalcTimestamp=False) as font:
            font.flavor = None
            font.save(destination)
        result[family, role] = destination.read_bytes()
        notices[family] = (directory / "LICENSE").read_text()
    (FONT_DIR / "FONT-LICENSES.txt").write_text(
        "\n\n".join(f"{family}\n{text}" for family, text in notices.items())
    )
    return result


def relationship(document, ident: str, kind: str, target: str) -> None:
    matches = [
        node
        for node in document.getElementsByTagName("Relationship")
        if node.getAttribute("Id") == ident
    ]
    node = matches[0] if matches else document.createElementNS(REL, "Relationship")
    node.setAttribute("Id", ident)
    node.setAttribute("Type", f"{R}/{kind}")
    node.setAttribute("Target", target)
    if not matches:
        document.documentElement.appendChild(node)


def content_type(document, extension: str, mime: str) -> None:
    matches = [
        node
        for node in document.getElementsByTagName("Default")
        if node.getAttribute("Extension") == extension
    ]
    if not matches:
        node = document.createElement("Default")
        node.setAttribute("Extension", extension)
        node.setAttribute("ContentType", mime)
        document.documentElement.appendChild(node)


def embed_fonts(parts: dict[str, bytes], fonts: dict[tuple[str, str], bytes]) -> None:
    table = minidom.parseString(parts["word/fontTable.xml"])
    table.documentElement.setAttribute("xmlns:r", R)
    rel_path = "word/_rels/fontTable.xml.rels"
    rels = minidom.parseString(parts.get(rel_path, f'<Relationships xmlns="{REL}"/>'.encode()))
    types = minidom.parseString(parts["[Content_Types].xml"])
    content_type(types, "odttf", "application/vnd.openxmlformats-officedocument.obfuscatedFont")
    content_type(types, "txt", "text/plain")
    for (family, role), data in fonts.items():
        ident = "rIdDOTFont" + family.replace(" ", "") + role
        target = "fonts/" + ident + ".odttf"
        key = uuid.uuid5(uuid.NAMESPACE_URL, hashlib.sha256(data).hexdigest())
        mask = key.bytes[::-1]
        obfuscated = bytearray(data)
        for index in range(32):
            obfuscated[index] ^= mask[index % 16]
        parts["word/" + target] = bytes(obfuscated)
        relationship(rels, ident, "font", target)
        matches = [
            node
            for node in table.getElementsByTagName("w:font")
            if node.getAttribute("w:name") == family
        ]
        node = matches[0] if matches else table.createElement("w:font")
        node.setAttributeNS(W, "w:name", family)
        if not matches:
            table.documentElement.appendChild(node)
        embed = ensure(node, "w:embed" + role)
        embed.setAttributeNS(R, "r:id", ident)
        embed.setAttributeNS(W, "w:fontKey", "{" + str(key).upper() + "}")
    parts["word/fontTable.xml"] = table.toxml(encoding="UTF-8")
    parts[rel_path] = rels.toxml(encoding="UTF-8")
    parts["[Content_Types].xml"] = types.toxml(encoding="UTF-8")
    parts["word/fonts/FONT-LICENSES.txt"] = (FONT_DIR / "FONT-LICENSES.txt").read_bytes()
    settings = minidom.parseString(parts["word/settings.xml"])
    prop(settings.documentElement, "w:embedTrueTypeFonts", val=1)
    prop(settings.documentElement, "w:saveSubsetFonts", val=0)
    parts["word/settings.xml"] = settings.toxml(encoding="UTF-8")


def jacket(document, paragraph, width: int, height: int) -> None:
    for node in list(paragraph.getElementsByTagName("w:drawing")):
        props = node.getElementsByTagName("wp:docPr")
        if props and props[0].getAttribute("name") == "DOTIdentityJacket":
            parent = node.parentNode
            if not all_text(parent):
                parent.parentNode.removeChild(parent)
            else:
                parent.removeChild(node)
    # Behind-page artwork keeps the existing cover words selectable and editable.
    drawing = minidom.parseString(f'''<w:r xmlns:w="{W}" xmlns:r="{R}"
      xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
      xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
      xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
      <w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0"
        relativeHeight="0" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1">
        <wp:simplePos x="0" y="0"/>
        <wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH>
        <wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV>
        <wp:extent cx="{width}" cy="{height}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>
        <wp:wrapNone/><wp:docPr id="900" name="DOTIdentityJacket"
          descr="DOT nucleus brand mark; decorative, not a measured scientific diagram."/>
        <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
        <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
          <pic:pic><pic:nvPicPr><pic:cNvPr id="900" name="dot-identity-jacket.png"/>
            <pic:cNvPicPr/></pic:nvPicPr>
            <pic:blipFill><a:blip r:embed="rIdDOTIdentityJacket"/>
              <a:stretch><a:fillRect/></a:stretch></pic:blipFill>
            <pic:spPr><a:xfrm><a:off x="0" y="0"/>
              <a:ext cx="{width}" cy="{height}"/></a:xfrm>
              <a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
          </pic:pic>
        </a:graphicData></a:graphic>
      </wp:anchor></w:drawing></w:r>''')
    paragraph.appendChild(document.importNode(drawing.documentElement, True))


def wide_equations(document):
    return [
        equation
        for equation in document.getElementsByTagName("m:oMathPara")
        if len(all_text(equation)) > 80
    ]


def format_display_equations(document) -> None:
    wide_equation_nodes = wide_equations(document)
    for equation in document.getElementsByTagName("m:oMathPara"):
        wide = equation in wide_equation_nodes
        for run in equation.getElementsByTagName("m:r"):
            if wide or re.search(r"\bDOT (?:directional )?hypothesis\b", all_text(run)):
                properties = ensure(run, "m:rPr")
                normal = elements(properties, "m:nor")
                if not normal:
                    normal = document.createElement("m:nor")
                    normal.setAttribute("m:val", "1")
                    properties.insertBefore(normal, properties.firstChild)
    for equation in wide_equation_nodes:
        math = equation.getElementsByTagName("m:oMath")[0]
        if elements(math, "m:eqArr"):
            continue
        qualifiers = [
            run for run in elements(math, "m:r") if "DOT directional hypothesis" in all_text(run)
        ]
        if len(qualifiers) != 1 or math.lastChild is not qualifiers[0]:
            raise ValueError("Review the wide formula's qualifier before typesetting")
        # Native equation rows wrap the qualifier without changing any tokens.
        array = document.createElement("m:eqArr")
        first = document.createElement("m:e")
        second = document.createElement("m:e")
        array.appendChild(first)
        array.appendChild(second)
        for node in list(math.childNodes):
            (second if node is qualifiers[0] else first).appendChild(node)
        math.appendChild(array)


def designed_invariant(document):
    copy = document.cloneNode(True)
    format_display_equations(copy)
    return invariant(copy)


def brand_document(document, identity: dict) -> None:
    body = document.getElementsByTagName("w:body")[0]
    paragraphs = elements(body, "w:p")
    before = all_text(document), designed_invariant(document)
    preface = next(
        (index for index, paragraph in enumerate(paragraphs) if text_of(paragraph) == "PREFACE"),
        None,
    )
    if preface is None or not paragraphs or text_of(paragraphs[0]):
        raise ValueError("The cover structure changed; review the design template first")
    palette = identity["light"]
    fonts = identity["fonts"]
    for index, paragraph in enumerate(paragraphs):
        value = text_of(paragraph)
        sizes = [
            int(node.getAttribute("w:val"))
            for node in paragraph.getElementsByTagName("w:sz")
            if node.getAttribute("w:val").isdigit()
        ]
        if index < preface:
            size = 68 if index == 2 else 22 if index == 6 else 20
            face = (
                fonts["display"]
                if index in (2, 6)
                else fonts["annotation"]
                if index in (1, 3, 7)
                else fonts["reading"]
            )
            pformat(
                paragraph,
                size=size,
                indent=0,
                line=290,
                after=180,
                font=face,
                bold=False,
                color=identity["dark"]["ink"][1:].upper(),
            )
            prop(ensure(paragraph, "w:pPr"), "w:jc", val="left")
            if index in (1, 3, 7):
                for run in paragraph.getElementsByTagName("w:r"):
                    prop(
                        ensure(run, "w:rPr"),
                        "w:color",
                        val=identity["dark"]["accent"][1:].upper(),
                    )
            if index == 5:
                prop(
                    ensure(paragraph, "w:pPr"),
                    "w:spacing",
                    before=0,
                    after=4100,
                    line=20,
                    lineRule="exact",
                )
            continue
        chapter_label = (
            value == "PREFACE" or value.startswith("CHAPTER ") or value == "NOTES AND SOURCES"
        )
        heading = bool(sizes and max(sizes) >= 28)
        display_math = paragraph.getElementsByTagName("m:oMathPara")
        pformat(
            paragraph,
            size=18 if chapter_label else 42 if heading else 22,
            indent=0 if heading or chapter_label or display_math else 170,
            line=300 if heading else 320,
            before=0,
            after=180 if heading else 120 if chapter_label else 80,
            font=fonts["annotation"]
            if chapter_label
            else fonts["display"]
            if heading
            else fonts["reading"],
            bold=None,
            color=(palette["accent"] if chapter_label else palette["ink"])[1:].upper(),
        )
        if heading or chapter_label:
            prop(ensure(paragraph, "w:pPr"), "w:keepNext", val=1)
        if display_math:
            prop(ensure(paragraph, "w:pPr"), "w:jc", val="center")
        for link in paragraph.getElementsByTagName("w:hyperlink"):
            for run in link.getElementsByTagName("w:r"):
                color = prop(ensure(run, "w:rPr"), "w:color", val=palette["accent"][1:].upper())
                for attribute in ("w:themeColor", "w:themeTint", "w:themeShade"):
                    if color.hasAttribute(attribute):
                        color.removeAttribute(attribute)
    for section in document.getElementsByTagName("w:sectPr"):
        prop(section, "w:pgSz", w=10080, h=14400)
        prop(
            section,
            "w:pgMar",
            top=1080,
            right=1080,
            bottom=1080,
            left=1080,
            header=480,
            footer=480,
            gutter=0,
        )
        prop(section, "w:titlePg", val=1)
    jacket(document, paragraphs[0], 6_400_800, 9_144_000)
    format_display_equations(document)
    if (all_text(document), invariant(document)) != before:
        raise ValueError(
            "Design changed manuscript words, equations, fields, citations, or bookmarks"
        )


def align_edition(document, metadata, version: int) -> None:
    if version < 1:
        raise ValueError("Edition version must be positive")
    labels = [
        node
        for node in document.getElementsByTagName("w:t")
        if node.firstChild and re.fullmatch(r"Digital Edition · Version \d+", node.firstChild.data)
    ]
    if len(labels) != 1:
        raise ValueError("Expected exactly one existing cover edition label")
    before = all_text(document), invariant(document)
    old_label = labels[0].firstChild.data
    new_label = f"Digital Edition · Version {version}"
    labels[0].firstChild.data = new_label
    for tag in ("dc:subject", "dc:description"):
        nodes = metadata.getElementsByTagName(tag)
        if len(nodes) != 1 or not nodes[0].firstChild:
            raise ValueError(f"Missing edition metadata: {tag}")
        node = nodes[0].firstChild
        node.data, count = re.subn(r"Version \d+", f"Version {version}", node.data)
        if count != 1:
            raise ValueError(f"Expected exactly one edition version in {tag}")
    if (all_text(document), invariant(document)) != (
        before[0].replace(old_label, new_label, 1),
        before[1],
    ):
        raise ValueError("Edition alignment changed content beyond the cover label")


def brand_manuscript(source: Path, output: Path, *, edition_version: int | None = None) -> None:
    identity = json.loads((ROOT / "frontend/src/content/identity.json").read_text())
    background = ROOT / "design/youtube/book-background.png"
    if not background.is_file():
        raise FileNotFoundError(
            "Render the channel kit first; the book jacket background is missing"
        )
    with zipfile.ZipFile(source) as archive:
        parts = {name: archive.read(name) for name in archive.namelist()}
    document = minidom.parseString(parts["word/document.xml"])
    if edition_version is not None:
        metadata = minidom.parseString(parts["docProps/core.xml"])
        align_edition(document, metadata, edition_version)
        parts["docProps/core.xml"] = metadata.toxml(encoding="UTF-8")
    brand_document(document, identity)
    rels = minidom.parseString(parts["word/_rels/document.xml.rels"])
    relationship(rels, "rIdDOTIdentityJacket", "image", "media/dot-identity-jacket.png")
    parts["word/_rels/document.xml.rels"] = rels.toxml(encoding="UTF-8")
    parts["word/media/dot-identity-jacket.png"] = background.read_bytes()
    types = minidom.parseString(parts["[Content_Types].xml"])
    content_type(types, "png", "image/png")
    parts["[Content_Types].xml"] = types.toxml(encoding="UTF-8")
    parts["word/document.xml"] = document.toxml(encoding="UTF-8")
    embed_fonts(parts, export_fonts())
    for name in list(parts):
        if name.startswith(("word/header", "word/footer")) and name.endswith(".xml"):
            apparatus = minidom.parseString(parts[name])
            for paragraph in apparatus.getElementsByTagName("w:p"):
                pformat(
                    paragraph,
                    size=16,
                    indent=0,
                    font=identity["fonts"]["annotation"],
                    color=identity["light"]["muted"][1:].upper(),
                )
            parts[name] = apparatus.toxml(encoding="UTF-8")
    output.parent.mkdir(parents=True, exist_ok=True)
    write_package(parts, output)
    print(f"Designed {output}: 7x10 inch pages; prose and native equations preserved")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--edition-version",
        type=int,
        help="Explicitly align the existing cover label and edition metadata",
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=ROOT / "docs/blueprint/DOT-Book-One-Digital-Edition-v3.docx",
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Explicit output path; the input is never overwritten implicitly",
    )
    args = parser.parse_args()
    brand_manuscript(
        args.input.resolve(),
        args.output.resolve(),
        edition_version=args.edition_version,
    )


if __name__ == "__main__":
    main()
