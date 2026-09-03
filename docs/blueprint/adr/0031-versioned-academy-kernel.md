# ADR-0031: Versioned Relational Academy Kernel with Rebuildable Projections

- **Status:** Proposed
- **Date:** 2026-09-02
- **Deciders:** Founder, future Academy stewards
- **Builds on:** ADR-0002, ADR-0006, ADR-0011, ADR-0018, ADR-0030

## Context

The DOT Academy needs to hold definitions, diagrams, hypotheses, objections,
responses, experiments, excerpts, essays, and their relationships for longer
than any one interface or infrastructure vendor is likely to last. The existing
platform already has three useful but distinct substrates:

- versioned publication projects and immutable release bodies;
- source objects, source versions, chunks, and citation anchors; and
- a generic footprint graph whose JSON properties describe imported identities,
  posts, sources, and relationships.

It would be quick to store Academy objects as generic footprint nodes. That
would make their required invariants—immutable revisions, claim levels,
publication boundaries, review state, experimental preregistration, attribution,
and correction history—conventions inside JSON. Conventions are not sufficient
for a scholarly record.

It would also be premature to introduce a graph database, event-sourced system,
or fleet of microservices. The current team and workload benefit from one
transaction boundary and one deployable backend. Longevity comes first from
portable records and explicit boundaries, not infrastructure quantity.

## Decision

The Academy will be implemented as a dedicated bounded context inside the
FastAPI modular monolith. PostgreSQL is the authoritative store for identity,
workflow state, permissions, immutable revision metadata, and typed relations.
The object store holds immutable bodies, diagrams, datasets, manifests, and
release bundles by content hash.

The following are projections and may be deleted and rebuilt from the Academy
kernel:

- the public knowledge graph;
- full-text and semantic search indexes;
- embeddings;
- AI retrieval indexes;
- static HTML and social cards;
- sitemap and JSON-LD documents; and
- analytics aggregates.

The generic footprint graph remains the member-owned digital-footprint domain.
Academy releases may project selected public nodes and edges into it for
navigation, but the footprint graph is never authoritative for Academy content
or editorial state.

Academy authority is scoped through Academy-space memberships and role grants;
it is not inferred from the founder's member ownership, authorship credit, or
infrastructure access. The existing owner-bound tenancy remains authoritative
for personal data. Academy requests add a server-derived space and actor
context for RLS and policy checks, allowing later stewards to work in one
institutional record without sharing a personal owner identity.

An Academy work has a stable identity. Its revisions are immutable snapshots.
A private preparation reserves a release number while required delivery
artifacts are built and verified. Only then does it become a public release,
pointing to exactly one revision and an immutable manifest. Corrections create
a new revision and release; they never rewrite an earlier release. Withdrawal
preserves a tombstone, reason, and history unless law or privacy requires
removal of the underlying bytes.

Writes use a transactional outbox. Workers update projections idempotently.
Redis remains an ephemeral broker, cache, and rate-limit substrate; it is not a
system of record. A separate event-streaming platform is not introduced until
measured throughput or independent consumers require it.

Each public release can be exported without running DOT as a self-describing,
checksummed bundle containing human-readable content and machine-readable
metadata. The export maps to established standards where they fit—JSON-LD,
W3C PROV, W3C Web Annotation, CRediT, and RO-Crate—without making an external
registry or identifier provider necessary for ordinary publication.

## Consequences

**Positive.** Database constraints can enforce the Academy's epistemic and
editorial boundaries. Public delivery remains available when the authoring
backend is down. Search, graph, and AI technology can change without changing
the scholarly record. Complete exports make institutional succession and
independent archiving possible.

**Negative.** The platform must maintain projection workers and schema-versioned
exports. PostgreSQL relation queries will eventually need dedicated read models
for very large public graphs. Immutable releases consume more object storage
than mutable pages. Dedicated Academy tables initially duplicate a small amount
of structure already present in publications and the footprint graph.

**Revisit if** Academy write throughput exceeds a single regional PostgreSQL
primary, projection lag cannot meet its service objective, or graph traversal
becomes both central and measurably inefficient in PostgreSQL. Those are
triggers for extracting a service or adding a graph read store; they are not
reasons to move the source of truth.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Store everything as footprint nodes and JSON properties | Fastest initial implementation | Scholarly invariants become unenforced conventions; domains blur | Rejected |
| Make a graph database authoritative | Natural traversal | Weak fit for revision/release transactions; adds operational dependence | Rejected |
| Event-source the entire Academy | Complete event history | High implementation and replay complexity before it is needed | Rejected |
| Split Academy, experiments, review, and publishing into services now | Independent scaling | Distributed transactions and operational cost for an early platform | Rejected |
| Relational kernel, immutable objects, rebuildable projections | Strong integrity, portable releases, evolutionary path | Requires explicit schemas and projection discipline | **Proposed** |
