"""Ingest a released edition so the copilot can quote it.

Reads the published manifest and section files, then loads them as public canon
(ADR-0017). Re-running is safe: identical text is a no-op, revised text becomes a
new version, and nothing private is touched.

    python scripts/ingest_canon.py [--owner henok] [--dry-run]

Claim levels are declared, never inferred. Add them to CLAIM_LEVELS_BY_SECTION as
the author decides them; an undeclared section simply carries none.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import app.auth.dependencies
import app.db.session
import app.domains.canon.service as canon


def edition_root() -> pathlib.Path:
    configured = os.environ.get("ORCHESTRATOR_CANON_ROOT")
    if configured:
        return pathlib.Path(configured)
    repo_root = pathlib.Path(__file__).resolve().parents[3]
    return repo_root / "frontend/public/publications/henok/digital-organism-theory/v5"


EDITION_ROOT = edition_root()

#: Declared by the author, section by section. Absent means undeclared.
CLAIM_LEVELS_BY_SECTION: dict[str, str] = {}


def load_sections(root: pathlib.Path) -> tuple[str, str, list[canon.CanonSection]]:
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    if (
        manifest["release"]["status"] != "published"
        or manifest["project"]["visibility"] != "public"
    ):
        raise ValueError("Only a published public edition can become public canon")
    edition_slug: str = manifest["project"]["slug"]
    edition_title: str = manifest["project"]["title"]

    sections: list[canon.CanonSection] = []
    for entry in manifest["sections"]:
        body = root / "sections" / f"{entry['slug']}.md"
        if not body.exists():
            raise SystemExit(f"missing section file: {body}")
        text = body.read_text(encoding="utf-8")
        if manifest["release"]["version"] >= 5:
            expected = (
                manifest.get("integrity", {}).get("files", {}).get(f"sections/{entry['slug']}.md")
            )
            if not expected or hashlib.sha256(body.read_bytes()).hexdigest() != expected:
                raise ValueError(
                    f"Released section no longer matches its manifest: {entry['slug']}"
                )
            if "/_book-v5" in text or "/_preview/book-v5" in text:
                raise ValueError("A private proof cannot become public canon")
        # The reader renders captions from the edition manifest. Restore that
        # manuscript text beside each illustration before deriving AI chunks.
        for figure in manifest.get("figures", []):
            if figure.get("section") != entry["slug"]:
                continue
            figure_url = (
                f"/publications/henok/{edition_slug}/v{manifest['release']['version']}/"
                f"{figure['src']}"
            )
            pattern = r"!\[(?:\\.|[^\]])*\]\(" + re.escape(figure_url) + r"\)"
            caption = (
                f"Figure {figure['number']} · {figure['title']}. "
                f"{figure['claimLevel']}. {figure['caption']}\n\n"
                f"Illustration description: {figure['alt']}"
            )
            text, count = re.subn(pattern, lambda _, value=caption: value, text)
            if count != 1:
                raise ValueError(f"A canon illustration must occur exactly once: {figure['id']}")
        sections.append(
            canon.CanonSection(
                slug=entry["slug"],
                kind=entry["kind"],
                number=entry["number"],
                title=entry["title"],
                part=entry["part"],
                # Depth containers (ADR-0036) fold text in the reader; the canon
                # keeps the passage and drops only its marker lines.
                text=re.sub(r"^:::.*$\n?", "", text, flags=re.M),
                claim_level=CLAIM_LEVELS_BY_SECTION.get(entry["slug"]),
            )
        )
    return edition_slug, edition_title, sections


async def main(owner_id: str, dry_run: bool) -> None:
    edition_slug, edition_title, sections = load_sections(EDITION_ROOT)

    print(f"{edition_title} — {len(sections)} sections")
    for section in sections:
        marker = f" [{section.claim_level}]" if section.claim_level else ""
        print(f"  {canon.citation_label(edition_title, section)}{marker}")

    if dry_run:
        print("\ndry run — nothing written")
        return

    owner = app.auth.dependencies.OwnerContext(owner_id=owner_id, actor_id="ingest-canon")
    async with app.db.session.tenant_session(owner_id) as session:
        results = await canon.ingest_edition(
            session,
            owner,
            edition_slug=edition_slug,
            edition_title=edition_title,
            sections=sections,
        )

    written = sum(result.chunk_count for result in results if not result.unchanged)
    embedded = sum(result.embedded_count for result in results)
    unchanged = sum(1 for result in results if result.unchanged)
    print(
        f"\ningested {len(results)} sections · {written} new chunks · "
        f"{embedded} embedded · {unchanged} unchanged"
    )
    await app.db.session.engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--owner", default="henok")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    asyncio.run(main(args.owner, args.dry_run))
