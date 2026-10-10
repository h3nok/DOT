# ADR-0047: Homepage without the duplicate work, writing and contact doors

- **Status:** Accepted
- **Date:** 2026-10-09
- **Deciders:** Founder, asking whether the "Things built. Ideas explored." section is needed on the homepage
- **Amends:** ADR-0044 (homepage destinations only)

## Context

ADR-0044 added a homepage section that named the founder and offered three
colored destinations: work (About), writing (Blog) and conversation (Contact).
The page already does both jobs above it. The hero names the founder in a link
to About ("Henok Ghebrechristos · Builder · Author · PhD"), and the site header
on every viewport carries About, Blog and Contact. The section repeated both one
scroll later. It also sat between the hero and the theory sequence the hero
introduces (ADR-0042), so a reader following T × E → Big C → RF₀ → Little c was
interrupted by navigation.

## Decision

Remove the section and its entry in the page's section map. The founder line in
the hero and the header navigation remain the homepage's paths to work, writing
and contact. The script-free homepage text keeps equivalent plain links, with
the project inquiry (`/contact?purpose=project`) its description promises.

The IntentCard primitive stays in Attention OS; it is no longer used on the
homepage. Its now-unused homepage styles are removed in a separate cleanup.

Serves L2 (one finite path through the page) and L10 (fewer competing actions;
Read Book One stays the primary one). Violates none.

## Consequences

- The homepage reads as one sequence: Love, the reading invitation, the model,
  and the closing invitation.
- A visitor who comes for work reaches it from the hero's founder line or the
  header. Links shared in a work context should point at `/about` directly.
- Revisit if inquiries show visitors failing to find work or contact from the
  homepage.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep the section | Explicit builder signal mid-page | Repeats the header and hero; interrupts the theory sequence | Rejected |
| Move it to the end of the page | Keeps the doors without interrupting | Competes with the closing reading invitation | Rejected |
| Remove it; rely on the hero line and header | One sequence, no duplicate navigation | One fewer prominent work entry | Chosen |
