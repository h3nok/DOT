# ADR-0009: Retire the Flask prototype; one twin service

- **Status:** Accepted
- **Date:** 2026-08-05
- **Deciders:** Founder

## Context

The platform runs two backends that serve the same nouns. `backend/src` is a Flask
prototype with OTP auth, a JSON-file profile graph, JSON-file publications, a Gemini
"twin ask" route, and a large tail of unused blog/forum/course/user/donation/metrics
routes. `backend/orchestrator` is a FastAPI service with Postgres, a real footprint graph
(nodes, edges, accounts, imports, provenance, owner scoping, tests), a publication release
pipeline with sealed manifests, and a worker tier.

The frontend calls both. Identity, publishing, and the profile graph therefore have two
sources of truth and two auth mechanisms. The orchestrator's footprint graph — the most
valuable asset in the repository — has no frontend caller at all, while the homepage
renders a hand-authored tree stored as a flat file by Flask.

This cannot be reconciled incrementally. Every feature added while both exist has to pick
a side, and the split is already producing duplicated auth, duplicated publication models,
and a graph nobody can see.

## Decision

The FastAPI orchestrator becomes the single backend and is reframed as **the Twin** — the
tenant-scoped runtime for a member's digital footprint. `backend/src` is deleted.

Three Flask capabilities have no orchestrator equivalent and are ported before deletion:

1. **Profile graph** → the existing `footprint_nodes` / `footprint_edges` tables, exposed
   as `/v1/graph/profile`. The JSON-file format is a one-time import, not a supported store.
2. **Twin ask** → `/v1/twin/ask`, rebuilt against the graph with retrieval, citations, and
   the HKI boundary of ADR-0010. The ungrounded Gemini passthrough is not ported.
3. **Circle / invites** → the `invite_codes` and `members` tables that already exist.

Everything else in Flask — `blog`, `forum`, `courses`, `users`, `donations`, `metrics`,
password auth — is deleted without porting. It is prototype residue from a different
product idea and carries a hardcoded secret key, a second SQLite database, and CORS
wide open.

The frontend collapses to one API client against one base URL.

## Consequences

- (+) One auth flow, one session, one identity model, one publication model.
- (+) The footprint graph becomes the thing the product actually renders.
- (+) Tenant isolation (ADR-0011) and HKI conformance (ADR-0010) only have to be
  implemented and audited once.
- (+) Removes a hardcoded Flask secret key, a second SQLite database, and unauthenticated
  legacy routes from the attack surface.
- (−) The Flask donations module is deleted rather than ported; it had five exploitable
  defects. Member funding is rebuilt against the orchestrator by
  [ADR-0012](0012-member-funded-support-plane.md), which supersedes this bullet.
- (−) A one-time migration is needed for any existing `data/profiles/*.json` and
  `data/publications/*.json` content.
- **Revisit if:** a plane develops a scaling curve that genuinely differs from the rest, at
  which point ADR-0002 governs extraction — not a return to two general-purpose backends.

## Alternatives considered

| Option                                              | Pros                                                          | Cons                                                                                         | Verdict      |
| --------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------ |
| Keep both, Flask as the public BFF                  | No migration work now                                         | Two auth flows, two graphs, two publication models; the split gets more expensive every week | Rejected     |
| Port everything from Flask, then delete             | Nothing is lost                                               | Ports dead prototype code (blog, forum, courses) into a clean service                        | Rejected     |
| Retire Flask, port only the three live capabilities | One backend; deletes prototype residue; graph becomes visible | One-time migration; donations removed                                                        | **Accepted** |
| Rewrite the orchestrator inside Flask               | Familiar to the earliest code                                 | Loses async, Postgres, workers, sealed releases, and the test suite                          | Rejected     |
