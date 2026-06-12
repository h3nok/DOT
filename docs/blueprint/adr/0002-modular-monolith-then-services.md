# ADR-0002: Modular monolith now, microservices on demand

- **Status:** Accepted
- **Date:** 2026-06-11
- **Deciders:** Founder, Principal Engineer

## Context

Target is 100M+ members, but day-one reality is a founder's profile and the first
invitations. Premature microservices add operational cost, distributed-systems
complexity, and slow iteration. The existing backend is Flask + SQLite.

## Decision

Build a **modular monolith** with hard module boundaries (auth, invite, member, content,
presence) inside one deployable, **designed to be split**. Keep Flask for the foundation
phase to maximize iteration speed. Migrate the datastore from **SQLite → PostgreSQL**
before any real member data lands. Keep services **stateless** so horizontal scaling and
later extraction are mechanical.

## Consequences

- (+) Fast iteration now; clean seams enable later extraction without rewrites.
- (+) Statelessness + Postgres + Redis is the standard scale-out path.
- (−) Requires discipline to keep module boundaries from leaking.
- **Revisit / split a module out when:** that module's load, deploy cadence, or team
  ownership diverges, or profiling shows it dominating resource use. Consider moving the
  hottest path off sync-Flask (FastAPI/async or Go) when throughput demands it.

## Alternatives considered

| Option                      | Pros                             | Cons                                    | Verdict              |
| --------------------------- | -------------------------------- | --------------------------------------- | -------------------- |
| Microservices from day one  | "Scale-ready"                    | Huge overhead at near-zero traffic      | Rejected (premature) |
| Stay on SQLite              | Zero migration                   | Single-writer, no replicas, won't scale | Rejected             |
| Modular monolith → Postgres | Speed + clean seams + scale path | Requires boundary discipline            | **Accepted**         |
