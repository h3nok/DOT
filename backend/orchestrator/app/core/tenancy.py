"""Tenant isolation primitives (ADR-0011).

Isolation is layered and fails closed: the request resolves a tenant, the
transaction is bound to it, Postgres row-level security enforces it, and this
module's query guard catches anything that slips through where RLS is not
available (SQLite in tests, local development).
"""

from __future__ import annotations

import hashlib
import typing

import sqlalchemy
import sqlalchemy.engine
import sqlalchemy.event
import sqlalchemy.ext.asyncio
import sqlalchemy.orm
import sqlalchemy.sql

TENANT_SETTING = "app.tenant_id"

#: Tables carrying `owner_id` directly. Child tables inherit isolation through
#: their parent's RLS policy, so they are deliberately absent here.
TENANT_TABLES: frozenset[str] = frozenset(
    {
        "orchestrator_runs",
        "publication_projects",
        "footprint_accounts",
        "footprint_nodes",
        "footprint_edges",
        "footprint_imports",
        "source_objects",
    }
)

#: Child table -> (parent table, local FK column, parent PK column).
TENANT_CHILD_TABLES: dict[str, tuple[str, str, str]] = {
    "orchestrator_steps": ("orchestrator_runs", "run_id", "id"),
    "publication_sections": ("publication_projects", "project_id", "id"),
    "publication_releases": ("publication_projects", "project_id", "id"),
    "publication_revisions": ("publication_sections", "section_id", "id"),
    "source_versions": ("source_objects", "source_object_id", "id"),
    "knowledge_chunks": ("source_versions", "source_version_id", "id"),
    "source_anchors": ("knowledge_chunks", "chunk_id", "id"),
}

OWNER_COLUMN = "owner_id"
SHARD_COLUMN = "owner_shard"

#: Shard count is fixed for the life of the data; changing it rewrites placement.
SHARD_COUNT = 4096

_GUARDED_STATEMENTS: tuple[sqlalchemy.Select, sqlalchemy.Update, sqlalchemy.Delete] = (sqlalchemy.sql.Select, sqlalchemy.sql.Update, sqlalchemy.sql.Delete)


class TenantScopeError(RuntimeError):
    """Raised when a tenant table is queried without tenant scope."""


def owner_shard(owner_id: str) -> int:
    """Stable shard for an owner. Used for partitioning and future routing."""

    digest: bytes = hashlib.blake2b(owner_id.encode("utf-8"), digest_size=2).digest()
    return int.from_bytes(digest, "big") % SHARD_COUNT


async def bind_tenant(session: sqlalchemy.ext.asyncio.AsyncSession, owner_id: str) -> None:
    """Bind the current transaction to a tenant.

    On Postgres this sets the RLS variable with transaction scope, so a pooled
    connection can never carry a stale tenant into the next request. On other
    dialects it only marks the session so the query guard can stand down.
    """

    if not owner_id:
        raise TenantScopeError("Cannot bind an empty tenant.")

    session.info[TENANT_SETTING] = owner_id
    if session.bind is not None and session.bind.dialect.name == "postgresql":
        await session.execute(
            sqlalchemy.select(sqlalchemy.func.set_config(TENANT_SETTING, owner_id, True))
        )


def current_tenant(session: sqlalchemy.ext.asyncio.AsyncSession) -> str | None:
    return typing.cast("str | None", session.info.get(TENANT_SETTING))


@sqlalchemy.event.listens_for(sqlalchemy.orm.Session, "before_flush")
def _fill_owner_shard(
    session: sqlalchemy.orm.Session,
    flush_context: typing.Any,
    instances: typing.Any,
) -> None:
    """Derive the partition key so callers never have to remember it."""

    for obj in session.new:
        owner_id: str | None = getattr(obj, OWNER_COLUMN, None)
        if owner_id and getattr(obj, SHARD_COLUMN, None) is None:
            setattr(obj, SHARD_COLUMN, owner_shard(owner_id))


def _tenant_tables_in(statement: typing.Any) -> set[str]:
    found: set[str] = set()
    if isinstance(statement, sqlalchemy.sql.Select):
        candidates: list[typing.Any] = list(statement.get_final_froms())
    else:
        candidates = [statement.table]
    for element in candidates:
        for node in sqlalchemy.sql.visitors.iterate(element):
            name: str | None = getattr(node, "name", None)
            if isinstance(node, sqlalchemy.Table) and name in TENANT_TABLES:
                found.add(name)
    return found


def _has_owner_predicate(statement: typing.Any) -> bool:
    whereclause: typing.Any | None = getattr(statement, "whereclause", None)
    if whereclause is None:
        return False
    for element in sqlalchemy.sql.visitors.iterate(whereclause):
        if isinstance(element, sqlalchemy.Column) and element.name == OWNER_COLUMN:
            return True
    return False


@sqlalchemy.event.listens_for(sqlalchemy.orm.Session, "do_orm_execute")
def _guard_tenant_scope(state: sqlalchemy.orm.ORMExecuteState) -> None:
    """Fail closed when a tenant table is read or mutated without scope.

    Postgres RLS is the real boundary; this guard exists so the same mistake is
    caught in tests and local development, where RLS is not enforced.
    """

    if state.is_column_load or state.is_relationship_load:
        return  # Refresh or lazy load of an object that was already scoped.
    if not (state.is_select or state.is_update or state.is_delete):
        return

    bind: sqlalchemy.Engine | sqlalchemy.Connection | None = state.session.bind
    if bind is not None and bind.dialect.name == "postgresql":
        return  # RLS is authoritative here.

    statement: typing.Any = state.statement
    if not isinstance(statement, _GUARDED_STATEMENTS):
        return
    tables: set[str] = _tenant_tables_in(statement)
    if not tables or _has_owner_predicate(statement):
        return
    raise TenantScopeError(
        f"Query touches tenant table(s) {sorted(tables)} without an {OWNER_COLUMN} predicate."
    )

