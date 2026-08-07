---
mode: agent
description: Add a new domain to the FastAPI orchestrator with tenancy and tests.
---

Add a new orchestrator domain: ${input:domain}

Read `.github/instructions/orchestrator.instructions.md` and
`docs/blueprint/10-DIGITAL-TWIN-PLATFORM.md` first.

Produce, in this order:

1. **Schema** — `app/domains/<domain>/models.py`. Every tenant table carries `owner_id`.
   Then an Alembic migration; verify with `alembic check`.
2. **Contracts** — `app/domains/<domain>/schemas.py`. Explicit pydantic types, no `Any`.
3. **Service** — `app/domains/<domain>/service.py`. All logic here. Accept `OwnerContext`,
   never a bare owner id. No FastAPI imports in this file.
4. **Router** — `app/api/v1/<domain>.py`. Parse, authorize, delegate. Register in the v1
   router.
5. **Tests** — `app/tests/test_<domain>.py`, covering at minimum:
   - the happy path
   - **cross-tenant isolation**: another owner cannot read or mutate these rows
   - validation failure returns 4xx, not 500
   - any state machine's illegal transition is rejected
   Set required env via `monkeypatch.setenv`; never depend on a developer `.env`.

Then answer explicitly:

- Which nodes, which edges, whose consent, what provenance, how does it export?
- Which manifesto law does this serve, and does it violate any?

Finish with `make verify`.
