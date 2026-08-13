# ADR-0018: First-party knowledge surfaces derive from the book

- **Status:** Accepted
- **Date:** 2026-08-06
- **Deciders:** Founder

## Context

The original Big Theory draft and the line-edited Book One manuscript developed
in different directions. The public reader served an older generated release,
the concept graph asserted the older Substrate / Stabilization framing, and the
agent could retrieve prior and revised canon chunks together. A reader could
therefore encounter three different accounts presented with equal authority.

Book One now states a more disciplined framework, distinguishes observation,
model, hypothesis, and speculation, and names its unpaid theoretical debts.
Those boundaries lose their value if adjacent first-party surfaces silently
restore earlier claims.

## Decision

The current digital-edition Word manuscript is the private editorial source of
truth.
Immutable web releases are the public canon.

- The live reader points to the newest released edition. Earlier releases remain
  intact as history and are never rewritten.
- The first-party concept map is a derived reading layer. Every node requires a
  resolvable edition, section, heading, and claim level. It may summarize and
  connect book passages; it may not introduce independent theory.
- Agent answers about DOT ground in the current released book and retain visible
  citations. Superseded canon versions remain stored but are excluded from
  retrieval.
- Edition maps, reading paths, landing copy, graph labels, and vocabulary use the
  same release manifest and book terminology.
- Commentary, extensions, and forks are welcome, but they must live on visibly
  separate surfaces and cannot render as Book One or its concept map.
- The older Big Theory draft is historical material. It is not an input to live
  first-party knowledge surfaces.

## Consequences

- (+) A reader encounters one coherent account across the book, concept map, and
  agent workspace.
- (+) Every explanatory concept can be checked against the exact passage behind
  it.
- (+) The book's epistemic limits survive translation into interface and agent
  behavior.
- (+) Historical releases and drafts remain available for provenance without
  competing with the current edition.
- (-) Changing the book requires regenerating and validating its dependent
  surfaces.
- (-) New theoretical work cannot be slipped into the concept graph; it must
  become commentary or enter a later book edition through editorial review.
- **Revisit if:** DOT gains a separately governed, peer-reviewed theory
  publication whose authority and provenance are explicit enough to stand
  beside, rather than masquerade as, the book.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep book and living draft as peers | Faster theory iteration | Readers receive conflicting canon; agent grounding becomes ambiguous | Rejected |
| Rewrite the existing v1 release | One live folder | Destroys immutable release history and provenance | Rejected |
| Treat the digital-edition manuscript as source and derive all first-party surfaces | One checkable account; history preserved | Requires regeneration and provenance tests | **Accepted** |
