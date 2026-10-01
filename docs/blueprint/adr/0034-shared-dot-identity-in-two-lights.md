# ADR-0034: One DOT Identity in Two Lights

- **Status:** Proposed
- **Date:** 2026-09-30
- **Deciders:** Founder (system-following defaults and complete Word/PDF design selected)

## Context

The public site first opened in monochrome, its book had a separate graphic
grammar, and a YouTube channel needs artwork without becoming a second brand.
The founder asked for a recognisable final identity across these surfaces,
including a complete Word/PDF design pass, not just a cover mockup.

Readers already own saved appearances and reading settings. A new default must
not silently repaint an old preference, disable reduced motion, or turn an
academic credential into evidence for the book's hypotheses.

## Decision

Use `frontend/src/content/identity.json` as the shared palette and type-role
record: warm ivory and green ink in daylight; living-ink dark and warm-white
text at night; restrained jade in both. Retain the existing nucleus mark as
the identity, not a literal scientific diagram.

Follow the device's light/dark preference until the reader explicitly chooses
a base. First visits and Reset select DOT Daylight or DOT Night. Both share
the same environment configuration so a system change stays within the named
pair. Keep the existing Radial field, reading defaults, alternate environments,
and reduced-motion behaviour.

Add an explicit palette field to appearance configurations. Older saved
configurations resolve to `classic`; they are not inferred to be branded from
their hue. Preserve whole-config saved environments. Fine-tuned colour, paper,
typography, and contrast controls continue to work.

Use Space Grotesk for the branded display voice, Source Serif 4 for long-form
reading, and JetBrains Mono for annotation. Keep other chosen reading faces
and the existing semantic theory-layer accents.

Style the private canonical Word manuscript as a 7-by-10-inch edition, with
an ink-and-jade jacket, native editable cover text, light reading pages, and
the shared type roles. Preserve every manuscript word, native equation,
field, citation, and bookmark. Embed the licensed fonts in Word. On Linux,
scope bundled fonts to each LibreOffice export through a temporary Fontconfig
configuration rather than installing them into the user's machine. The
editable manuscript remains private; the protected PDF uses the existing
delivery contract.

Keep inline equations within left-aligned prose. Put the long display equation's
qualifier on a second native equation row rather than clipping it or shrinking
every formula. Explicit normal-text formatting preserves literal "DOT" labels;
without it LibreOffice interprets that word as a dot-accent command. Tests compare
the complete equation invariant with only these explicit layout/formatting
transformations permitted; all tokens and native subscripts are preserved.
The founder approved correcting the existing Version 2
cover label and document metadata to Version 3 to match the released edition.
That explicit metadata correction is the only manuscript-text exception.

Generate a separate, off-site channel kit: banner, avatar, finite thumbnail
examples, and a still title card. Use the verified author record for the
channel's credit. State the PhD's field in the proposed channel description;
it is relevant background, not proof of consciousness-first claims. Do not
invent a channel URL or handle, add an automatic embed, or load trackers.

## Enforcement

- Identity tests require AAA contrast for body text and AA for supporting
  text and actions in both palettes.
- Default, appearance, and saved-configuration tests protect the named pair,
  existing reading choices, and legacy appearances.
- Browser tests assert the rendered colours, system-theme response, metadata,
  explicit Reset, and working fine-tune controls.
- The channel renderer checks actual text bounds, the centre safe area,
  circular-crop safety, PNG dimensions, and upload byte limits.
- Book-design tests compare all manuscript text and the complete native
  equation/field/citation/bookmark invariant before and after formatting.
- The normal release gate ties generated reading units and artifacts to the
  canonical manuscript checksum. Inspect the actual PDF before accepting the
  design; a cover image alone is not a complete edition.

Serves L1 (calm), L7 (reader choices remain reversible), L8 (legibility and
honest claims), L9 (local fonts and untracked artwork), and L10 (one identity
and one focus). Violates none. The existing online book still uses Reader/P2;
the identity layer and channel artwork are not new Attention OS primitives.

## Consequences

Positive: the work is recognisable across media, defaults remain humane, and
artwork can be reproduced without outside services or handwritten author facts.
Old preferences stay intact rather than becoming an undocumented migration.

Negative: font-embedded SVGs and Word files are larger. Rebuilding Word fonts
needs the optional book-design tools; ordinary PDF release uses the bundled
font files. Some vector editors need the named fonts installed despite SVG
embedding. A digital 7-by-10-inch proof is not a printer-specific wrap cover,
spine calculation, ISBN registration, or distribution agreement.

Revisit if readability tests fail, a translated edition needs new glyphs, the
founder changes the identity, or a print distributor specifies different trim,
bleed, binding, or colour requirements.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep unrelated monochrome, book, and channel identities | No migration work | The work is hard to recognise across media | Rejected |
| Force every reader into a dark theme | Consistent screenshots | Ignores device preferences and saved choices | Rejected |
| Infer branding from an existing saved jade hue | Fewer schema fields | Silently changes an explicit old appearance | Rejected |
| One shared identity, a matched system-following pair, explicit opt-in for old appearances | Coherent and reversible | Requires persistence, browser, and edition checks | Chosen |
