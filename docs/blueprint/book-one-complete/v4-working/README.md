# Complete Book One — Complete Edition, author review v4.8

> Private editorial manuscript. Public v3 remains the released edition.

*Consciousness: A Digital Organism — Foundations, Agency, and Research*

Henok Ghebrechristos · October 2026

## Current book

- [Read the designed PDF](v4.8-review/DOT-Complete-Book-One-v4.8-Review.pdf).
- [Edit the Word manuscript](v4.8-review/DOT-Complete-Book-One-v4.8-Review.docx).
- [Review the line edit against v4.7](v4.8-review/DOT-Complete-Book-One-v4.8-Review-Redline.html).
- [Inspect the validation record](v4.8-review/DOT-Complete-Book-One-v4.8-Review-Validation.json).

The v4.8 DOCX is the current private editorial handoff. It applies a recorded
line edit to v4.7 ([128 paragraph edits](editing/v4.8-edits.json)), marks
[26 depth passages](editing/v4.8-depth.json) for the digital edition
(ADR-0036), and replaces the review layout with a print design. It preserves
v4.7's definitions, 51 numbered references, 101 native Word equations
(24 display and 77 inline), and equation fields.
The earlier `manuscript/` Markdown files describe the v4.2 source snapshot;
they do **not** contain all subsequent Word revisions. Do not regenerate the
current book from those files or treat them as a parallel current manuscript.
This follows the Word-source/public-release distinction in ADR-0018.

## One manuscript, two renderings

The same Word file produces both editions (ADR-0036). The printed Complete
Edition sets every passage inline. The free digital edition folds the 26 depth
passages — notation, derivations, research protocols, technical rival
comparisons — behind closed disclosures the reader opens on request, so the
core reads at about 33,000 words with the full 44,000 one tap away.

Depth passages are invisible Word bookmarks named `depth_NN_start` and
`depth_NN_end` (Insert → Bookmark shows them). Keep each pair when editing; to
move or drop a passage, edit [the depth list](editing/v4.8-depth.json). Both
build scripts refuse unpaired or overlapping passages.

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

The Complete Edition is set on a 6 × 9 inch page in Source Serif 4, using its
SmText optical size for 10.5-point body text and its Display cut for chapter
titles; Space Grotesk carries labels and running heads (the shared identity in
ADR-0034). Text is justified and hyphenated, paragraphs are indented with no
space between them, and the first paragraph after a heading starts flush.
Headings use two levels in one family. Every major division opens on a
right-hand page with a dropped title and no running head; blank versos are
left blank. Front matter is numbered in roman, Chapter 1 starts at page 1.
The copyright page carries a colophon.

Comparison tables use horizontal rules only and are captioned as Tables 1–5;
the Experience Loop is Figure 1. Display equations sit in a layout grid sized
to the text measure. v4.7's grid gave each equation 1.5 inches, which made
LibreOffice cut off the end of fourteen of the 24 formulas in the review PDF
(for example, (1.1) lost “⇒ Experiences(S, r(e))”); all 24 now render in full.
The cover uses the ink-and-jade jacket shared with the digital edition,
labelled Complete Edition.

The PDF is tagged, keeps its outline and links, and embeds every typeface; the
only fallback faces are LibreOffice's mathematics fonts. This is a review
proof, not a printer-specific production file: print-on-demand still needs a
separate cover with spine (after the final page count), an ISBN, and an index.

## Reproduce and inspect

From the repository root, with LibreOffice and Poppler installed and the
book-design requirements in `.venv` (`scripts/requirements-book-design.txt`):

```bash
make book-complete                       # build and render v4.8
make preview-book-complete PANDOC=…      # derive digital reading units to /tmp
```

`scripts/build_book_v48.py` takes the frozen v4.7 Word file, checked against
the SHA-256 in both manifests, and refuses paragraph drift, body-text changes
outside the line-edit manifest, and any change to native math, fields,
citations, or bookmarks. Fonts are scoped to each LibreOffice export, not
installed. Print typefaces are in `design/fonts/print/` (SIL Open Font License).

Further manual Word changes should be saved as a new revision. Rebuilding v4.8
reapplies its fixed manifests and would overwrite unrecorded changes in the
v4.8 output directory. Use `--output /tmp/book-review` for an isolated proof.

## Release boundary

Prior editions and the v4.2 Markdown remain as history. Author-only questions
in `manuscript/coauthor-questions.md` are excluded from the reader book.

Sharing this PDF with reviewers does not change public canon. Publication
requires deliberately freezing a new release and deriving the public reader
and other first-party surfaces from that release. No website deployment is
part of this editorial revision.

The work serves L1 (calm presentation), L7 (reversible, traceable revision),
L8 (useful reading), and L10 (one focus). It introduces no manifesto exception.
