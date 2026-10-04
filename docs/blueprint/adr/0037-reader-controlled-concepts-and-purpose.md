# ADR-0037: Finite Explained Concepts and a Purpose Card

- **Status:** Accepted
- **Date:** 2026-10-03
- **Deciders:** Founder (explicitly approved finite public-hero autoplay with explanations, Pause/Play, and no looping)
- **Amends:** ADR-0026's vocabulary presentation, not its architecture sequence
- **Scoped exception:** L2's autoplay restriction for this finite public introduction only; ADR-0004's member-interior ban remains unchanged

## Context

The founder requested a key-concept slideshow in place of the hero's general
hypothesis line, stronger colour distinction in the existing architecture,
and a Love-and-relationships purpose card after Little c. The established
layout and T x E background must remain intact. ADR-0026 preferred simultaneous
vocabulary access. The first compact replacement hid explanations in accessible
text and did not introduce the ideas clearly enough. The founder then requested
visible explanations and autoplay, and explicitly approved a scoped exception
for a finite, pausable introduction rather than an endless carousel.

## Decision

Present the existing ten Book One concept definitions in their existing order.
Show a legible title, a visible plain-language explanation, and its claim level.
Run a deterministic introduction once, in order, with visible Pause/Play and
Previous/Next controls. Never wrap, restart automatically, or navigate the reader
to another surface. Stop on the tenth concept with an explicit completion state.
Keep reading available immediately; finishing the introduction is not a gate.

Type an autoplay title once, then allow at least eight seconds to read its
explanation, extending that interval for text longer than 200 words per minute
would permit. Pause advancement during mouse hover, while offscreen, and while
the document is hidden. Give a fresh reading interval when returning. Keyboard
focus and manual paging stop playback until Play is explicitly requested.
Do not announce automatic slide changes to screen readers; announce manual
changes politely. Reduced motion and Appearance stillness disable typing and
autoplay while preserving access to every complete explanation.
Switching stillness off does not restart playback without Play.

Size the introduction to its longest slide at the current width and font.
Do not truncate titles or explanations or move the reading action between
slides. Elevate this explanatory surface without replacing the established
heading, reading invitation, background, or architecture.

Reveal the existing splash background behind the hero rather than drawing a
replacement square lattice. The default curved radial mesh is already shared
by the loading dot and the architecture through the organism field anchor.
Use the existing twelve-percent threshold veil instead of an opaque backdrop,
while preserving the local reading wash. The expansive field suggests continuity
and possibility; it is not evidence of a measured external lattice.
Keep it distinct from RF₀'s physical diagram grid and honour the reader's
Appearance preset, field-off and high-contrast controls. Add no canvas,
substitute geometry, perspective transform, or new looping animation.

Keep the four-layer architecture and its conceptual geometry. Use restrained
graphite for physical RF structure and the reader's selected accent for conscious
processes, not a multicolour palette. Keep surface tint subtle and boundaries
sharp. Preserve shape, labels, and line patterns so meaning is not conveyed
by colour alone. Make existing
social coupling, offered options, and chosen Intent visually distinguishable;
do not invent additional Frames or causal relationships.

Place Consciousness 101 after Little c and before the existing Academy ending.
Explain Love and relationships as purpose within DOT, not as another
architecture layer or a universally established scientific result. Link to
the released book's operational Love passage and add the section to the
finite page navigation. Do not change the released manuscript.

Explain RF₀ as DOT's proposed high-fidelity, complex developmental environment
for Little c: an incubator metaphor for living, sampling possibilities, and
developing together. Preserve RF₀'s identity as the physical universe, real
consequences, and the possibility of other Frames. State that both origin and
developmental purpose remain hypotheses, not conclusions derived from physics.

## Enforcement

Component tests require all ten visible explanations and claim levels, the
full post-typing reading interval, a finite autoplay endpoint, disabled endpoints,
Pause/Play, suspension and timer cleanup, and no timers under either stillness
setting. Browser tests exercise actual autoplay, pointer-focus playback controls,
hover/offscreen suspension, keyboard paging, full text without glyph clipping,
stable reading-action position, and access to reading on a 320-pixel screen.
Field tests require one shared membrane canvas, a hero veil below fifteen
percent opacity, no substitute square grid, and no pointer interception.
Loading tests require the same field to hand off from the splash dot to the
architecture anchor; existing Appearance tests require field-off suppression.
Architecture tests require perceptual separation of at least 0.05 in OKLab
between physical structure and conscious Intent, and label contrast of at
least 4.5 in both lights.

Purpose tests require Little c -> Consciousness 101 -> Academy ordering,
working page navigation, and a book-source link that reveals its folded
passage. Existing geometry, stillness, and manifesto tests remain enforced.

Serves L1, L2's natural completion, L7, L8, L10, and L12; violates none under
the founder-approved, public-introduction-only autoplay exception above. No
member-interior or Reader autoplay is permitted. This is public explanatory
UI, not a new Attention OS primitive. The manifesto quarantine is unchanged.

## Consequences

Positive: concepts can be learned one at a time, colour clarifies the existing
system, and the architecture leads into its human purpose without replacing
the established page.

Negative: default motion can interrupt reading, mitigated by visible Pause,
hover/focus suspension, and stillness. Comparing all ten definitions requires
interaction, and the purpose card makes the page longer. The book and doctrine
remain available for full reading rather than being gated by the slideshow.

Revisit if readers find default rotation distracting, miss definitions, colour distinction fails under chosen
appearances, the reading action shifts, or the purpose card is mistaken for an
additional cosmological layer.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep only the general hypothesis line | Small and explicit | Does not introduce the requested concepts | Rejected |
| Show all ten definitions in the hero | Supports comparison | Crowds the preserved opening | Rejected |
| Compact titles with hidden definitions | Small footprint | Does not visibly explain the concepts | Rejected |
| Endless automatic rotation | Always moving | Removes natural completion and interrupts reading | Rejected |
| Manual explained concepts only | Least interruption | Does not meet the founder's requested introduction | Rejected |
| One-pass explained introduction with visible playback controls | Requested presentation, explicit limits, preserved architecture | Requires a scoped autoplay exception and suspension safeguards | Chosen |
