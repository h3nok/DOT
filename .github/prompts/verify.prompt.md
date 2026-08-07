---
mode: agent
description: Verify the repo honestly and report what actually passed.
---

Run the full gate and report results without softening them.

1. Run `make verify` from the repo root.
2. If anything fails, diagnose the root cause before changing code. Do not:
   - add to the `QUARANTINE` list in `frontend/src/test/manifesto-laws.test.ts`
   - add `eslint-disable`, `@ts-ignore`, `# noqa`, or `continue-on-error`
   - skip or delete a failing test
   Fix the cause, or report that it is a genuine blocker and why.
3. Re-run until green, then report:
   - which gates ran and their results
   - what you changed and why
   - anything you could NOT verify, stated plainly

4. Finally, confirm compliance:
   - which manifesto law(s) the change serves, and that it violates none
   - whether any doc in `docs/blueprint/` is now stale because of this change

If a check was not run, say so. Never describe an unrun check as passing.
