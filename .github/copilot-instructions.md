---
applyTo: "**"
---

# Copilot Instructions — Attention-first platform

This repo builds an **invite-only platform that protects attention instead of selling
it**. The product philosophy in `docs/blueprint/00-ATTENTION-MANIFESTO.md` is binding.
See `AGENTS.md` for the full guide.

## Always

- Before non-trivial work, read `docs/blueprint/00-ATTENTION-MANIFESTO.md`,
  `01-NORTH-STAR.md`, `02-ARCHITECTURE.md`,
  `04-KNOWLEDGE-AND-PUBLICATION.md`, `05-FASTAPI-ORCHESTRATOR.md`,
  `06-IMPLEMENTATION-ROADMAP.md`, and relevant ADRs in `docs/blueprint/adr/`.
- For every change, state **which manifesto law (L1–L12) it serves and that it violates none.**
- Compose member screens from the `attention-os/` primitives **where they exist**. Only P2
  (Reader) is implemented today; P1, P3, P4, P5 are not. Build a missing primitive or say
  you didn't — never claim composition that did not happen.

## Never (in member-facing surfaces — ADR-0004)

- No engagement feeds, infinite scroll, or autoplay-next.
- No push notifications or red badge counters.
- No public vanity metrics (likes / followers / views).
- No streaks, FOMO, or fake scarcity.
- No dark patterns — leaving, cancelling, and exporting stay easy.
- No third-party trackers, ad SDKs, or behavioral profiling.

If a task seems to need any of the above, stop and flag it; it requires a superseding ADR.

## Repo facts

- Frontend entry is `src/AppOptimized.tsx` (not `App.tsx` — consolidating per ADR-0005). pnpm; React 19 + Vite + TS + Tailwind v4 + shadcn/Radix.
- Backend is a single FastAPI orchestrator at `backend/orchestrator/` (Postgres, Redis,
  MinIO, Alembic, Dramatiq). The Flask prototype was removed per ADR-0009 — docs that
  mention `backend/src` are stale.
- Don't edit dead/duplicate files — verify live imports first.
- `services/api/BaseApiService.ts` is legacy (retired `/api` backend, localStorage auth).
  Use `services/Orchestrator*Service.ts`.

## Quality & security

- `make verify` is the gate (frontend lint + typecheck + tests + build, backend lint/format + tests). Typecheck is **blocking**; the repo is at zero type errors.
- ADR-0004 is enforced by `frontend/src/test/manifesto-laws.test.ts`. Its `QUARANTINE` list only ever shrinks — never add to it to make a build pass.
- Validate all input server-side (incl. invite tokens); never trust the client; no secrets in repo; parameterized queries only. Never store auth material in `localStorage`.
- Respect performance budgets and `prefers-reduced-motion`; lazy-load three.js/audio.
- Don't create change-log markdown unless asked; record decisions as ADRs.
