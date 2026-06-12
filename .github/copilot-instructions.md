---
applyTo: "**"
---

# Copilot Instructions — Attention-first platform

This repo builds an **invite-only platform that protects attention instead of selling
it**. The product philosophy in `docs/blueprint/00-ATTENTION-MANIFESTO.md` is binding.
See `AGENTS.md` for the full guide.

## Always

- Before non-trivial work, read `docs/blueprint/00-ATTENTION-MANIFESTO.md`, `01-NORTH-STAR.md`, `02-ARCHITECTURE.md`, and relevant ADRs in `docs/blueprint/adr/`.
- For every change, state **which manifesto law (L1–L12) it serves and that it violates none.**
- Build member screens by composing the five `attention-os/` primitives (Focus Modes, Reader, Single-Focus Nav, Intention/Attention-Budget, Presence). Don't reinvent them.

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
- Backend is Flask + SQLite today, migrating to Postgres for the real invite system (ADR-0002/0003).
- Don't edit dead/duplicate files — verify live imports first.

## Quality & security

- `pnpm lint`, `pnpm test`, and `pnpm build` must pass before merge. Full `pnpm exec tsc --noEmit` is installed and reported in CI, but currently non-blocking while existing repo-wide TS debt is retired; touched files should not add new type errors.
- Validate all input server-side (incl. invite tokens); never trust the client; no secrets in repo; parameterized queries only.
- Respect performance budgets and `prefers-reduced-motion`; lazy-load three.js/audio.
- Don't create change-log markdown unless asked; record decisions as ADRs.
