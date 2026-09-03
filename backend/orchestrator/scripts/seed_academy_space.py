"""Seed DOT Academy as the first space in the institution kernel (ADR-0032).

An institution is a row plus a policy, never a codepath. Idempotent by slug:
re-running finds the existing space and exits.

Environment:
  ACADEMY_CUSTODIAN_OWNER_ID  operational custodian (default: henok)
  ACADEMY_STEWARD_MEMBER_ID   founding steward's member/actor id (default: henok)
"""

from __future__ import annotations

import asyncio
import os
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import app.db.session
import app.domains.academy.bootstrap

CUSTODIAN_OWNER_ID: str = os.environ.get("ACADEMY_CUSTODIAN_OWNER_ID", "henok")
STEWARD_MEMBER_ID: str = os.environ.get("ACADEMY_STEWARD_MEMBER_ID", "henok")

#: DOT Academy's three programs (ADR-0030). Curation, not schema.
PROGRAMS: list[tuple[str, str]] = [
    ("theory", "Theory — definitions, diagrams, hypotheses"),
    ("critical-inquiry", "Critical Inquiry — objections, responses, experiments"),
    ("writing", "Writing — excerpts and essays"),
]


async def seed() -> None:
    async with app.db.session.AsyncSessionLocal() as session:
        space = await app.domains.academy.bootstrap.provision_space(
            session,
            slug="dot-academy",
            title="DOT Academy",
            description=(
                "Founder-stewarded public inquiry into Digital Organism Theory. "
                "A versioned public argument graph; not an accredited body."
            ),
            custodian_owner_id=CUSTODIAN_OWNER_ID,
            steward_member_id=STEWARD_MEMBER_ID,
            programs=PROGRAMS,
        )
        print(f"Academy space ready: {space.slug} ({space.id})")


if __name__ == "__main__":
    asyncio.run(seed())
