# ADR-0020: Public Entry Follows Reader Intent

- **Status:** Accepted
- **Date:** 2026-08-11
- **Deciders:** Founder

## Context

ADR-0017 defined the movement's anatomy as canon, concept map, practice, applied
work, and movement. Rendering that anatomy directly as the public homepage made
the first choice taxonomic: a new visitor had to understand labels such as
"Concept Map" and "Applied" before understanding why the work mattered.

The homepage also hydrated from the editable profile graph. A cached or
server-published draft could therefore override released copy and keep an older
front door visible after the application changed. That is appropriate for a
member-owned profile, but not for the movement's public proposition.

Visitors arrive with simpler intentions: understand the theory, read or keep
the book, join the movement, or support the work. These choices must be visible
without making funding or membership a condition of reading.

## Decision

The public homepage is a release-controlled invitation map, not a rendering of
the movement's ontology or an editable profile graph.

- Book One remains the single primary action.
- Four secondary doors are stated in human terms: explore the theory, get the
  book, join the movement, and support the work.
- The concept map and open-question register remain first-class theory
  surfaces, but they do not define the homepage hierarchy.
- Public hero copy ships with the frontend release and cannot be replaced by
  local graph cache or a server profile draft.
- The Word manuscript in `docs/blueprint/` is the private editorial source for
  the web reader and one downloadable digital PDF. The editable DOCX is never a
  public artifact.
- Minty remains directly available from the field for readers who prefer a
  conversational entry.

## Consequences

- (+) A first-time visitor can understand the proposition and available actions
  without knowing DOT's internal vocabulary.
- (+) Joining, support, and book ownership are findable without competing with
  the primary reading action.
- (+) Public copy is deterministic across browsers and deployments.
- (+) The concept graph can become deeper without making the homepage denser.
- (-) The homepage no longer demonstrates recursive graph navigation by
  default; the concept map and Minty carry that interaction.
- (-) Editorial changes to the public proposition require a code release.
- **Revisit if:** reader research shows that one of the four doors is routinely
  mistaken for access to a different or more complete canon.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep the movement anatomy as the home ring | Demonstrates the graph immediately | Requires internal vocabulary before motivation | Rejected |
| Add join and support beneath the existing ring | Small implementation change | Leaves the conceptual hierarchy and stale-data problem intact | Rejected |
| Make every door an equal primary button | Maximum immediate visibility | Violates single-focus navigation and obscures the canon | Rejected |
| One primary reading action with four quiet intention doors | Human, complete, and attention-safe | Separates the front door from the graph metaphor | **Accepted** |
