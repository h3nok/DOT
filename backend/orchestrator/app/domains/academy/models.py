"""Academy kernel models (ADR-0030, ADR-0031, ADR-0032).

One kernel, many institutions: every table carries a NOT NULL `academy_space_id`
so a second academy is a row, never a fork (doc 14 P14). Revisions and events
are immutable; releases move only through their state machine; the public reads
a projection table, never these rows (doc 14 P2, P9).
"""

from __future__ import annotations

import datetime

import sqlalchemy
import sqlalchemy.orm

import app.db.models

#: Closed union (doc 14 §4.2). New kinds require a migration and an editorial contract.
WORK_KINDS: tuple[str, ...] = (
    "definition",
    "diagram",
    "hypothesis",
    "objection",
    "response",
    "experiment",
    "excerpt",
    "essay",
)

#: Claim classification (doc 14 §4.2). "supported" never means "true".
EPISTEMIC_LEVELS: tuple[str, ...] = ("Observation", "Model", "Hypothesis", "Speculation")
CLAIM_STATES: tuple[str, ...] = (
    "proposed",
    "operationalized",
    "under_test",
    "supported",
    "not_supported",
    "inconclusive",
    "revised",
    "retired",
)
CLAIM_CONTEXT_ROLES: tuple[str, ...] = ("academy_position", "represented_account")
#: Provenance state at release (P4): sourced, author-originated, or explicit absence.
CLAIM_ORIGINS: tuple[str, ...] = ("sourced", "author_originated", "no_external_source")

#: Typed relation vocabulary (doc 14 §6). supports/does_not_support are reserved
#: until released experiment results exist (Phase 5); the service rejects them.
RELATION_PREDICATES: tuple[str, ...] = (
    "depends_on",
    "defines",
    "leads_to",
    "contrasts_with",
    "applies_to",
    "cites",
    "derives_from",
    "quotes",
    "objects_to",
    "responds_to",
    "tests",
    "supports",
    "does_not_support",
    "revises",
    "supersedes",
)

WORK_LIFECYCLE_STATES: tuple[str, ...] = (
    "draft",
    "in_review",
    "candidate",
    "released",
    "withdrawn",
    "retired",
)
RELEASE_STATUSES: tuple[str, ...] = ("preparing", "released", "failed", "withdrawn")
VISIBILITIES: tuple[str, ...] = ("private", "circle", "public")

#: Scoped institutional roles (doc 14 §14; doc 13 §8.1). "Admin" is not a role.
ACADEMY_ROLES: tuple[str, ...] = (
    "reader",
    "contributor",
    "reviewer",
    "program_editor",
    "publisher",
    "steward",
    "archivist",
)

MEMBERSHIP_STATES: tuple[str, ...] = ("invited", "active", "ended")


def _in(column: str, values: tuple[str, ...]) -> str:
    quoted = ", ".join(f"'{value}'" for value in values)
    return f"{column} IN ({quoted})"


class AcademySpace(app.db.models.Base, app.db.models.TimestampMixin):
    """One governed institution. DOT Academy is a row here, not a codepath."""

    __tablename__ = "academy_spaces"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("aspace")
    )
    slug: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), unique=True, nullable=False, index=True
    )
    title: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), nullable=False
    )
    description: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.Text())
    # active | dormant | closed
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="active"
    )
    #: Operational custody only. Confers zero editorial authority (P14); tests
    #: enforce that a custodian without grants cannot transition anything.
    custodian_owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    governance_policy_revision_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )


class AcademyPolicy(app.db.models.Base):
    """Versioned governance policy. Releases record the revision they passed under."""

    __tablename__ = "academy_policies"
    __table_args__ = (sqlalchemy.UniqueConstraint("academy_space_id", "revision_number"),)

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("apol")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    revision_number: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False
    )
    body: sqlalchemy.orm.Mapped[dict] = sqlalchemy.orm.mapped_column(
        sqlalchemy.JSON(), nullable=False
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )


class AcademyProgram(app.db.models.Base, app.db.models.TimestampMixin):
    """Per-space curation (ADR-0032): programs are data, kinds are schema."""

    __tablename__ = "academy_programs"
    __table_args__ = (sqlalchemy.UniqueConstraint("academy_space_id", "slug"),)

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("aprog")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    slug: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), nullable=False
    )
    title: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), nullable=False
    )
    charter: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.Text())
    display_order: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False, default=0
    )


class AcademyMembership(app.db.models.Base):
    __tablename__ = "academy_memberships"
    __table_args__ = (
        sqlalchemy.UniqueConstraint("academy_space_id", "member_id"),
        sqlalchemy.CheckConstraint(
            _in("membership_state", MEMBERSHIP_STATES), name="ck_academy_membership_state"
        ),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("amem")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    member_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False, index=True
    )
    membership_state: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="active"
    )
    invited_by: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    joined_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )
    ended_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )


class AcademyRoleGrant(app.db.models.Base):
    """Authority is only ever an active scoped grant under a policy (P14)."""

    __tablename__ = "academy_role_grants"
    __table_args__ = (
        sqlalchemy.CheckConstraint(_in("role", ACADEMY_ROLES), name="ck_academy_grant_role"),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("agrant")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    membership_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_memberships.id"), nullable=False, index=True
    )
    role: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False
    )
    program_scope: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_programs.id")
    )
    work_scope: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    policy_revision_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_policies.id"), nullable=False
    )
    granted_by: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    valid_from: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )
    valid_until: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    revoked_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )


class AcademyWork(app.db.models.Base, app.db.models.TimestampMixin):
    """Stable identity of one intellectual object (P1). Slugs are never recycled."""

    __tablename__ = "academy_works"
    __table_args__ = (
        sqlalchemy.UniqueConstraint("academy_space_id", "canonical_slug"),
        sqlalchemy.CheckConstraint(_in("kind", WORK_KINDS), name="ck_academy_work_kind"),
        sqlalchemy.CheckConstraint(
            _in("lifecycle_state", WORK_LIFECYCLE_STATES), name="ck_academy_work_state"
        ),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("awork")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    kind: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, index=True
    )
    canonical_slug: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(160), nullable=False
    )
    program_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_programs.id"), index=True
    )
    visibility: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(16), nullable=False, default="private"
    )
    lifecycle_state: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="draft", index=True
    )
    created_by: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )


class AcademyRevision(app.db.models.Base):
    """Immutable snapshot. There is no updated_at, ever (P1)."""

    __tablename__ = "academy_revisions"
    __table_args__ = (sqlalchemy.UniqueConstraint("work_id", "revision_number"),)

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("arev")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    work_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_works.id"), nullable=False, index=True
    )
    revision_number: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False
    )
    schema_version: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False, default=1
    )
    title: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), nullable=False
    )
    summary: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.Text())
    body_ref: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(512), nullable=False
    )
    body_media_type: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False, default="text/markdown"
    )
    content_hash: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    language: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(16), nullable=False, default="en"
    )
    change_note: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.Text())
    created_by: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )


class AcademyRelease(app.db.models.Base):
    """preparing → released | failed; released → withdrawn. Nothing else (P2)."""

    __tablename__ = "academy_releases"
    __table_args__ = (
        sqlalchemy.UniqueConstraint("work_id", "release_number"),
        sqlalchemy.CheckConstraint(
            _in("release_status", RELEASE_STATUSES), name="ck_academy_release_status"
        ),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("arel")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    work_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_works.id"), nullable=False, index=True
    )
    revision_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_revisions.id"), nullable=False
    )
    release_number: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False
    )
    release_status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="preparing", index=True
    )
    visibility: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(16), nullable=False, default="public"
    )
    manifest_ref: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(512)
    )
    manifest_hash: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    policy_revision_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_policies.id")
    )
    prepared_by: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    prepared_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )
    released_by: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    released_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    withdrawn_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    withdrawal_reason: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Text()
    )
    failure_reason: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Text()
    )
    supersedes_release_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )


class AcademyClaim(app.db.models.Base):
    """Stable claim identity, addressable below the document (P3)."""

    __tablename__ = "academy_claims"
    __table_args__ = (sqlalchemy.UniqueConstraint("work_id", "canonical_key"),)

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("aclaim")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    work_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_works.id"), nullable=False, index=True
    )
    canonical_key: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(160), nullable=False
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )


class AcademyClaimRevision(app.db.models.Base):
    """The claim's statement as it appeared in one work revision. Immutable."""

    __tablename__ = "academy_claim_revisions"
    __table_args__ = (
        sqlalchemy.UniqueConstraint("claim_id", "academy_revision_id"),
        sqlalchemy.CheckConstraint(
            _in("epistemic_level", EPISTEMIC_LEVELS), name="ck_academy_claim_level"
        ),
        sqlalchemy.CheckConstraint(_in("claim_state", CLAIM_STATES), name="ck_academy_claim_state"),
        sqlalchemy.CheckConstraint(
            _in("context_role", CLAIM_CONTEXT_ROLES), name="ck_academy_claim_role"
        ),
        sqlalchemy.CheckConstraint(_in("origin", CLAIM_ORIGINS), name="ck_academy_claim_origin"),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("aclrev")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    claim_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_claims.id"), nullable=False, index=True
    )
    academy_revision_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_revisions.id"), nullable=False, index=True
    )
    statement: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Text(), nullable=False
    )
    context_role: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="academy_position"
    )
    epistemic_level: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(16), nullable=False
    )
    claim_state: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="proposed"
    )
    #: P4 — provenance is a visible state, never an omitted field.
    origin: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False
    )
    origin_note: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.Text())
    assumptions: sqlalchemy.orm.Mapped[list | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.JSON()
    )
    failure_conditions: sqlalchemy.orm.Mapped[list | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.JSON()
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )


class AcademyRelation(app.db.models.Base):
    """Typed, versioned assertion between works or claims."""

    __tablename__ = "academy_relations"
    __table_args__ = (
        sqlalchemy.CheckConstraint(
            _in("predicate", RELATION_PREDICATES), name="ck_academy_relation_predicate"
        ),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("arelt")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    asserted_in_revision_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_revisions.id"), nullable=False, index=True
    )
    source_work_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_works.id"), nullable=False, index=True
    )
    source_claim_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_claims.id")
    )
    predicate: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, index=True
    )
    target_work_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_works.id"), index=True
    )
    target_claim_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_claims.id")
    )
    #: Cross-boundary targets (book canon, external sources) are explicit
    #: identifiers, never collapsed into work rows (P5).
    target_external: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(512)
    )
    note: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.Text())
    confidence: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32)
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )


class AcademySourceLink(app.db.models.Base):
    """Precise provenance: internal source anchor or external identifier (P4)."""

    __tablename__ = "academy_source_links"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("asrcl")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    academy_revision_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_revisions.id"), nullable=False, index=True
    )
    claim_revision_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_claim_revisions.id"), index=True
    )
    source_object_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    source_version_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    source_anchor_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    external_uri: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(1024)
    )
    external_identifier: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256)
    )
    relation: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="cites"
    )
    locator: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(512)
    )
    quotation_hash: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    accessed_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )


class AcademyContribution(app.db.models.Base):
    """Credit snapshot on a revision; later profile edits never rewrite history."""

    __tablename__ = "academy_contributions"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("acont")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    academy_revision_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_revisions.id"), nullable=False, index=True
    )
    member_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    public_person_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    display_name_snapshot: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), nullable=False
    )
    role: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    degree: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.String(32))
    orcid_snapshot: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    affiliation_snapshot: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256)
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )


class AcademyEvent(app.db.models.Base):
    """Permanent audit of meaningful transitions. Append-only."""

    __tablename__ = "academy_events"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("aevt")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    aggregate_type: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False
    )
    aggregate_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False, index=True
    )
    event_type: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    actor_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    policy_revision_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )
    payload: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON())
    occurred_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )
    request_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )


class AcademyOutbox(app.db.models.Base):
    """Transactional projection queue: inserted with the state change it describes."""

    __tablename__ = "academy_outbox"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: app.db.models.make_id("aout")
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("academy_spaces.id"), nullable=False, index=True
    )
    topic: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False, index=True
    )
    payload: sqlalchemy.orm.Mapped[dict] = sqlalchemy.orm.mapped_column(
        sqlalchemy.JSON(), nullable=False
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), server_default=sqlalchemy.func.now(), nullable=False
    )
    processed_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    attempts: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False, default=0
    )


class AcademyReleaseProjection(app.db.models.Base):
    """The only table public delivery reads (P9 by construction, not filtering).

    Written in the same transaction that marks a release `released`; a withdrawal
    turns the row into a tombstone. Contains public data only — no RLS, no drafts.
    """

    __tablename__ = "academy_release_projections"
    __table_args__ = (sqlalchemy.UniqueConstraint("work_id", "release_number"),)

    release_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True
    )
    academy_space_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False, index=True
    )
    space_slug: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), nullable=False, index=True
    )
    work_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False, index=True
    )
    work_slug: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(160), nullable=False, index=True
    )
    kind: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, index=True
    )
    program_slug: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128)
    )
    release_number: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False
    )
    revision_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    title: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), nullable=False
    )
    summary: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.Text())
    body_ref: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(512), nullable=False
    )
    body_media_type: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    manifest: sqlalchemy.orm.Mapped[dict] = sqlalchemy.orm.mapped_column(
        sqlalchemy.JSON(), nullable=False
    )
    manifest_hash: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False
    )
    released_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=False
    )
    withdrawn_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    withdrawal_reason: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Text()
    )
    supersedes_release_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64)
    )


#: Every private kernel table (RLS on Postgres, guard elsewhere). The projection
#: table is deliberately absent: it is public by construction.
ACADEMY_SPACE_TABLES: frozenset[str] = frozenset(
    {
        "academy_policies",
        "academy_programs",
        "academy_memberships",
        "academy_role_grants",
        "academy_works",
        "academy_revisions",
        "academy_releases",
        "academy_claims",
        "academy_claim_revisions",
        "academy_relations",
        "academy_source_links",
        "academy_contributions",
        "academy_events",
        "academy_outbox",
    }
)


def _register_immutability_guard() -> None:
    import sqlalchemy.orm as _orm

    immutable = (AcademyRevision, AcademyClaimRevision, AcademyEvent)

    @sqlalchemy.event.listens_for(_orm.Session, "before_flush")
    def _block_immutable_updates(
        session: _orm.Session, flush_context: object, instances: object
    ) -> None:  # noqa: ARG001
        for obj in session.dirty:
            if isinstance(obj, immutable) and session.is_modified(obj):
                raise RuntimeError(
                    f"{type(obj).__name__} rows are immutable; create a new revision instead."
                )


_register_immutability_guard()
