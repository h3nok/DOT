# ADR-0045: Shared public-page design foundations

- **Status:** Accepted
- **Date:** 2026-10-09
- **Deciders:** Founder (apply and bootstrap the existing design system)
- **Extends:** ADR-0034 and ADR-0041

## Context

The personal platform has an established identity, appearance controls, and
Attention OS navigation and form primitives. About, Blog, and Contact still
repeat page-specific typography, surface colors, and secondary-link styles.
The founder requested shared design foundations and a more visual About page.

## Decision

Extend the existing system under `frontend/src/shared/design-system/` with
public-page spacing, type, radius, and four named color tones. Load these tokens
once from the live entry. Reuse the palette in existing IntentCard navigation
and IntentionPicker options. Respect the reader's theme, contrast, and radius.

Compose About, Blog, and Contact with PageIntro, SectionHeading, Surface, and
TextLink where applicable. Keep PageShell, DotButton, and Attention OS primitives
as their existing contracts. Surfaces have no implicit action; navigation uses
real links and preserves native download, external-link, and fragment behavior.

Give About's recorded products original, decorative SVG illustrations and
visible technology labels. These are diagrams, not purported product screenshots.
Keep a finite portfolio, real destinations, the supplied résumé, and one primary
project inquiry. Employer labels in the public career and résumé are generic at
the founder's request; named products remain in the portfolio.

This foundation does not implement the absent Focus Modes, Attention Budget,
or Presence primitives, and does not change the manuscript or inquiry copy.

Serves L1 (calm), L2 (finite pages), L7 (honest content and native links),
L9 (no trackers), L10 (clear actions), and L12 (visitor-directed paths).
Violates no manifesto laws.

## Consequences

Shared visual changes can reach all three public pages and the existing home
navigation without adding a CSS framework or dependencies. Each page keeps its
own useful visual identity. New public sections should use the shared foundations
before defining their own heading, surface, or secondary-link styles.

## Amendment — 2026-10-10 (one type system, one button)

The founder chose to consolidate typography to the identity's three faces and
to give the shared button one treatment everywhere.

- **Faces.** `--font-sans` is Space Grotesk (interface and display) and
  `--font-serif` is Source Serif 4 (reading and serif headings); JetBrains Mono
  stays the annotation face. Inter and Playfair no longer appear by default.
  They remain registered only for reader-chosen Appearance options (the Sans
  reading face and the classic palette), and browsers fetch a face only when a
  page uses it. Space Grotesk now ships its 600 and 700 weights so interface
  emphasis is never synthesized.
- **DotButton.** The shared button sits on its own paper with a hairline edge
  and a slight lift on hover, replacing the frameless grey fill. Dark mode uses
  a lifted surface without shadow; high contrast draws the edge in full ink.
  The hero's reading invitation now inherits this instead of defining its own.

Pages keep their own layouts and illustrations; only the faces and the shared
button converge. Serves L1 (calm, legible surfaces) and L10 (one recognisable
action style); violates no law.

## Alternatives considered

- Separate copies of the styles: simpler initially, but diverge across pages.
- Introduce another CSS framework: duplicates the established tokens and controls.
- Extend the existing components and tokens: chosen for continuity and reuse.
