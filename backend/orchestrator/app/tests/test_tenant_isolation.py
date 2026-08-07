"""Tenant isolation (ADR-0011).

These assert the boundary itself, not the endpoints that sit behind it.
"""

from importlib.machinery import ModuleSpec
from pathlib import Path
from types import ModuleType

import fastapi.testclient
import pytest
import sqlalchemy
import sqlalchemy.ext.asyncio

import app.core.tenancy
import app.db.models


def _headers(owner_id: str) -> dict[str, str]:
    return {"X-Owner-Id": owner_id}


def test_owner_cannot_read_another_owners_node(client: fastapi.testclient.TestClient) -> None:
    created = client.post(
        "/v1/graph/nodes",
        headers=_headers("owner-alice"),
        json={"kind": "note", "label": "Alice private note"},
    )
    assert created.status_code == 201, created.text

    alice = client.get("/v1/graph/snapshot", headers=_headers("owner-alice"))
    assert alice.status_code == 200
    assert len(alice.json()["nodes"]) == 1

    bob = client.get("/v1/graph/snapshot", headers=_headers("owner-bob"))
    assert bob.status_code == 200
    assert bob.json()["nodes"] == []


def test_owner_cannot_read_another_owners_project(client: fastapi.testclient.TestClient) -> None:
    created = client.post(
        "/v1/publications/projects",
        headers=_headers("owner-alice"),
        json={"type": "book", "title": "Alice Book", "slug": "alice-book"},
    )
    assert created.status_code == 201, created.text
    project_id: str = created.json()["id"]

    fetched = client.get(f"/v1/publications/projects/{project_id}", headers=_headers("owner-bob"))
    assert fetched.status_code == 404


def test_vault_upload_rejects_key_outside_own_prefix(
    client: fastapi.testclient.TestClient,
) -> None:
    response = client.put(
        "/v1/vault/upload/vault/owner-alice/stolen.txt",
        headers=_headers("owner-bob"),
        content=b"payload",
    )
    assert response.status_code == 403


def test_vault_upload_rejects_traversal(client: fastapi.testclient.TestClient) -> None:
    response = client.put(
        "/v1/vault/upload/vault/owner-bob/../../releases/manifest.json",
        headers=_headers("owner-bob"),
        content=b"payload",
    )
    assert response.status_code in {400, 403}


def test_vault_upload_requires_authentication(client: fastapi.testclient.TestClient) -> None:
    response = client.put("/v1/vault/upload/vault/anyone/x.txt", content=b"payload")
    assert response.status_code == 401


async def test_query_guard_blocks_unscoped_tenant_query(
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> None:
    async with session_factory() as session:
        with pytest.raises(app.core.tenancy.TenantScopeError):
            await session.execute(sqlalchemy.select(app.db.models.FootprintNode))


async def test_query_guard_allows_scoped_tenant_query(
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> None:
    async with session_factory() as session:
        result = await session.execute(
            sqlalchemy.select(app.db.models.FootprintNode).where(
                app.db.models.FootprintNode.owner_id == "owner-alice"
            )
        )
        assert result.scalars().all() == []


async def test_owner_shard_is_derived_on_flush(
    session_factory: sqlalchemy.ext.asyncio.async_sessionmaker[sqlalchemy.ext.asyncio.AsyncSession],
) -> None:
    async with session_factory() as session:
        node = app.db.models.FootprintNode(owner_id="owner-alice", kind="note", label="n")
        session.add(node)
        await session.commit()
        assert node.owner_shard == app.core.tenancy.owner_shard("owner-alice")


def test_owner_shard_is_stable_and_bounded() -> None:
    assert app.core.tenancy.owner_shard("owner-alice") == app.core.tenancy.owner_shard(
        "owner-alice"
    )
    assert 0 <= app.core.tenancy.owner_shard("owner-alice") < app.core.tenancy.SHARD_COUNT


def _policy_module() -> ModuleType:
    import importlib.util
    import pathlib

    path: Path = pathlib.Path(__file__).resolve().parents[2] / "migrations" / "versions"
    spec: ModuleSpec | None = importlib.util.spec_from_file_location(
        "m0007", path / "0007_tenant_isolation.py"
    )
    module: ModuleType = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_every_rls_policy_resolves_to_a_real_owner_column() -> None:
    # A policy that joins to a table without owner_id is not merely broken SQL,
    # it is a silently absent tenant boundary. Ownership can be several hops up.
    migration: ModuleType = _policy_module()
    owning_columns: dict[str, set[str]] = {
        table: {c.name for c in app.db.models.Base.metadata.tables[table].columns}
        for table in app.db.models.Base.metadata.tables
    }

    for table in list(migration.TENANT_TABLES) + list(migration.CHILD_TABLES):
        policy = migration._policy_for(table)
        assert "current_setting" in policy

        if table in migration.TENANT_TABLES:
            assert "owner_id" in owning_columns[table]
            continue

        # Walk the declared chain and assert it terminates on a table that
        # really carries owner_id, and that each hop's FK column exists.
        current = table
        seen = set()
        while current in migration.CHILD_TABLES:
            assert current not in seen, f"cycle in ownership chain at {current}"
            seen.add(current)
            parent, fk, parent_pk = migration.CHILD_TABLES[current]
            assert fk in owning_columns[current], f"{current}.{fk} does not exist"
            assert parent_pk in owning_columns[parent]
            assert f"{parent} p" in policy
            current = parent

        assert "owner_id" in owning_columns[current], (
            f"{table} chain ends at {current}, which has no owner_id"
        )
