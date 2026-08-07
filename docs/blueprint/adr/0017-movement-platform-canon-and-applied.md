# ADR-0017: The platform is the movement — canon, theory, practice, applied

> Superseded in part by ADR-0018: the first-party theory surface is a
> book-derived concept map, not an independently editable doctrine.

- **Status:** Proposed
- **Date:** 2026-08-06
- **Deciders:** Founder

## Context

The platform began as the founder's public profile (North Star §2, phase 0) and
grew a book, a doctrine graph, a publication pipeline, and a grounded twin around
it. The centre of the graph is a person, so the ceiling is that person's reach.

The intent has changed: this is the platform of the **DOT movement**. A movement
needs three things a personal site does not, and conflating them is the standard
failure mode:

1. **A canon** — fixed, versioned, citable text that everyone can point at and
   argue with. The publication pipeline (immutable sealed releases with
   provenance) already provides this; Book One is its first artefact — six
   chapters, 22,572 words, 14 equations, 25 references in the line-edited v2
   release.
2. **A concept map** — a graph derived from the current book edition, with typed
   relations, passage provenance, claim boundaries, and a first-class
   `question` kind for the book's unpaid debts.
3. **An applied layer** — what people *do* with it: teaching, practice, studies,
   replications, implementations. **This does not exist**, and its absence is the
   difference between a readership and a movement.

Today the canon and an independently editable theory sit as peers in the ring, and the applied
layer is missing entirely. The founder is the hub rather than a steward.

There is also an economic fact to state rather than hide: the work is currently
subsidised by unrelated employment. Making it sustainable is a legitimate goal,
and the honest way to pursue it is to say so plainly — not to engineer urgency.

## Decision

**The platform is DOT. The founder is a steward within it, not its centre.**

- **Five limbs, not five worlds.** The field is rooted at DOT, with:
  **Book One** (the canon), **Concept Map** (book-derived structure and open
  debts), **The Practice** (teaching and exercises), **Applied** (studies and
  implementations), **The Movement** (circle, contribution, stewardship, support).
- **Canon and commentary are structurally separable.** Sealed releases are
  immutable and versioned. Commentary, teaching material, and applied work may
  reference canon but must never render in a way that could be mistaken for it.
- **The Canon is the primary entry.** The single action under the nucleus enters
  the book at its first chapter. Chapters are one deliberate move in, never a
  wall of links (doc 12).
- **Evidence tiers are mandatory in the applied layer.** Every applied or study
  node declares its claim level — `Observation`, `Model`, `Hypothesis`,
  `Speculation` — reusing the book's existing `reader_contract.claim_levels`. A
  node without a declared level cannot be released.
- **Negative results and open seams are permanent first-class citizens.** A
  movement that displays failed replications survives criticism; one that hides
  them becomes propaganda (doc 08 §4.1).
- **Stewardship, never ownership.** Contribution follows the existing release
  pipeline with provenance and version. Disagreement branches openly.
- **No contributor ranking, ever.** No leaderboards, no "top contributors", no
  reputation scores, no badges. This extends ADR-0004's ban on vanity metrics to
  the contribution layer, where the pressure to add them will be strongest.
- **Support is stated plainly and asked once.** The purpose — making this work
  sustainable enough to be someone's full-time occupation — is written in plain
  language, with no urgency, guilt, scarcity, or recurring-payment trap, and
  leaving is always one gesture (L6, L7, ADR-0012). Support never affects what
  reaches a member (ADR-0015).

## Consequences

- (+) The ceiling stops being one person's reach; others can carry the theory.
- (+) Canon, theory, and practice each get the treatment they need instead of one
  compromise surface.
- (+) Mandatory claim levels make "applied science" a checkable claim rather than
  a label, and directly serve the discernment the theory argues for.
- (+) Serves L3 (sought, not served), L5, L8 and doc 08's coherence test.
- (−) The founder's profile stops being the front door. Anyone looking for the
  person has further to travel; a steward node and a dedicated route are the
  remedy.
- (−) Contribution requires review and stewardship time — a real ongoing cost, and
  the main reason a movement platform stalls.
- (−) The applied layer needs a content model and workflow that do not exist yet;
  until they do, the fifth limb is partly a promise, which must be stated as such.
- (−) Refusing contributor rankings will make growth slower than a gamified
  alternative. Accepted: the ranking is the beginning of the disease.
- **Revisit if:** the movement framing produces no contributors within a
  meaningful period, which would suggest the ladder — not the architecture — is
  wrong.

## Alternatives considered

| Option                                          | Pros                                       | Cons                                                                       | Verdict      |
| ----------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- | ------------ |
| Keep the profile as the front door              | No churn; personal brand compounds          | Movement ceiling equals one person; canon buried under a portfolio          | Rejected     |
| Make the landing a book table of contents       | Presents the book immediately               | A TOC is inert; asks a stranger to pick a chapter before knowing why        | Rejected     |
| Separate movement site from personal site       | Clean separation                            | Two products, two codebases, split trust and duplicated pipeline            | Rejected     |
| DOT at the centre; canon first, founder a steward | Movement can outlive the author; canon is primary | Applied layer still to build; slower, unranked growth                | **Accepted** |
