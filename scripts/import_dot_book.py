#!/usr/bin/env python3
"""Import the current DOT Word manuscript as a deterministic public web release.

The Word manuscript remains the editorial source of truth. This script uses
Pandoc for OOXML/OMML extraction, splits the result at the manuscript's existing
section markers, and writes finite Markdown reading units plus a release
manifest for the public Stay reader.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path


BOOK_ROUTE = "/book/digital-organism-theory"


@dataclass(frozen=True)
class SectionSpec:
    marker: str
    next_marker: str | None
    slug: str
    kind: str
    number: int | None
    title: str
    subtitle: str | None
    part: str
    related_concepts: tuple[str, ...]


SECTIONS = (
    SectionSpec(
        marker="**PREFACE**",
        next_marker="**CHAPTER 1**",
        slug="preface",
        kind="preface",
        number=None,
        title="The Observer Belongs in the Inquiry",
        subtitle=None,
        part="The Proposed Architecture",
        related_concepts=("subjective-data", "fear", "love"),
    ),
    SectionSpec(
        marker="**CHAPTER 1**",
        next_marker="**CHAPTER 2**",
        slug="the-digital-organism",
        kind="chapter",
        number=1,
        title="The Digital Organism",
        subtitle="Consciousness, subjectivity, and the architecture of persistence",
        part="The Proposed Architecture",
        related_concepts=(
            "digital-organism",
            "big-c",
            "little-c",
            "reality-frame",
            "canvas",
            "intent",
        ),
    ),
    SectionSpec(
        marker="**CHAPTER 2**",
        next_marker="**CHAPTER 3**",
        slug="the-decoupling-principle",
        kind="chapter",
        number=2,
        title="The Decoupling Principle",
        subtitle="Where awareness meets the body",
        part="The Proposed Architecture",
        related_concepts=("little-c", "body-interface", "rendering-latency", "intent"),
    ),
    SectionSpec(
        marker="**CHAPTER 3**",
        next_marker="**CHAPTER 4**",
        slug="architecture-of-continuity",
        kind="chapter",
        number=3,
        title="Architecture of Continuity",
        subtitle="Engineered continuity, immersion, and learning",
        part="The Proposed Architecture",
        related_concepts=("continuity", "reality-frame", "reality-stream", "big-c"),
    ),
    SectionSpec(
        marker="**CHAPTER 4**",
        next_marker="**CHAPTER 5**",
        slug="reality-frames",
        kind="chapter",
        number=4,
        title="Reality Frames",
        subtitle="Rules, consequence, and the structure of experience",
        part="The Proposed Architecture",
        related_concepts=(
            "reality-frame",
            "reality-stream",
            "world-invariants",
            "agency",
            "intent",
        ),
    ),
    SectionSpec(
        marker="**CHAPTER 5**",
        next_marker="**CHAPTER 6**",
        slug="the-canvas",
        kind="chapter",
        number=5,
        title="The Canvas",
        subtitle="The persistent substrate of experience",
        part="The Human Instance",
        related_concepts=("canvas", "painting", "character", "fear"),
    ),
    SectionSpec(
        marker="**CHAPTER 6**",
        next_marker="**NOTES AND SOURCES**",
        slug="the-painting",
        kind="chapter",
        number=6,
        title="The Painting",
        subtitle="From inherited conditioning to conscious authorship",
        part="The Human Instance",
        related_concepts=("painting", "character", "culture", "fear", "love"),
    ),
    SectionSpec(
        marker="**NOTES AND SOURCES**",
        next_marker=None,
        slug="references",
        kind="references",
        number=None,
        title="References",
        subtitle=None,
        part="Notes and Sources",
        related_concepts=("sources", "evidence"),
    ),
)


SUPERSCRIPT = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument(
        "--output",
        default=Path(
            "frontend/public/publications/henok/digital-organism-theory/v1"
        ),
        type=Path,
    )
    parser.add_argument("--release-date", default="2026-07-30")
    return parser.parse_args()


def pandoc_markdown(source: Path) -> str:
    with tempfile.TemporaryDirectory(prefix="dot-book-") as temp_dir:
        output = Path(temp_dir) / "book.md"
        subprocess.run(
            [
                "pandoc",
                str(source),
                "--from=docx",
                "--to=gfm",
                "--wrap=none",
                f"--output={output}",
            ],
            check=True,
        )
        return output.read_text(encoding="utf-8")


def citation_links(match: re.Match[str]) -> str:
    identifiers = [value.strip() for value in match.group(1).split(",")]
    return "".join(
        f"[{identifier.translate(SUPERSCRIPT)}]"
        f"({BOOK_ROUTE}/references#reference-{identifier})"
        for identifier in identifiers
    )


def clean_markdown(raw: str, spec: SectionSpec) -> str:
    text = raw.strip()
    text = text.removeprefix(spec.marker).lstrip()

    # The page shell supplies these existing manuscript headings.
    text = text.removeprefix(f"**{spec.title}**").lstrip()
    if spec.subtitle:
        text = text.removeprefix(f"*{spec.subtitle}*").lstrip()
    if spec.kind == "references":
        text = text.removeprefix("**References**").lstrip()

    # Internal manuscript headings become subordinate to the chapter heading
    # rendered by the web reader.
    text = re.sub(r"^## ", "### ", text, flags=re.MULTILINE)
    text = re.sub(r"^# ", "## ", text, flags=re.MULTILINE)

    # Pandoc expresses Word superscript citations as inline HTML. Convert them
    # to ordinary Markdown links so the public reader needs no raw-HTML mode.
    text = re.sub(r"<sup>([0-9,]+)</sup>", citation_links, text)
    text = re.sub(r"<u>(.*?)</u>", r"\1", text)

    if spec.kind == "references":
        text = re.sub(
            r"^\*\*(\d+)\.\*\*\s*",
            lambda match: f"### Reference {match.group(1)}\n\n",
            text,
            flags=re.MULTILINE,
        )

    return text.strip() + "\n"


def section_slice(markdown: str, spec: SectionSpec) -> str:
    start = markdown.find(spec.marker)
    if start < 0:
        raise ValueError(f"Missing manuscript marker: {spec.marker}")
    if spec.next_marker is None:
        return markdown[start:]
    end = markdown.find(spec.next_marker, start + len(spec.marker))
    if end < 0:
        raise ValueError(f"Missing manuscript marker: {spec.next_marker}")
    return markdown[start:end]


def word_count(markdown: str) -> int:
    without_urls = re.sub(r"https?://\S+", "", markdown)
    without_math = re.sub(r"\$\$.*?\$\$", "", without_urls, flags=re.DOTALL)
    return len(re.findall(r"\b[\w’'-]+\b", without_math))


def main() -> None:
    args = parse_args()
    source = args.input.resolve()
    output = args.output.resolve()
    sections_dir = output / "sections"
    sections_dir.mkdir(parents=True, exist_ok=True)

    markdown = pandoc_markdown(source)
    manifest_sections: list[dict[str, object]] = []

    for index, spec in enumerate(SECTIONS):
        content = clean_markdown(section_slice(markdown, spec), spec)
        content_path = sections_dir / f"{spec.slug}.md"
        content_path.write_text(content, encoding="utf-8")
        words = word_count(content)
        manifest_sections.append(
            {
                "id": f"dot-book-one-{spec.slug}",
                "order": index,
                "slug": spec.slug,
                "kind": spec.kind,
                "number": spec.number,
                "title": spec.title,
                "subtitle": spec.subtitle,
                "part": spec.part,
                "content_path": f"sections/{spec.slug}.md",
                "word_count": words,
                "reading_time_minutes": max(1, round(words / 220)),
                "related_concepts": list(spec.related_concepts),
            }
        )

    checksum = hashlib.sha256(source.read_bytes()).hexdigest()
    total_words = sum(
        int(section["word_count"]) for section in manifest_sections
    )
    equation_count = len(
        re.findall(r"^\$\$.*\$\$$", markdown, flags=re.MULTILINE)
    )
    reference_count = len(
        re.findall(r"^\*\*\d+\.\*\*", section_slice(markdown, SECTIONS[-1]), re.MULTILINE)
    )
    manifest = {
        "schema_version": "publication.release.v2",
        "generated_at": f"{args.release_date}T00:00:00Z",
        "source": {
            "format": "docx",
            "sha256": checksum,
        },
        "project": {
            "id": "dot-book-one",
            "owner_id": "henok",
            "type": "book",
            "series_title": "Digital Organism Theory",
            "title": "Consciousness: A Digital Organism",
            "subtitle": "The Development and Application of a Big Theory of Everything",
            "author": "Henok Ghebrechristos",
            "slug": "digital-organism-theory",
            "visibility": "public",
        },
        "release": {
            "id": "dot-book-one-foundational-v1",
            "version": 1,
            "status": "foundational-preview",
            "label": "Foundational edition",
            "published_at": None,
            "updated_at": args.release_date,
        },
        "extent": {
            "chapters": 6,
            "words": total_words,
            "equations": equation_count,
            "references": reference_count,
        },
        "reader_contract": {
            "finite": True,
            "autoplay": False,
            "claim_levels": [
                "Observation",
                "Model",
                "Hypothesis",
                "Speculation",
            ],
        },
        "sections": manifest_sections,
    }
    (output / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
