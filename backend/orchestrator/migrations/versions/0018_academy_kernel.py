"""Academy kernel: one space-generic institution kernel (ADR-0030/0031/0032).

Every private kernel table carries a NOT NULL academy_space_id and is protected
by row-level security bound to `app.academy_space_id` / `app.academy_actor_id`.
The release projection table is public by construction and has no RLS.

Revision ID: 0018_academy_kernel
Revises: 0017_reader_subscriptions
Create Date: 2026-09-02
"""

from __future__ import annotations

import alembic
import sqlalchemy as sa

revision: str = "0018_academy_kernel"
down_revision: str | None = "0017_reader_subscriptions"
branch_labels: str | None = None
depends_on: str | None = None

SPACE_SETTING = "app.academy_space_id"
ACTOR_SETTING = "app.academy_actor_id"

#: Strict space isolation: readable/writable only inside the bound space.
STRICT_TABLES: tuple[str, ...] = (
    "academy_policies",
    "academy_programs",
    "academy_role_grants",
    "academy_events",
    "academy_outbox",
)

#: Editorial tables: also readable via the actor's active membership, so a
#: primary-key lookup can resolve before the space is bound — but never into a
#: space the actor does not belong to.
MEMBER_READ_TABLES: tuple[str, ...] = (
    "academy_works",
    "academy_revisions",
    "academy_releases",
    "academy_claims",
    "academy_claim_revisions",
    "academy_relations",
    "academy_source_links",
    "academy_contributions",
)


def _is_postgres() -> bool:
    return alembic.op.get_bind().dialect.name == "postgresql"


def upgrade() -> None:
    alembic.op.create_table(
        "academy_spaces",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("slug", sa.String(128), nullable=False, unique=True, index=True),
        sa.Column("title", sa.String(256), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("custodian_owner_id", sa.String(64), nullable=False),
        sa.Column("governance_policy_revision_id", sa.String(64)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    alembic.op.create_table(
        "academy_policies",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("revision_number", sa.Integer(), nullable=False),
        sa.Column("body", sa.JSON(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("academy_space_id", "revision_number"),
    )
    alembic.op.create_table(
        "academy_programs",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("title", sa.String(256), nullable=False),
        sa.Column("charter", sa.Text()),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("academy_space_id", "slug"),
    )
    alembic.op.create_table(
        "academy_memberships",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("member_id", sa.String(64), nullable=False, index=True),
        sa.Column("membership_state", sa.String(32), nullable=False, server_default="active"),
        sa.Column("invited_by", sa.String(64)),
        sa.Column(
            "joined_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("ended_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("academy_space_id", "member_id"),
        sa.CheckConstraint(
            "membership_state IN ('invited', 'active', 'ended')", name="ck_academy_membership_state"
        ),
    )
    alembic.op.create_table(
        "academy_role_grants",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "membership_id",
            sa.String(64),
            sa.ForeignKey("academy_memberships.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("program_scope", sa.String(64), sa.ForeignKey("academy_programs.id")),
        sa.Column("work_scope", sa.String(64)),
        sa.Column(
            "policy_revision_id",
            sa.String(64),
            sa.ForeignKey("academy_policies.id"),
            nullable=False,
        ),
        sa.Column("granted_by", sa.String(64), nullable=False),
        sa.Column(
            "valid_from", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("valid_until", sa.DateTime(timezone=True)),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint(
            "role IN ('reader', 'contributor', 'reviewer', 'program_editor', "
            "'publisher', 'steward', 'archivist')",
            name="ck_academy_grant_role",
        ),
    )
    alembic.op.create_table(
        "academy_works",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("kind", sa.String(32), nullable=False, index=True),
        sa.Column("canonical_slug", sa.String(160), nullable=False),
        sa.Column("program_id", sa.String(64), sa.ForeignKey("academy_programs.id"), index=True),
        sa.Column("visibility", sa.String(16), nullable=False, server_default="private"),
        sa.Column(
            "lifecycle_state", sa.String(32), nullable=False, server_default="draft", index=True
        ),
        sa.Column("created_by", sa.String(64), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("academy_space_id", "canonical_slug"),
        sa.CheckConstraint(
            "kind IN ('definition', 'diagram', 'hypothesis', 'objection', "
            "'response', 'experiment', 'excerpt', 'essay')",
            name="ck_academy_work_kind",
        ),
        sa.CheckConstraint(
            "lifecycle_state IN ('draft', 'in_review', 'candidate', 'released', "
            "'withdrawn', 'retired')",
            name="ck_academy_work_state",
        ),
    )
    alembic.op.create_table(
        "academy_revisions",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "work_id", sa.String(64), sa.ForeignKey("academy_works.id"), nullable=False, index=True
        ),
        sa.Column("revision_number", sa.Integer(), nullable=False),
        sa.Column("schema_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("title", sa.String(256), nullable=False),
        sa.Column("summary", sa.Text()),
        sa.Column("body_ref", sa.String(512), nullable=False),
        sa.Column("body_media_type", sa.String(64), nullable=False, server_default="text/markdown"),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("language", sa.String(16), nullable=False, server_default="en"),
        sa.Column("change_note", sa.Text()),
        sa.Column("created_by", sa.String(64), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("work_id", "revision_number"),
    )
    alembic.op.create_table(
        "academy_releases",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "work_id", sa.String(64), sa.ForeignKey("academy_works.id"), nullable=False, index=True
        ),
        sa.Column(
            "revision_id", sa.String(64), sa.ForeignKey("academy_revisions.id"), nullable=False
        ),
        sa.Column("release_number", sa.Integer(), nullable=False),
        sa.Column(
            "release_status", sa.String(32), nullable=False, server_default="preparing", index=True
        ),
        sa.Column("visibility", sa.String(16), nullable=False, server_default="public"),
        sa.Column("manifest_ref", sa.String(512)),
        sa.Column("manifest_hash", sa.String(64)),
        sa.Column("policy_revision_id", sa.String(64), sa.ForeignKey("academy_policies.id")),
        sa.Column("prepared_by", sa.String(64), nullable=False),
        sa.Column(
            "prepared_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("released_by", sa.String(64)),
        sa.Column("released_at", sa.DateTime(timezone=True)),
        sa.Column("withdrawn_at", sa.DateTime(timezone=True)),
        sa.Column("withdrawal_reason", sa.Text()),
        sa.Column("failure_reason", sa.Text()),
        sa.Column("supersedes_release_id", sa.String(64)),
        sa.UniqueConstraint("work_id", "release_number"),
        sa.CheckConstraint(
            "release_status IN ('preparing', 'released', 'failed', 'withdrawn')",
            name="ck_academy_release_status",
        ),
    )
    alembic.op.create_table(
        "academy_claims",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "work_id", sa.String(64), sa.ForeignKey("academy_works.id"), nullable=False, index=True
        ),
        sa.Column("canonical_key", sa.String(160), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("work_id", "canonical_key"),
    )
    alembic.op.create_table(
        "academy_claim_revisions",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "claim_id",
            sa.String(64),
            sa.ForeignKey("academy_claims.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "academy_revision_id",
            sa.String(64),
            sa.ForeignKey("academy_revisions.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("statement", sa.Text(), nullable=False),
        sa.Column("context_role", sa.String(32), nullable=False, server_default="academy_position"),
        sa.Column("epistemic_level", sa.String(16), nullable=False),
        sa.Column("claim_state", sa.String(32), nullable=False, server_default="proposed"),
        sa.Column("origin", sa.String(32), nullable=False),
        sa.Column("origin_note", sa.Text()),
        sa.Column("assumptions", sa.JSON()),
        sa.Column("failure_conditions", sa.JSON()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("claim_id", "academy_revision_id"),
        sa.CheckConstraint(
            "epistemic_level IN ('Observation', 'Model', 'Hypothesis', 'Speculation')",
            name="ck_academy_claim_level",
        ),
        sa.CheckConstraint(
            "claim_state IN ('proposed', 'operationalized', 'under_test', 'supported', "
            "'not_supported', 'inconclusive', 'revised', 'retired')",
            name="ck_academy_claim_state",
        ),
        sa.CheckConstraint(
            "context_role IN ('academy_position', 'represented_account')",
            name="ck_academy_claim_role",
        ),
        sa.CheckConstraint(
            "origin IN ('sourced', 'author_originated', 'no_external_source')",
            name="ck_academy_claim_origin",
        ),
    )
    alembic.op.create_table(
        "academy_relations",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "asserted_in_revision_id",
            sa.String(64),
            sa.ForeignKey("academy_revisions.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "source_work_id",
            sa.String(64),
            sa.ForeignKey("academy_works.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("source_claim_id", sa.String(64), sa.ForeignKey("academy_claims.id")),
        sa.Column("predicate", sa.String(32), nullable=False, index=True),
        sa.Column("target_work_id", sa.String(64), sa.ForeignKey("academy_works.id"), index=True),
        sa.Column("target_claim_id", sa.String(64), sa.ForeignKey("academy_claims.id")),
        sa.Column("target_external", sa.String(512)),
        sa.Column("note", sa.Text()),
        sa.Column("confidence", sa.String(32)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "predicate IN ('depends_on', 'defines', 'leads_to', 'contrasts_with', "
            "'applies_to', 'cites', 'derives_from', 'quotes', 'objects_to', "
            "'responds_to', 'tests', 'supports', 'does_not_support', 'revises', "
            "'supersedes')",
            name="ck_academy_relation_predicate",
        ),
    )
    alembic.op.create_table(
        "academy_source_links",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "academy_revision_id",
            sa.String(64),
            sa.ForeignKey("academy_revisions.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "claim_revision_id",
            sa.String(64),
            sa.ForeignKey("academy_claim_revisions.id"),
            index=True,
        ),
        sa.Column("source_object_id", sa.String(64)),
        sa.Column("source_version_id", sa.String(64)),
        sa.Column("source_anchor_id", sa.String(64)),
        sa.Column("external_uri", sa.String(1024)),
        sa.Column("external_identifier", sa.String(256)),
        sa.Column("relation", sa.String(32), nullable=False, server_default="cites"),
        sa.Column("locator", sa.String(512)),
        sa.Column("quotation_hash", sa.String(64)),
        sa.Column("accessed_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    alembic.op.create_table(
        "academy_contributions",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "academy_revision_id",
            sa.String(64),
            sa.ForeignKey("academy_revisions.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("member_id", sa.String(64)),
        sa.Column("public_person_id", sa.String(64)),
        sa.Column("display_name_snapshot", sa.String(256), nullable=False),
        sa.Column("role", sa.String(64), nullable=False),
        sa.Column("degree", sa.String(32)),
        sa.Column("orcid_snapshot", sa.String(64)),
        sa.Column("affiliation_snapshot", sa.String(256)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    alembic.op.create_table(
        "academy_events",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("aggregate_type", sa.String(32), nullable=False),
        sa.Column("aggregate_id", sa.String(64), nullable=False, index=True),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("actor_id", sa.String(64), nullable=False),
        sa.Column("policy_revision_id", sa.String(64)),
        sa.Column("payload", sa.JSON()),
        sa.Column(
            "occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("request_id", sa.String(64)),
    )
    alembic.op.create_table(
        "academy_outbox",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column(
            "academy_space_id",
            sa.String(64),
            sa.ForeignKey("academy_spaces.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("topic", sa.String(64), nullable=False, index=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("processed_at", sa.DateTime(timezone=True)),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
    )
    # Public by construction: written only at release time, read by delivery. No RLS.
    alembic.op.create_table(
        "academy_release_projections",
        sa.Column("release_id", sa.String(64), primary_key=True),
        sa.Column("academy_space_id", sa.String(64), nullable=False, index=True),
        sa.Column("space_slug", sa.String(128), nullable=False, index=True),
        sa.Column("work_id", sa.String(64), nullable=False, index=True),
        sa.Column("work_slug", sa.String(160), nullable=False, index=True),
        sa.Column("kind", sa.String(32), nullable=False, index=True),
        sa.Column("program_slug", sa.String(128)),
        sa.Column("release_number", sa.Integer(), nullable=False),
        sa.Column("revision_id", sa.String(64), nullable=False),
        sa.Column("title", sa.String(256), nullable=False),
        sa.Column("summary", sa.Text()),
        sa.Column("body_ref", sa.String(512), nullable=False),
        sa.Column("body_media_type", sa.String(64), nullable=False),
        sa.Column("manifest", sa.JSON(), nullable=False),
        sa.Column("manifest_hash", sa.String(64), nullable=False),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("withdrawn_at", sa.DateTime(timezone=True)),
        sa.Column("withdrawal_reason", sa.Text()),
        sa.Column("supersedes_release_id", sa.String(64)),
        sa.UniqueConstraint("work_id", "release_number"),
    )

    if not _is_postgres():
        # SQLite (tests, local) cannot enforce RLS; the scope guard in
        # app/domains/academy/context.py carries that weight there.
        return

    space_match = f"academy_space_id = current_setting('{SPACE_SETTING}', true)"
    member_of_space = (
        "EXISTS (SELECT 1 FROM academy_memberships m "
        "WHERE m.academy_space_id = {table}.academy_space_id "
        f"AND m.member_id = current_setting('{ACTOR_SETTING}', true) "
        "AND m.membership_state = 'active')"
    )

    def enable_rls(table: str, using: str, check: str) -> None:
        alembic.op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        alembic.op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
        alembic.op.execute(
            f"CREATE POLICY {table}_space_isolation ON {table} USING ({using}) WITH CHECK ({check})"
        )

    for table in STRICT_TABLES:
        enable_rls(table, space_match, space_match)
    for table in MEMBER_READ_TABLES:
        # Reads resolve through the bound space or the actor's own membership;
        # writes require the bound space, never membership alone.
        using = f"{space_match} OR {member_of_space.format(table=table)}"
        enable_rls(table, using, space_match)
    # A member may always see their own membership row (it is how spaces are
    # discovered before binding); everything else needs the bound space.
    membership_using = f"{space_match} OR member_id = current_setting('{ACTOR_SETTING}', true)"
    enable_rls("academy_memberships", membership_using, space_match)


def downgrade() -> None:
    tables = (
        "academy_release_projections",
        "academy_outbox",
        "academy_events",
        "academy_contributions",
        "academy_source_links",
        "academy_relations",
        "academy_claim_revisions",
        "academy_claims",
        "academy_releases",
        "academy_revisions",
        "academy_works",
        "academy_role_grants",
        "academy_memberships",
        "academy_programs",
        "academy_policies",
        "academy_spaces",
    )
    if _is_postgres():
        for table in tables:
            if table in ("academy_spaces", "academy_release_projections"):
                continue
            alembic.op.execute(f"DROP POLICY IF EXISTS {table}_space_isolation ON {table}")
            alembic.op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY")
            alembic.op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")
    for table in tables:
        alembic.op.drop_table(table)
