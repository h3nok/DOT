# Blueprint — Single Source of Truth

This folder is the north star for the project. **Start with 00, then 14 (architecture)
and 15 (implementation plan)** — they consolidate the design docs below (ADR-0032).
Docs marked *annex* or *superseded* are retained for history and detail.

| #   | Doc                                                                  | What it answers                                                                              |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 00  | [Attention Manifesto](00-ATTENTION-MANIFESTO.md)                     | **Why** — how attention is captured, and the laws (L1–L12) we invert it with. The soul.      |
| 01  | [North Star](01-NORTH-STAR.md)                                       | **What** — vision, info architecture, and the 5 Attention OS primitives (P1–P5).             |
| 02  | [Architecture](02-ARCHITECTURE.md)                                   | **How** — frontend, backend, invite/auth, analytics-without-surveillance, scale to 100M+.    |
| 03  | [Cleanup & Structure](03-CLEANUP-AND-STRUCTURE.md)                   | **From here to there** — target layout + safe, staged refactor.                              |
| 04  | [Knowledge & Publication OS](04-KNOWLEDGE-AND-PUBLICATION.md)        | *Annex to 14* — uploads, connected sources, AI summaries, and book publishing.               |
| 05  | [FastAPI Orchestrator](05-FASTAPI-ORCHESTRATOR.md)                   | *Annex to 14* — original orchestrator service spec (the live code now leads).                |
| 06  | [Implementation Roadmap](06-IMPLEMENTATION-ROADMAP.md)               | *Superseded by 15* — earlier increment plan, kept for history.                               |
| 07  | [Digital Footprint Graph](07-DIGITAL-FOOTPRINT-GRAPH.md)             | **Graph layer** — social integrations, footprint graph, graph navigation, connector posture. |
| 08  | [Doctrine & Coherence Surface](08-DOCTRINE-AND-COHERENCE-SURFACE.md) | **Reading/teaching layer** — doctrine content model + generative, focus-oriented graph UI.   |
| 09  | [Public Launch Sprint Plan](09-PUBLIC-LAUNCH-SPRINT-PLAN.md)         | *Superseded by 15* — launch sprints; Gate A / data-rights obligations still referenced.      |
| 10  | [Digital Twin Platform](10-DIGITAL-TWIN-PLATFORM.md)                 | *Annex to 14* — twin consolidation, tenant isolation, HKI-conformant agent.                  |
| 11  | [Attention Membrane](11-ATTENTION-MEMBRANE.md)                       | **Running design doc** — Stay as the inbound/outbound filter: thesis, staging, open questions. |
| 12  | [Field & Focus](12-FIELD-AND-FOCUS.md)                               | **Navigation law** — two states, the Thread, typed exits, and the profile ring as an argument. |
| 13  | [DOT Academy Platform](13-DOT-ACADEMY-PLATFORM.md)                   | *Annex to 14* — detailed kernel schema, kind contracts, lifecycles, preservation.            |
| 14  | [The Intellectual Platform](14-INTELLECTUAL-PLATFORM.md)             | **The architecture** — one kernel, many institutions; invariants P1–P14; consolidated contract. |
| 15  | [Platform Implementation Plan](15-PLATFORM-IMPLEMENTATION-PLAN.md)   | **The plan** — ground truth, Phases 0–8 with acceptance gates.                               |
| —   | [ADRs](adr/)                                                         | Locked decisions with trade-offs.                                                            |

## How to use this

- Building a feature? Confirm it serves the manifesto laws and uses Attention OS primitives.
- Every feature must also resolve to explicit nodes, edges, provenance, consent, and
  portability — the graph-OS invariant (see doc 07 §1 and §4A).
- Making a decision with lasting trade-offs? Write an ADR (`adr/0000-template.md`).
- AI agents: start at `../../AGENTS.md`, which points back here.

## Decision log

| ADR                                                                | Decision                                                  | Status   |
| ------------------------------------------------------------------ | --------------------------------------------------------- | -------- |
| [0001](adr/0001-member-funded-invite-only.md)                      | Member-funded, invite-only — never ad-funded              | Accepted |
| [0002](adr/0002-modular-monolith-then-services.md)                 | Modular monolith now, services on demand; SQLite→Postgres | Accepted |
| [0003](adr/0003-server-enforced-invites.md)                        | Server-enforced signed single-use invite tokens           | Accepted |
| [0004](adr/0004-attention-os-primitives.md)                        | Attention OS primitives — no feed, counters, or push      | Accepted |
| [0005](adr/0005-single-frontend-entry.md)                          | Single canonical frontend entry & structure               | Accepted |
| [0006](adr/0006-member-owned-knowledge-publication.md)             | Member-owned Knowledge & Publication OS                   | Accepted |
| [0007](adr/0007-blind-infrastructure-and-app-layer-encryption.md)  | Blind infrastructure & application-layer encryption       | Accepted |
| [0008](adr/0008-fastapi-orchestrator-for-knowledge-publication.md) | FastAPI orchestrator for knowledge/publication workflows  | Accepted |
| [0009](adr/0009-retire-flask-single-twin-service.md)               | Retire the Flask prototype; one twin service              | Accepted |
| [0010](adr/0010-twin-agent-hki-conformance.md)                     | The twin agent runs under HKI conformance                 | Accepted |
| [0011](adr/0011-tenant-isolation-row-level-security.md)            | Tenant isolation by row-level security, not convention    | Accepted |
| [0012](adr/0012-member-funded-support-plane.md)                    | A member-funded support plane (amends 0009)               | Accepted |
| [0013](adr/0013-inbound-provenance.md)                             | Inbound provenance — nothing arrives without a reason     | Proposed |
| [0014](adr/0014-declarative-policy-no-engagement-ranking.md)       | Declarative policy, never learned engagement ranking      | Proposed |
| [0015](adr/0015-no-paid-passage.md)                                | No paid passage — revenue invariant to delivery           | Proposed |
| [0016](adr/0016-field-focus-navigation.md)                         | Navigation is Field, Focus, and a Thread — never a menu   | Proposed |
| [0017](adr/0017-movement-platform-canon-and-applied.md)            | The platform is the movement — canon, theory, applied     | Proposed |
| [0018](adr/0018-book-derived-knowledge-surfaces.md)                | First-party knowledge surfaces derive from the book       | Accepted |
| [0019](adr/0019-verified-join-queue.md)                             | Verified join queue with sealed addresses                 | Accepted |
| [0020](adr/0020-public-entry-follows-reader-intent.md)             | Public entry follows reader intent                        | Accepted |
| [0021](adr/0021-steward-editable-copy-released-by-default.md)      | Steward-editable copy remains release-controlled          | Accepted |
| [0022](adr/0022-the-front-door-is-a-note-not-a-pitch.md)           | The front door is a note, not a pitch                     | Accepted |
| [0023](adr/0023-paid-digital-edition-free-reader.md)               | Paid authenticated PDF; complete web reader stays free    | Proposed |
| [0024](adr/0024-aggregate-readership-no-profiling.md)              | Aggregate readership without behavioural profiling       | Accepted |
| [0025](adr/0025-two-doors-reader-list.md)                           | Two doors: invited circle and open reader list            | Accepted |
| [0026](adr/0026-theory-led-public-entry.md)                         | The public entry teaches the theory                       | Accepted |
| [0027](adr/0027-theory-panels-before-process-detail.md)            | Theory panels precede process detail                      | Accepted |
| [0028](adr/0028-invite-through-honest-entry-points.md)             | Invite through honest entry points                        | Accepted |
| [0029](adr/0029-one-clear-ending-on-the-public-entry.md)           | One clear ending on the public entry                      | Superseded |
| [0030](adr/0030-living-academy-fixed-publications.md)              | The website is a living academy; books remain publications | Accepted |
| [0031](adr/0031-versioned-academy-kernel.md)                       | Versioned relational Academy kernel with rebuildable projections | Proposed |
| [0032](adr/0032-one-platform-kernel-many-institutions.md)          | One platform kernel, many institutions; blueprint consolidated to docs 14/15 | Proposed |
