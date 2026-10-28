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

## Amendment — 2026-10-26: Films and learning share the Academy

The founder requested one Academy destination for films and learning. Restore
`/academy` as the public learning entry, with the existing introduction films,
the two finite Book One reading paths, the edition-bound concept map, and open
questions. The page presents materials that are available now; it does not
claim courses, accreditation, assessment, or a learning account system.

The screening room lives at `/academy/films`. The earlier `/films` and
`/videos` addresses redirect there while preserving query parameters and
fragment anchors. Runtime canonical links, static HTML, structured data, and
the sitemap use the same hierarchy. Both earlier addresses remain built as
canonical aliases, so shared links also have a useful destination without
JavaScript. Navigation names the Academy as the common entry.

The public site offers one **Explore** observer point at the lower-left edge,
leaving the centre of the top bar clear. Its trigger is portalled outside the
headers so their backdrop filters cannot change its viewport position. It
opens a full-screen navigation field, with six named destinations arranged
around the current location on wide screens and along a curved reading path
on smaller screens. Conversation and the reader list remain quiet links.
Keyboard focus stays in the open field, Escape closes it, and focus returns to
the control. Short screens scroll within the field; reduced-motion and
stillness preferences suppress the entrance animation.

Book One remains a separate fixed publication at
`/book/digital-organism-theory`. Reading paths reuse the reader's existing
registry and change the encounter order without changing the sealed text.
Films retain their claim-level disclosures, source links, explicit playback,
and finite ending. Nothing starts automatically when a reader opens a link.

Serves L1 (predictable navigation), L2 (finite materials), L7 (working shared
links and honest availability), L10 (one learning entry), and L12
(reader-directed study). Violates no manifesto laws.

## Amendment — 2026-10-27: One short silent film per concept

At the founder's request, the Academy entry no longer screens a film; it opens
with the reading paths, the concept map, and open questions. The screening
room at `/academy/films` now holds one short silent film for each concept in
the concept map, in the map's order. Each film draws its concept for sixteen
seconds and shows the concept map's own name and definition. Films have no
sound, start only when asked, end on their final frame, and never advance to
the next film. A link can name one film with `?concept=`. The narrated
inquiry film is no longer screened on the site; its renders stay in the
YouTube kit. Each concept is drawn as a familiar picture where one carries it,
taken from the book where the book offers one, and its film adds one analogy
line beside the definition: the book's words where it has them, otherwise a
restatement of the book's own relationships that claims nothing more.

The homepage plays one film through every concept in the same order, built
from the same drawings. It opens on four short scenes in the author's
published words: the struggle the American Millennial Manifesto describes,
the cultural trap that makes it feel like how things are (Book One, The
Painting), the Frame that turns continuity into curriculum (Book One,
Reality Frames), and the homepage's own line, "Understand what shapes you.
Transcend your culture." Then comes each concept with its words typed as it
plays, held long enough for a first-time reader (about 20 characters a
second) to read them and then look at the picture, 13 to 18 seconds each.
The book's title closes it, about five minutes
in all, ending on links into the book and the concept map. It is the
only film with sound: soft typewriter keys, which start only when the reader
presses Play and can be turned off in the player. With reduced motion it
shows each part finished and makes no sound. It pauses when scrolled out of
view. The concept films in the screening room stay silent.

Serves L1 (calm motion; the only sound is the typing the reader chose to
start), L3 (no autoplay or chaining; it pauses when unseen), and L7 (text
taken from the concept map and the book, links to the source passage; the
sound is one click to turn off). Violates no manifesto laws.
