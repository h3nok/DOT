# ADR-0030: The Website Is a Living Academy; Books Remain Publications

- **Status:** Accepted
- **Date:** 2026-09-02
- **Deciders:** Founder
- **Supersedes:** ADR-0029 (Book One as the public entry's final destination)
- **Amends:** ADR-0018 (book-derived first-party knowledge surfaces)

## Context

The public site began as a path into Book One. It now has the beginnings of a
larger intellectual record: a concept map, diagrams, explicit hypotheses, an
open-seams register, and a publication system. Treating every one of those
surfaces as an accessory to the current book would make the book carry two
incompatible jobs. A book should be a bounded, edited, citable object. A theory
under development needs a place where definitions can sharpen, diagrams can be
revised, objections can remain open, experiments can fail in public, and new
work can appear without silently changing an earlier edition.

A conventional content hub would solve the inventory problem while violating
the product's attention laws. Feeds, recency ranking, card walls, popularity,
and constant navigation would turn a place of inquiry into another place that
harvests attention.

## Decision

The website will become the living intellectual home of Digital Organism
Theory. Its public inquiry layer is named the **DOT Academy**. “Academy” names a
disciplined method and a stewarded public record; it does not claim
accreditation, institutional consensus, or authority over belief.

The Academy organizes work into three programs and eight explicit object kinds:

1. **Theory** — definitions, diagrams, and hypotheses.
2. **Critical inquiry** — objections, responses, and experiments.
3. **Writing** — excerpts and essays.

Books remain a fourth, visibly separate publication boundary. Book One is a
fixed, versioned edition. Academy work may cite, explain, extend, or challenge
it, but cannot silently rewrite it or render as part of its canon. A revision to
the book becomes authoritative only through a new immutable release.

Every released Academy object must declare:

- its object kind;
- its claim-level coverage, with every material claim classified as
  Observation, Model, Hypothesis, or Speculation;
- its provenance and relationship to prior work;
- its version or review date; and
- its critical disposition when applicable, including unresolved,
  inconclusive, or not supported.

The Academy begins from what already exists. `/doctrine` remains the
edition-bound Book One concept map; `/applied` remains the open-seams and work
register; the public architecture diagram remains the first diagram; and
`/book/digital-organism-theory` remains the separate Book One publication. A
new `/academy` route makes that structure and its editorial boundaries visible
before additional collections are released.

The Academy is finite and relation-led. It has no feed, trending surface,
engagement ranking, public counters, or autoplaying next item. One object holds
focus at a time; related work is offered through typed, meaningful exits. Open
questions, objections, negative results, and superseded responses remain in the
record.

## Consequences

**Positive.** The theory can develop without making the current book unstable.
Readers can distinguish canon, interpretation, extension, criticism, and
evidence. The site gains a durable scholarly architecture before its volume of
material grows. The public entry can invite inquiry rather than functioning
only as a book funnel.

**Negative.** The Academy introduces a second authority boundary that must be
enforced in content, metadata, search, and interface language. Several object
kinds will initially show an honest opening state rather than invented content.
New work requires stronger editorial metadata than an ordinary essay site.

**Revisit if** the Academy becomes formally accredited, adopts an independent
peer-review body, or a later theory publication receives authority equal to a
book edition. Any such change requires a new ADR and may not be inferred from
growth in readership or contribution volume.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep the site solely as a path into Book One | Simple authority model | Cannot hold living theory or criticism without overloading the book | Rejected |
| Turn the site into a conventional article portal | Familiar and quick to populate | Produces a feed, weak provenance, and attention competition | Rejected |
| Continuously update one online “book” | Always current | Destroys edition stability and makes citation unreliable | Rejected |
| Living Academy with fixed publications | Supports development and criticism while preserving canon | Requires strict metadata and boundary design | **Chosen** |
