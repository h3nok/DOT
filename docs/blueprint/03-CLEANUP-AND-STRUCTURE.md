# Cleanup & Structure Plan

> Target structure (from `02-ARCHITECTURE.md §3`) and a **safe, staged** plan to get there
> from the current DOT-era layout. Per ADR-0005, cleanup is a dedicated, reviewed change —
> never bundled with feature work, always verified by `tsc --noEmit` + `pnpm build` + `pnpm test`.

## Target frontend layout

```
frontend/src/
├── app/             # ONE router + providers + layout shells
├── attention-os/    # P1 focus-modes · P2 reader · P3 focus-nav · P4 intention · P5 presence
├── blocks/
│   ├── profile/     # public profile (home, work, writing)
│   ├── invite/      # The Door (from blocks/core/invite)
│   └── member/      # /home /read /focus /people /me
├── content/         # site.config.ts, MDX
├── services/        # typed API clients + SoundscapeService
└── shared/          # shadcn ui, contexts, lib, hooks
```

## Stage 1 — Consolidate the app entry (ADR-0005)

- `main.tsx` imports `AppOptimized.tsx`; `App.tsx` is a parallel, unused router.
- **Action:** make one canonical entry under `app/`. Keep the lazy-loaded routing from
  `AppOptimized.tsx`; fold in any routes only present in `App.tsx`; delete the loser.
- **Verify:** every route still resolves; `pnpm build` green.

## Stage 2 — Remove dead/duplicate files

Verified to have **no live importers** (grep across `frontend/src`, 2026-06-11) —
safe to delete in a dedicated change after a final build check:

| File                                                  | Status                                              |
| ----------------------------------------------------- | --------------------------------------------------- |
| `src/App.tsx`                                         | superseded by `AppOptimized.tsx` (entry) — keep one |
| `src/blocks/core/home/HomePage_NEW.tsx`               | no importers                                        |
| `src/blocks/core/home/CompactSlideshowRefactored.tsx` | no importers                                        |
| `src/components/LogoTest.tsx`                         | dev scratch, no importers                           |
| `src/components/LogoDebugger.tsx`                     | dev scratch, no importers                           |

**Re-verify each** with a usage check immediately before deletion (files can gain importers
over time). Candidates to **review** (may still be referenced by the current home — confirm
before touching): `CompactSlideshow.tsx`, `ConceptSlideshow.tsx`, and the other DOT-era
home components (`DOTConcepts`, `FeaturesShowcase`, `ResearchHighlights`, etc.). These are
likely retired as the profile is rebuilt on Attention OS primitives, but verify per-file.

**Procedure (per batch):**

1. `grep` the symbol/path across `frontend/src` → confirm zero imports.
2. Delete the file(s).
3. `pnpm exec tsc --noEmit && pnpm build && pnpm test --run`.
4. Commit with message naming the removed files. Keep batches small.

> Everything is in git, so deletions are recoverable — but staged verification prevents
> breaking the build mid-refactor.

## Stage 3 — Introduce `attention-os/`

- Create the five primitive folders with the contracts from North Star §5.
- Migrate the existing prototype: brainwave visualizer + `SoundscapeService` → `attention-os/focus-modes/` (P1); bionic reading → `attention-os/reader/` (P2).
- Refactor `blocks/core/invite/InviteGatewayPage.tsx` → `blocks/invite/` consuming those primitives instead of embedding them.

## Stage 4 — Reorganize blocks

- Split `blocks/core/home` → public `blocks/profile/` (kept, Attention-OS-based) vs. retired DOT-era components (deleted in Stage 2).
- Establish `blocks/member/` for the authenticated interior.

## Stage 5 — Docs hygiene

- `docs/blueprint/` is the source of truth. Older planning docs (`PERSONAL_SITE_SPRINT_PLAN.md`) are reference; reconcile or archive to `docs/archive/`.
- Keep `docs/archive/` as-is (already consolidated history).

## Guardrails

- One stage per PR. Never delete a file with live imports.
- CI (`.github/workflows/ci.yml`) must pass: lint, typecheck, test, build.
- No feature work rides along with a cleanup PR.
