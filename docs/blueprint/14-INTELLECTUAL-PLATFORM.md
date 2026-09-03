# 14 — The Intellectual Platform (consolidated architecture)

> **The one architecture document.** This consolidates the platform design that was
> spread across docs 04, 05, 08, 10, 12, and 13 into a single contract, and
> generalizes the DOT Academy kernel into a platform primitive: **one kernel, many
> institutions**. A new theory, a new model, or a new academy is a new *space* in
> the same kernel — never a fork of the codebase.
>
> **Status:** Proposed design (ADR-0032). The manifesto (doc 00) and ADRs still
> outrank this file. The implementation plan and current-state ground truth live in
> `15-PLATFORM-IMPLEMENTATION-PLAN.md`.
>
> **What exists today:** the FastAPI orchestrator with thirteen domains (auth, canon,
> commerce, graph, join, knowledge, publication, readers, runs, sitecontent,
> support, twin, **academy**), OTP auth with JWT session cookies, a working publication
> studio, the Book One reading pipeline, and the static Academy public IA in the
> frontend. **The Phase 1 Academy kernel is implemented** (migration
> `0018_academy_kernel`): spaces, programs, memberships, role grants, works,
> immutable revisions, claims, relations, source links, contributions, releases
> with manifests, events, outbox, and the public release projection — space-generic
> with RLS, seeded with DOT Academy as space row 1 (`make seed-academy`).
> **Not yet built:** reviews, experiments, importers, Academy Studio UI, search/graph
> projections, export bundles — doc 15 Phases 2+.

---

## 1. Thesis: one kernel, many institutions

The platform's product is a **versioned public argument graph** under governed
stewardship. DOT Academy is the first institution on it, not the shape of it.

The kernel primitive is the **space**: one governed intellectual institution with
its own works, claims, releases, membership, role grants, and versioned governance
policy. The platform commits to:

- **Institution = data, not code.** Creating a second academy — a new theory, a
  new research program, a new school — is inserting a row and a policy, not
  writing a migration or a route file.
- **Kinds are platform vocabulary; programs are institutional curation.** The
  eight work kinds (§4.2) are a closed union enforced by schema, because the
  platform's epistemic contracts attach to kinds. Programs (Theory, Critical
  Inquiry, Writing for DOT Academy) are per-space rows: another institution may
  organize its inquiry differently without touching the kind contracts.
- **No shared authority.** Spaces are isolated by row-level security. Cross-space
  citation is an explicit typed relation. There is no global reputation,
  cross-space editorial power, or platform-level truth arbitration.
- **The book boundary generalizes.** Each space may designate canonical fixed
  publications (Book One for DOT). Space work can cite, interpret, extend, test,
  or challenge a canon; it never silently becomes part of it (ADR-0030, A5).

The UI does not expose multi-space administration until a real second institution
exists (no "academy builder" theater). But the schema, RLS, URLs, and tests are
space-generic from the first migration, because retrofitting institutional
isolation into a live scholarly record is the one migration we must never need.

## 2. What this document consolidates

| Prior doc | Disposition |
| --- | --- |
| 00 — Attention Manifesto | Untouched. Binding law above this file. |
| 01 — North Star | Reference. Primitives P1–P5 still the member-UI contract. |
| 02 — Architecture | Reference for platform-wide basics (stack, budgets, security baseline). |
| 04 — Knowledge & Publication | **Absorbed.** Domains now exist in code; contract carried in §5. |
| 05 — FastAPI Orchestrator | **Absorbed.** Service exists; the live code is the spec, this doc holds the boundaries. |
| 06 — Implementation Roadmap | **Superseded by doc 15** (kept for history). |
| 07 — Digital Footprint Graph | Reference. Boundary restated in §5.1. |
| 08 — Doctrine & Coherence Surface | Reference detail for the Book One concept map surface. |
| 09 — Public Launch Sprint Plan | **Superseded by doc 15** (kept for history). |
| 10 — Digital Twin Platform | **Absorbed.** Flask retired (ADR-0009); twin boundary restated in §5, §13. |
| 11 — Attention Membrane | Running doc, unaffected. |
| 12 — Field & Focus | Reference detail for the navigation law summarized in §12. |
| 13 — DOT Academy Platform | **Absorbed and generalized here.** Where they differ, this doc wins (except ADRs). |

If a doc above disagrees with this one, this one wins — unless an ADR disagrees,
in which case the ADR wins (blueprint rules).

## 3. Binding invariants (P1–P14)

Carried forward from doc 13's A1–A13, now platform-wide, plus one new invariant.
These are release gates, not intentions.

- **P1 — One stable work identity, many immutable revisions.** A work keeps one
  opaque identity across title/slug/program/status changes. Every editorial
  checkpoint is an immutable revision; corrections create new revisions.
- **P2 — A release never changes.** A public release resolves to one exact
  revision, exact assets, a manifest, and content hashes. "Latest" is an alias;
  a versioned URL is permanent.
- **P3 — Claims are addressable below the document level.** Every material claim
  has a stable identity and versioned statement. A work may mix epistemic levels.
- **P4 — Provenance is required at release.** A released claim points to precise
  sources, declares itself author-originated, or states why no source applies.
  "Source unknown" is a visible state, never an omitted field.
- **P5 — Canon and space work are different namespaces.** Publication releases,
  space releases, and external sources never collapse into one "content" type.
  Cross-boundary links are explicit relations.
- **P6 — Criticism cannot be erased by response.** An objection remains a
  first-class released work after a response exists. "Answered" ≠ "resolved."
- **P7 — Negative and inconclusive results remain discoverable.** Never sorted
  down, hidden, or deleted. Withdrawals leave a public tombstone and reason.
- **P8 — Public graph and search are explainable projections.** No popularity,
  recency-as-worth, agreement, dwell time, or contributor status in ranking.
  Every result carries a `reason`.
- **P9 — Private by default; release is explicit.** Public delivery reads only
  from release projections; drafts cannot leak through public paths.
- **P10 — AI never becomes an authority layer.** It cannot assign claim levels,
  accept reviews, close objections, interpret results as support, or publish.
  Every answer labels its authority layer (canon / space release / external).
- **P11 — The institution can leave its software.** Every release exports as
  human-readable files plus documented machine-readable metadata and checksums,
  restorable without this application, its database, or its AI vendor.
- **P12 — Attention remains protected.** No feeds, infinite scroll, autoplay,
  streaks, badges, counters, push interruptions, profiles, or engagement
  ranking (manifesto L2–L6, L9; ADR-0004, ADR-0014). Every surface has a
  beginning, a focus, typed exits, and an end.
- **P13 — A conventional account is represented, not caricatured.** Represented
  external positions carry field, scope, named sources, review date, and the
  strongest defensible formulation.
- **P14 — Institutional isolation (new).** Every kernel row belongs to exactly
  one space. RLS enforces the boundary; authority flows only from active scoped
  role grants under a versioned policy — never from custody, authorship credit,
  founder identity, or infrastructure access. A second space must be creatable
  without code change and provably unable to touch the first.

## 4. Object model

### 4.1 Vocabulary

```text
Space          one governed institution (DOT Academy is row 1)
Program        per-space curatorial grouping of works (data, not enum)
Work           stable identity of one intellectual object, of one Kind
Revision       immutable content snapshot of a work
Claim          stable sub-document assertion; versioned per revision
Relation       typed, versioned edge between works/claims
Release        immutable public (or circle) publication of one revision
Source link    precise provenance to an internal source version/anchor or external identifier
Contribution   credit snapshot attached to a revision
Policy         versioned governance object; releases record the policy they passed under
Canon          fixed publications across the publication boundary (e.g., Book One)
```

### 4.2 Work kinds (closed union, schema-gated)

```text
definition | diagram | hypothesis | objection |
response | experiment | excerpt | essay
```

Each kind has a release contract (required intellectual fields) and a critical
invariant — carried verbatim from doc 13 §6:

| Kind | Required at release | Critical invariant |
| --- | --- | --- |
| Definition | Term, definition, scope, exclusions, origin, linked claims | Changed meaning ⇒ new revision, visible diff |
| Diagram | Source spec, rendered asset, alt text, legend, represented claims | Editable source + accessible description ship with the image |
| Hypothesis | Statement, assumptions, scope, predictions, failure conditions | No possible contrary observation ⇒ visibly marked non-discriminating |
| Objection | Exact target release/claim, strongest formulation, scope, sources | Cannot target the mutable "latest" alias |
| Response | Target objection release, answer, concessions, residual questions | Never deletes or auto-resolves its objection |
| Experiment | Frozen protocol, variables, analysis plan, ethics state, artifacts | Protocol freezes before a run; negative/aborted runs remain |
| Excerpt | Exact publication release, anchor, quotation, rights state | Cannot excerpt a draft or alter quoted text |
| Essay | Scope, relation to the theory, claims + levels, provenance | Not canon merely because a founder wrote it |

Claim classification: `epistemic_level ∈ {Observation, Model, Hypothesis,
Speculation}` and `claim_state ∈ {proposed, operationalized, under_test,
supported, not_supported, inconclusive, revised, retired}`. "Supported" means
supported by identified work under identified conditions — never "true."

### 4.3 Lifecycles (summary)

```text
Work:        workspace draft → immutable revision → review → candidate → released → superseded/withdrawn (record retained)
Hypothesis:  proposed → operationalized → under test → supported / not supported / inconclusive → revised or retired
Objection:   released → response invited → response released → open / answered / under test / resolved-by-policy
Experiment:  protocol draft → ethics review → preregistered+frozen → run → completed/aborted → results released → replication/critique
Release:     preparing → released | failed;  released → withdrawn (tombstone, never URL reuse)
```

Full lifecycle semantics: doc 13 §7 remains the reference text; nothing there is
changed by this consolidation.

## 5. Bounded contexts

Mapped to the code that actually exists under `backend/orchestrator/app/domains/`:

| Context | Code domain(s) today | Owns | Does not own |
| --- | --- | --- | --- |
| **Academy kernel** *(to build)* | `academy` (new) | Spaces, programs, works, revisions, claims, relations, reviews, experiments, releases | Book manuscripts, member footprints, imported private files |
| **Publication** | `publication`, `canon`, `readers` | Fixed multi-section publications, editions, manifests, reading surfaces | Living definitions, objection status |
| **Knowledge** | `knowledge` | Source objects, versions, chunks, anchors, embeddings | Editorial truth, epistemic classification |
| **Identity & access** | `auth`, `join` | Members, sessions, invites, verified join queue | Authorship claims, contributor credit |
| **Graph** | `graph` | Member-owned footprint; public navigation projections | Academy truth, revision history, review workflow |
| **Commerce & support** | `commerce`, `support` | Paid edition, member-funded support plane (ADR-0012, ADR-0015, ADR-0023) | Any influence on ranking or delivery |
| **Twin** | `twin`, `runs` | Source-bounded retrieval and answers, durable runs (HKI conformance, ADR-0010) | Publishing, review, claim classification |
| **Delivery** | *(release builder, to build)* | Static projections, manifests, exports, caching | Draft state |
| **Site content** | `sitecontent` | Steward-editable released copy (ADR-0021) | Scholarly record |

Two boundary rules survive every refactor:

1. **The footprint graph is never authoritative for kernel content** (ADR-0031).
   Kernel releases may project public nodes/edges into it for navigation;
   deleting that projection must not affect the record.
2. **Publication and kernel stay separate domains.** A book is ordered, bounded,
   and editioned as a whole; a definition or objection has an independent
   lifecycle. Shared capabilities become libraries, not merged tables.

## 6. Kernel schema

Tables keep the `academy_*` prefix (ADR-0030/0031 vocabulary): on this platform
"academy" *is* the generic word for a governed intellectual institution. All
tables carry a NOT NULL space key directly or through their parent (P14).

```text
academy_spaces            id, custodian_owner_id, slug, title, description, status,
                          governance_policy_revision_id, created_at, updated_at

academy_programs          id, academy_space_id, slug, title, charter, display_order
                          -- per-space curation; NEW relative to doc 13, which had
                          -- program as a fixed field. Kinds stay schema-gated.

academy_memberships       id, academy_space_id, member_id, membership_state,
                          invited_by, joined_at, ended_at

academy_role_grants       id, membership_id, role, program_scope?, work_scope?,
                          policy_revision_id, granted_by, valid_from, valid_until?, revoked_at?

academy_works             id, academy_space_id, kind, canonical_slug, program_id,
                          visibility, lifecycle_state, created_by, created_at, updated_at

academy_revisions         id, work_id, revision_number, schema_version, title, summary,
                          body_ref, body_media_type, content_hash, language, change_note,
                          created_by, created_at            -- no updated_at, ever

academy_releases          id, work_id, revision_id, release_number, release_status,
                          visibility, manifest_ref, manifest_hash, prepared_by, prepared_at,
                          released_by, released_at, withdrawn_at, withdrawal_reason,
                          supersedes_release_id

academy_claims            id, work_id, canonical_key, created_at
academy_claim_revisions   id, claim_id, academy_revision_id, statement, context_role,
                          epistemic_level, claim_state, assumptions, failure_conditions, created_at

academy_relations         id, asserted_in_revision_id, source_work_id, source_claim_id?,
                          predicate, target_work_id, target_claim_id?, note, confidence?, created_at

academy_source_links      id, academy_revision_id, claim_revision_id?, source_object_id?,
                          source_version_id?, source_anchor_id?, external_uri?,
                          external_identifier?, relation, locator, quotation_hash?, accessed_at?

academy_contributions     id, academy_revision_id, member_id?, public_person_id?,
                          display_name_snapshot, role, degree?, orcid_snapshot?,
                          affiliation_snapshot?, created_at

academy_review_assignments  id, revision_id, reviewer_id, review_type, conflict_statement,
                            state, assigned_at, completed_at
academy_review_reports      id, assignment_id, recommendation, body_ref, content_hash,
                            visibility, created_at

academy_experiment_protocols  id, experiment_work_id, academy_revision_id, protocol_state,
                              preregistered_at, frozen_hash
academy_experiment_runs       id, protocol_id, run_number, run_state, started_at,
                              completed_at, outcome, deviation_log_ref, result_summary_ref,
                              conducted_by
academy_experiment_artifacts  id, run_id, kind, object_ref, content_hash, media_type,
                              size_bytes, visibility, license

academy_events            permanent audit: space, aggregate, event_type, actor,
                          policy_revision_id, payload, occurred_at, request_id
outbox_events             transactional projection queue (same tx as the state change)
```

Relation predicates (closed, versioned):

```text
depends_on | defines | leads_to | contrasts_with | applies_to |
cites | derives_from | quotes | objects_to | responds_to |
tests | supports | does_not_support | revises | supersedes
```

`supports`/`does_not_support` require a target claim and a released experiment
result; `objects_to` requires a target claim or release. These are database and
service invariants, not UI hints. Field-level detail beyond this sketch: doc 13
§5 remains the annotated reference.

## 7. Data architecture

- **PostgreSQL is authoritative** for identity, state machines, relations,
  approvals, release metadata, audit, and outbox. Existing personal tenancy
  (`app.tenant_id = owner_id`, ADR-0011) is untouched; kernel transactions add
  server-bound `app.academy_space_id` + `app.actor_id` derived from the session
  and an active membership — never from client headers. RLS on every private
  kernel table checks the bound space and scoped grant.
- **Object store holds immutable bodies and artifacts**, write-once by content
  hash, under `academy/{space_id}/...` namespaces (doc 13 §10.2). Bucket
  versioning and retention protect released objects.
- **Redis holds no truth.** Queues, rate limits, short caches, locks. Losing it
  delays work; it cannot lose a release.
- **Everything public is a rebuildable projection:** static HTML/CDN pages,
  search index, public graph, embeddings, retrieval indexes, JSON-LD, sitemaps,
  aggregate analytics (ADR-0024). Deleting all projections and rebuilding from
  the kernel changes no release hash or citation.
- **Transactional outbox** connects writes to projections; workers are
  idempotent. No Kafka, graph database, search cluster, or service mesh in the
  first implementation; extraction seams are documented in doc 13 §9.2 and
  activate only on measured need (ADR-0002).

## 8. Release transaction

```text
validate revision + policy
  → reserve private preparation + version number
  → build immutable bundle + required delivery artifacts (HTML, plain view, manifest, export)
  → verify hashes and links
  → atomically mark released + write audit/outbox
  → publish versioned delivery, atomically move current alias
  → async: search/graph/retrieval projections, archive replication
```

Failed preparation ⇒ `failed`, nothing public, prior alias stays live. Failed
async projection ⇒ release stands, job retries. Public reading is static-first
and must survive the backend, Redis, and AI being down.

## 9. Identifiers, URLs, citations

- Opaque prefixed IDs (`aspace_`, `awork_`, `arev_`, `aclaim_`, `arel_`, `arun_`).
- Stable HTTP identifiers per released entity:
  `https://dotheory.org/id/academy-work/{work_id}` etc.
- **URL scheme, decided now to avoid breakage later:** the first space owns the
  bare `/academy/...` namespace. Future spaces mount at `/a/{space-slug}/...`.
  Slugs are never recycled; a citation always points to a versioned URL.
- `/doctrine` stays the edition-bound Book One concept map (ADR-0018); it is not
  renamed into the kernel. `/book/...` stays the fixed publication surface.
- External identifiers (ORCID, DOI/DataCite) are adapters and optional mappings,
  never internal primary keys; registration failure cannot corrupt a release.

## 10. API contracts

Space-scoped authoring surface (generalizing doc 13 §12.1 — work creation is
already space-scoped there; all collection routes follow):

```text
POST/GET  /v1/academy/spaces/{space_id}/works
GET/PATCH /v1/academy/works/{work_id}
POST/GET  /v1/academy/works/{work_id}/revisions
POST      /v1/academy/revisions/{revision_id}/{submit|claims|relations|sources|contributors|reviews|approve}
POST      /v1/academy/works/{work_id}/releases
POST      /v1/academy/releases/{release_id}/withdraw
POST      /v1/academy/experiments/{work_id}/protocols → freeze → runs → complete
```

Public delivery (cacheable, immutable ETags from manifest hashes):

```text
GET /v1/academy/delivery/{catalog | works/{id} | works/{id}/releases/{n} |
     claims/{id} | graph?focus=&depth<=2 | search?q= | releases/{id}/export}
```

Every state-changing endpoint: scoped authorization, policy validation,
idempotency key, audit event, outbox insert, request ID. Public JSON carries
explicit schema versions; export schemas live in the repo with fixtures.

## 11. AI boundary

The twin retrieves only released material allowed by visibility. Every retrieved
unit carries `authority_layer: book_canon | academy_release | external_source`,
work kind, release/edition ID, claim ID + epistemic level where applicable,
source anchor, and content hash. Answers preserve those labels; cross-layer
synthesis says so. AI suggestions (candidate claims, relations, contradictions,
alt text, summaries) stay private with model provenance until a human adoption
event attributes responsibility. "AI reviewed" is never displayed as peer
review (P10; ADR-0010).

## 12. Public experience

Route model (space 1):

```text
/                         theory-led threshold (ADR-0026)
/academy                  field + institutional boundary
/academy/{collection}     eight finite collections (definitions … essays)
/academy/.../{slug}       current release alias
/academy/.../{slug}/v/{n} immutable release
/book, /doctrine, /applied  canon, concept map, transitional seams register
```

Navigation obeys the Field & Focus law (doc 12, ADR-0016): collection pages are
finite fields; selecting opens one focus surface; exits are typed relations, not
menus; the Thread is session-local and never stored. A focused work shows kind
and boundary, the work, claims with levels at point of use, provenance,
strongest objections, version history, typed exits, and an explicit stop. No
page ends in "more for you." Accessibility: every graph has an ordered text
projection, color never carries meaning alone, reduced-motion equivalents are
mandatory, print/plain-HTML views are first-class.

## 13. Preservation and succession

- Every release exports as a self-describing bundle (manifest, markdown + HTML
  content, JSON-LD claims/relations/provenance, RO-Crate metadata, checksums)
  useful without DOT (P11). Standards mapping: JSON-LD/schema.org, PROV-O, Web
  Annotation, CRediT, RO-Crate, DataCite-compatible metadata — as declared
  export profiles, never as silent internal mutation.
- 3-2-1 posture: authoritative DB with PITR, versioned object store, independent
  archive copy, periodic portable snapshots. Restore drills are scheduled work,
  not aspirations.
- An annual succession package (bundles, schema history, governance record,
  identifier mappings, DNS recovery, restore docs, static site copy) must let a
  future steward run the institution without the founder's laptop or memory.

## 14. Security and privacy

Server-side scopes only; RLS on every private kernel table; short-lived
sessions, no auth material in `localStorage`; strong auth for publishers and
stewards; two-person approval policy-capable before multiple publishers exist.
Sanitize rendered HTML/SVG; isolate uploaded active content; hash every released
asset; SSRF-restricted outbound fetches. Public attribution uses explicit
public-person records, not member account fields. Aggregate, non-profiled
analytics only (ADR-0024). Moderation reviews targeting, evidence, conflicts,
plagiarism, fabrication, and unsafe proposals — public disagreement is not an
abuse category.

## 15. Scale and evolution

- **Read scale:** releases are immutable and CDN-friendly; global readership
  mostly never touches the database.
- **Write scale:** editorial writes are low-volume, transaction-heavy; one
  well-indexed regional PostgreSQL primary is correct until measured otherwise.
- **Graph scale:** bounded focus queries (depth ≤ 2, explicit limits),
  precomputed neighborhoods, cursor pagination; a dedicated graph read store
  only after query evidence, and even then disposable.
- **Institution scale:** second space ⇒ separate governance, tenant-scoped
  writes, explicit cross-space citations, no shared reviewer authority without
  delegation, independent export/deletion. Cross-space work never creates a
  global reputation score. A generic "academy marketplace" waits for a second
  *real* institution.

## 16. What not to build

Activity feeds, per-work comment sections, popularity/citation leaderboards, a
graph database, real-time collaborative editing before revision semantics are
stable, automated truth scores, AI-assigned claim levels, on-platform sensitive
human-subject data collection, microservices/Kafka without measured need,
federation before local contracts are proven, an academy builder before a second
institution exists.

---

*Manifesto compliance: this architecture serves L1 (attention is sacred — finite,
typed surfaces), L5/L6 (no counters, no streaks — P8, P12), L8 (depth over
glances), L9 (no surveillance — ADR-0024, P8), and L12 (declared intention —
pull-based search, typed exits). It violates none; every forbidden mechanic is a
named invariant with an enforcement path (doc 15 gates).*
