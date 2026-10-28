# ADR-0055: The Hero Retires Its Concept Slideshow

- **Status:** Proposed
- **Date:** 2026-10-28
- **Deciders:** Founder (chose removal on 2026-10-28 after a concept-by-concept review)
- **Supersedes in part:** ADR-0037 (the finite hero concept introduction and its
  2026-10-10 critique amendment) and ADR-0038 (the hero's first concept)
- **Keeps:** ADR-0026's architecture order, ADR-0037's architecture colours and
  Consciousness 101, ADR-0038's lineage ending

## Context

The homepage explained DOT's concepts three times: a twenty-entry autoplay
slideshow in the hero, the four architecture sections (T × E, Big C, RF₀,
Little c), and the concept film, which types each Concept Map definition from
Book One. The slideshow was the only one with its own wording, and that
wording had drifted from Book One:

- It defined the Digital Organism as "you … the conscious process that lives
  through a body". Book One says Big C is the Digital Organism that persisted,
  and defines the term as a state-bearing, information-sensitive process (Model).
- It said RF₀ is where consciousness stabilizes before exploring other
  realities, that a stabilized consciousness can explore other Frames and widen
  its decision space, that awareness is "a local share" of Big C, and that
  Big C runs an "outer loop". None of these claims appears in Book One.
- Its Fear and Intent entries paraphrased the Concept Map instead of quoting it.

Three explanations with different wording are not clear. The autoplay
exception in ADR-0037 also kept motion at the top of the page.

## Decision

- Remove the hero concept slideshow, its twenty entries (including the three
  outside-perspective critiques), and the "Questions for inquiry" block from
  the page text served without JavaScript. The hero keeps its heading, the
  single Read Book One action, the architecture figure, and the question
  disclosure.
- Clicking a part of the hero figure scrolls to the section that explains it:
  T × E → `#possibility-field`, Big C → `#big-c`, RF₀ and other Frames →
  `#reality-frame`, Little c → `#little-c`. The figure stays presentational: no
  hover or pointer-tracking effects. For keyboard readers, the hero's "Explore
  the architecture" link and the page map lead to the same sections.
- The architecture sections state T × E in the author-confirmed terms (T is
  primordial continuity, Time; E is the raw information source), with Big C
  emerging within T × E (ADR-0026). Big C is introduced as Book One introduces
  it: the Digital Organism that persisted. Little c keeps the founder's wording
  from ADR-0038.
- Concept definitions on the homepage come from Book One's Concept Map (the
  film) or the four architecture sections. No third parallel set is
  maintained.

## Enforcement

- `HeroProposition.test.tsx` requires that no "Key concepts and questions"
  region exists, that each figure part scrolls to its section, and that the
  "Explore the architecture" link points to `#possibility-field`.
- `themeTokens.test.ts` keeps the figure free of pointer-tracking handlers.
- `movementNarrative.test.ts` pins the T × E and Big C wording, and the hero's
  lack of a slideshow.
- `materialize-public-routes.test.ts` requires that "Questions for inquiry" is
  absent from the page text.
- `e2e/hero-architecture.spec.ts` and `e2e/routes.spec.ts` check the hero
  layout without the slideshow.

## Consequences

**Positive.** The first screen has no motion other than the figure's single
entrance. Each concept has one homepage explanation that matches Book One.
This serves L1 (calm), L3 (nothing pulls toward a next item), L7 (honest claim
levels) and L10 (one primary action). It violates no ADR-0004 prohibition, and
it removes the scoped autoplay exception in ADR-0037.

**Negative.** The three outside-perspective critiques (Closed Question,
Physicalism, Secular Humanism) no longer appear anywhere on the site. Each
architecture section still sets the mainstream view beside DOT's question, but
without those named citations. Claim-level badges per concept now appear only
in the film and the architecture sections.

**Revisit if** readers report that the hero gives too little orientation before
the scroll, or the founder wants the critiques restored. In that case, restore
them as a static section that quotes Book One, not as a hero carousel.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep the slideshow, rewrite every slide to Book One wording | Keeps hero orientation | A third copy of the Concept Map to keep in sync; autoplay stays in the hero | Rejected |
| Keep a four-slide slideshow for the architecture parts only | Shorter, closer to the figure | Still repeats the sections directly below it | Rejected |
| Remove the slideshow and link the figure to its sections | One explanation per concept; calm first screen | Critiques retired | **Chosen** |
