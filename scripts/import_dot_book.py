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
import dataclasses
import pathlib
from typing import Any

from httpx import Client, Response
from httpx._models import Response

BOOK_ROUTE = "/book/digital-organism-theory"


@dataclasses.dataclass(frozen=True)
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


SECTIONS: tuple[SectionSpec, SectionSpec, SectionSpec, SectionSpec, SectionSpec, SectionSpec, SectionSpec, SectionSpec] = (
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


SUPERSCRIPT: dict[int, int] = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=pathlib.Path)
    parser.add_argument(
        "--output",
        default=pathlib.Path(
            "frontend/public/publications/henok/digital-organism-theory/v1"
        ),
        type=pathlib.Path,
    )
    parser.add_argument("--release-date", default="2026-07-30")
    parser.add_argument(
        "--push",
        action="store_true",
        help="Publish through the orchestrator API (project → sections → release).",
    )
    parser.add_argument("--orchestrator-url", default="http://127.0.0.1:8000")
    parser.add_argument("--owner-id", default="habte")
    return parser.parse_args()


def pandoc_markdown(source: pathlib.Path) -> str:
    with tempfile.TemporaryDirectory(prefix="dot-book-") as temp_dir: str: str:
        output: pathlib.Path = pathlib.Path(temp_dir) / "book.md"
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
    identifiers: list[str | Any] = [value.strip() for value in match.group(1).split(",")]
    return "".join(
        f"[{identifier.translate(SUPERSCRIPT)}]"
        f"({BOOK_ROUTE}/references#reference-{identifier})"
        for identifier in identifiers
    )


def clean_markdown(raw: str, spec: SectionSpec) -> str:
    text: str = raw.strip()
    text: str = text.removeprefix(spec.marker).lstrip()

    # The page shell supplies these existing manuscript headings.
    text: str = text.removeprefix(f"**{spec.title}**").lstrip()
    if spec.subtitle:
        text: str = text.removeprefix(f"*{spec.subtitle}*").lstrip()
    if spec.kind == "references":
        text: str = text.removeprefix("**References**").lstrip()

    # Internal manuscript headings become subordinate to the chapter heading
    # rendered by the web reader.
    text: str = re.sub(r"^## ", "### ", text, flags=re.MULTILINE)
    text: str = re.sub(r"^# ", "## ", text, flags=re.MULTILINE)

    # Pandoc expresses Word superscript citations as inline HTML. Convert them
    # to ordinary Markdown links so the public reader needs no raw-HTML mode.
    text: str = re.sub(r"<sup>([0-9,]+)</sup>", citation_links, text)
    text: str = re.sub(r"<u>(.*?)</u>", r"\1", text)

    if spec.kind == "references":
        text: str = re.sub(
            r"^\*\*(\d+)\.\*\*\s*",
            lambda match: f"### Reference {match.group(1)}\n\n",
            text,
            flags=re.MULTILINE,
        )

    return text.strip() + "\n"


def section_slice(markdown: str, spec: SectionSpec) -> str:
    start: int = markdown.find(spec.marker)
    if start < 0:
        raise ValueError(f"Missing manuscript marker: {spec.marker}")
    if spec.next_marker is None:
        return markdown[start:]
    end: int = markdown.find(spec.next_marker, start + len(spec.marker))
    if end < 0:
        raise ValueError(f"Missing manuscript marker: {spec.next_marker}")
    return markdown[start:end]


def word_count(markdown: str) -> int:
    without_urls: str = re.sub(r"https?://\S+", "", markdown)
    without_math: str = re.sub(r"\$\$.*?\$\$", "", without_urls, flags=re.DOTALL)
    return len(re.findall(r"\b[\w’'-]+\b", without_math))


def main() -> None:
    args: argparse.Namespace = parse_args()
    source = args.input.resolve()
    output = args.output.resolve()
    sections_dir = output / "sections"
    sections_dir.mkdir(parents=True, exist_ok=True)

    markdown: str = pandoc_markdown(source)
    manifest_sections: list[dict[str, object]] = []

    for index, spec in enumerate(SECTIONS):
        content: str = clean_markdown(section_slice(markdown, spec), spec)
        content_path = sections_dir / f"{spec.slug}.md"
        content_path.write_text(content, encoding="utf-8")
        words: int = word_count(content)
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

    checksum: str = hashlib.sha256(source.read_bytes()).hexdigest()
    total_words: int = sum(
        int(section["word_count"]) for section in manifest_sections
    )
    equation_count: int = len(
        re.findall(r"^\$\$.*\$\$$", markdown, flags=re.MULTILINE)
    )
    reference_count: int = len(
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

    if args.push:
        push_to_orchestrator(
            base_url=args.orchestrator_url.rstrip("/"),
            owner_id=args.owner_id,
            manifest=manifest,
            sections_dir=sections_dir,
            source_sha=checksum,
        )


def push_to_orchestrator(
    *,
    base_url: str,
    owner_id: str,
    manifest: dict,
    sections_dir: pathlib.Path,
    source_sha: str,
) -> None:
    """Publish the extracted book through the orchestrator API, idempotently."""
    try:
        import httpx
    except ImportError:
        raise SystemExit("--push requires httpx (activate the orchestrator venv).")

    headers: dict[str, str] = {"X-Owner-Id": owner_id}
    project_meta = {
        "series_title": manifest["project"]["series_title"],
        "subtitle": manifest["project"]["subtitle"],
        "author": manifest["project"]["author"],
        "source": manifest["source"],
        "extent": manifest["extent"],
        "reader_contract": manifest["reader_contract"],
        "label": manifest["release"]["label"],
    }
    slug = manifest["project"]["slug"]

    with httpx.Client(base_url=base_url, headers=headers, timeout=30) as client: Client: Client:
        projects: Response = client.get("/v1/publications/projects")
        projects.raise_for_status()
        project: Any | None = next((p for p in projects.json() if p["slug"] == slug), None)
        if project is None:
            created: Response = client.post(
                "/v1/publications/projects",
                json={
                    "title": manifest["project"]["title"],
                    "slug": slug,
                    "type": "book",
                    "visibility": "public",
                    "meta": project_meta,
                },
            )
            created.raise_for_status()
            project = created.json()
            print(f"Created project {project['id']} ({slug})")
        else:
            client.patch(
                f"/v1/publications/projects/{project['id']}",
                json={"visibility": "public", "meta": project_meta},
            ).raise_for_status()
            print(f"Using project {project['id']} ({slug})")

        existing: Response = client.get(f"/v1/publications/projects/{project['id']}/sections")
        existing.raise_for_status()
        by_title: dict[Any, Any] = {s["title"]: s for s in existing.json()}

        for spec_section in manifest["sections"]:
            section_meta = {
                "slug": spec_section["slug"],
                "kind": spec_section["kind"],
                "number": spec_section["number"],
                "subtitle": spec_section["subtitle"],
                "part": spec_section["part"],
                "word_count": spec_section["word_count"],
                "reading_time_minutes": spec_section["reading_time_minutes"],
                "related_concepts": spec_section["related_concepts"],
            }
            section: Any | None = by_title.get(spec_section["title"])
            if section is None:
                created: Response = client.post(
                    f"/v1/publications/projects/{project['id']}/sections",
                    json={
                        "title": spec_section["title"],
                        "order": spec_section["order"],
                        "meta": section_meta,
                    },
                )
                created.raise_for_status()
                section = created.json()
            else:
                client.patch(
                    f"/v1/publications/sections/{section['id']}",
                    json={"order": spec_section["order"], "meta": section_meta},
                ).raise_for_status()

            body: str = (sections_dir / f"{spec_section['slug']}.md").read_text(encoding="utf-8")
            upload: Response = client.put(
                f"/v1/publications/sections/{section['id']}/body",
                content=body.encode("utf-8"),
                headers={"Content-Type": "text/markdown"},
            )
            upload.raise_for_status()
            print(f"  Section synced: {spec_section['title']}")

        release: Response = client.post(
            f"/v1/publications/projects/{project['id']}/releases",
            json={},
            headers={"Idempotency-Key": f"import-{source_sha[:16]}"},
        )
        release.raise_for_status()
        data = release.json()
        print(
            f"Released v{data['version']} — read at "
            f"{base_url}/v1/publications/delivery/{owner_id}/{slug}/manifest"
        )


if __name__ == "__main__":
    main()
