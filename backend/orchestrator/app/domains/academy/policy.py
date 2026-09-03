"""Authority resolution (doc 14 §14; doc 13 §8).

Authority is only ever an active, scoped role grant under a versioned policy.
Custody, authorship, founder identity, and infrastructure access confer no
editorial power (P14). Every check resolves the active grant and returns the
policy revision that governs the transition, so releases can record it.
"""

from __future__ import annotations

import dataclasses
import datetime

import fastapi
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.domains.academy.models as models

#: Action -> roles that may perform it. Roles do not imply one another; a
#: steward who must also publish holds both grants explicitly.
ACTION_ROLES: dict[str, frozenset[str]] = {
    "create_work": frozenset({"contributor", "program_editor", "steward"}),
    "update_work": frozenset({"contributor", "program_editor", "steward"}),
    "create_revision": frozenset({"contributor", "program_editor", "steward"}),
    "annotate_revision": frozenset({"contributor", "program_editor", "steward"}),
    "submit_revision": frozenset({"contributor", "program_editor", "steward"}),
    "release": frozenset({"publisher"}),
    "withdraw": frozenset({"publisher", "steward"}),
    "read_private": frozenset(
        {"reader", "contributor", "reviewer", "program_editor", "publisher", "steward"}
    ),
}

#: Policy v1: founder-stewarded self-release, recorded honestly as policy
#: rather than hidden in code defaults (doc 13 §8.2).
GOVERNANCE_POLICY_V1: dict = {
    "version": 1,
    "review": {"required_for_release": False, "note": "Founder-steward may self-release."},
    "release_approvals_required": 1,
    "conflict_disclosure_required": False,
    "correction_procedure": "New revision and release; withdrawals leave a tombstone.",
}


@dataclasses.dataclass(frozen=True)
class Authority:
    """Proof that one actor may perform one action in one space, under a policy."""

    space_id: str
    actor_id: str
    membership_id: str
    role: str
    policy_revision_id: str


class AuthorityError(fastapi.HTTPException):
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=fastapi.status.HTTP_403_FORBIDDEN, detail=detail)


async def require_authority(
    session: sqlalchemy.ext.asyncio.AsyncSession,
    *,
    space_id: str,
    actor_id: str,
    action: str,
    program_id: str | None = None,
) -> Authority:
    """Resolve an active grant permitting `action`, or raise 403.

    Fails closed: unknown actions are denied rather than defaulted.
    """

    allowed_roles: frozenset[str] | None = ACTION_ROLES.get(action)
    if allowed_roles is None:
        raise AuthorityError(f"Unknown academy action: {action}")

    membership = (
        await session.execute(
            sqlalchemy.select(models.AcademyMembership).where(
                models.AcademyMembership.academy_space_id == space_id,
                models.AcademyMembership.member_id == actor_id,
                models.AcademyMembership.membership_state == "active",
            )
        )
    ).scalar_one_or_none()
    if membership is None:
        raise AuthorityError("No active membership in this academy space.")

    now = datetime.datetime.now(datetime.UTC)
    grants = (
        (
            await session.execute(
                sqlalchemy.select(models.AcademyRoleGrant).where(
                    models.AcademyRoleGrant.academy_space_id == space_id,
                    models.AcademyRoleGrant.membership_id == membership.id,
                    models.AcademyRoleGrant.revoked_at.is_(None),
                )
            )
        )
        .scalars()
        .all()
    )
    for grant in grants:
        if grant.role not in allowed_roles:
            continue
        valid_from = grant.valid_from
        if valid_from is not None and valid_from.tzinfo is None:
            valid_from = valid_from.replace(tzinfo=datetime.UTC)
        if valid_from is not None and valid_from > now:
            continue
        valid_until = grant.valid_until
        if valid_until is not None and valid_until.tzinfo is None:
            valid_until = valid_until.replace(tzinfo=datetime.UTC)
        if valid_until is not None and valid_until <= now:
            continue
        # A program-scoped grant only reaches works in that program.
        if grant.program_scope is not None and grant.program_scope != program_id:
            continue
        return Authority(
            space_id=space_id,
            actor_id=actor_id,
            membership_id=membership.id,
            role=grant.role,
            policy_revision_id=grant.policy_revision_id,
        )

    raise AuthorityError(f"No active grant permits '{action}' in this space.")
