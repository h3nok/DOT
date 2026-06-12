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
4. `docs/blueprint/adr/` — decisions already locked.

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

Member UI is composed from `frontend/src/attention-os/` primitives (North Star §5):
Focus Modes (P1), Reader (P2), Single-Focus Navigation (P3), Intention & Attention
Budget (P4), Presence & Ambient Signals (P5). Don't reinvent these; extend them.

## Repo facts (save yourself time)

- Project root is `DOT/` (this folder). Frontend: `frontend/`, backend: `backend/`.
- **Frontend entry is `src/AppOptimized.tsx`**, not `src/App.tsx` (consolidating — ADR-0005).
- Package manager: **pnpm**. Stack: React 19 + Vite 6 + TS + Tailwind v4 + shadcn/Radix.
- Backend: Flask today (SQLite), migrating to Postgres for the real invite system (ADR-0002/0003).
- Existing attention prototype lives in `blocks/core/invite/InviteGatewayPage.tsx` + `services/SoundscapeService.ts`.

## Commands

```bash
# Frontend (run inside frontend/)
pnpm install
pnpm dev          # local dev server
pnpm build        # production build (must pass before merge)
pnpm lint         # eslint
pnpm exec vitest run  # vitest non-watch test run

# Backend (inside backend/, venv at ../.venv)
source ../.venv/bin/activate
pip install -r requirements.txt
python src/main.py
```

## Working rules

- **Read before editing.** Don't edit files that have no live imports — check first (many DOT-era duplicates exist).
- **Quality gates:** `pnpm lint`, `pnpm test`, and `pnpm build` must be green before merge. Full `pnpm exec tsc --noEmit` is installed and reported in CI, but currently non-blocking while repo-wide TS debt is retired; touched files should not add new type errors.
- **Security:** validate all input server-side (incl. invite tokens); never trust the client; no secrets in the repo; parameterized queries only.
- **Performance is a feature:** respect the budgets in `02-ARCHITECTURE.md §7`. Lazy-load three.js/audio. Respect `prefers-reduced-motion`.
- **Don't add change-log markdown files** unless asked. Architecture changes → an ADR.
- **Small, reviewable changes.** Cleanup/deletion of legacy files happens in its own change, never bundled with features (ADR-0005).

## Decision-making

If a requirement is ambiguous, prefer the option that (a) protects member attention and
(b) keeps module boundaries clean. When a decision has lasting trade-offs, write an ADR
in `docs/blueprint/adr/` using `0000-template.md`.
