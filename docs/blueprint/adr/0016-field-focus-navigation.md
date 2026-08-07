# ADR-0016: Navigation is Field, Focus, and a Thread — never a menu

- **Status:** Proposed
- **Date:** 2026-08-05
- **Deciders:** Founder

## Context

ADR-0004 forbids the mechanisms that fragment attention: feeds, infinite scroll,
push, counters, streaks. It says nothing about **navigation**, and navigation is
where the remaining fragmentation lives.

A conventional menu — a nav bar, a tab set, a ring of equal dots — presents every
destination as simultaneously available, unrelated to every other, with no record
of where the member has been and no end. That is the same structure as a feed,
differing only in that the member does the scrolling with their eyes. It is a
fragmentation surface by construction.

The product contradicted itself on this point. `08-DOCTRINE-AND-COHERENCE-SURFACE.md`
§6 specifies a strict layout law for `/doctrine` — graph, one focus panel, a quiet
input, nothing else — while the public profile shipped a seven-dot ring of
content categories with arbitrary positions and no relations. The first screen a
visitor saw disagreed with the design contract.

The deeper problem is that the ring mixed **kinds**: a thesis, a time marker, a
social space, and three content bins presented as peers. A visitor learned what
the founder *had*, not what he *claimed*. Doc 08 §1 sets the standard this fails:
DOT is an instrument that should leave a thread more coherent, not a content site
about coherence.

## Decision

**Navigation is a law, not a component choice.** It applies to every member- and
visitor-facing surface, including the public profile.

- **Two states, never three.** *Field* (the graph at rest — orientation only) and
  *Focus* (one idea, with the field receded). No dashboards, list views, card
  walls, tab sets, or stacked modals. Focus is exclusive: opening a node closes
  the previous one.
- **Movement is by typed relation, not by menu.** Exits from a focused node are
  rendered in the doctrine's relation vocabulary — `depends-on`, `leads-to`,
  `contrasts`, `defines`, `applies` — as language. Every move is along meaning.
- **The Thread.** A session-local, finite, re-walkable record of the path of
  attention is displayed. It is **never persisted** — not to `localStorage`, not
  to the server, not to analytics. A stored thread is a behaviour log (L9).
- **Attention is enforced as singularity and completion, never as duration.** A
  ~700ms threshold before exits appear; one idea at a time; a visible end mark
  offering one continuation and an explicit stop; ambient stillness that deepens
  with reading. Leaving is always one gesture.
- **Rings are ordered.** Sequence begins at 12 o'clock and proceeds clockwise;
  geometry is computed from child count so the rule holds at every depth. Dot
  size encodes weight and line weight encodes relation strength — never traffic.
- **The public profile's first ring is an argument, not an inventory.** Content
  categories are evidence beneath the claims they support. The ring's fifth
  member is the theory's open questions, permanently.
- **Motion expresses resolve.** Only `appear`, `connect`, `focus`, `settle`;
  200–600ms ease-out; no springs, no overshoot; reduced motion degrades to
  opacity.

The design contract is `12-FIELD-AND-FOCUS.md`. Enforcement is
`frontend/src/attention-os/focus/` plus its unit tests: ring order and thread
behaviour are tested as logic, not asserted in prose.

## Consequences

- (+) Removes the last fragmentation surface in the product, and makes the
  profile and the doctrine one instrument instead of two languages.
- (+) The interface demonstrates the thesis instead of describing it: the member
  can see their own attention as a thread, and every move has a stated reason.
- (+) P3 (Single-Focus Navigation) stops being an unbuilt claim in North Star §5.
- (+) Serves L1 (predictable), L2 (natural completion), L3 (no feed), L8, L10
  (single focus), L11 (attention budget), L12 (declared intention).
- (−) Worse for someone skimming for a portfolio: "Work" and "Writing" are no
  longer one click from the front door. Accepted deliberately — this is an
  invite-only thesis surface, not lead generation. A quiet text link is the
  remedy, never a ring node.
- (−) Authoring cost rises: a node without a stated relation to its parent cannot
  be navigated to properly, so publishing requires thinking about structure.
- (−) The threshold will be perceived as latency by some visitors. Mitigated by a
  700ms ceiling and immediate keyboard bypass; revisit if it tests badly.
- (−) Existing ad-hoc surfaces under `dot/` and `blocks/` must be migrated to the
  law over time; until then the product is partially conformant, and that gap
  should be stated rather than hidden.
- **Revisit if:** evidence shows the threshold or relation-only movement prevents
  members from completing intentions they actually declared.

## Alternatives considered

| Option                                        | Pros                                          | Cons                                                                    | Verdict      |
| --------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- | ------------ |
| Keep the radial menu, reduce it to five dots   | Cheapest; familiar                            | Still a menu: unordered, unrelated, no memory, no end                   | Rejected     |
| Conventional nav bar + breadcrumbs             | Universally understood; zero learning cost    | Maximal simultaneous availability; hierarchy is not meaning              | Rejected     |
| Apply doc 08's law only to `/doctrine`         | No profile churn                              | Preserves the self-contradiction on the first screen a visitor sees      | Rejected     |
| Field & Focus + Thread + typed exits           | Coherence is structural; demonstrates the thesis | Unfamiliar; authoring cost; migration debt                            | **Accepted** |
