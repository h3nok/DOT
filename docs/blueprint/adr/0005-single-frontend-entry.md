# ADR-0005: Single canonical frontend entry & structure

- **Status:** Accepted
- **Date:** 2026-06-11
- **Deciders:** Principal Engineer

## Context

`main.tsx` imports `AppOptimized.tsx`, but `App.tsx` also exists with an overlapping
router — two sources of truth for routing. The home block contains legacy duplicates
(`HomePage_NEW.tsx`, `CompactSlideshowRefactored.tsx`, etc.) inherited from the DOT-era
app. This causes drift and confuses both humans and agents.

## Decision

- **One app entry, one router.** Consolidate `App.tsx` and `AppOptimized.tsx` into a
  single `app/` shell (lazy-loaded routes, code-split). Delete the redundant one.
- Adopt the target module layout in `02-ARCHITECTURE.md §3` (`app/`, `attention-os/`,
  `blocks/`, `content/`, `services/`, `shared/`).
- Legacy/duplicate files are removed only after confirming zero imports (grep/usage check)
  — see the cleanup plan in `03-CLEANUP-AND-STRUCTURE.md`. Deletions happen in a dedicated
  change, reviewed, never bundled with feature work.

## Consequences

- (+) One obvious place for everything; agents stop editing dead files.
- (−) One-time refactor churn; must update imports carefully and verify build/tests green.
- **Guardrail:** run typecheck + build + tests after each cleanup batch; never delete a
  file with live imports.

## Alternatives considered

| Option                                   | Pros                    | Cons                        | Verdict      |
| ---------------------------------------- | ----------------------- | --------------------------- | ------------ |
| Leave both entries                       | No churn                | Permanent confusion & drift | Rejected     |
| Consolidate to one entry + target layout | Clarity, agent-friendly | One-time refactor           | **Accepted** |
