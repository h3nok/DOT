# ADR-0008: FastAPI orchestrator for knowledge and publication workflows

- **Status:** Accepted
- **Date:** 2026-06-13
- **Deciders:** Founder, Principal Engineer

## Context

The platform now needs a real Knowledge & Publication OS: source ingestion, private
knowledge indexing, scoped AI, editorial workflows, immutable public releases, and
export/delete jobs. These are long-running, IO-heavy workflows with clear state machines.

The existing Flask backend is useful for the prototype shell, but extending it into the
workflow engine would mix legacy routes, synchronous request handling, AI/provider calls,
object storage, queues, and publication release logic in one place. That would make the
new subsystem harder to secure, test, and eventually scale.

## Decision

Build a dedicated **FastAPI orchestrator service** for the Knowledge & Publication OS.
It owns the APIs and workers for sources, ingestion, knowledge retrieval, source-backed AI,
Publication Studio, publishing, export, deletion, and connector syncs.

The orchestrator is a bounded service, not a full microservice split of the whole
platform. It verifies identity from the auth/invite layer, but it does not replace auth in
the first cut. It stores durable workflow state in Postgres, uses Redis-backed workers for
background execution, stores private blobs in encrypted object storage, and begins with
pgvector for self-contained semantic search.

The detailed service contract lives in `../05-FASTAPI-ORCHESTRATOR.md`.

## Consequences

- (+) Gives ingestion, AI, publishing, and data-rights workflows a clean operational
  boundary.
- (+) Uses FastAPI/Pydantic/OpenAPI for typed contracts and async IO.
- (+) Lets the current Flask prototype continue while new member-owned workflows are
  built on a target-grade backend.
- (+) Keeps the first implementation self-contained: Postgres, Redis, object storage,
  workers, and pgvector.
- (-) Adds one more deployable earlier than the original modular-monolith plan.
- (-) Requires careful auth/session integration between Flask/BFF and the orchestrator.
- (-) Requires service-level observability, migrations, queue operations, and worker
  runbooks from the start.
- **Revisit if:** the orchestrator becomes the primary API gateway, if workflows require a
  stronger durable workflow engine such as Temporal, or if pgvector no longer meets
  retrieval latency/quality requirements.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| Extend Flask backend | Least new infrastructure | Mixes prototype shell with durable AI/publishing workflows; weaker async/typing story | Rejected |
| Split every module into microservices now | Clear ownership per domain | Too much operational cost before product fit | Rejected |
| Managed agent platform first | Fast demos, less worker code | Weak ownership boundary; harder privacy/export/delete guarantees | Rejected |
| FastAPI orchestrator + workers | Clean boundary, typed APIs, self-contained, scalable path | Adds a deployable and queue operations | **Accepted** |
