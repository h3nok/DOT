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

## 4. Book-derived concepts (content model)

The concept map is a graph of **nodes** connected by typed **relations**. It is
a reading layer over the current released book, not a second manuscript
(ADR-0018).

### 4.1 Node

A node is one idea, claim, definition, or practice.

```
DoctrineNode
  id            stable slug, e.g. "subjective-data", "big-c", "canvas"
  kind          "foundation" | "claim" | "definition" | "practice" | "question"
  title         short, plain
  oneLine       a single sentence the node can be reduced to
  body          argued prose (markdown)
  status        "released"
  version       the source book edition
  source        required edition + section + heading + claim level
  relatedIds    typed edges to other nodes
```

Node kinds:

- **foundation** — a load-bearing structure explicitly developed in the book.
- **claim** — an assertable, arguable statement.
- **definition** — a precise term (little c, coherence, fragmentation).
- **practice** — something a reader can _do_ to increase coherence.
- **question** — an open seam, explicitly unresolved.

The `question` kind is required, not decorative. It carries the limits and unpaid
debts the book names. A node may summarize or connect passages; it may not
introduce a claim the released book does not make.

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

## 5. The Book One spine

The first map follows the structure actually argued in Book One:

1. **The Subjective Data Principle.** Feeling is data, but not automatically
   truth. The observer belongs in the inquiry.
2. **Digital Organism.** A state-bearing, information-sensitive process that
   works to preserve or develop coherence across change. This is a model
   definition, not a proof of sentience.
3. **Big C and Little c.** The larger conscious process and local experiencer
   are hypotheses, and must render as such.
4. **Reality Frame, Reality Stream, and Intent.** The book's model of lawful
   environment, situated experience, and committed direction.
5. **The Experience Loop.** Reality Stream is interpreted through the Painting;
   Intent becomes action; consequence updates the Canvas.
6. **Canvas, Painting, Character, Fear, and Love.** The human instance and the
   movement from inherited conditioning toward conscious authorship.
7. **Limits and Unpaid Debts.** The tests, measures, and distinctions the theory
   does not yet possess.

These are derived entry points into the released text. The older Substrate /
Stabilization draft is historical material, not a source for the public map.

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

- Every released node is **immutable and edition-bound**. A new book edition
  generates a new map version; history remains inspectable.
- Nodes carry **required provenance**: edition, section, heading, and declared
  claim level.
- Commentary and forks branch openly, but they are separate surfaces and may
  never render as Book One or as its concept map.
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
- Released nodes are immutable, edition-bound, and show resolvable provenance.
- No concept node exists without a passage in the live book edition.
- Contributor commentary is visibly separate from the Book One map.
