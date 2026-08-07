---
mode: agent
description: Write a new ADR for a decision with lasting trade-offs.
---

Write an ADR in `docs/blueprint/adr/` for: ${input:decision}

Steps:

1. Read `docs/blueprint/adr/0000-template.md` and the two most recent ADRs for voice.
2. List existing ADRs and take the next unused number. Never renumber existing ones.
3. Check whether this decision supersedes or amends an existing ADR. If so, say which, and
   state the relationship in both files.
4. Write the ADR:
   - **Context** — the forces and the pressure that makes this decision necessary. Include
     what will go wrong if it is left undecided.
   - **Decision** — imperative, specific, and testable. Enumerate what is prohibited and
     what is permitted.
   - **Consequences** — positives, real negatives (what this costs us), and the trigger
     that would make us revisit.
   - **Alternatives considered** — a table with Pros / Cons / Verdict.
5. State **how the decision is enforced**: a test, a lint rule, a schema constraint, or a
   CI check. If it cannot be enforced mechanically, say so explicitly.
6. Name the manifesto laws (L1–L12) it serves.
7. Set Status to `Proposed` and the date to today.
8. Register it in the decision log table in `docs/blueprint/README.md`.

Do not implement the decision in the same change.
