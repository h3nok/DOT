---
applyTo: "frontend/src/**"
---

# Frontend rules

## Where things live

- Entry is `src/AppOptimized.tsx`. Routes are lazy-loaded there. `src/App.tsx` does not exist.
- `attention-os/` — reusable attention primitives. Only P2 (Reader) exists. New primitives
  belong here, not inside a feature folder.
- `dot/` — the graph surface (nucleus, nodes, twin, vault, circle, support).
- `blocks/` — page-level surfaces composed into routes.
- `organism/` — ambient theme/vitality layer driven by CSS variables.
- `shared/` — contexts, UI components, hooks used across surfaces.
- `services/` — API clients. Use `Orchestrator*Service.ts`. **Do not** build on
  `services/api/BaseApiService.ts` (retired `/api` backend, reads auth from localStorage).

## Non-negotiables

- No engagement feeds, infinite scroll, autoplay-next, push notifications, badge counters,
  vanity metrics, streaks, or third-party trackers. These fail
  `src/test/manifesto-laws.test.ts`, which is a ratchet — fix the code, never extend
  `QUARANTINE`.
- Auth material never goes in `localStorage` or `sessionStorage`. Sessions are httpOnly
  cookies via `useAuth`.
- Respect `prefers-reduced-motion`: every animated surface needs a still equivalent, and a
  reduced-motion user must still see all content.
- Lazy-load anything heavy (three.js, audio, markdown/KaTeX bundles).

## Conventions

- TypeScript everywhere; keep `pnpm exec tsc --noEmit` at zero errors.
- Prefer composition over new global context. Adding a context is an architectural choice —
  justify it.
- Graph geometry must be a function of child count. Do not hard-code slots for a specific
  number of nodes; it breaks at other depths.
- Components that exceed ~300 lines should be decomposed before being extended.

## Before you claim done

```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm exec vitest run && pnpm build
```
