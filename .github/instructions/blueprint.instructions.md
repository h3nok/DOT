---
applyTo: "docs/blueprint/**"
---

# Blueprint & ADR rules

## Hierarchy

1. `00-ATTENTION-MANIFESTO.md` — laws L1–L12. Binding.
2. Numbered docs — design. `11-ATTENTION-MEMBRANE.md` is a **running** doc and changes often.
3. `adr/` — locked decisions. **If a doc and an ADR disagree, the ADR wins.**

## Writing an ADR

- Copy `adr/0000-template.md`; take the next free number; do not renumber existing ADRs.
- Status starts `Proposed`. Only the founder moves it to `Accepted`.
- Required: Context (forces, not narrative), Decision (imperative and testable),
  Consequences (including the negative ones and a revisit trigger), Alternatives table.
- State how the decision is **enforced** — a test, a lint rule, a schema constraint. A
  decision with no enforcement is a wish.
- Register it in `docs/blueprint/README.md`'s decision log.

## Accuracy rules

- Docs describe what exists, or clearly mark what does not. Aspirational text must say so —
  agents read these files as fact and will build on false claims.
- When code makes a doc stale, fix the doc in the same change.
- Do not create summary/change-log markdown. Decisions go in ADRs.
