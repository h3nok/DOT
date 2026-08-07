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
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import app.auth.dependencies
import app.db.session
import app.domains.canon.service as canon

REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
EDITION_ROOT = REPO_ROOT / "frontend/public/publications/henok/digital-organism-theory/v2"

#: Declared by the author, section by section. Absent means undeclared.
CLAIM_LEVELS_BY_SECTION: dict[str, str] = {}


def load_sections(root: pathlib.Path) -> tuple[str, str, list[canon.CanonSection]]:
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    edition_slug: str = manifest["project"]["slug"]
    edition_title: str = manifest["project"]["title"]

    sections: list[canon.CanonSection] = []
    for entry in manifest["sections"]:
        body = root / "sections" / f"{entry['slug']}.md"
        if not body.exists():
            raise SystemExit(f"missing section file: {body}")
        sections.append(
            canon.CanonSection(
                slug=entry["slug"],
                kind=entry["kind"],
                number=entry["number"],
                title=entry["title"],
                part=entry["part"],
                text=body.read_text(encoding="utf-8"),
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
    async with app.db.session.AsyncSessionLocal() as session:
        results = await canon.ingest_edition(
            session,
            owner,
            edition_slug=edition_slug,
            edition_title=edition_title,
            sections=sections,
        )

    written = sum(result.chunk_count for result in results if not result.unchanged)
    unchanged = sum(1 for result in results if result.unchanged)
    print(f"\ningested {len(results)} sections · {written} new chunks · {unchanged} unchanged")
    await app.db.session.engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--owner", default="henok")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    asyncio.run(main(args.owner, args.dry_run))
