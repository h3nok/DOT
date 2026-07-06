# 08 — Doctrine and the Coherence Surface

Design document for DOT's reading and teaching layer: the doctrine content model
and the generative, graph-driven, focus-oriented interface that delivers it.

This document is the design contract. Code should conform to it. When code and
this document disagree, fix one of them on purpose, not by drift.

---

## 1. Purpose

DOT is not a content site about coherence. It is an instrument that should leave
every thread (every reader) more coherent than it arrived.

The Coherence Surface is the public reading and teaching layer. It exists to:

- present the doctrine clearly, without noise,
- let a reader move through ideas by relation, not by feed,
- hold attention on one idea at a time,
- and make the structure of the theory visible as a graph.

It must do this while refusing the mechanics that fragment attention.

---

## 2. The One Test

Every feature, animation, and surface answers a single question:

> Does this increase a thread's coherence, or does it harvest its attention?

If it harvests attention, it is forbidden. This is a design rule, not a
preference. It is enforced in review.

---

## 3. What the surface refuses

These are hard constraints, visible in the visuals themselves:

- No advertisements, sponsorships, or commercial placements.
- No feeds, infinite scroll, or autoplay.
- No vanity metrics on public surfaces: no view counts, like counts, follower
  counts, or trending lists.
- No notifications designed to pull a reader back.
- No engagement streaks, badges, or gamified return loops.
- No dark patterns, urgency timers, or manufactured scarcity.
- No popups that interrupt reading.
- No autoplaying motion that competes with the text.

If a future contributor proposes any of the above, the answer is no, and this
document is the reason.

---

## 4. Core concepts (content model)

The doctrine is a graph of **nodes** connected by typed **relations**.

### 4.1 Node

A node is one idea, claim, definition, or practice.

```
DoctrineNode
  id            stable slug, e.g. "substrate", "stabilization", "little-c"
  kind          "foundation" | "claim" | "definition" | "practice" | "question"
  title         short, plain
  oneLine       a single sentence the node can be reduced to
  body          argued prose (markdown)
  status        "draft" | "released"
  version       integer, increments on released revision
  relatedIds    typed edges to other nodes
  sources       optional citations / source trail
  releasedAt    timestamp when locked
```

Node kinds:

- **foundation** — the load-bearing spine (substrate, stabilization, thread).
- **claim** — an assertable, arguable statement.
- **definition** — a precise term (little c, coherence, fragmentation).
- **practice** — something a reader can _do_ to increase coherence.
- **question** — an open seam, explicitly unresolved.

The `question` kind is required, not decorative. The doctrine must show its open
edges. A theory that hides its unknowns is propaganda.

### 4.2 Relation

```
DoctrineRelation
  from      nodeId
  to        nodeId
  type      "depends-on" | "leads-to" | "contrasts" | "defines" | "applies"
  strength  0..1   (visual weight only, never a ranking score)
```

Relations are meaning, not popularity. `strength` controls line weight in the
graph; it must never be derived from traffic or engagement.

---

## 5. The three foundations (initial content)

The first released foundations, written as argued prose:

1. **The Substrate (E).** Reality rests on an incomprehensible substrate of
   possibility. We do not explain it; we locate ourselves inside it.
2. **Stabilization.** Consciousness is the first pattern that stabilized itself
   within the substrate and held. Emergence is assumed (complex systems theory),
   not re-derived. The claim begins after stabilization.
3. **The Thread (little c).** We are individuated threads of that stabilized
   field. We do not know where, when, or how we emerge — only that we are inside
   the substrate, and that a thread moves toward fragmentation or coherence.

A fourth, the **Stance**, ties the ethic to the metaphysics: to hold form
against dissolution is the founding act of consciousness and the meaning of
courage. Love is maximal coherence; fear is the defense of separateness.

These are the seed nodes of the graph.

---

## 6. The interface: generative, graph-driven, focus-oriented

### 6.1 Layout law

The persistent surface contains only:

- the **graph** (the structure of the doctrine), and
- a **single focus panel** (the one idea currently in view), and
- a quiet **command/question input**.

Everything else opens as a transient drawer and closes again. No persistent
sidebars of features. No dashboards. No cards walls.

### 6.2 Generative graph

The graph is not a static diagram. It is generated from the doctrine nodes and
their relations, and it grows as the doctrine grows.

- Each node renders as a **dot**. One dot, one idea, one little c.
- Dot size encodes node weight (foundations larger), never popularity.
- Relations render as lines; line weight encodes `strength`.
- Layout is computed (radial or force-directed), not hand-placed, so new nodes
  integrate automatically.
- Selecting a dot moves focus to that idea and gently re-centers the graph.
- Related dots illuminate; unrelated dots dim. This is the coherence gesture:
  attention narrows to what connects.

### 6.3 Focus mode

Focus is the heart of the surface.

- When a node is in focus, the rest of the field recedes (darkens, blurs
  slightly, lowers contrast) so one idea holds the reader.
- The focus panel shows: the node's one-line, then its body, then its typed
  relations as quiet exits ("this depends on…", "this leads to…").
- Reading one node should make the next node a deliberate choice, never an
  autoplay.
- A "reading path" can chain nodes (foundation → foundation), but the reader
  always chooses to advance. No momentum mechanics.

### 6.4 Motion language

Motion expresses resolve and relation, not delight.

- `appear` — a dot fades in after stillness.
- `connect` — a line draws when a relation is revealed.
- `focus` — the field recedes; one node rises.
- `settle` — the graph re-centers slowly, gravitationally.
- No bounce, no spring overshoot, no playful easing.
- Respect `prefers-reduced-motion`: replace movement with opacity only.

---

## 7. Visual system

Inherits the DOT design language; this surface is its strictest expression.

- **Field:** deep black is the default reading environment for the graph;
  a true light mode exists for long-form prose and must remain first-class.
- **Signal:** one configurable accent color per surface. Not a palette.
- **Type:** serif for doctrine prose (slow, considered); mono for labels and
  structure; restrained sizes.
- **Glass:** only on opened surfaces (focus panel, drawers), never on the
  resting field.
- **Density:** generous negative space. Emptiness is a feature; it is where
  attention rests.
- **Chrome:** minimal. No toolbars of features. Controls justify their presence.

Accessibility is non-negotiable: legible contrast in both themes, keyboard
navigation of the graph, focus-visible states, reduced-motion support.

---

## 8. Teaching layer (Practice nodes)

Practice nodes turn doctrine into something a reader can do.

- A practice is a short, guided exercise in increasing coherence: a reading
  path, a reasoning drill, a contemplative prompt, a way to notice one's own
  fragmentation.
- Practices end by making the reader more independent, never more dependent.
  The success state is "you can do this yourself now."
- Practices are nodes in the same graph, related to the claims they enact.

---

## 9. Durability and stewardship

The doctrine must outlast its author.

- Every released node is **immutable and versioned** via the orchestrator's
  release pipeline. Revisions create new versions; history is inspectable.
- Nodes carry **provenance**: author, version, released timestamp, source trail.
- Doctrine is **forkable**: disagreement should branch openly, not schism in bad
  faith.
- Authority is **stewardship of integrity**, not ownership of truth. Stewards
  maintain the record; they do not control belief.

---

## 10. Routes

- `/doctrine` — the Coherence Surface (graph + focus + question input).
- `/doctrine/:nodeId` — deep link to a node in focus.
- The public landing (`/`) can route a willing reader into `/doctrine`.

Existing graph plumbing under `src/blocks/graph` and the orchestrator publication
release pipeline are the substrate this surface is built on; reuse them rather
than inventing parallel systems.

---

## 11. Acceptance criteria

- The resting surface shows only graph, focus panel, and question input.
- No ads, feeds, vanity metrics, or return-loop mechanics exist anywhere on it.
- The graph is generated from doctrine data and grows when nodes are added.
- Focus mode visibly recedes the field and holds one idea.
- Reduced-motion and keyboard navigation work.
- Light and dark themes both render legibly.
- Released nodes are immutable, versioned, and show provenance.
- A second contributor can publish a node through the orchestrator.
