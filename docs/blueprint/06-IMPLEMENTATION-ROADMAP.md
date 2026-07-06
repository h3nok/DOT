# Implementation Roadmap

> The current build plan for the self-contained Stay/DOT system. This document turns the
> design decisions in the blueprint into an execution order, starting with the FastAPI
> orchestrator and Publication Studio.

## 1. Current source of truth

Read these documents in this order before implementation work:

1. `00-ATTENTION-MANIFESTO.md` - product laws and non-negotiables.
2. `01-NORTH-STAR.md` - product surfaces and Attention OS primitives.
3. `02-ARCHITECTURE.md` - system shape, privacy, deployment, and scaling constraints.
4. `04-KNOWLEDGE-AND-PUBLICATION.md` - product layer for sources, reader, AI, and publishing.
5. `05-FASTAPI-ORCHESTRATOR.md` - service contract for the orchestrator.
6. `07-DIGITAL-FOOTPRINT-GRAPH.md` - graph-aware social integrations and footprint UI.
7. This roadmap - build order and acceptance gates.
8. `adr/` - accepted decisions and trade-offs.

The older root-level `PERSONAL_SITE_SPRINT_PLAN.md` is retained as a legacy personal-site
plan. It no longer drives the platform implementation.

## 2. Implementation principle

Build the smallest complete loop first:

```text
private draft -> validated release -> static public reading page -> exportable artifact
```

After that loop works, add source ingestion, source-backed AI, export/delete, and then
connectors. Do not start with connectors, a general chatbot, social mechanics, or a broad
microservice split.

## 2A. Reuse from the existing AI Platform

The existing FastAPI orchestrator at
`/Users/hghebrechristos/Innovation/innovationlab-monorepo/apps/ai-platform/orchestrator-service`
is the reference implementation for service infrastructure. DOT should reuse its proven
patterns while keeping a different product domain.

Reused/adapted now:

- FastAPI app shell with lifespan startup/shutdown logging.
- Shared-style settings object with production validation.
- Structured JSON logging with request ID propagation.
- Conservative private-content redaction in logs.
- Standard health/readiness aliases: `/health`, `/healthz`, `/ready`, `/readyz`,
  `/health/ready`.
- JWT/gateway-ready auth path with a local header adapter for development.
- Resilient HTTP client primitives with retry and circuit breaker.
- Service-error primitives for domain code.
- Test style for health/auth/API contracts.

Reusable later:

- Knowledge API chunking and citation model, adapted to member-owned sources.
- Ingestion Pipeline job lifecycle, retry, and review-state patterns.
- Redis job-state patterns if Postgres-backed `orchestrator_runs` needs a faster hot path.
- Vector-store adapter boundaries, adapted to Postgres/pgvector first.

Intentionally not reused:

- ADK agent loop, MLOps registries, Agent Engine deployment, and enterprise tool registry.
- Enterprise tenant/value-stream semantics as-is. DOT uses member ownership and source
  scope instead.
- Gamification, dashboards, and engagement-oriented analytics.

## 2B. Reuse from the existing AI Platform React/UI layers

The AI Platform frontend contains mature React interaction patterns that are useful for
DOT, but they should be copied/adapted into DOT source rather than imported as a package.
DOT already has the compatible stack: React 19, TypeScript, Tailwind v4, Radix/shadcn,
lucide, Framer Motion, `react-resizable-panels`, markdown rendering, and typed services.

Reference paths:

- `/Users/hghebrechristos/Innovation/innovationlab-monorepo/apps/ai-platform/packages/chat/src`
- `/Users/hghebrechristos/Innovation/innovationlab-monorepo/apps/ai-platform/packages/ui/src/components/agentic`
- `/Users/hghebrechristos/Innovation/innovationlab-monorepo/apps/ai-platform/agentic/client/src/components/citations`
- `/Users/hghebrechristos/Innovation/innovationlab-monorepo/apps/ai-platform/agentic/client/src/components/confidence`
- `/Users/hghebrechristos/Innovation/innovationlab-monorepo/apps/ai-platform/agentic/client/src/components/layout/split-canvas-shell.tsx`
- `/Users/hghebrechristos/Innovation/innovationlab-monorepo/apps/ai-platform/agentic/client/src/pages/knowledge/components`

Reusable now:

- Adapter-driven chat architecture: `ChatAdapter`, `useChat`, streaming message events,
  loading/error states, auto-scroll, and backend-agnostic message types. In DOT this becomes
  a scoped source assistant, not a general assistant homepage.
- Citation and evidence primitives: inline source chips, expandable source previews,
  reliability/confidence states, and source-detail affordances. In DOT these become
  `SourceAnchorChip`, `CitationPopover`, and `ClaimSupportIndicator` tied to source chunks
  and publication citations.
- Split canvas workspace pattern: persistent work context with an optional side canvas.
  In DOT this becomes the Publication Studio shell: project/source outline, editor/reader,
  and an inspector for citations, run status, revisions, and export.
- Guided intake flow from the Knowledge page: choose source, check, review, process, done.
  In DOT this becomes Knowledge Vault upload, with personal-source language and explicit
  rights/scope decisions.
- Document detail sheet and version history patterns: source metadata, processing status,
  tags, diff/version timeline, reprocess/archive/delete actions. In DOT this powers source
  detail and publication revision history.
- Design-system decisions: CSS-variable tokens, semantic status colors, compact status
  badges, icon-first controls, restrained motion tokens, dark-mode parity, and shadcn
  `new-york`-style density.

Intentionally not reused:

- `@costco/ui` as a runtime dependency, Costco brand tokens, or enterprise product names.
- Admin dashboards, KPI grids, value-stream/team governance, feature-flag UI, and broad
  enterprise permission vocabulary.
- Gamification, score rings, streaks, leaderboards, celebrations, or engagement analytics.
- Always-on chat as the primary surface. DOT's primary surfaces are reader, editor, source
  vault, and public release pages.
- Thought-trace/tool-call spectacle by default. Workflow details should be inspectable in
  run status panels, not promoted as entertainment.
- tRPC/API assumptions from the AI Platform app. DOT should keep typed service clients
  against the FastAPI orchestrator OpenAPI contract.

## 3. Target system increments

### Increment 0 - Documentation and contracts

Status: scaffolded.

Scope:

- Blueprint docs updated with the Knowledge & Publication OS.
- FastAPI orchestrator service spec written.
- ADR-0008 accepted for the orchestrator boundary.
- Implementation roadmap maintained here.

Acceptance:

- Blueprint index links to all current docs.
- AGENTS.md points agents to the current implementation docs.
- Legacy docs are marked subordinate where they conflict with the blueprint.

### Increment 1 - Orchestrator foundation

Status: scaffolded; next step is running it against local Postgres/Redis/MinIO.

Goal: create the backend service skeleton that future workflows can run through.

Scope:

- `backend/orchestrator/` FastAPI app.
- Settings module with environment-based config.
- `/healthz`, `/readyz`, and OpenAPI.
- Postgres connection with SQLAlchemy 2 async.
- Alembic migrations.
- Redis connection.
- Worker broker and one no-op test workflow.
- Local Docker Compose for Postgres, Redis, and MinIO.
- Test harness with pytest, ruff, and migration checks.

Acceptance:

- `orchestrator-api` starts locally on port `8000`.
- `orchestrator-worker` starts locally and can process a smoke job.
- First migration applies cleanly to an empty Postgres database.
- CI can run lint and tests for the orchestrator package.
- No private content appears in logs.

### Increment 2 - Auth and ownership boundary

Goal: make every orchestrator action member-scoped before storing real data.

Scope:

- Auth dependency that verifies the existing session/JWT or gateway-provided identity.
- `owner_id` propagated into every domain service.
- Permission helpers for owner-scoped reads/writes.
- Idempotency-key support for state-changing routes.
- Basic rate-limit hooks using Redis.

Acceptance:

- Requests without verified identity cannot access private routes.
- A member cannot read or mutate another member's projects, sources, runs, or exports.
- State-changing requests can be retried without duplicating records.
- Tests cover cross-owner access denial.

### Increment 3 - Publication Studio MVP

Goal: publish Habte's book/work from private drafts to immutable public pages.

Scope:

- `publication_projects`.
- `publication_sections`.
- `publication_revisions`.
- `publication_releases`.
- Create/list/read/update project endpoints.
- Create/update/revision section endpoints.
- Release validation endpoint.
- Release creation workflow.
- Static release manifest.
- Public reading route backed by release manifest.
- Markdown export for a project or release.

Acceptance:

- A private book project can be created with ordered chapters.
- Edits create revisions.
- A release freezes the selected revision graph.
- Public pages read from immutable release assets, not live draft tables.
- A correction creates a new release or revokes an old release.
- Public reading pages have no feed rail, vanity counters, or autoplay-next.

### Increment 3A - Digital Footprint Graph foundation

Status: scaffolded.

Goal: make the orchestrator graph-aware before broad social connectors are added.

Scope:

- `footprint_accounts`.
- `footprint_nodes`.
- `footprint_edges`.
- `footprint_imports`.
- Graph account create/list endpoints.
- Graph node and edge create endpoints.
- Idempotent graph import endpoint backed by `orchestrator_runs`.
- Owner-scoped graph import list endpoint for UI status/history.
- RSS/Substack import processor that normalizes feed items into graph nodes and edges.
- Public-network feed guardrails for RSS/Substack fetches.
- Owner-scoped graph snapshot endpoint.
- Frontend graph service and first footprint graph page at `/footprint` and `/graph`.
- Frontend import panel plus recent import history/status surface.

Acceptance:

- A member can add a platform account such as Substack/RSS.
- A member can create footprint nodes and edges.
- A member can queue a graph import and inspect its run.
- A member can list recent graph imports with status and summary counts.
- A member can process a Substack/RSS feed into account, publication, post, and topic nodes.
- Repeated graph imports with the same idempotency key return the same import record.
- Repeated account creation for the same platform handle returns one account record.
- Local/private RSS targets are rejected before connector fetch.
- A member cannot read another member's graph.
- Cross-owner graph edges are rejected.
- The UI can render empty, offline, and populated graph snapshots.

### Increment 4 - Knowledge Vault upload MVP

Goal: ingest member-owned files and make them readable with provenance.

Scope:

- Pre-signed upload creation.
- `source_objects`, `source_versions`, `knowledge_chunks`, `source_anchors`.
- Encrypted object-store references.
- Text extraction for markdown/plain text first, PDF next.
- Chunking with locators.
- Processing status through `orchestrator_runs`.
- Source delete/export controls.

Acceptance:

- A member can upload a source and see processing status.
- Ready sources can be opened in the Calm Reader.
- Chunks have source anchors and checksums.
- Reprocessing creates a new source version.
- Deletion removes active blobs, chunks, embeddings, and anchors unless a published
  release has a legal citation dependency.

### Increment 5 - Source-backed AI

Goal: answer and summarize only from explicit member-selected sources.

Scope:

- Embedding integration.
- pgvector-backed retrieval.
- Assistant query endpoint.
- Source summary endpoint.
- Collection summary endpoint.
- Draft-section helper for Publication Studio.
- Citation coverage validation.
- Unsupported-claim markers.
- Redacted model-provider integration layer.

Acceptance:

- Every answer returns citations or explicitly says the sources do not support the answer.
- Retrieval scope is explicit; there is no default "all member data" mode.
- Raw prompts, retrieved chunks, and private draft bodies do not appear in logs, traces, or
  analytics.
- AI-generated drafts are saved as revisions and never published automatically.

### Increment 6 - Export/delete and audit

Goal: make reversibility real before adding more data sources.

Scope:

- Member export workflow.
- Deletion request workflow.
- Audit events without private content.
- Object cleanup verification.
- Derived data cleanup for chunks, embeddings, caches, and run outputs.
- Key-rotation or key-destruction hooks where applicable.

Acceptance:

- A member can request an export and receive a structured archive.
- A member can request deletion without staff intervention.
- Deletion status remains inspectable without retaining deleted content.
- Support/admin paths cannot bypass owner checks.

### Increment 7 - Connector framework

Goal: add external sources only after uploads, publication, provenance, and data rights work.

Scope:

- Connector registry.
- Encrypted connector tokens.
- Explicit scopes and revocation.
- Read-only sync jobs.
- Per-connector rate-limit and backoff policy.
- Inspectable import ledger.

Acceptance:

- Members can see what a connector can access before enabling it.
- Members can revoke a connector.
- Sync jobs are idempotent and inspectable.
- No connector silently imports broad account history.

## 4. Frontend implementation track

The frontend should expose only the next backend capability that is actually durable.

Order:

1. Publication Studio routes and API client.
2. Public reading route for immutable releases.
3. Run status UI for validation/publish jobs.
4. Knowledge Vault upload and source list.
5. Calm Reader for sources.
6. Digital Footprint graph cockpit and graph navigation.
7. Source-backed assistant panel scoped to selected sources.
8. Export/delete controls in member settings.
9. Connector management after the backend connector framework exists.

Member-facing UI must use Attention OS primitives:

- Reader for long-form reading.
- FocusNav for single-primary-action screens.
- Intention/attention budget where the session has an explicit task.
- No feed, notifications, counters, streaks, or engagement loops.

### 4A. Frontend scaffold targets

When the frontend scaffold begins, create these DOT-native modules:

```text
frontend/src/blocks/publication/
  PublicationStudioPage.tsx
  components/PublicationStudioShell.tsx
  components/ProjectOutline.tsx
  components/SectionEditor.tsx
  components/ReleasePanel.tsx
  components/RevisionTimeline.tsx

frontend/src/blocks/knowledge/
  vault/KnowledgeVaultPage.tsx
  vault/SourceIntakeFlow.tsx
  vault/SourceDetailSheet.tsx
  assistant/SourceAssistantPanel.tsx
  assistant/sourceAssistantAdapter.ts
  components/SourceAnchorChip.tsx
  components/CitationPopover.tsx
  components/ClaimSupportIndicator.tsx
  components/RunStatusPanel.tsx

frontend/src/blocks/graph/
  FootprintGraphPage.tsx
  components/FootprintGraphNavigator.tsx

frontend/src/services/
  OrchestratorGraphService.ts
```

The first implementation should copy only the minimal source patterns needed from the AI
Platform React layers, then replace imports with DOT primitives from
`frontend/src/shared/components/ui` and typed clients in `frontend/src/services`.

## 5. Engineering gates

Every implementation increment must include:

- schema migration;
- API contract or OpenAPI change;
- domain tests;
- permission tests;
- redaction/logging tests when private content is involved;
- local run instructions;
- documented failure modes and retry behavior for workflows;
- update to this roadmap if scope changes.

## 6. Current next actions

1. Start local services with `make orchestrator-services-up`.
2. Apply migrations with `make migrate-orchestrator`.
3. Start the API with `make start-orchestrator`.
4. Start the worker with `make start-orchestrator-worker`.
5. Replace the local `X-Owner-Id` auth adapter with the real gateway/session verifier.
6. Add an S3/GCS-backed object-store adapter behind the release manifest interface.
7. Add first graph normalizer worker for Substack RSS imports.
8. Begin Knowledge Vault source upload tables and pre-signed upload flow.
9. Serve public reading pages from immutable release manifests instead of draft tables.

This is the next concrete build path. Anything outside this path should either wait or
receive a new ADR if it changes the system direction.
