"""Seed Book One as a publication project in the orchestrator.

Reads the static release manifest and section Markdown files that
`import_dot_book.py` already produced, and creates a matching project,
sections, and body objects in the orchestrator database so the
Publication Studio can manage the book.

Idempotent: re-running skips the project if it already exists.
"""

from __future__ import annotations

import asyncio
import json
import os
import pathlib
import sys

import sqlalchemy

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import app.auth.dependencies
import app.db.models
import app.db.session
import app.domains.publication.schemas
import app.domains.publication.service

OWNER_ID: str = os.environ.get("BOOK_OWNER_ID", "henok")
REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
MANIFEST_PATH = REPO_ROOT / (
    "frontend/public/publications/henok/digital-organism-theory/v3/manifest.json"
)
SECTIONS_DIR = MANIFEST_PATH.parent / "sections"


async def seed_book() -> None:
    owner = app.auth.dependencies.OwnerContext(
        owner_id=OWNER_ID,
        actor_id="seed-book-project",
        role="admin",
    )

    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)

    project_meta = manifest["project"].get("meta") or {}
    project_slug = manifest["project"]["slug"]

    async with app.db.session.AsyncSessionLocal() as session:
        existing: sqlalchemy.Result[
            tuple[app.db.models.PublicationProject]
        ] = await session.execute(
            sqlalchemy.select(app.db.models.PublicationProject).where(
                app.db.models.PublicationProject.owner_id == owner.owner_id,
                app.db.models.PublicationProject.slug == project_slug,
            )
        )
        if existing.scalar_one_or_none() is not None:
            print(f"Project '{project_slug}' already exists — skipping.")
            await app.db.session.engine.dispose()
            return

        project = await app.domains.publication.service.create_project(
            session,
            owner,
            app.domains.publication.schemas.PublicationProjectCreate(
                title=manifest["project"]["title"],
                slug=project_slug,
                type=manifest["project"].get("type", "book"),
                visibility=manifest["project"].get("visibility", "public"),
                meta=project_meta,
            ),
        )
        print(f"Created project: {project.title} ({project.id})")

        for section_data in manifest["sections"]:
            content_path = section_data.get("content_path", "")
            section_meta = {
                k: section_data[k]
                for k in (
                    "slug",
                    "kind",
                    "number",
                    "subtitle",
                    "part",
                    "word_count",
                    "reading_time_minutes",
                    "related_concepts",
                )
                if k in section_data and section_data[k] is not None
            }

            section = await app.domains.publication.service.create_section(
                session,
                owner,
                project.id,
                app.domains.publication.schemas.PublicationSectionCreate(
                    order=section_data["order"],
                    title=section_data["title"],
                    meta=section_meta or None,
                ),
            )

            # Load the Markdown body from the static files and store it.
            if content_path:
                md_path = MANIFEST_PATH.parent / content_path
                if md_path.exists():
                    body_text = md_path.read_text(encoding="utf-8")
                    await app.domains.publication.service.set_section_body(
                        session, owner, section.id, body_text
                    )
                    print(
                        f"  Section {section_data['order']}: {section_data['title']} ({len(body_text)} chars)"
                    )
                else:
                    print(
                        f"  Section {section_data['order']}: {section_data['title']} (no file at {md_path})"
                    )
            else:
                print(
                    f"  Section {section_data['order']}: {section_data['title']} (no content_path)"
                )

        try:
            release = await app.domains.publication.service.create_release(
                session,
                owner,
                project.id,
                app.domains.publication.schemas.PublicationReleaseCreate(
                    slug=project_slug,
                ),
                idempotency_key="seed-book-one-v1",
            )
            print(f"Created release v{release.version} ({release.id})")
        except Exception as exc:
            print(f"Release creation skipped: {exc}")
            print("  You can publish from the Studio once the object store is writable.")

    await app.db.session.engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_book())
