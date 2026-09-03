"""Institutional space binding and fail-closed scope guard (P14, ADR-0032).

Mirrors the personal-tenancy layers of app/core/tenancy.py, one level up: the
request resolves a space server-side, the transaction is bound to it, Postgres
RLS enforces it, and the ORM guard catches unscoped queries where RLS is not
available (SQLite in tests, local development).
"""

from __future__ import annotations

import typing

import sqlalchemy
import sqlalchemy.event
import sqlalchemy.ext.asyncio
import sqlalchemy.orm
import sqlalchemy.sql

import app.domains.academy.models

ACADEMY_SPACE_SETTING = "app.academy_space_id"
ACADEMY_ACTOR_SETTING = "app.academy_actor_id"

SPACE_COLUMN = "academy_space_id"

_GUARDED_STATEMENTS: tuple[type, ...] = (
    sqlalchemy.sql.Select,
    sqlalchemy.sql.Update,
    sqlalchemy.sql.Delete,
)


class AcademyScopeError(RuntimeError):
    """Raised when a kernel table is touched without institutional scope."""


async def bind_actor(session: sqlalchemy.ext.asyncio.AsyncSession, actor_id: str) -> None:
    """Bind the accountable actor before any space is known.

    On Postgres this lets membership-aware RLS policies resolve a PK lookup
    (e.g. a work id) to the actor's own spaces only — never across them.
    """

    if not actor_id:
        raise AcademyScopeError("Cannot bind an empty actor.")
    session.info[ACADEMY_ACTOR_SETTING] = actor_id
    if session.bind is not None and session.bind.dialect.name == "postgresql":
        await session.execute(
            sqlalchemy.select(sqlalchemy.func.set_config(ACADEMY_ACTOR_SETTING, actor_id, True))
        )


async def bind_space(
    session: sqlalchemy.ext.asyncio.AsyncSession, space_id: str, actor_id: str
) -> None:
    """Bind the transaction to one institution and one accountable actor.

    Both values are derived server-side from the session and membership — never
    accepted as authority-bearing client input (doc 14 §7).
    """

    if not space_id:
        raise AcademyScopeError("Cannot bind an empty academy space.")
    session.info[ACADEMY_SPACE_SETTING] = space_id
    session.info[ACADEMY_ACTOR_SETTING] = actor_id
    if session.bind is not None and session.bind.dialect.name == "postgresql":
        await session.execute(
            sqlalchemy.select(
                sqlalchemy.func.set_config(ACADEMY_SPACE_SETTING, space_id, True),
                sqlalchemy.func.set_config(ACADEMY_ACTOR_SETTING, actor_id, True),
            )
        )


def current_space(session: sqlalchemy.ext.asyncio.AsyncSession) -> str | None:
    return typing.cast("str | None", session.info.get(ACADEMY_SPACE_SETTING))


def _academy_tables_in(statement: typing.Any) -> set[str]:
    found: set[str] = set()
    if isinstance(statement, sqlalchemy.sql.Select):
        candidates: list[typing.Any] = list(statement.get_final_froms())
    else:
        candidates = [statement.table]
    for element in candidates:
        for node in sqlalchemy.sql.visitors.iterate(element):
            name: str | None = getattr(node, "name", None)
            if (
                isinstance(node, sqlalchemy.Table)
                and name in app.domains.academy.models.ACADEMY_SPACE_TABLES
            ):
                found.add(name)
    return found


def _has_scope_predicate(statement: typing.Any) -> bool:
    """A space predicate or an exact primary-key lookup counts as scoped.

    A PK fetch is precise, not a cross-space scan; the service re-checks the
    row's space (or derives its scope from it) after loading.
    """

    whereclause: typing.Any | None = getattr(statement, "whereclause", None)
    if whereclause is None:
        return False
    for element in sqlalchemy.sql.visitors.iterate(whereclause):
        if isinstance(element, sqlalchemy.Column) and element.name in (SPACE_COLUMN, "id"):
            return True
    return False


@sqlalchemy.event.listens_for(sqlalchemy.orm.Session, "do_orm_execute")
def _guard_academy_scope(state: sqlalchemy.orm.ORMExecuteState) -> None:
    """Fail closed when a kernel table is read or mutated without scope."""

    if state.is_column_load or state.is_relationship_load:
        return
    if not (state.is_select or state.is_update or state.is_delete):
        return

    bind = state.session.bind
    if bind is not None and bind.dialect.name == "postgresql":
        return  # RLS is authoritative here.

    statement: typing.Any = state.statement
    if not isinstance(statement, _GUARDED_STATEMENTS):
        return
    tables: set[str] = _academy_tables_in(statement)
    if not tables or _has_scope_predicate(statement):
        return
    raise AcademyScopeError(
        f"Query touches academy table(s) {sorted(tables)} without a "
        f"{SPACE_COLUMN} or primary-key predicate."
    )
