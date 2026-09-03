# Public Launch Sprint Plan

> **Superseded as a plan (ADR-0032, 2026-09-02).** Current execution lives in
> `15-PLATFORM-IMPLEMENTATION-PLAN.md`; the Gate A (public reading) and data-rights
> obligations defined here remain valid and are referenced from there. Retained as history.

> End-to-end execution plan to take the platform from "runs locally" to public use.
> This plan operationalizes `06-IMPLEMENTATION-ROADMAP.md` for launch. It is grounded in a
> verified code audit (2026-08-04), not aspiration.

## 1. What "public use" means

Launch happens in two gates. Each gate is a shippable deliverable with its own
acceptance criteria.

| Gate                           | Deliverable                                                                                                                               | Who it serves        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **Gate A — Public Reading GA** | Anyone on the internet can read published releases at `/read/:ownerId/:slug` served from immutable manifests via a deployed orchestrator. | Readers (no account) |
| **Gate B — Member Beta**       | Invite-only members can sign in, publish, import their footprint, upload sources, and export/delete everything they own.                  | Invited members      |

Gate A ships first: it requires no member data rights work and proves the full
private-draft → validated-release → public-page loop in production. Gate B is blocked by
the manifesto's non-negotiables (portability, deletion, consent) — member accounts do not
open until export/delete works.

## 2. Verified current state (audit summary)

### Done and solid

- **Publications domain**: projects/sections/revisions CRUD, release validation,
  idempotent release creation, immutable JSON manifests in object store, public delivery
  endpoint filtered to `published` + `public` (`backend/orchestrator/app/domains/publication/`).
- **Footprint graph domain**: accounts/nodes/edges, idempotent imports backed by
  `orchestrator_runs`, RSS/Substack normalizer, snapshot endpoint, cross-owner isolation
  (`backend/orchestrator/app/domains/graph/`).
- **Auth machinery**: JWT (HS256) + `local_header` adapter, write-scope enforcement,
  production-mode validation (`backend/orchestrator/app/auth/dependencies.py`).
- **Infra primitives**: Alembic migrations (4), Dramatiq + Redis worker, dual-mode object
  store (filesystem/S3), request-ID middleware, structured errors, 22 tests, CI lint+test.
- **Frontend**: Publication Studio (API-connected), public reader on delivery manifests,
  Doctrine surface, NucleusGraph authoring, typed orchestrator services, OTP `useAuth`.

### Gaps blocking Gate A

1. **No production deployment** — orchestrator API/worker run only locally; the public
   reader has no backend to resolve manifests against.
2. **No production data plane** — no managed Postgres, Redis, or S3-compatible store.
3. **No CORS/security posture** — no CORS allowlist, security headers, or rate limiting.
4. **No observability** — no error tracking, uptime checks, or backups.
5. **Reader is not yet public-grade** — no SEO/OG metadata, sitemap, revocation handling,
   or accessibility pass.

### Gaps blocking Gate B

6. **Split-brain auth** — frontend OTP (`/api/otp/*`) lives in the legacy Flask backend
   (`backend/src/routes/auth.py`); the orchestrator verifies its own JWT. There is no
   bridge, so a signed-in member cannot call the orchestrator in production.
7. **No export/delete/audit** — manifesto gate; Increment 6 not started.
8. **Vault ingestion unfinished** — upload URL + tables exist; no registration into DB,
   extraction, chunking, or source UI.
9. **Footprint graph UI unwired** — API clients exist; no navigator/import panel routes.
10. **Test debt** — 2 frontend test files; no e2e smoke of the publish→read loop.

## 3. Sprint plan

Six sprints. Each sprint has a single theme, a demo, and hard exit criteria. Engineering
gates from roadmap §5 (migration, contract, domain tests, permission tests, redaction
tests, run instructions) apply to every sprint.

---

### Sprint 1 — Production spine (deploy everything once)

**Theme:** the orchestrator exists on the public internet, safely, even with zero users.

Scope:

- Pick and provision the hosting stack (recommendation, one provider each):
  - API + worker containers: Fly.io or Cloud Run (containerized; `Dockerfile` +
    `docker-compose.orchestrator.yml` already model the shape).
  - Postgres: Neon or Supabase (managed, branchable).
  - Redis: Upstash.
  - Object store: Cloudflare R2 (S3-compatible; `S3ObjectStore` already supports
    endpoint URLs).
- Domain + TLS: `api.<domain>` for the orchestrator; frontend stays static
  (GitHub Pages or Cloudflare Pages) pointed at it via `VITE_ORCHESTRATOR_URL`.
- Alembic migrations run as a release step, not at app boot.
- CORS middleware with explicit origin allowlist; baseline security headers.
- Redis-backed rate limiting on all public and mutation routes (roadmap Increment 2 item).
- Observability floor: Sentry (API + frontend), uptime monitor on `/healthz`, nightly
  Postgres backups with a tested restore.
- CI/CD: extend `.github/workflows/ci.yml` with build+deploy jobs (deploy on `main`,
  migration check against a throwaway database).

Exit criteria:

- `https://api.<domain>/healthz` is green from CI and an external monitor.
- `orchestrator-worker` processes a smoke job in production.
- A release manifest written locally can be read through the deployed public delivery
  endpoint.
- Secrets live only in the deploy platform; `local_header` auth is rejected in prod
  (already enforced by settings validation — verify in deployed env).
- Restore-from-backup has been executed once.

---### Sprint 2 — One auth system (kill the split brain)

**Theme:** OTP login lives in the orchestrator; every request is member-scoped end to end.

Scope:

- Port the OTP flow from Flask (`backend/src/routes/auth.py`) into a new orchestrator
  `auth` domain: `POST /v1/auth/otp/request`, `POST /v1/auth/otp/verify`,
  `GET /v1/auth/session`.
- `members` table + migration (id, email hash, display name, status, invited_by,
  created_at). Server-enforced single-use invite codes per ADR-0003.
- Verify issues a short-lived session JWT in an httpOnly cookie; the existing JWT
  dependency verifies it and derives `owner_id` — no `X-Owner-Id` in production paths.
- Email delivery adapter (Resend/Postmark) with the dev-code fallback preserved locally.
- Frontend: point `useAuth.ts` at the orchestrator; remove the Flask `/api` dependency
  from the auth path; owner mode derives from session only (drop `?owner=1` in prod
  builds).
- Rate limit OTP request/verify aggressively (per-email + per-IP).
- Decommission plan for the Flask backend: auth route removed; donations/metrics either
  ported later or explicitly frozen (documented, not load-bearing for launch).

Exit criteria:

- A member can request a code, sign in, and call every owner-scoped orchestrator route
  with the session cookie — locally and in production.
- Requests without a session hit 401; cross-owner tests still pass; OTP brute force is
  rate-limited (tests prove all three).
- No Flask process is required to run the platform.

---

### Sprint 3 — Public Reading GA (**Gate A ships**)

**Theme:** the first public deliverable — Henok's book readable by anyone, calmly.

Scope:

- Publish the real book end-to-end: Studio → sections/revisions → validate → release →
  `/read/henok/<book-slug>` in production (dogfood; fix what breaks).
- Delivery hardening: CDN/cache headers on manifest reads, release revocation honored by
  the reader, version pinning (`?v=`), graceful 404/revoked states.
- Reader polish: SEO + OpenGraph metadata per release, sitemap for published releases,
  shareable section links, print stylesheet, typography/ToC pass using Attention OS
  reader primitives — no feed rail, counters, or autoplay-next (manifesto check).
- Accessibility pass (keyboard nav, contrast, semantics) and Lighthouse budget
  (performance ≥ 90 on the reader route).
- Frontend route cleanup: retire legacy/duplicate home-era routes and dead components on
  the public path (per `03-CLEANUP-AND-STRUCTURE.md`).
- Provenance surface (product track D2): the reader displays release version, rendered
  date, and an "immutable release" affordance backed by the manifest; share links carry
  version pins.
- E2E smoke test in CI: create project → release → fetch public manifest → render.

Exit criteria:

- A stranger with a URL can read the book on production with no account.
- Revoking a release removes it from public within cache TTL.
- Publish→read e2e test runs green in CI against a real (ephemeral) stack.
- Reader route passes the accessibility and performance budgets.
- A reader can tell which release version they are reading and that it cannot be
  silently edited (D2).

---

### Sprint 4 — Data rights: export, delete, audit (manifesto gate)

**Theme:** reversibility is real before any member data accumulates. Roadmap Increment 6,
pulled ahead of vault/connectors deliberately — member beta cannot open without it.

Scope:

- `member_exports` workflow: full structured archive (projects, sections, revisions,
  releases, graph nodes/edges/accounts/imports, vault sources) as a downloadable bundle
  via `orchestrator_runs`.
- Deletion request workflow: soft-request → verification → hard delete of rows, object
  store blobs, chunks, and derived data; release citation-dependency carve-out per
  roadmap.
- Audit events table — event type, owner, timestamp, no private content — with redaction
  tests.
- Object cleanup verification job (orphaned blob scan).
- Member settings UI: export button with run status, deletion request with confirmation,
  audit trail view.

Exit criteria:

- A member can export and receive a complete archive without staff help.
- A member can delete their account; verification proves blobs/chunks/rows are gone.
- Deletion status is inspectable after deletion without retaining content.
- Audit log contains zero private content (tested).

---

### Sprint 5 — Knowledge Vault MVP (roadmap Increment 4)

**Theme:** member-owned sources become readable with provenance.

Scope:

- Finish `POST /v1/vault/nodes`: persist `source_objects` + initial `source_versions`
  (currently returns an ID without a DB insert).
- Extraction worker: markdown/plain text first, PDF second; chunking with
  `source_anchors` locators and checksums; status via `orchestrator_runs`.
- Source list + detail endpoints (owner-scoped), reprocess → new version, delete wired
  into Sprint 4 deletion machinery.
- Frontend: Knowledge Vault page (guided intake flow per roadmap §2B), source list with
  processing status (`RunStatusPanel`), Calm Reader for ready sources, source detail
  sheet with version history.
- Calm-state design pass (product track D3) across vault and studio: designed empty,
  loading, offline, and completion states.

Exit criteria:

- Upload → processing status → readable source with anchors, end to end in production.
- Reprocessing creates a new version; deletion removes blobs/chunks/embeddings.
- No source content appears in logs (redaction tests).

---

### Sprint 6 — Footprint surface + Member Beta (**Gate B ships**)

**Theme:** the member-facing graph OS opens to invited members.

Scope:

- Footprint graph UI: `/footprint` route wired to the snapshot endpoint
  (`OrchestratorGraphService` already exists), import panel for RSS/Substack with
  history/status, empty/offline/populated states (roadmap Increment 3A frontend half).
- Invite issuance UI for the owner; invite acceptance flow on top of Sprint 2 codes.
- Onboarding path for a new member: sign in → empty studio/vault/footprint → first
  import or upload.
- P4 Session Intention & Attention Budget first implementation (product track D4),
  with the consented time-well-spent metric floor.
- The Door polished as the production entry path + stated membership pricing posture
  (product track D5).
- Beta readiness: load smoke test (k6 or Locust) on delivery + auth routes, incident
  runbook, backup/restore re-drill, key rotation procedure documented.
- Beta cohort: issue first invites; instrument only consented, non-surveillance
  operational metrics.

Exit criteria:

- An invited member completes sign-up → import → publish → public read unaided.
- Graph UI renders all three states against production.
- A member can declare an intention, complete it, and see the system stop asking for
  attention (D4).
- Runbook exists; on-call knows how to roll back a deploy and restore a backup.
- Gate B checklist signed off against manifesto laws L1–L12.

---

## 4. Product & design track (parallel)

Engineering sprints above make the platform work; this track makes it _legible as a
product_. Grounding (2026-08-04 product assessment): the defensible novelty is the
compound of provenance-first publishing, the manifesto enforced as binding law, the
threshold ritual, and the organic graph surface. Most manifesto laws are absences — no
feed, no counters, no push — and absences don't demo. These workstreams make the
novelty visible. Each lands inside the numbered sprints referenced.

### D1 — Design-language consolidation (Sprints 1–3)

Three design eras coexist (legacy home-era components, `blocks/` shadcn surfaces, the
newer `src/dot/` organic language). The `dot/` language wins.

- `src/dot/` (BloomSurface, NucleusGraph, SynapticEdge) is the canonical design
  language; `blocks/` surfaces adopt its tokens.
- Single documented OKLCH token set with dark-mode parity.
- Legacy home-era components retired from every public route
  (per `03-CLEANUP-AND-STRUCTURE.md`).
- The empty `src/plexus/` skeleton is deleted or given a real charter — no dead
  promises in the tree.

Exit: every route reachable from `/` renders in one design language.

### D2 — Provenance surface (Sprint 3, ships with Gate A)

The platform's most marketable novelty — verifiable, immutable publishing — made
visible to a stranger in five seconds.

- Reader shows release version, rendered date, and an "immutable release" affordance
  backed by the manifest.
- Section share links carry version pins.
- Revoked/superseded releases state what happened instead of silently vanishing.

Exit: a reader can tell what version they are reading and that it cannot be silently
edited.

### D3 — Calm-state design (Sprints 3–5)

"Calm" must read as intentional, not unfinished.

- Designed empty, loading, offline, completion, and end-of-content states for reader,
  studio, vault, and footprint surfaces.
- Completion states celebrate finishing (L2/L8): an explicit end-of-book moment, no
  next-content bait.

Exit: no default spinner or blank screen on any public or member path.

### D4 — Session Intention & Attention Budget (Sprints 5–6, ships with Gate B)

P4 is the most differentiating member-facing primitive and currently has zero
implementation. It ships with the beta, not after.

- First implementation of the `IntentionProvider` contract (North Star §5): optional
  intention declaration on entering the member interior, gentle elapsed-time awareness,
  a calm "you've done what you came for" moment. Never nags.
- The consented time-well-spent metric floor ships with it (intention completion,
  optional self-reported reflection) — the manifesto §5 metrics get their first real
  instrumentation.

Exit: a member can declare an intention, complete it, and watch the system stop asking
for attention; metrics contain no surveillance.

### D5 — The Door and membership posture (Sprint 6, ships with Gate B)

The invite gateway is the strongest craft moment and the first impression.

- The threshold ritual (soundscape, brainwave visualizer, decryption arrival) polished
  into the production entry path.
- A stated membership pricing posture per ADR-0001 (member-funded), even if minimal
  ("beta members: free; founding pricing later"), presented on the Door. Stripe
  donations stay frozen in Flask; no new billing engineering for Gate B.

Exit: entering feels like crossing a threshold; the money question has a stated answer.

## 5. Deliberate sequencing decisions

- **Export/delete before vault** (Sprint 4 before 5): roadmap lists vault as Increment 4
  and data rights as 6, but public members must never deposit data we cannot return or
  destroy. Reordered for launch; ADR not required (no architectural change).
- **Source-backed AI (Increment 5) is post-launch.** It is the deepest remaining system
  (embeddings, pgvector, citation coverage) and neither gate depends on it.
- **Connector framework (Increment 7) stays last**, unchanged. RSS/Substack import
  already covers the read-only, low-risk case.
- **Flask backend is retired, not ported.** Only OTP auth is load-bearing; it moves to
  the orchestrator in Sprint 2. Donations/metrics get frozen or ported after Gate B.
- **P4 (intention/budget) waits for the member interior** (Sprint 6): it is meaningless
  without signed-in members, but Gate B does not open without it — it is the beta's
  signature product detail.

## 6. Risks and mitigations

| Risk                              | Mitigation                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Hosting decision stalls Sprint 1  | Default stack named in Sprint 1; any S3/Postgres/Redis substitution is config-only (adapters already exist).                 |
| OTP port breaks existing sign-in  | Keep Flask endpoint alive behind a flag until orchestrator parity is proven by tests, then cut over.                         |
| Public reader leaks draft content | Delivery endpoint already filters `published`+`public`; add a regression test that drafts and revoked releases 404 publicly. |
| Deletion misses derived data      | Sprint 4 cleanup-verification job + explicit checklist per table/blob prefix.                                                |
| Solo-builder bandwidth            | Every sprint ends demoable; Gate A after Sprint 3 delivers public value even if later sprints stretch.                       |
| Calm design reads as unfinished   | D3 calm-state workstream: every empty/loading/completion state is designed, not defaulted.                                   |
| Novelty stays invisible           | D2 provenance surface ships with Gate A; the immutable-release story is demonstrable on every public page.                   |

## 7. Immediate next actions (Sprint 1, day one)

1. Choose the hosting stack (defaults above) and provision Postgres/Redis/R2.
2. Write the orchestrator `Dockerfile` + deploy workflow job.
3. Point a staging `VITE_ORCHESTRATOR_URL` build at the deployed API.
4. Add CORS + rate-limit middleware behind settings.
5. Wire Sentry and the uptime monitor.
