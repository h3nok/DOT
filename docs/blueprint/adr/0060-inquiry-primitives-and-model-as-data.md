# ADR-0060: Inquiry primitives, design-system layers, and a work's model as data

- **Status:** Proposed
- **Date:** 2026-11-17
- **Deciders:** Founder (requested 2026-11-16 and 2026-11-17)

## Context

The founder said the AMM home "doesn't really speak to the diagnosis, to the model",
asked whether concepts and presentation should be separated, and asked for pages that
include "everything a serious inquirer might need to grow their own theory", built
from primitives and a design system first, borrowing from Sullix and Green Elephant.

Until now each page restated the model in its own words and markup. The same
architecture is drawn three different ways, and copies drift (the Open Questions page
still names edition v4 while the book is v5). Claim levels exist in the book but appear
on only one page.

## Decision

1. **Layers.** Following Sullix's design-system document and Green Elephant's token
   packages: raw values → roles (`shared/design-system/tokens.css`) → Attention OS
   primitives (`attention-os/*`) → page patterns (`blocks/*`). A space (DOT, AMM) sets
   only `--space-accent` and `--scene-band`; pages never restyle a primitive's internals.
2. **Inquiry primitives** (`attention-os/inquiry`): `Scene` (one concept per screen),
   `Eyebrow` and `Locator` (where a screen sits in the model), `ModelMap` (the drawing
   for the eye, the list for everyone), `LevelMark` and `LevelKey` (claim levels by
   shape, never colour alone), `Cited` (every sentence one link from its passage),
   `Terms`, `Records`, `Notebook` (private worksheet, tab-only), and `CiteThis`.
3. **A work's model is data, written once.** AMM's is `content/amm-model.json`, generated
   from the published chapters by `scripts/build-amm-model.py`; `AmmModel.test.ts` fails
   if a sentence drifts from its chapter section. The page's own labels live in `amm.json`
   (`model`, `inquiry`) and are editable in Studio; the book's sentences are not.
4. **The public AMM is a gateway to the book** (the founder, 2026-11-18: "The site is
   simply a gateway to the book. Editable pages and all."). Each screen carries one
   painting or pair, at most one link, and one AI-illustration note; no step eyebrows,
   per-screen share pills or source lines, and no system/model jargon.
   - **`/amm` (Home)** has three screens: the opening (the book's sentence, the Host, and
     one link, *Start reading* → Chapter One); **the foundation and the diagnosis**
     (`#amm-diagnosis`: "The purpose of life is Love." with Book One's definition, quoted
     and cited, then "The country's culture is an inverted reality." as a row-for-row table
     under the portrait and the stall, leading to Chapter Three's *The Inversion in
     Practice*); and **the book** (`#amm-book`: the four chapters, each a painting, its
     number and title, `#amm-chapter-1`…`#amm-chapter-4`, plus *All editions*).
   - **`/amm/figures`** keeps the sourced charts Chapter Two refers to (wealth, equity,
     savings, housing, sources), reached from Chapter Two on the home and every AMM footer.
   - **Folded pages keep their addresses.** `/amm/power`, `/amm/capital` and `/amm/money/*`
     open Chapter Two, or the matching figure on `/amm/figures`; `/amm/reflect` opens
     Chapter Three at the Inversion. Their prerendered pages are `noindex` with the chapter
     as canonical (`materialize-public-routes.test.ts`, `e2e/amm-figures.spec.ts`).
   - Every visible label on these pages is a Studio field (`ammCopy.js`); Studio lists only
     fields a live page shows. The book's sentences come from `amm-model.json`.
   The Organized Power and Host & Infection components, their CSS and unit tests stay until
   a separate cleanup change (ADR-0005). Enforced by `e2e/amm-home.spec.ts` (two screens
   after the opening, under 260 words, no "model", one illustration note per screen).
5. **`/amm/inquiry`** gathers what an inquirer needs: the model, Book One's four levels
   of claim, the working definitions with the DOT concepts they apply, the book's method
   with a private notebook, the book's own tests of itself, dated records, and citations.
6. **Accessibility is tested.** axe-core checks WCAG 2.2 A/AA in the browser suite
   (`expectNoAxeViolations`); new work must pass it. A design-system lab at
   `/_preview/design-system` (development only) shows every token and primitive.

Laws served: L1 (motion only through the shared tokens, still for reduced motion, "Hold
still" and environment off; the home is now three screens with one link each), L3 (a
finite gateway that ends at the book, not a scroll of companion pages), L5 (no counts or
scores), L7 (claim levels visible; the
notebook saves and clears in one place), L9 (the notebook never leaves the tab; nothing
is tracked). No law is violated.

## Consequences

- A revision to a chapter requires regenerating `amm-model.json`; the test names the
  sentence that drifted.
- The four Leech terms and "Idealism" and "Division" are the author's labels of
  2026-11-16, not yet terms in book v1.1. They appear only as names; every definition
  shown is a published sentence. "Authorship" placed outside the figure is an editorial
  reading awaiting the author's confirmation.
- DOT's concept map, open questions and home architecture can move onto the same
  primitives and model data next, which removes the v4/v5 drift.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Copy Green Elephant's `@greene/ui` components | Mature, tested | Dashboard cards and Tailwind class contracts; card walls break the Field and Focus law | Borrowed the layering, skip-link pattern and axe; not the components |
| shadcn/Radix cards for the inquirer's page | Fast | A card wall, not one concept per screen | Rejected |
| Keep hand-written copy per page | No new structure | Drift and unsourced restatement | Rejected |
