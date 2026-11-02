# ADR-0058: Theme-aware illustrations in the digital book

- **Status:** Accepted
- **Date:** 2026-11-01
- **Deciders:** Founder (requested calm animated diagrams for each key concept)
- **Extends:** ADR-0018, ADR-0036, ADR-0057

## Context

The digital book displays v5's print SVGs as images. Their fixed white paper
and print layout interrupt the reading surface, particularly in dark mode.
The founder requested illustrations that belong to the digital book and explain
each key concept through calm motion.

## Decision

Give the eight numbered v5 figures native SVG screen compositions, rendered by
the existing Reader figure primitive. Preserve their manuscript positions,
numbers, captions, alternative descriptions, and claim levels. The composition
must retain each figure's proposed relationships, including Little c outside
RF₀ and within Big C, speculative T × E outside Big C, and functional coupling
remaining when identification changes.

Place one additional visual study for each of the seventeen released Concept
Map concepts beside an existing relevant heading. Reuse the reviewed film
drawings as pure SVG functions with the reader's typography and theme; their
captions derive from the released Concept Map. Load this drawing code with the
book route. These are reading aids, not new numbered manuscript figures.

Each illustration plays one nine-second explanation and then holds its final
frame. Pause and replay belong to the reader. Offscreen and hidden documents
stop their clocks. OS reduced motion and the site's stillness preference show
the complete drawing without starting an animation. There is no autoplay-next,
continuous loop, sound, score, or attention prompt.

This is a web rendering change. The sealed release, Word manuscript, PDF,
retrieval corpus, and original image files retain their checksums. Browser
printing uses the original numbered figure artwork; the additional web studies
do not enter the printed edition. An unknown figure or older edition retains
its original image renderer. Prose and claim boundaries remain readable
independently of motion and JavaScript.

## Verification

Check all eight diagrams and seventeen concept placements against the released
inventory and heading anchors. Browser checks cover light/dark, narrow screens,
finite motion, pause/replay, stillness, and print fallback. Run `make verify`,
including immutable-release checks, before publication.

Serves L1 (calm, predictable explanation), L2 (a finite sequence), L7 (visible
claim levels and reader control), L8 (comprehension), and L10 (reading focus).
Violates no manifesto law.
