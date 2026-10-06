"""Seed DOT Academy as the first space in the institution kernel (ADR-0032).

An institution is a row plus a policy, never a codepath. Idempotent by slug:
re-running finds the existing space and exits.

Environment:
  ACADEMY_CUSTODIAN_OWNER_ID  operational custodian (default: henok)
  ACADEMY_STEWARD_MEMBER_ID   founding steward's member/actor id (default: henok)
  ACADEMY_STEWARD_EMAIL       production: grant the member who signs in with this
                              address (created now if they have not signed in yet)
"""

from __future__ import annotations

import asyncio
import os
import pathlib
import sys

import sqlalchemy
import sqlalchemy.ext.asyncio

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import app.db.models
import app.db.session
import app.domains.academy.bootstrap
import app.domains.auth.service

CUSTODIAN_OWNER_ID: str = os.environ.get("ACADEMY_CUSTODIAN_OWNER_ID", "henok")
STEWARD_MEMBER_ID: str = os.environ.get("ACADEMY_STEWARD_MEMBER_ID", "henok")
STEWARD_EMAIL: str = os.environ.get("ACADEMY_STEWARD_EMAIL", "").strip()

#: DOT Academy's three programs (ADR-0030). Curation, not schema.
PROGRAMS: list[tuple[str, str]] = [
    ("theory", "Theory — definitions, diagrams, hypotheses"),
    ("critical-inquiry", "Critical Inquiry — objections, responses, experiments"),
    ("writing", "Writing — excerpts and essays"),
]


async def steward_member_id(session: sqlalchemy.ext.asyncio.AsyncSession, email: str) -> str:
    """Production sign-in identifies people by generated member id, not by a handle."""
    if not email:
        return STEWARD_MEMBER_ID
    email_hash = app.domains.auth.service._hash_email(email)
    member = await session.scalar(
        sqlalchemy.select(app.db.models.Member).where(app.db.models.Member.email_hash == email_hash)
    )
    if member is None:
        member = app.db.models.Member(email_hash=email_hash, role="owner")
        session.add(member)
        await session.commit()
    return member.id


async def seed() -> None:
    async with app.db.session.AsyncSessionLocal() as session:
        steward = await steward_member_id(session, STEWARD_EMAIL)
        space = await app.domains.academy.bootstrap.provision_space(
            session,
            slug="dot-academy",
            title="DOT Academy",
            description=(
                "Founder-stewarded public inquiry into Digital Organism Theory. "
                "A versioned public argument graph; not an accredited body."
            ),
            custodian_owner_id=CUSTODIAN_OWNER_ID,
            steward_member_id=steward,
            programs=PROGRAMS,
        )
        granted = await app.domains.academy.bootstrap.ensure_steward(
            session, space=space, steward_member_id=steward
        )
        print(f"Academy space ready: {space.slug} ({space.id}); steward granted now: {granted}")


if __name__ == "__main__":
    asyncio.run(seed())
