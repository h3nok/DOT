# ADR-0057: An illustrated version 5 from one reviewed manuscript

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** Founder (requested version 5, illustrated book and web presentation)
- **Extends:** ADR-0018 and ADR-0036

## Context

The public v4 and private v4.9 proof retain an editorial position that puts T/E
inside Big C. The author has confirmed Big C emerged within T × E, and that the
prerequisites are speculative extrapolation rather than direct experience.
The book also uses coupling for both functional connection and identification.
Its web conversion drops the opening illustration, and book figures lack the
responsive caption treatment that exists for posts.

## Decision

Build version 5 from the exact v4.9 Word source through a recorded edit manifest.
Correct the ontology, claim levels, notation, and terminology together, retaining
native equations, source references, links, and paired depth bookmarks. Preserve
the prior manuscripts and immutable releases. The author’s confirmed decisions
apply directly; they are not pending questions to be asked again.

Eight numbered teaching illustrations use shared SVG masters, print renderings,
and readable narrow-screen compositions. Their metadata includes caption,
alternative description, claim level, and dimensions. Mark their locations in
the Word manuscript, then derive their position and numbering in the PDF and
web book from that same document. Begin with embodied experience and introduce
the speculative origin later; the conceptual emergence order remains explicit.
The architecture and cover place RF₀ and Little c within Big C, with Little c
outside RF₀ and receiving its Reality Stream, as clarified by the author on
2026-10-31. Dedicated Chapter 4 figures explain that stream and Little c's scope
of access and action. The drawings show model relationships, not physical locations.

The Word manuscript, PDF, redline, and validation record are review artifacts
under `v5-working/`. Web proof assets live in ignored
`frontend/.book-v5-preview/`, served only by a development middleware. Its route
is absent from production builds. A proof build never rewrites public v4, the
backend PDF, the concept map, or the retrieval corpus. Publication remains a
separate release operation following review of the concrete version 5 proof.

## Amendment, 2026-11-01: precise embodiment and a sealed release candidate

The author clarified that the Avatar embodies Little c in RF₀, an experience
laboratory for Little cs. Little c remains within Big C and outside RF₀,
receiving the Frame's Reality Stream. Apply this distinction to the manuscript,
cover, illustrations, homepage, film, and derived concept summaries. Canvas
names the capacity to carry and update state; Painting names its accumulated
organization. Functional coupling remains when identification changes.

The editorial pass covers all 2,055 source paragraphs and two inserted passages.
Its 107 additional precision edits are recorded in `v5-precision-review.json`
and the consolidated edit manifest, while protected equations, references,
links, and bookmarks remain intact. This is an internal editorial and theory
consistency review, not independent scientific validation.

`build_book_v5.py --release --render` prepares a final-labelled candidate with
the same typography and illustrations as the proof. Short closing sections stay
together to avoid nearly empty final pages. The tagged 6 × 9 inch PDF includes
figure descriptions, page labels, and illustration bookmarks. The web importer
stages the same manuscript and all eight responsive illustrations under `/tmp`.

`promote_book_v5.py` verifies the exact manuscript, PDF, redline, edit manifest,
and artwork hashes before sealing local v5 archive and public assets. A
different sealed edition cannot be overwritten. The backend PDF and canon
inputs use this same edition; canon ingestion restores figure captions and
descriptions from its manifest. Prior releases remain unchanged. Local sealing
does not deploy the website or ingest a production database. External
publication remains subject to the edition review in ADR-0036.

## Publication authorization, 2026-11-01

After receiving the final PDF, Word manuscript, redline, and remaining release
concerns, the founder instructed: “Go ahead.” This authorizes publication of
the prepared v5 edition and connection of the revised opening to the existing
website film surfaces. The approved artifacts are pinned by these SHA-256 hashes:

- PDF: `a3e4597e4826891da3964dc67e4a08f196fb1c32ea8cde23e3787bf86747be86`
- Redline: `a0b2f08094b09aa57d40cd99cc9164217c28c02398bad7100c4e85781db65108`

Deployment must retain the newer production changes and verify both the public
site and backend canon. A first-time reader comprehension check remains human
feedback to gather; software verification does not substitute for it.

## Consequences

The author can review one text in three forms, including the changed passages
and illustrations. The existing public edition remains reproducible. The figure
inventory prevents silent loss during conversion, and responsive compositions
avoid shrinking labels beyond comfortable reading size.

The review assets and live canon deliberately differ until publication. A final
release must switch the web/PDF pointers, derived concepts, and source-grounded
assistant together. Serves L1, L7, L8, and L10; violates no manifesto law.

## Alternatives considered

| Option | Assessment |
| ------ | ---------- |
| Edit the existing v4 release in place | Destroys provenance and is rejected by ADR-0018. |
| Edit Word, PDF, and web independently | Allows text and figure drift. |
| Insert film screenshots throughout | Small labels, transient captions, and dark frames do not suit every reading surface. |
| One manuscript with labelled static illustrations and local proofs | Chosen. |
