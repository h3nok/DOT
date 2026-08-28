#!/usr/bin/env python3
"""Release the current DOT Word manuscript to the reader and protected PDF.

The Word manuscript remains the editorial source of truth. This script uses
Pandoc for OOXML/OMML extraction, splits the result at the manuscript's existing
section markers, and writes finite Markdown reading units plus a release
manifest for the public DOT reader. It uses LibreOffice to produce one protected
digital PDF for authenticated delivery; the editable DOCX remains private.
"""

from __future__ import annotations

import argparse
import dataclasses
import datetime
import hashlib
import json
import os
import pathlib
import re
import shutil
import subprocess
import tempfile
from typing import Any

BOOK_ROUTE = "/book/digital-organism-theory"
PROTECTED_PDF_NAME = "digital-organism-theory-book-one.pdf"
LEGACY_PUBLIC_ARTIFACTS = (
    "consciousness-a-digital-organism-book-one-v2.docx",
    "consciousness-a-digital-organism-book-one-v2.pdf",
)
MACOS_LIBREOFFICE = "/Applications/LibreOffice.app/Contents/MacOS/soffice"
PANDOC_DATA_DIR = os.environ.get("PANDOC_DATA_DIR")


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


SECTIONS: tuple[
    SectionSpec,
    SectionSpec,
    SectionSpec,
    SectionSpec,
    SectionSpec,
    SectionSpec,
    SectionSpec,
    SectionSpec,
] = (
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

# These are editorial presentations, not new claims. Keeping them in the
# release pipeline means a refreshed DOCX produces the same reading grammar
# instead of requiring hand-edits to generated Markdown.
EDITORIAL_PASSAGES: dict[str, tuple[tuple[str, str], ...]] = {
    "preface": (
        (
            "\n\n".join(
                (
                    "Some are observations.",
                    "Some are models.",
                    "Some are hypotheses.",
                    "Some remain speculation.",
                    "That distinction governs the entire book.",
                )
            ),
            "\n>\n".join(
                (
                    "> **Epistemic key**",
                    "> Some are observations.",
                    "> Some are models.",
                    "> Some are hypotheses.",
                    "> Some remain speculation.",
                    "> That distinction governs the entire book.",
                )
            ),
        ),
        (
            "Feeling must be treated as data, but feeling is not automatically truth.",
            "> **Working definition**\n>\n> Feeling must be treated as data, but feeling is not automatically truth.",
        ),
        (
            "Love is the condition in which Fear no longer governs you.",
            "> **Working definition**\n>\n> Love is the condition in which Fear no longer governs you.",
        ),
    ),
    "the-digital-organism": (
        (
            "The distinction is essential:\n\nThe observation is that experience is mediated, recursive, embodied, and capable of self-modification. DOT’s cosmology supplies the source architecture from which those properties must follow; its foundational postulates remain hypotheses relative to public evidence.",
            "> **Claim boundary**\n>\n> The observation is that experience is mediated, recursive, embodied, and capable of self-modification. DOT’s cosmology supplies the source architecture from which those properties must follow; its foundational postulates remain hypotheses relative to public evidence.",
        ),
        (
            "The decisive question is empirical:\n\nWhat observations should follow if neural and biological processes are the in-Frame rendering of Little c rather than its producer, and how should those observations differ from a model that mistakes the interface for the whole?",
            "> **Open question**\n>\n> What observations should follow if neural and biological processes are the in-Frame rendering of Little c rather than its producer, and how should those observations differ from a model that mistakes the interface for the whole?",
        ),
        (
            "The Canvas carries. The Painting interprets. Character acts.",
            "> **Keep this distinction**\n>\n> The Canvas carries. The Painting interprets. Character acts.",
        ),
    ),
    "the-decoupling-principle": (
        (
            "This is the chapter’s governing hypothesis:\n\nLittle c authors Intent; the body renders action; consequence returns through the body and updates the Canvas.",
            "> **Model statement**\n>\n> Little c authors Intent; the body renders action; consequence returns through the body and updates the Canvas.",
        ),
        (
            "In plain language:\n\nLittle c moves first; the body follows.",
            "> **In plain language**\n>\n> Little c moves first; the body follows.",
        ),
    ),
    "architecture-of-continuity": (
        (
            "Primordial continuity is fundamental in the model.\n\nSeamless continuity inside a Reality Frame is engineered.",
            "> **Keep this distinction**\n>\n> Primordial continuity is fundamental in the model.\n>\n> Seamless continuity inside a Reality Frame is engineered.",
        ),
        (
            "Physics formalizes the runtime generated by RF₀.\n\nDOT must derive the runtime from its source architecture.",
            "> **Derivation boundary**\n>\n> Physics formalizes the runtime generated by RF₀.\n>\n> DOT must derive the runtime from its source architecture.",
        ),
        (
            "Delegate stability.\n\nPreserve continuity.\n\nLearn at the next level.",
            "> **The model in one movement**\n>\n> Delegate stability.\n>\n> Preserve continuity.\n>\n> Learn at the next level.",
        ),
    ),
    "reality-frames": (
        (
            "The Reality Frame is the wider environment and its rules.\n\nThe Reality Stream is what reaches the experiencer from moment to moment.",
            "> **Keep this distinction**\n>\n> The Reality Frame is the wider environment and its rules.\n>\n> The Reality Stream is what reaches the experiencer from moment to moment.",
        ),
        (
            "Freedom is not escape from constraint. It is increasing access to meaningful possibility within constraint.",
            "> **Working definition**\n>\n> Freedom is not escape from constraint. It is increasing access to meaningful possibility within constraint.",
        ),
        (
            "Intent does not command the world.\n\nIt commits the person to a lawful move within it.",
            "> **Keep this distinction**\n>\n> Intent does not command the world.\n>\n> It commits the person to a lawful move within it.",
        ),
        (
            "Outcome determines what must be repaired in the world.\n\nIntent helps determine what is being formed in the person.\n\nNeither erases the other.",
            "> **Keep this distinction**\n>\n> Outcome determines what must be repaired in the world.\n>\n> Intent helps determine what is being formed in the person.\n>\n> Neither erases the other.",
        ),
    ),
    "the-canvas": (
        (
            "**The Canvas carries.**\n\n**The Painting interprets.**\n\n**Character acts.**",
            "> **Keep this distinction**\n>\n> **The Canvas carries.**\n>\n> **The Painting interprets.**\n>\n> **Character acts.**",
        ),
        (
            "The Canvas carries the deltas.\n\nThe Painting is their accumulated organization.\n\nEvery loop begins from the state left by earlier loops.",
            "> **The model in one movement**\n>\n> The Canvas carries the deltas.\n>\n> The Painting is their accumulated organization.\n>\n> Every loop begins from the state left by earlier loops.",
        ),
        (
            "Include the feeling. Inspect what it may be carrying. Do not promote it into truth without further inquiry.",
            "> **Working definition**\n>\n> Include the feeling. Inspect what it may be carrying. Do not promote it into truth without further inquiry.",
        ),
        (
            "Fear is the governing contraction that organizes decision-space around a predicted threat.",
            "> **Working definition**\n>\n> Fear is the governing contraction that organizes decision-space around a predicted threat.",
        ),
        (
            "Little c mistakes a limited Painting for the whole self and organizes life around protecting it.",
            "> **Model statement**\n>\n> Little c mistakes a limited Painting for the whole self and organizes life around protecting it.",
        ),
    ),
    "the-painting": (
        (
            "The Canvas carries.\n\nThe Painting interprets.\n\nCharacter acts.",
            "> **Keep this distinction**\n>\n> The Canvas carries.\n>\n> The Painting interprets.\n>\n> Character acts.",
        ),
        (
            "Authorship is not omnipotence.\n\nIt is participation with increasing clarity.",
            "> **Keep this distinction**\n>\n> Authorship is not omnipotence.\n>\n> It is participation with increasing clarity.",
        ),
    ),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=pathlib.Path)
    parser.add_argument(
        "--output",
        default=pathlib.Path(
            "frontend/public/publications/henok/digital-organism-theory/v3"
        ),
        type=pathlib.Path,
    )
    parser.add_argument("--release-date", default=datetime.date.today().isoformat())
    parser.add_argument("--release-version", default=3, type=int)
    parser.add_argument("--release-label", default="Digital edition")
    parser.add_argument("--release-status", default="published")
    parser.add_argument("--pandoc", default=os.environ.get("PANDOC", "pandoc"))
    parser.add_argument(
        "--pandoc-data-dir",
        default=pathlib.Path(PANDOC_DATA_DIR) if PANDOC_DATA_DIR else None,
        type=pathlib.Path,
    )
    parser.add_argument(
        "--artifacts-output",
        default=pathlib.Path("backend/orchestrator/private/books"),
        type=pathlib.Path,
    )
    parser.add_argument(
        "--libreoffice",
        default=os.environ.get("LIBREOFFICE", "libreoffice"),
    )
    parser.add_argument(
        "--skip-artifacts",
        action="store_true",
        help="Rebuild only the web release and manifest.",
    )
    parser.add_argument(
        "--artifacts-only",
        action="store_true",
        help="Refresh the public digital PDF without running Pandoc.",
    )
    parser.add_argument(
        "--push",
        action="store_true",
        help="Publish through the orchestrator API (project → sections → release).",
    )
    parser.add_argument("--orchestrator-url", default="http://127.0.0.1:8000")
    parser.add_argument("--owner-id", default="henok")
    return parser.parse_args()


def resolve_executable(requested: str, *fallbacks: str) -> str:
    """Resolve a release tool while preserving explicit path overrides."""

    for candidate in (requested, *fallbacks):
        candidate_path = pathlib.Path(candidate).expanduser()
        if candidate_path.is_file() and os.access(candidate_path, os.X_OK):
            return str(candidate_path)
        resolved = shutil.which(candidate)
        if resolved:
            return resolved

    names = ", ".join((requested, *fallbacks))
    raise SystemExit(f"Required release tool not found: {names}")


def pandoc_markdown(
    source: pathlib.Path,
    pandoc: str,
    pandoc_data_dir: pathlib.Path | None,
) -> str:
    with tempfile.TemporaryDirectory(prefix="dot-book-") as temp_dir:
        output: pathlib.Path = pathlib.Path(temp_dir) / "book.md"
        command = [
            pandoc,
            str(source),
            "--from=docx",
            "--to=gfm",
            "--wrap=none",
            f"--output={output}",
        ]
        if pandoc_data_dir is not None:
            command.insert(1, f"--data-dir={pandoc_data_dir.resolve()}")
        subprocess.run(command, check=True)
        return output.read_text(encoding="utf-8")


def citation_links(match: re.Match[str]) -> str:
    identifiers: list[str | Any] = [
        value.strip() for value in match.group(1).split(",")
    ]
    return "".join(
        f"[{identifier.translate(SUPERSCRIPT)}]"
        f"({BOOK_ROUTE}/references#reference-{identifier})"
        for identifier in identifiers
    )


def apply_editorial_passages(text: str, spec: SectionSpec) -> str:
    for source, presentation in EDITORIAL_PASSAGES.get(spec.slug, ()):
        if presentation in text:
            continue
        text = text.replace(source, presentation, 1)
    return text


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

    # GFM's writer protects TeX as code. The reader has remark-math/KaTeX, so
    # restore ordinary dollar-delimited math after Pandoc has preserved the
    # Word equation itself.
    text: str = re.sub(
        r"``` math\n(.*?)\n```",
        lambda match: f"$$\n{match.group(1)}\n$$",
        text,
        flags=re.DOTALL,
    )
    text: str = re.sub(
        r"^\$\$(.+)\$\$$",
        lambda match: f"$$\n{match.group(1)}\n$$",
        text,
        flags=re.MULTILINE,
    )
    text: str = re.sub(r"\$`([^`\n]+)`\$", r"$\1$", text)

    if spec.kind == "references":
        text: str = re.sub(
            r"^\*\*(\d+)\.\*\*\s*",
            lambda match: f"### Reference {match.group(1)}\n\n",
            text,
            flags=re.MULTILINE,
        )

    text = apply_editorial_passages(text, spec)

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


def display_equation_count(markdown: str) -> int:
    """Count equations after Pandoc output has been normalized for the reader."""

    delimiters: int = len(re.findall(r"^\$\$\s*$", markdown, flags=re.MULTILINE))
    if delimiters % 2:
        raise ValueError("Unbalanced display-math delimiters in released Markdown")
    return delimiters // 2


def release_downloads(
    source: pathlib.Path,
    output: pathlib.Path,
    libreoffice: str,
) -> None:
    """Derive the protected digital PDF from the private manuscript."""

    output.mkdir(parents=True, exist_ok=True)
    for stale_name in LEGACY_PUBLIC_ARTIFACTS:
        (output / stale_name).unlink(missing_ok=True)

    with tempfile.TemporaryDirectory(prefix="dot-book-pdf-") as temp_dir:
        temp = pathlib.Path(temp_dir)
        profile = temp / "libreoffice-profile"
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
            f"-env:UserInstallation={profile.resolve().as_uri()}",
            "--headless",
            "--convert-to",
            "pdf:writer_pdf_Export",
            "--outdir",
            str(temp),
            str(source),
        ]
        subprocess.run(command, check=True, env=environment)
        generated_pdf = temp / f"{source.stem}.pdf"
        if not generated_pdf.exists():
            raise RuntimeError("LibreOffice completed without producing a PDF")
        shutil.copyfile(generated_pdf, output / PROTECTED_PDF_NAME)

    print(f"Released the digital edition from {source.name}:")
    print(f"  {output / PROTECTED_PDF_NAME}")


def main() -> None:
    args: argparse.Namespace = parse_args()
    source = args.input.resolve()
    output = args.output.resolve()
    artifacts_output = args.artifacts_output.resolve()

    if not source.is_file() or source.suffix.lower() != ".docx":
        raise SystemExit(f"Word manuscript not found: {source}")

    if args.artifacts_only:
        libreoffice = resolve_executable(
            args.libreoffice,
            "soffice",
            MACOS_LIBREOFFICE,
        )
        release_downloads(source, artifacts_output, libreoffice)
        return

    sections_dir = output / "sections"
    sections_dir.mkdir(parents=True, exist_ok=True)

    pandoc = resolve_executable(args.pandoc)
    markdown: str = pandoc_markdown(source, pandoc, args.pandoc_data_dir)
    manifest_sections: list[dict[str, object]] = []
    released_sections: list[str] = []

    for index, spec in enumerate(SECTIONS):
        content: str = clean_markdown(section_slice(markdown, spec), spec)
        released_sections.append(content)
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
    total_words: int = sum(int(section["word_count"]) for section in manifest_sections)
    # Pandoc 3.7 writes Word equations as fenced math while Ubuntu's Pandoc 3.1
    # writes display delimiters directly. `clean_markdown` normalizes both to
    # the reader's `$$` form, so the manifest must count that stable output.
    equation_count: int = sum(
        display_equation_count(content) for content in released_sections
    )
    reference_count: int = len(
        re.findall(
            r"^\*\*\d+\.\*\*", section_slice(markdown, SECTIONS[-1]), re.MULTILINE
        )
    )
    manifest = {
        "schema_version": "publication.release.v2",
        "generated_at": f"{args.release_date}T00:00:00Z",
        "source": {
            "format": "docx",
            "name": source.name,
            "sha256": checksum,
        },
        "project": {
            "id": "dot-book-one",
            "owner_id": "henok",
            "type": "book",
            "series_title": "Digital Organism Theory",
            "title": "Consciousness: A Digital Organism",
            "subtitle": "A Framework for Consciousness, Conditioning, and Conscious Authorship",
            "author": "Henok Ghebrechristos",
            "slug": "digital-organism-theory",
            "visibility": "public",
        },
        "release": {
            "id": f"dot-book-one-v{args.release_version}",
            "version": args.release_version,
            "status": args.release_status,
            "label": args.release_label,
            "published_at": args.release_date
            if args.release_status == "published"
            else None,
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

    if not args.skip_artifacts:
        libreoffice = resolve_executable(
            args.libreoffice,
            "soffice",
            MACOS_LIBREOFFICE,
        )
        release_downloads(source, artifacts_output, libreoffice)

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

    with httpx.Client(base_url=base_url, headers=headers, timeout=30) as client:
        projects = client.get("/v1/publications/projects")
        projects.raise_for_status()
        project: Any | None = next(
            (p for p in projects.json() if p["slug"] == slug), None
        )
        if project is None:
            created = client.post(
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

        existing = client.get(f"/v1/publications/projects/{project['id']}/sections")
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
                created = client.post(
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

            body: str = (sections_dir / f"{spec_section['slug']}.md").read_text(
                encoding="utf-8"
            )
            upload = client.put(
                f"/v1/publications/sections/{section['id']}/body",
                content=body.encode("utf-8"),
                headers={"Content-Type": "text/markdown"},
            )
            upload.raise_for_status()
            print(f"  Section synced: {spec_section['title']}")

        release = client.post(
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
