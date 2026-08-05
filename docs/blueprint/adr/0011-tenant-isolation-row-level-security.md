# ADR-0011: Tenant isolation by row-level security, not by convention

- **Status:** Accepted
- **Date:** 2026-08-05
- **Deciders:** Founder

## Context

Every tenant-facing table carries `owner_id`, and every service function currently filters
on it in application code:

```python
select(FootprintNode).where(FootprintNode.owner_id == owner.owner_id, ...)
```

This is correct today because the code is small and one person wrote it. It is a
convention, not a boundary. A single omitted predicate — in a new endpoint, a background
worker, an analytics query, a join that scopes the parent but not the child — silently
returns another member's graph. There is no test that can catch the clause that was never
written.

The platform is designed for millions of members holding private graphs, imported
archives, and unpublished drafts, on a product promise of member ownership. Cross-tenant
leakage is the one failure this product cannot survive. Convention is not a proportionate
control.

## Decision

Tenant isolation becomes structural, layered, and fail-closed.

- **L1 — Server-derived context.** `TenantContext` is derived from a verified session JWT
  or a trusted gateway assertion. `X-Owner-Id` header trust exists only under
  `AUTH_MODE=local_header`, which startup validation already rejects in staging and
  production.
- **L2 — Transaction binding.** Every request-scoped transaction opens with
  `SET LOCAL app.tenant_id = '<owner_id>'`. `SET LOCAL` is scoped to the transaction, so a
  pooled connection cannot carry a stale tenant into the next request.
- **L3 — Row-level security.** Every tenant table gets `ENABLE ROW LEVEL SECURITY` and
  `FORCE ROW LEVEL SECURITY`, with policies of
  `USING (owner_id = current_setting('app.tenant_id', true))`. Child tables without their
  own `owner_id` are scoped through their parent. The application role does not hold
  `BYPASSRLS`; migrations and admin tooling use a separate role.
- **L4 — ORM query guard.** A SQLAlchemy `before_execute` hook raises `TenantScopeError`
  when a statement touches a tenant table with neither RLS active nor an `owner_id`
  predicate present. This keeps the SQLite test path honest and catches mistakes in
  development, where RLS is not enforced.
- **L5 — Content encryption.** Per ADR-0007, private bodies are encrypted under a
  tenant-scoped DEK before persistence. RLS protects rows; the DEK protects bytes.

Background workers are tenants too: `process_footprint_import` opens its transaction with
the same binding, using the `owner_id` recorded on the job.

**Public delivery is the single, explicit exception.** Sealed release manifests and bodies
are served unauthenticated because the member chose to publish them. They are read through
a dedicated `public_delivery` path that queries `(owner_id, slug, status='published')`
from the URL and never accepts a tenant context from the caller.

**Sharding.** Tenant tables carry `owner_shard smallint` derived from `hash(owner_id)`.
Hot tables (`footprint_nodes`, `footprint_edges`) partition on it, and every index leads
with `owner_id`. A future move to per-shard databases becomes a routing change rather than
a data migration.

## Consequences

- (+) A forgotten `WHERE` clause returns zero rows instead of another member's data.
- (+) A cross-tenant read requires disabling RLS _and_ removing the query guard — two
  deliberate acts, both visible in review.
- (+) The twin's retrieval boundary (ADR-0010, HKI-7) is inherited rather than
  re-implemented, because retrieval runs inside the bound transaction.
- (+) Partitioning by `owner_shard` gives a scale-out path that does not require rewriting
  queries.
- (−) SQLite tests do not enforce RLS, so the query guard carries that weight; RLS
  behaviour itself needs Postgres-backed integration tests.
- (−) Every query path costs one extra `SET LOCAL` round trip per transaction.
- (−) Cross-tenant features (shared claims, circles) must be modelled as two consented
  rows, one in each tenant, rather than one shared row.
- (−) Admin, support, and analytics need an explicitly separate role and an audited path.
- **Revisit if:** RLS policy evaluation becomes a measured bottleneck under partitioning,
  in which case the escape is per-tenant schemas or per-shard databases — never returning
  to application-only scoping.

## Alternatives considered

| Option                                        | Pros                                                      | Cons                                                                 | Verdict      |
| --------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- | ------------ |
| Application-level `WHERE` only (status quo)   | Simple; already written; portable across DBs              | One omitted clause is a breach; untestable by construction           | Rejected     |
| Repository base class that injects the filter | Cheap; catches most cases                                 | Bypassed by any raw query, join, or worker that skips the repository | Rejected     |
| Postgres RLS + transaction binding + guard    | Fail-closed at the database; survives raw SQL and workers | Postgres-specific; needs a second role; SQLite tests need the guard  | **Accepted** |
| Schema-per-tenant                             | Very strong isolation                                     | Does not survive millions of tenants; migration cost per schema      | Rejected     |
| Database-per-tenant                           | Strongest isolation                                       | Absurd operational cost at this member count                         | Rejected     |
