---
applyTo: "backend/orchestrator/**"
---

# Orchestrator rules

One FastAPI service, five planes: identity, graph, ingestion, twin, publication
(`docs/blueprint/10-DIGITAL-TWIN-PLATFORM.md`). Planes are modules in one deployable, not
microservices (ADR-0002).

## Layout

- `app/api/v1/` — routers only: parse, authorize, delegate. No business logic.
- `app/domains/<domain>/` — `service.py` (logic), `schemas.py` (pydantic), `models.py`.
- `app/db/` — SQLAlchemy models, session, tenancy guard.
- `app/auth/` — `OwnerContext` resolution. Never trust `X-Owner-Id` outside `local_header`.
- `migrations/` — Alembic. Generated files are formatted like the rest of the code.

## Non-negotiables

- **Tenant scope is structural.** Query through the tenant-bound session; pass
  `OwnerContext`, never a bare `owner_id` string, into retrieval paths (ADR-0011).
- **The twin cites or refuses.** Answers whose `cites[]` are not a subset of what retrieval
  returned are discarded (ADR-0010). Model output is a closed JSON union — malformed output
  is a refusal, not a repair-and-retry.
- **Untrusted content stays enveloped.** Imported/member text goes inside the untrusted
  envelope, never concatenated into a system prompt.
- **Zero retention** for prompts, retrieved context, and answers — no DB, no logs, no traces.
- Sealed releases are immutable. Add a new version instead of mutating one.
- Validate every input server-side. Parameterized queries only. No secrets in the repo.

## Tests

- Tests must not depend on a developer `.env`. Set what you need via `monkeypatch.setenv`
  in the fixture.
- Every new endpoint needs: a happy path, a permission/tenant-isolation test, and a
  validation-failure test.

## Before you claim done

```bash
cd backend/orchestrator
../../.venv/bin/ruff check app migrations
../../.venv/bin/ruff format --check app migrations
../../.venv/bin/pytest
```
