# ADR-0038: DOT Names Its Movement and Its Lineage

- **Status:** Proposed
- **Date:** 2026-10-05
- **Deciders:** Founder
- **Amends:** ADR-0022 ("Movement" is not used as a status claim), ADR-0026 (hero lede)

## Context

A first-time visitor could not tell what DOT claims or where it stands. The hero
described "a practical framework", and the first concept defined the Digital
Organism as "a process that responds to information while maintaining its
coherence" — a definition a thermostat or a language model also satisfies. The
founder's actual proposition did not appear: Little c is not physical, it
receives this world through a body, and RF₀ serves as its incubator.

The page also gave no account of DOT's neighbours. Consciousness-first and
informational accounts of reality already exist — Thomas Campbell's *My Big TOE*,
Bernardo Kastrup's analytic idealism, Donald Hoffman's conscious agents. A
reader who knows them asks at once how DOT relates; silence reads as either
ignorance or concealment.

The founder has decided that the public entry presents DOT as a new intellectual
movement within that consciousness-first theory-of-everything tradition.

## Decision

- **The hero carries no explanatory paragraph.** The question, the concept
  slideshow, and the reading action are enough; a lede stating the proposal
  and a critique of science read as verbose and arrogant to the founder and
  was removed. The page states no blanket charge against science; DOT's
  preface defines pseudoscience as a claim exceeding its method, and that
  standard applies to DOT too.
- **The first concept carries the real definition at the honest level.** The
  Digital Organism is defined as a non-physical conscious process receiving
  this world through a body, labelled *hypothesis*, consistent with Big C and
  Little c.
- **The ending names the movement and its lineage.** It is labelled "A new
  intellectual movement", names Campbell, Kastrup, and Hoffman as nearest
  neighbours, states DOT's central question, and says plainly that naming these
  thinkers does not imply their endorsement (Book One's external-model rule).

Unchanged from ADR-0022: reading remains the single primary action; no join or
funding ask appears at the door; claim levels stay visible.

## Enforcement

- `HeroProposition.test.tsx` pins the absence of a hero lede and the first
  concept's proposal at the `hypothesis` level.
- `movementNarrative.test.ts` pins the movement label, the named lineage, and
  the non-endorsement sentence.
- `materialize-public-routes.test.ts` pins the short, non-assertive page
  metadata.

## Consequences

**Positive.** A visitor meets one question, the concepts, and one action in the
first screen, and learns by the end where DOT stands among comparable theories. Naming neighbours is honest and
lets readers compare. This serves L7 (honest) and keeps L10 (one primary action),
and violates no ADR-0004 prohibition.

**Negative.** "Movement" is now a status label on the page while the community
is small; it must be earned by the Academy rather than asserted elsewhere.
Association with *My Big TOE* invites readers to assume DOT shares its claims
where it may not (for example, T and E preceding Big C).

**Revisit if** reader feedback shows DOT being read as derivative of a named
theory, a named thinker objects, or the movement label is used to pressure
participation.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep "practical framework" framing | Low risk | Hides DOT's actual proposition | Rejected |
| Call mainstream scientists pseudoscientists | Forceful | False as a general claim; contradicts the preface; invites dismissal | Rejected |
| State the unexplained gap; name the movement and lineage | Honest, comparable, distinctive | "Movement" precedes the community | **Chosen** |
