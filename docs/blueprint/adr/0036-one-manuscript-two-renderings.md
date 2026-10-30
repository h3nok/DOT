# ADR-0036: One Manuscript, Two Renderings

- **Status:** Proposed
- **Date:** 2026-10-02
- **Deciders:** Founder (chose "one manuscript, two renderings" over an abridged digital text)

## Context

Book One exists as a free digital edition for everyone and a Complete Edition
for serious readers. The founder wants the digital edition to be as strong as
the printed one while staying easy for a general reader, and the printed book
to carry the full technical detail.

The digital v3 release is a separate, older 23.5k-word text; the Complete
Edition review manuscript (v4.x) is about 45k words. Keeping two texts means
they drift: every correction has to be made twice, and the digital reader
quietly falls behind the theory (ADR-0018 already makes Word the single
source).

The digital reader also has to stay finite and calm (ADR-0004): nothing that
pressures a reader to "complete" hidden material, no counters, no tricks.

## Decision

Keep **one** Word manuscript for both editions.

1. Mark technical-depth passages in Word with paired, invisible bookmarks
   `depth_NN_start` / `depth_NN_end`, listed with neutral labels in
   `docs/blueprint/book-one-complete/v4-working/editing/v4.8-depth.json`.
   Depth is: formal notation and derivations, research protocols, technical
   rival comparisons, claim ledgers, extended measurement caveats. Never depth:
   chapter openings and closings, first definitions of DOT terms, the four
   claim levels, lived-experience and practical material, the Coda, the
   Glossary.
2. **Print** (`scripts/build_book_v48.py`) sets every passage inline.
3. **Digital** (`scripts/import_dot_book_v4.py`) turns each passage into a
   `::: depth Label` … `:::` container. The reader
   (`attention-os/reader/remarkDepthPassages.js`, `DepthPassage.tsx`) folds it
   into a native `<details>` that is **closed by default**, states what the
   passage covers and its reading time, and offers the Complete Edition.
   The text stays in the page for search, assistive technology, and
   script-free readers; the static materializer uses the same plugin.
4. Release manifests report both core and complete reading time per section.
5. Building an edition never publishes it. A new digital release is cut only
   after the author approves the edition's redline.

## Enforcement

- `build_book_v48.py` refuses manifest drift, unpaired or overlapping depth
  ranges, ranges inside tables or across chapter headings, and any change to
  body text beyond the approved line-edit manifest; it preserves all native
  equations, fields, citations, and bookmarks.
- `import_dot_book_v4.py` refuses unpaired bookmarks, unconverted markup,
  unbalanced containers, and any loss of the 24 display equations or 51
  references.
- `remarkDepthPassages.test.ts`, `BookMarkdown.test.tsx`, and
  `materialize-public-routes.test.ts` require closed-by-default disclosures,
  no visible markers, and the passage text present in the page.

## Consequences

- The digital edition reads at ~33k core words (about 2.5 hours) with the
  full 44k one tap away; print and digital can no longer drift.
- The author must keep the bookmarks intact when editing in Word. Deleting a
  paragraph that holds a depth bookmark breaks the pair; both scripts fail
  loudly rather than publishing a wrong layer.
- Choosing what is "depth" is an editorial judgement. The first pass was
  proposed by an editor and reviewed; the author can move or remove any range
  in the JSON without touching prose.
- Revisit if readers report that folded passages hide something they needed
  to follow a later chapter, or if the Complete Edition gains material that
  does not belong in the digital text at all.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| One manuscript, depth folded in digital | No drift; full text available; calm by default | Requires bookmarks to survive Word editing | **Chosen** |
| Separate abridged digital text | Shortest digital read | Two texts to maintain; digital falls behind; cuts are invisible to readers | Rejected |
| Same full text in both, no layering | Simplest | Digital stays as dense as the specialist edition; fails "for everyone" | Rejected |

## Amendment, 2026-10-28: formal detail is optional in the digital edition

The author: "This book is not about formalizing." Not every equation has the
author's approval yet, so the free digital edition must not lead with them.

- Every equation in the main text is now folded too, not only those marked as
  depth passages. Each folds into a closed **Formal note**, labelled with its
  equation number. The fold takes along the sentence that introduces the
  equation (one ending in a colon) and the paragraphs that explain its
  symbols (those that open with a symbol or a notation cue, or that cite an
  equation by number). A paragraph that only names notation folds on its own.
- Prose that merely mentions a symbol stays in the reading line, so the
  argument is never hidden.
- Only the few equations that show a key relationship stay in the reading
  line, with the sentences that explain them: `ESSENTIAL_EQUATIONS` in
  `remarkDepthPassages.js`, currently 2.5, 5.7, 5.8, and 6.1. The author
  decides this list; changing it touches no prose.
- This is a rendering choice, so released text is unchanged (ADR-0018). The
  Complete Edition still prints everything inline. The static page text uses
  the same plugin, so readers without JavaScript see the same folds.

Serves L1 (a calm, accessible reading line) and L7 (nothing is removed; every
formal note opens on request). Violates none.
