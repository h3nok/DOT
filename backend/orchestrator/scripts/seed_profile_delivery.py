from __future__ import annotations

import asyncio
import os
import pathlib
import sys

import sqlalchemy

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import app.auth.dependencies
import app.db.models
import app.db.session
import app.domains.publication
import app.domains.publication.schemas
import app.domains.publication.service

OWNER_ID: str = os.environ.get("PROFILE_DELIVERY_OWNER_ID", "henok")
PROJECT_SLUG: str = os.environ.get("PROFILE_DELIVERY_SLUG", "henok-profile")
DISPLAY_NAME = "Henok Ghebrechristos, PhD"

PROFILE_SECTIONS: list[dict[str, str]] = [
    {
        "title": "Public Identity Anchor",
        "body_ref": f"profile-delivery://{OWNER_ID}/public-identity-anchor",
    },
    {
        "title": "Publication Engine",
        "body_ref": f"profile-delivery://{OWNER_ID}/publication-engine",
    },
    {
        "title": "Founding Access",
        "body_ref": f"profile-delivery://{OWNER_ID}/founding-access",
    },
    {
        "title": "Trust Contract",
        "body_ref": f"profile-delivery://{OWNER_ID}/trust-contract",
    },
]


async def get_or_create_project(
    owner: app.auth.dependencies.OwnerContext,
) -> app.db.models.PublicationProject:
    async with app.db.session.AsyncSessionLocal() as session:
        result: sqlalchemy.Result[tuple[app.db.models.PublicationProject]] = await session.execute(
            sqlalchemy.select(app.db.models.PublicationProject).where(
                app.db.models.PublicationProject.owner_id == owner.owner_id,
                app.db.models.PublicationProject.slug == PROJECT_SLUG,
            )
        )
        project: app.db.models.PublicationProject | None = result.scalar_one_or_none()
        if project is not None:
            return project

        return await app.domains.publication.service.create_project(
            session,
            owner,
            app.domains.publication.schemas.PublicationProjectCreate(
                title="Henok Ghebrechristos Profile Delivery",
                slug=PROJECT_SLUG,
                type="profile",
                visibility="public",
                meta={
                    "display_name": DISPLAY_NAME,
                    "credential": "PhD in Computer Science",
                },
            ),
        )


async def seed_profile_delivery() -> None:
    owner = app.auth.dependencies.OwnerContext(
        owner_id=OWNER_ID,
        actor_id="seed-profile-delivery",
        role="admin",
    )
    project: app.db.models.PublicationProject = await get_or_create_project(owner)

    async with app.db.session.AsyncSessionLocal() as session:
        sections: list[
            app.db.models.PublicationSection
        ] = await app.domains.publication.service.list_release_sections(
            session,
            project.id,
        )
        if not sections:
            for order, section in enumerate(PROFILE_SECTIONS):
                await app.domains.publication.service.create_section(
                    session,
                    owner,
                    project.id,
                    app.domains.publication.schemas.PublicationSectionCreate(
                        order=order,
                        title=section["title"],
                        body_ref=section["body_ref"],
                    ),
                )

        release: app.db.models.PublicationRelease = (
            await app.domains.publication.service.create_release(
                session,
                owner,
                project.id,
                app.domains.publication.schemas.PublicationReleaseCreate(
                    slug=PROJECT_SLUG,
                ),
                idempotency_key="seed-profile-delivery-v1",
            )
        )

    print(
        "Seeded profile delivery:",
        f"owner={OWNER_ID}",
        f"slug={PROJECT_SLUG}",
        f"release=v{release.version}",
        f"manifest={release.manifest_key}",
    )
    await app.db.session.engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_profile_delivery())
