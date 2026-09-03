"""Space provisioning: an institution is a row plus a policy, never a codepath.

Used by the seed script and the isolation test suite. Idempotent by slug.
"""

from __future__ import annotations

import sqlalchemy
import sqlalchemy.ext.asyncio

import app.domains.academy.context as context
import app.domains.academy.models as models
import app.domains.academy.policy as policy


async def provision_space(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    slug: str,
    title: str,
    description: str | None,
    custodian_owner_id: str,
    steward_member_id: str,
    programs: list[tuple[str, str]],
    steward_roles: tuple[str, ...] = ("steward", "publisher", "contributor"),
) -> models.AcademySpace:
    """Create (or return) a space with policy v1 and a founding steward.

    The custodian and the steward are deliberately separate parameters:
    custody is operational, authority is the grants (P14).
    """

    existing = (
        await session.execute(
            sqlalchemy.select(models.AcademySpace).where(models.AcademySpace.slug == slug)
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    space = models.AcademySpace(
        slug=slug,
        title=title,
        description=description,
        custodian_owner_id=custodian_owner_id,
    )
    session.add(space)
    await session.flush()
    await context.bind_space(session, space.id, steward_member_id)

    policy_row = models.AcademyPolicy(
        academy_space_id=space.id,
        revision_number=1,
        body=policy.GOVERNANCE_POLICY_V1,
    )
    session.add(policy_row)
    await session.flush()
    space.governance_policy_revision_id = policy_row.id

    for order, (program_slug, program_title) in enumerate(programs):
        session.add(
            models.AcademyProgram(
                academy_space_id=space.id,
                slug=program_slug,
                title=program_title,
                display_order=order,
            )
        )

    membership = models.AcademyMembership(
        academy_space_id=space.id,
        member_id=steward_member_id,
        membership_state="active",
    )
    session.add(membership)
    await session.flush()

    for role in steward_roles:
        session.add(
            models.AcademyRoleGrant(
                academy_space_id=space.id,
                membership_id=membership.id,
                role=role,
                policy_revision_id=policy_row.id,
                granted_by=steward_member_id,
            )
        )

    session.add(
        models.AcademyEvent(
            academy_space_id=space.id,
            aggregate_type="space",
            aggregate_id=space.id,
            event_type="academy.space.provisioned",
            actor_id=steward_member_id,
            policy_revision_id=policy_row.id,
            payload={"slug": slug},
        )
    )
    await session.commit()
    return space
