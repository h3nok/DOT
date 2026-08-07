# 12 — Field & Focus: the navigation law

> The interface law for every surface, and the two artifacts that carry it: the
> **Thread** and **typed exits**.
>
> This document is a design contract. Code conforms to it. When code and this
> document disagree, fix one of them on purpose, not by drift.
>
> Governed by ADR-0016. Extends `08-DOCTRINE-AND-COHERENCE-SURFACE.md` §6 from
> `/doctrine` to the whole product.

---

## 1. The problem this solves

Conventional navigation is a **menu**: every destination equally available, at
all times, with no relation between options, no memory of where you have been,
and no end. A navigation bar is a feed that does not scroll.

A radial ring of equal dots is the same structure wearing better clothes. DOT
shipped exactly that on the public profile while `08` specified something far
stricter for `/doctrine`. The product contradicted itself, and the contradiction
was visible on the first screen.

Doc 08 §1 states the standard: *DOT is not a content site about coherence; it is
an instrument that should leave every thread more coherent than it arrived.*
Navigation is where that is won or lost.

---

## 2. The law: two states, never three

| State     | What it is                         | What it shows                        |
| --------- | ---------------------------------- | ------------------------------------ |
| **Field** | The graph at rest. Orientation.    | Structure only. No prose to read.    |
| **Focus** | One idea, held.                    | One node's substance. Field recedes. |

There is no third state. No dashboard, no list view, no card wall, no stacked
modals, no tabs. Opening a node closes the previous one.

Entering Focus makes the field **recede**: lower contrast, slight blur, reduced
motion in the ambient layer. Leaving Focus returns the field. That is the entire
navigational vocabulary.

---

## 3. The Thread

A single hairline along the bottom edge records the path of **this session's
attention**: `Subjective Data → Digital Organism → Experience Loop`.

It is not breadcrumbs and not hierarchy. It is the chronology of attention, and
it is the theory rendered as an interface element — a thread moves toward
fragmentation or coherence, and here the member watches their own take shape.

Binding properties:

- **It has a beginning.** Where this session entered is always visible.
- **It is finite.** A long session compresses; it never scrolls forever.
- **It is re-walkable.** Selecting any point returns focus there.
- **It is session-local and never stored.** Not in `localStorage`, not on the
  server, not in analytics. It dies with the tab. A persisted thread is a
  behaviour log, which L9 forbids.
- **It is clearable** in one gesture.

---

## 4. Navigation is argument

From a focused node the member is never offered a menu. They are offered
**typed exits** in the doctrine's own relation vocabulary (doc 08 §4.2):

```
depends-on · leads-to · contrasts · defines · applies
```

Rendered as language, not as chrome:

> this **depends on** → The Subjective Data Principle
> this **leads to** → The Experience Loop
> this **contrasts with** → Limits and Unpaid Debts

Every move is along meaning. Wandering is structurally unavailable, and the
member always knows *why* one idea follows another. This is the coherence
mechanism; everything else in this document supports it.

---

## 5. Enforcing attention, honestly

The failure mode is obvious: "enforce attention" inverts into engagement
mechanics. The line is absolute — **enforce singularity and completion; never
enforce duration.**

1. **The threshold.** When a node takes focus, its exits fade in after ~700ms.
   A member cannot bounce out before arriving. Keyboard skips it immediately.
   It is a threshold, never a lock.
2. **One at a time.** Focus is exclusive. No tabs, no stack of half-read things.
3. **The end mark.** Every node visibly ends, and the end offers one deliberate
   continuation plus an explicit *stop here*. Finishing is a success state (L2, L8).
4. **Stillness as reward.** The organism's `calm` rises while reading: the field
   dims, drift stops, the accent desaturates. Depth is rewarded by the
   environment disappearing. This is the attention budget (L11) with no meter,
   no timer, and no nag.
5. **Nothing pulls back.** No badge, no notification, no count, ever (L4, L5).

Leaving is always one gesture. If a member wants out, the interface agrees
immediately.

---

## 6. The front door is the same instrument

The front door is not a homepage widget with its own rules. It is this instrument
rooted at the theory: same field, same focus, same thread, same typed exits. One
interface language everywhere — which is coherence, demonstrated rather than
described.

**The ring is the movement's anatomy, not an inventory** (ADR-0017). Five limbs,
read clockwise from the top:

| # | Node             | What it holds                                        |
| - | ---------------- | ---------------------------------------------------- |
| 1 | **Book One**     | The fixed, sealed, citable text                       |
| 2 | **Concept Map**  | Book-derived concepts, claim boundaries, and debts    |
| 3 | **The Practice** | Exercises, reading paths, and teaching material      |
| 4 | **Applied**      | Implementations and studies, with declared claim levels |
| 5 | **The Movement** | Circle, contribution, support, and stewardship       |

The centre is DOT, so the movement can outlive its author; the founder is
a steward inside the fifth limb. The nucleus carries exactly one primary action,
and it enters the canon at its first chapter.

**Open Seams and negative results are permanent.** A surface that leads with what
it does not know is the argument demonstrated; doc 08 already says a theory that
hides its unknowns is propaganda.

### 6.1 Ring geometry

- The sequence begins at **12 o'clock** and proceeds **clockwise**. Position
  carries reading order; arbitrary angles are not acceptable.
- The bottom arc stays clear for the nucleus label and its single primary action.
- Layout is computed from child count, never hand-placed per screen, so the rule
  holds at every depth of the recursive graph.
- Dot size encodes **weight** (foundations heavier). Line weight encodes
  relation **strength**. Neither is ever derived from traffic (doc 08 §4.2).
- Focusing a node illuminates its relations and dims the unrelated — the
  coherence gesture.

---

## 7. Visual system (the strict expression)

Premium here means restraint executed exactly, not effects.

- **Type.** Serif for doctrine prose at 62–68ch measure and ~1.65 leading; sans
  for interface; mono **only** for structural labels (relation types, versions).
  Three roles, never mixed.
- **Colour.** One accent per surface, derived from the organism's live vitals.
  Not a palette. Near-black field for the graph; a true light mode remains
  first-class for prose.
- **Material.** Glass only on opened surfaces. The resting field is matte.
- **Motion.** Only the four verbs from doc 08 §6.4 — `appear`, `connect`,
  `focus`, `settle`. 200–600ms, ease-out. **No springs, no overshoot, no
  bounce**: motion expresses resolve, not delight. `prefers-reduced-motion`
  replaces movement with opacity.
- **Line.** Hairlines. Relations rest at 8–12% opacity and only strengthen when
  they matter.
- **Space.** Emptiness is the premium signal and the place attention rests.

---

## 8. Primitives

This is P3 (Single-Focus Navigation) from North Star §5, finally real. It lives
in `frontend/src/attention-os/focus/`:

| Module              | Responsibility                                           |
| ------------------- | -------------------------------------------------------- |
| `radialOrder.ts`    | Clockwise-from-top slot geometry, bottom arc kept clear.  |
| `threadPath.ts`     | Session thread: append, collapse repeats, truncate, walk. |
| `ThreadLine.tsx`    | The hairline record of this session's attention.          |
| `RelationExits.tsx` | Typed exits, the threshold, and the end mark.             |

Pure logic is separated from rendering so the law is unit-testable rather than
asserted in prose.

---

## 9. Failure modes

- **Threshold too long** reads as broken. 700ms ceiling, always keyboard-skippable.
- **Relation-only movement can trap.** "Return to field" and the question input
  are always reachable.
- **A stored Thread is surveillance.** Session-only, or it does not ship.
- **Paternalism.** Structure is enforced; duration never is.

---

## 10. Acceptance criteria

- Every surface rests in Field or Focus, and nothing else exists.
- Focus visibly recedes the field and holds exactly one idea.
- The Thread appears, is re-walkable, is clearable, and survives no reload.
- Exits are typed in relation language, not generic links.
- The ring reads clockwise from 12 o'clock at every depth.
- The front door's first ring is the movement's five limbs, canon first.
- Reduced motion and keyboard navigation work throughout.
- No spring overshoot remains in navigational motion.
