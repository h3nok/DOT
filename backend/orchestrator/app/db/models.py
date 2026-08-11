from __future__ import annotations

import datetime
import uuid

import sqlalchemy
import sqlalchemy.orm


def make_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


class Base(sqlalchemy.orm.DeclarativeBase):
    pass


class TimestampMixin:
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True),
        server_default=sqlalchemy.func.now(),
        nullable=False,
    )
    updated_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True),
        onupdate=sqlalchemy.func.now(),
    )


class TenantMixin:
    """Marks a table as tenant-owned and carries its partition key (ADR-0011).

    `owner_shard` is derived from `owner_id` on flush; it exists so hot tables can
    be partitioned and later routed to per-shard databases without a data move.
    """

    owner_shard: sqlalchemy.orm.Mapped[int | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.SmallInteger()
    )


# ── Auth models ───────────────────────────────────────────────────────────────


class Member(Base, TimestampMixin):
    __tablename__ = "members"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("mbr")
    )
    # SHA-256 hex of the lowercased email — never store plaintext email.
    email_hash: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), unique=True, nullable=False, index=True
    )
    # Display name is optional and member-controlled.
    display_name: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128)
    )
    # active | suspended
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="active", index=True
    )
    role: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="member"
    )
    invited_by: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("members.id"), index=True
    )
    last_signed_in_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = (
        sqlalchemy.orm.mapped_column(sqlalchemy.DateTime(timezone=True))
    )


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("otp")
    )
    email_hash: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=False, index=True
    )
    # bcrypt hash of the 6-digit code — never store plaintext.
    code_hash: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), nullable=False
    )
    expires_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=False
    )
    attempts: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False, default=0
    )
    used_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True),
        server_default=sqlalchemy.func.now(),
        nullable=False,
    )


class InviteCode(Base):
    __tablename__ = "invite_codes"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("inv")
    )
    # Cryptographically random token stored as-is; the URL carries it.
    token_hash: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), unique=True, nullable=False, index=True
    )
    issued_by: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("members.id"), nullable=False, index=True
    )
    # Null until accepted.
    accepted_by: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("members.id")
    )
    expires_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True), nullable=False
    )
    accepted_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    revoked_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True),
        server_default=sqlalchemy.func.now(),
        nullable=False,
    )


class OrchestratorRun(Base, TenantMixin):
    __tablename__ = "orchestrator_runs"
    __table_args__ = (
        sqlalchemy.Index("ix_orchestrator_runs_owner_shard", "owner_shard", "owner_id"),
        sqlalchemy.UniqueConstraint(
            "owner_id",
            "workflow_type",
            "idempotency_key",
            name="uq_orchestrator_run_idempotency_scope",
        ),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("run")
    )
    owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), index=True, nullable=False
    )
    workflow_type: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), index=True, nullable=False
    )
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), index=True, nullable=False, default="queued"
    )
    idempotency_key: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), index=True
    )
    requested_by: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128)
    )
    input_ref: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON)
    output_ref: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON)
    error_code: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128)
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True),
        server_default=sqlalchemy.func.now(),
        nullable=False,
    )
    started_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    completed_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )

    steps: sqlalchemy.orm.Mapped[list[OrchestratorStep]] = sqlalchemy.orm.relationship(
        back_populates="run",
        cascade="all, delete-orphan",
    )


class OrchestratorStep(Base):
    __tablename__ = "orchestrator_steps"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("step")
    )
    run_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("orchestrator_runs.id"), index=True
    )
    step_name: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), nullable=False
    )
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), index=True, nullable=False, default="queued"
    )
    attempt_count: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False, default=0
    )
    locked_until: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    input_ref: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON)
    output_ref: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON)
    error_code: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128)
    )
    started_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    completed_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )

    run: sqlalchemy.orm.Mapped[OrchestratorRun] = sqlalchemy.orm.relationship(
        back_populates="steps"
    )


class PublicationProject(Base, TimestampMixin, TenantMixin):
    __tablename__ = "publication_projects"
    __table_args__ = (
        sqlalchemy.Index("ix_publication_projects_owner_shard", "owner_shard", "owner_id"),
        sqlalchemy.UniqueConstraint("owner_id", "slug", name="uq_publication_project_owner_slug"),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("pub")
    )
    owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), index=True, nullable=False
    )
    type: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="book"
    )
    title: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), nullable=False
    )
    slug: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), nullable=False
    )
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), index=True, nullable=False, default="draft"
    )
    visibility: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="private"
    )
    meta: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON)

    sections: sqlalchemy.orm.Mapped[list[PublicationSection]] = sqlalchemy.orm.relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="PublicationSection.section_order",
    )
    releases: sqlalchemy.orm.Mapped[list[PublicationRelease]] = sqlalchemy.orm.relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )


class PublicationSection(Base, TimestampMixin):
    __tablename__ = "publication_sections"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("sec")
    )
    project_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("publication_projects.id"), index=True
    )
    parent_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("publication_sections.id"), index=True
    )
    section_order: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False, default=0
    )
    title: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), nullable=False
    )
    body_ref: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(512)
    )
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), index=True, nullable=False, default="draft"
    )
    meta: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON)

    project: sqlalchemy.orm.Mapped[PublicationProject] = sqlalchemy.orm.relationship(
        back_populates="sections"
    )
    revisions: sqlalchemy.orm.Mapped[list[PublicationRevision]] = sqlalchemy.orm.relationship(
        back_populates="section",
        cascade="all, delete-orphan",
    )


class PublicationRevision(Base):
    __tablename__ = "publication_revisions"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("rev")
    )
    section_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("publication_sections.id"), index=True
    )
    editor_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), nullable=False
    )
    body_ref: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(512), nullable=False
    )
    message: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.Text)
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True),
        server_default=sqlalchemy.func.now(),
        nullable=False,
    )

    section: sqlalchemy.orm.Mapped[PublicationSection] = sqlalchemy.orm.relationship(
        back_populates="revisions"
    )


class PublicationRelease(Base):
    __tablename__ = "publication_releases"
    __table_args__ = (
        sqlalchemy.UniqueConstraint("project_id", "version", name="uq_publication_release_version"),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("rel")
    )
    project_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("publication_projects.id"), index=True
    )
    version: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False
    )
    slug: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), nullable=False
    )
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), index=True, nullable=False, default="rendering"
    )
    manifest_key: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(512), nullable=False
    )
    rendered_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    published_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    revoked_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )

    project: sqlalchemy.orm.Mapped[PublicationProject] = sqlalchemy.orm.relationship(
        back_populates="releases"
    )


class FootprintAccount(Base, TimestampMixin, TenantMixin):
    __tablename__ = "footprint_accounts"
    __table_args__ = (
        sqlalchemy.Index("ix_footprint_accounts_owner_shard", "owner_shard", "owner_id"),
        sqlalchemy.UniqueConstraint(
            "owner_id",
            "platform",
            "handle",
            name="uq_footprint_account_owner_platform_handle",
        ),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("acct")
    )
    owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), index=True, nullable=False
    )
    platform: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), index=True, nullable=False
    )
    handle: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), nullable=False
    )
    display_name: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256)
    )
    profile_url: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(1024)
    )
    external_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), index=True
    )
    auth_mode: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="manual"
    )
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), index=True, nullable=False, default="active"
    )
    sync_cursor: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON)
    last_synced_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    revoked_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )


class FootprintNode(Base, TimestampMixin, TenantMixin):
    __tablename__ = "footprint_nodes"
    __table_args__ = (
        sqlalchemy.Index("ix_footprint_nodes_owner_shard", "owner_shard", "owner_id"),
        sqlalchemy.UniqueConstraint(
            "owner_id",
            "platform",
            "external_id",
            name="uq_footprint_node_owner_platform_external",
        ),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("node")
    )
    owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), index=True, nullable=False
    )
    kind: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), index=True, nullable=False
    )
    label: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(512), nullable=False
    )
    platform: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), index=True
    )
    external_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), index=True
    )
    source_ref: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON)
    properties: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON)
    visibility: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), index=True, nullable=False, default="private"
    )
    confidence: sqlalchemy.orm.Mapped[float] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Float, nullable=False, default=1.0
    )
    first_seen_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True),
        server_default=sqlalchemy.func.now(),
        nullable=False,
    )
    last_seen_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )

    outgoing_edges: sqlalchemy.orm.Mapped[list[FootprintEdge]] = sqlalchemy.orm.relationship(
        back_populates="source_node",
        cascade="all, delete-orphan",
        foreign_keys="FootprintEdge.source_node_id",
    )
    incoming_edges: sqlalchemy.orm.Mapped[list[FootprintEdge]] = sqlalchemy.orm.relationship(
        back_populates="target_node",
        cascade="all, delete-orphan",
        foreign_keys="FootprintEdge.target_node_id",
    )


class FootprintEdge(Base, TimestampMixin, TenantMixin):
    __tablename__ = "footprint_edges"
    __table_args__ = (
        sqlalchemy.Index("ix_footprint_edges_owner_shard", "owner_shard", "owner_id"),
        sqlalchemy.UniqueConstraint(
            "owner_id",
            "source_node_id",
            "target_node_id",
            "relation",
            "platform",
            name="uq_footprint_edge_owner_relation",
        ),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("edge")
    )
    owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), index=True, nullable=False
    )
    source_node_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("footprint_nodes.id"), index=True, nullable=False
    )
    target_node_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("footprint_nodes.id"), index=True, nullable=False
    )
    relation: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), index=True, nullable=False
    )
    platform: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), index=True
    )
    weight: sqlalchemy.orm.Mapped[float] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Float, nullable=False, default=1.0
    )
    confidence: sqlalchemy.orm.Mapped[float] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Float, nullable=False, default=1.0
    )
    evidence_ref: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON)
    first_seen_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True),
        server_default=sqlalchemy.func.now(),
        nullable=False,
    )
    last_seen_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )

    source_node: sqlalchemy.orm.Mapped[FootprintNode] = sqlalchemy.orm.relationship(
        back_populates="outgoing_edges",
        foreign_keys=[source_node_id],
    )
    target_node: sqlalchemy.orm.Mapped[FootprintNode] = sqlalchemy.orm.relationship(
        back_populates="incoming_edges",
        foreign_keys=[target_node_id],
    )


class FootprintImport(Base, TenantMixin):
    __tablename__ = "footprint_imports"
    __table_args__ = (
        sqlalchemy.Index("ix_footprint_imports_owner_shard", "owner_shard", "owner_id"),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("imp")
    )
    owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), index=True, nullable=False
    )
    account_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("footprint_accounts.id"), index=True
    )
    run_id: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("orchestrator_runs.id"), index=True
    )
    connector: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), index=True, nullable=False
    )
    import_mode: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False, default="manual"
    )
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), index=True, nullable=False, default="queued"
    )
    requested_by: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128)
    )
    source_ref: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON)
    summary: sqlalchemy.orm.Mapped[dict | None] = sqlalchemy.orm.mapped_column(sqlalchemy.JSON)
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True),
        server_default=sqlalchemy.func.now(),
        nullable=False,
    )
    completed_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )

    account: sqlalchemy.orm.Mapped[FootprintAccount | None] = sqlalchemy.orm.relationship()
    run: sqlalchemy.orm.Mapped[OrchestratorRun | None] = sqlalchemy.orm.relationship()


class SourceObject(Base, TimestampMixin, TenantMixin):
    __tablename__ = "source_objects"
    __table_args__ = (
        sqlalchemy.Index("ix_source_objects_owner_shard", "owner_shard", "owner_id"),
        sqlalchemy.UniqueConstraint(
            "owner_id", "object_store_key", name="uq_source_object_owner_key"
        ),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("src")
    )
    owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), index=True, nullable=False
    )
    filename: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), nullable=False
    )
    object_store_key: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(512), nullable=False
    )
    size_bytes: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False, default=0
    )
    mime_type: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), nullable=False, default="application/octet-stream"
    )
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), index=True, nullable=False, default="pending"
    )
    #: Uploads are private; only released canon is ever widened. Fails closed.
    visibility: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(16), index=True, nullable=False, default="private"
    )

    versions: sqlalchemy.orm.Mapped[list[SourceVersion]] = sqlalchemy.orm.relationship(
        back_populates="source_object",
        cascade="all, delete-orphan",
        order_by="SourceVersion.version_num.desc()",
    )


class SourceVersion(Base):
    __tablename__ = "source_versions"
    __table_args__ = (
        sqlalchemy.UniqueConstraint(
            "source_object_id", "version_num", name="uq_source_version_num"
        ),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("sver")
    )
    source_object_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("source_objects.id"), index=True, nullable=False
    )
    version_num: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False, default=1
    )
    content_hash: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128)
    )
    extracted_text_ref: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(512)
    )
    status: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), index=True, nullable=False, default="processing"
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True),
        server_default=sqlalchemy.func.now(),
        nullable=False,
    )

    source_object: sqlalchemy.orm.Mapped[SourceObject] = sqlalchemy.orm.relationship(
        back_populates="versions"
    )
    chunks: sqlalchemy.orm.Mapped[list[KnowledgeChunk]] = sqlalchemy.orm.relationship(
        back_populates="source_version",
        cascade="all, delete-orphan",
        order_by="KnowledgeChunk.chunk_index",
    )


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"
    __table_args__ = (
        sqlalchemy.Index("ix_knowledge_chunks_embedding_model", "embedding_model"),
        sqlalchemy.UniqueConstraint(
            "source_version_id", "chunk_index", name="uq_knowledge_chunk_index"
        ),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("chk")
    )
    source_version_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("source_versions.id"), index=True, nullable=False
    )
    chunk_index: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False, default=0
    )
    text: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(sqlalchemy.Text, nullable=False)
    token_count: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False, default=0
    )
    #: Stored as JSON floats rather than a vector type so the same schema runs on
    #: SQLite and Postgres. Retrieval is always tenant-scoped, so the candidate
    #: set stays small enough to score in process until pgvector is warranted.
    embedding: sqlalchemy.orm.Mapped[list[float] | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.JSON, nullable=True
    )
    #: Which model produced the vector. Mixing models in one index is silently
    #: wrong, so retrieval compares only within a single model.
    embedding_model: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), nullable=True
    )

    source_version: sqlalchemy.orm.Mapped[SourceVersion] = sqlalchemy.orm.relationship(
        back_populates="chunks"
    )
    anchors: sqlalchemy.orm.Mapped[list[SourceAnchor]] = sqlalchemy.orm.relationship(
        back_populates="chunk",
        cascade="all, delete-orphan",
    )


class SourceAnchor(Base):
    __tablename__ = "source_anchors"

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("anch")
    )
    chunk_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("knowledge_chunks.id"), index=True, nullable=False
    )
    anchor_type: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(32), nullable=False
    )
    locator: sqlalchemy.orm.Mapped[dict] = sqlalchemy.orm.mapped_column(
        sqlalchemy.JSON, nullable=False
    )

    chunk: sqlalchemy.orm.Mapped[KnowledgeChunk] = sqlalchemy.orm.relationship(
        back_populates="anchors"
    )


# ── Twin conversations ────────────────────────────────────────────────────────


class TwinConversation(Base, TimestampMixin, TenantMixin):
    __tablename__ = "twin_conversations"
    __table_args__ = (
        sqlalchemy.Index("ix_twin_conversations_owner_shard", "owner_shard", "owner_id"),
        sqlalchemy.Index("ix_twin_conversations_owner_recent", "owner_id", "last_message_at"),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("conv")
    )
    owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), index=True, nullable=False
    )
    #: Whose twin is being addressed. A member can hold a conversation with
    #: someone else's public footprint, so this is not always `owner_id`.
    subject_owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), index=True, nullable=False
    )
    title: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(256), nullable=False, default="New conversation"
    )
    #: Denormalised so the conversation list sorts without touching messages.
    last_message_at: sqlalchemy.orm.Mapped[datetime.datetime | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True)
    )
    message_count: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False, default=0
    )

    messages: sqlalchemy.orm.Mapped[list[TwinMessage]] = sqlalchemy.orm.relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="TwinMessage.seq",
    )


class TwinMessage(Base):
    __tablename__ = "twin_messages"
    __table_args__ = (
        sqlalchemy.Index("ix_twin_messages_conversation_seq", "conversation_id", "seq"),
        sqlalchemy.UniqueConstraint("conversation_id", "seq", name="uq_twin_message_seq"),
    )

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("msg")
    )
    conversation_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.ForeignKey("twin_conversations.id"), index=True, nullable=False
    )
    #: Turn order within the thread. Both turns of an exchange commit in one
    #: transaction and share a timestamp, so created_at cannot order them, and
    #: replaying them out of order feeds the twin its own answer as the question.
    seq: sqlalchemy.orm.Mapped[int] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Integer, nullable=False, default=0
    )
    #: "member" or "twin".
    role: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(16), nullable=False
    )
    content: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.Text, nullable=False, default=""
    )
    #: The passages this answer was grounded in, stored verbatim. Re-deriving
    #: them later would show what the twin *would* cite now, not what it did.
    citations: sqlalchemy.orm.Mapped[list[dict] | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.JSON, nullable=True
    )
    refusal_code: sqlalchemy.orm.Mapped[str | None] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), index=True
    )
    created_at: sqlalchemy.orm.Mapped[datetime.datetime] = sqlalchemy.orm.mapped_column(
        sqlalchemy.DateTime(timezone=True),
        server_default=sqlalchemy.func.now(),
        nullable=False,
    )

    conversation: sqlalchemy.orm.Mapped[TwinConversation] = sqlalchemy.orm.relationship(
        back_populates="messages"
    )


class TwinFeedback(Base, TimestampMixin, TenantMixin):
    """A member's explicit verdict on one twin answer (L8 — accountability).

    Zero retention (HKI-6) applies to the *conversation*, not to a member's own
    deliberate signal. So this row holds only the verdict and its coarse shape —
    the rating, the lens it was given through, and whose twin answered. It never
    stores the prompt, the answer, or any free text: a member's words stay out of
    the ledger even when they choose to judge the reply.
    """

    __tablename__ = "twin_feedback"
    __table_args__ = (sqlalchemy.Index("ix_twin_feedback_owner_recent", "owner_id", "created_at"),)

    id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(64), primary_key=True, default=lambda: make_id("fbk")
    )
    owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), index=True, nullable=False
    )
    #: Whose twin produced the answer being judged.
    subject_owner_id: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(128), index=True, nullable=False
    )
    #: "helpful" or "not_helpful" — a closed verdict, never a number to rank by.
    rating: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(16), nullable=False
    )
    #: The lens the answer was read through (orient / ground / test).
    lens: sqlalchemy.orm.Mapped[str] = sqlalchemy.orm.mapped_column(
        sqlalchemy.String(16), nullable=False, default="ground"
    )
