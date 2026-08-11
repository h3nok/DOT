from __future__ import annotations

from unittest import mock

import pytest

import app.core.tenancy
import app.db.session
import app.domains.canon.service as canon
from scripts import ingest_canon


async def test_ingestion_job_binds_the_owner_tenant(
    session_factory, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: dict[str, str | None] = {}

    async def capture_tenant(session, owner, **kwargs):
        seen["owner"] = owner.owner_id
        seen["tenant"] = app.core.tenancy.current_tenant(session)
        return []

    monkeypatch.setattr(app.db.session, "AsyncSessionLocal", session_factory)
    monkeypatch.setattr(
        ingest_canon,
        "load_sections",
        lambda root: ("digital-organism-theory", "Digital Organism Theory", []),
    )
    monkeypatch.setattr(canon, "ingest_edition", capture_tenant)
    monkeypatch.setattr(app.db.session, "engine", mock.AsyncMock())

    await ingest_canon.main("henok", dry_run=False)

    assert seen == {"owner": "henok", "tenant": "henok"}
