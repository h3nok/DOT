# ADR-0014: Filtering is declarative policy, never learned engagement ranking

- **Status:** Proposed
- **Date:** 2026-08-05
- **Deciders:** Founder

## Context

The membrane (`11-ATTENTION-MEMBRANE.md`) requires Stay to decide what reaches a member.
There are two ways to build that, and they look similar for about six months.

1. **Learn it.** Observe what the member opens, dwells on, and returns to; train a model to
   predict the next such item; order by that prediction.
2. **Declare it.** The member states rules; the system executes them literally.

Option 1 is the engagement feed. Not "like" it — it *is* it. It is the same objective
function as the systems the manifesto was written against, differing only in politeness and
in who the optimization is claimed to serve. It also degrades in a predictable direction:
once a model is trained on return behavior, "the member came back" becomes the definition
of success, and L8 is quietly inverted. It cannot be explained to the member either, which
breaks ADR-0013.

The pressure toward option 1 is real: declarative rules feel like work, and "it just learns
you" is an easier sell. This ADR is written now, while nothing is built, because the
decision is nearly irreversible once a behavioral training set exists.

## Decision

**Filtering and ordering are executed from a member-authored policy document. No model
ranks by predicted engagement.**

- **Policy is a document, not a model.** It is member-owned, human-readable, versioned,
  diffable, exportable, and editable directly. The member can read the reason anything is
  filtered, because the reason is a line they can see.
- **Ordering is declared.** Chronological, source priority, or explicit rule order — chosen
  by the member. There is no relevance score derived from behavior.
- **ML is permitted for comprehension, forbidden for ranking.** Allowed: extraction,
  deduplication, classification, tagging, translation, summarization, and matching an item
  against a member-declared rule. Forbidden: any model whose objective is predicted opens,
  dwell, clicks, session length, or return probability.
- **No behavioral training signal is collected.** Per L9 and ADR-0007 we do not record
  opens, dwell, or click-through for ranking purposes. The training set for an engagement
  model must not exist.
- **Feedback edits rules, not weights.** "Less of this" opens the rule that admitted the
  item and proposes a change. The member accepts a visible diff.
- **Model-assisted authoring is allowed, model-authored policy is not.** The twin may
  *suggest* a rule; the suggestion is presented as a diff and takes effect only on explicit
  acceptance. Silent policy mutation is prohibited.
- **Deterministic and inspectable.** The same inputs and the same policy produce the same
  result. A member can dry-run a policy change against recent items before adopting it.

## Consequences

- (+) The filter can be explained, tested, and disproved — the precondition for ADR-0013.
- (+) Removes the mechanism by which humane filters historically become engagement engines.
- (+) Deterministic evaluation is far cheaper than per-item inference, which materially
  helps member-funded unit economics.
- (+) Serves L1 (predictable), L3 (no feed), L8 (time-well-spent), L9, L11, L12.
- (−) Higher onboarding cost. Good defaults and rule templates become essential product
  work, not polish.
- (−) We will lose head-to-head demos against "it just learns you" competitors.
- (−) Members can write bad policies and get bad results. Dry-run, diffs, and easy reversal
  are the mitigation; automatic correction on their behalf is not.
- **Revisit if:** we find a ranking method that is member-legible, member-editable, and not
  optimized on behavioral return signal. Personalization that meets those tests is not what
  this ADR forbids.

## Alternatives considered

| Option                                  | Pros                                      | Cons                                                              | Verdict      |
| --------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- | ------------ |
| Learned engagement ranking              | Low onboarding effort; familiar; demos well | Rebuilds the feed; unexplainable; inverts L8                     | Rejected     |
| Hybrid: declared rules + learned re-rank | Feels balanced                            | The learned layer decides the margin, so it decides everything     | Rejected     |
| Declarative policy only                 | Legible, testable, cheap, honest          | Onboarding cost; weaker cold-start                                | **Accepted** |
