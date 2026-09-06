# Complete Book One — author review edition v4.7

> Private editorial manuscript. Public v3 remains the released edition.

*Consciousness: A Digital Organism — Foundations, Agency, and Research*

Henok Ghebrechristos · September 2026

## Current book

- [Read the designed PDF](v4.7-review/DOT-Complete-Book-One-v4.7-Review.pdf).
- [Edit the Word manuscript](v4.7-review/DOT-Complete-Book-One-v4.7-Review.docx).
- [Review the prose changes from v4.6](v4.7-review/DOT-Complete-Book-One-v4.7-Review-Redline.html).
- [Inspect the validation record](v4.7-review/DOT-Complete-Book-One-v4.7-Review-Validation.json).

The v4.7 DOCX is the current private editorial handoff. It refines the v4.6
review edition, preserving its definitions, 51 numbered references,
101 native Word equations (24 display and 77 inline), and equation fields.
The earlier `manuscript/` Markdown files describe the v4.2 source snapshot;
they do **not** contain all subsequent Word revisions. Do not regenerate the
current book from those files or treat them as a parallel current manuscript.
This follows the Word-source/public-release distinction in ADR-0018.

## Editorial direction

Little c names the self-aware process at a local scope. Big C and Little c share
that fundamental nature, while scope and access differ. Canvas state carries a
local instance's distinctive history and developed identity. The Painting is
the accumulated organization of that state; Character expresses it through
action. Learning changes carried state and can widen what becomes available to
awareness and choice.

Book One takes self-awareness as a foundational postulate and leaves its
intrinsic nature open. It establishes the architecture, implications, and
research questions. Its concrete examples introduce the model; Book Two will
develop the practical method. Practical change does not by itself establish
Big C, persistence beyond the body, or cosmological purpose.

## Book design

The review edition uses a 6 × 9 inch layout, Georgia body text at 11 points,
roomier leading, neutral charcoal text, mirrored margins, and warm neutral
paper on the cover. Teal is reserved for the cover motif, selected diagram
marks, and chapter labels. Ordinary headings and body text are neutral.

A short linked contents page now includes a link to the architecture map,
which has its own page before the Preface. The map distinguishes the process,
carried state, and embodied environment. A second diagram in Chapter 2 shows
the Experience Loop with numbered steps and arrows. Both are embedded SVGs
with PNG fallbacks for Word compatibility; the proof PDF renders them as
vectors with selectable text. Shapes, labels, and arrows carry meaning in
grayscale as well as color.

Comparison tables remain where rows are useful. Repeated wrapper labels and
fragmented callouts have been consolidated into continuous prose. Scientific
claim identifiers remain attached to their statements. Chapter transitions,
figure placement, glossary entries, and page links are checked in the proof.
The PDF is tagged and preserves links. This is a review proof, not a claim of
formal PDF accessibility certification or printer-specific production approval.

## Reproduce and inspect

From the repository root, with Python 3, LibreOffice, and Poppler installed:

```bash
python3 scripts/design_book_one.py --render
```

The script uses the standard library and shares OOXML/proof helpers with
`scripts/revise_book_one_review.py`. Its input is the frozen v4.6 Word file,
checked against the SHA-256 in [the exact reading manifest](editing/v4.7-edits.json).
The v4.6 builder and its earlier source remain available for provenance.

The design builder refuses source or paragraph drift, protects native math and
equation fields, and checks rendered page destinations and stable contents
pagination. It writes a new review edition without modifying v4.6.

Editable vector sources and their compatibility images are in
[assets/v4.7/](assets/v4.7/). To regenerate images and the book together:

```bash
python3 scripts/design_book_one.py --render-assets --render
```

Further manual Word changes should be saved as a new revision. Rebuilding v4.7
reapplies its fixed manifest and would overwrite unrecorded changes in the
v4.7 output directory. Use `--output /tmp/book-review` for an isolated proof.

## Release boundary

Prior editions and the v4.2 Markdown remain as history. Author-only questions
in `manuscript/coauthor-questions.md` are excluded from the reader book.

Sharing this PDF with reviewers does not change public canon. Publication
requires deliberately freezing a new release and deriving the public reader
and other first-party surfaces from that release. No website deployment is
part of this editorial revision.

The work serves L1 (calm presentation), L7 (reversible, traceable revision),
L8 (useful reading), and L10 (one focus). It introduces no manifesto exception.
