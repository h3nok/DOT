# ADR-0046: Markdown post design, local preview, and release-scoped media

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** Founder, requesting post design, banner images, and a Markdown publication pipeline
- **Extends:** ADR-0033 and ADR-0045; preserves ADR-0040's Studio workflow

## Context

Static essays already share a parser, reader, archive, and build-time metadata.
They have no banner contract or draft preview. The founder wants a repeatable
file-based workflow for essays, case studies, and letters without a second CMS.

## Decision

Keep one `.md` file per post and its stable `/essays/<slug>` address. Add optional
format, series, cover, alt text, and caption fields. Store images in a sibling
folder named for the slug. Parse Markdown image references with the same GFM
grammar as the reader; validate paths, dimensions, alt text, and byte budgets.
Emit only referenced media for released posts, using content-hashed URLs. Reject
remote image embeds and source paths escaping the essays folder. These checks
are build-time validation of trusted authored files, not a public upload service.

Use P2 BookMarkdown in a post variant, with a wider banner, narrow reading column,
simple section headings, figure captions, and a finite ending. Reuse the cover in
the chronological archive, static page, Article metadata, Open Graph, and RSS.
Posts without covers remain supported. New commands scaffold drafts, validate
the collection, and open a development-only preview in the real reading design.
The production build has neither preview routes nor preview endpoints.

This explicitly keeps the file path usable alongside Studio. A piece chooses
one editorial source. File revisions remain Git-backed, not immutable Academy
releases. External distribution remains an explicit action; reader-list emails
are not sent by this pipeline. A date does not schedule publication.

Serves L1 (consistent reading), L2 (clear endings), L3 (chronological archive),
L7 (explicit publication and honest draft boundaries), L9 (local media, no
tracking embeds), and L10 (one reading column). Violates no manifesto laws.

## Consequences

The author can preview the finished design before releasing any work. Draft
assets and unused images stay out of the deployment. Committing drafts still
makes them visible in the public repository; local preview is not private
storage. Images must be sized before adding them; no image CDN or processing
service is introduced. Revisit an authenticated upload or unified importer only
when the author needs to move this workflow into Studio.

## Alternatives considered

- Put all media in `public/`: simple, but deploys unused and draft images.
- Add a hosted CMS: another source and external dependency without a present need.
- Extend the existing file pipeline: chosen for portability and a small operational footprint.
