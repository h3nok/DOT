# AGENTS.md — How to build in this repository

> Instructions for AI coding agents (and humans) working in this codebase. Read this
> before making changes. It is intentionally short; the deep context lives in
> `docs/blueprint/`.

## What this project is

An invite-only platform that **protects attention instead of selling it**. It starts as
the founder's public profile and grows one trusted invitation at a time. The product
philosophy is binding law, not vibes.

**Read these, in order, before non-trivial work:**

1. `docs/blueprint/00-ATTENTION-MANIFESTO.md` — the laws (L1–L12). The soul.
2. `docs/blueprint/01-NORTH-STAR.md` — vision, IA, the 5 Attention OS primitives.
3. `docs/blueprint/02-ARCHITECTURE.md` — how it's built to scale to 100M+.
4. `docs/blueprint/04-KNOWLEDGE-AND-PUBLICATION.md` — source-backed reading and publishing.
5. `docs/blueprint/05-FASTAPI-ORCHESTRATOR.md` — orchestrator service contract.
6. `docs/blueprint/06-IMPLEMENTATION-ROADMAP.md` — current build order and acceptance gates.
7. `docs/blueprint/adr/` — decisions already locked.

## The prime directive

Every change must answer: **"Which manifesto law does this serve, and does it violate
any?"** Put the answer in the PR/commit description.

These are **architecturally forbidden** in member-facing surfaces (ADR-0004):

- ❌ Engagement-ranked **feeds** / infinite scroll / autoplay-next (L2, L3)
- ❌ Interruptive **push notifications** or red **badges** (L4)
- ❌ Public **counters / vanity metrics** (likes, followers, views) (L5)
- ❌ **Streaks / FOMO / fake scarcity** (L6)
- ❌ **Dark patterns**; leaving/cancelling/exporting must be easy (L7)
- ❌ Third-party **trackers / ad SDKs / behavioral profiling** (L9)

If a task seems to require one of these, **stop and flag it** — it needs a superseding ADR,
not a quiet implementation.

## Build member screens from primitives

Member UI is *intended* to be composed from `frontend/src/attention-os/` primitives (North
Star §5): Focus Modes (P1), Reader (P2), Single-Focus Navigation (P3), Intention &
Attention Budget (P4), Presence & Ambient Signals (P5).

**Reality check (verify before relying on this):** only **P2 (Reader)** exists today, as
`attention-os/reader/BookMarkdown.tsx`. P1, P3, P4, and P5 are **not implemented**. Existing
surfaces are ad-hoc components under `dot/` and `blocks/`. If you need a primitive that does
not exist, either build it in `attention-os/` as a reusable module or say plainly that you
did not — do not claim to have composed from primitives that are absent.

## Repo facts (save yourself time)

- Project root is `DOT/` (this folder). Frontend: `frontend/`, backend: `backend/`.
- **Frontend entry is `src/AppOptimized.tsx`**, not `src/App.tsx` (consolidating — ADR-0005).
- Package manager: **pnpm**. Stack: React 19 + Vite 6 + TS + Tailwind v4 + shadcn/Radix.
- Backend: **one service** — the FastAPI orchestrator at `backend/orchestrator/`
  (Postgres/Redis/object store). The Flask prototype is **gone** (ADR-0009); if a doc still
  references `backend/src`, the doc is stale, not the code.
- Existing attention prototype lives in `blocks/core/invite/InviteGatewayPage.tsx` + `services/SoundscapeService.ts`.
- Legacy `services/api/BaseApiService.ts` targets the retired `/api` backend and reads auth
  from `localStorage`. Do not build on it; use `services/Orchestrator*Service.ts`.

## Commands

```bash
# The gate. Run this before claiming work is done — it is what CI runs.
make verify       # frontend lint + typecheck + tests + build, backend lint/format + tests
make format       # autofix frontend and backend formatting
make audit        # dependency vulnerability audit

# Frontend (run inside frontend/)
pnpm install
pnpm dev          # local dev server
pnpm build        # production build
pnpm lint         # eslint (covers .ts/.tsx)
pnpm exec tsc --noEmit   # typecheck — must stay at zero errors
pnpm exec vitest run     # tests

# FastAPI orchestrator (repo root)
make install-orchestrator
make orchestrator-services-up
make migrate-orchestrator
make start-orchestrator
make start-orchestrator-worker
make test-orchestrator
```

## Working rules

- **Read before editing.** Don't edit files that have no live imports — check first (many DOT-era duplicates exist).
- **Quality gates:** `make verify` must be green before merge. Typecheck is **blocking** and the
  repo is at zero type errors — keep it there.
- **The laws are executable.** `frontend/src/test/manifesto-laws.test.ts` fails the build on
  streaks, push notifications, vanity counters, infinite scroll, and third-party trackers.
  Its `QUARANTINE` list is a ratchet for pre-existing violations: never add to it to make a
  build pass, and delete entries as they are fixed.
- **Security:** validate all input server-side (incl. invite tokens); never trust the client; no secrets in the repo; parameterized queries only. Never put auth material in `localStorage`.
- **Performance is a feature:** respect the budgets in `02-ARCHITECTURE.md §7`. Lazy-load three.js/audio. Respect `prefers-reduced-motion`.
- **Don't add change-log markdown files** unless asked. Architecture changes → an ADR.
- **Small, reviewable changes.** Cleanup/deletion of legacy files happens in its own change, never bundled with features (ADR-0005).

## Decision-making

If a requirement is ambiguous, prefer the option that (a) protects member attention and
(b) keeps module boundaries clean. When a decision has lasting trade-offs, write an ADR
in `docs/blueprint/adr/` using `0000-template.md`.
