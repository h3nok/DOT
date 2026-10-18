# ADR-0050: A Markdown publishing desk with private artwork

- **Status:** Accepted
- **Date:** 2026-10-14
- **Deciders:** Founder, requesting Markdown import, images, editing and publication together
- **Extends:** ADR-0040 and ADR-0046 Markdown post design

## Context

The file publishing workflow has a designed reader and image validation. Studio
has private revisions and immutable releases, but imports front matter as body
text and places editing, claim review and distribution on one long form. The
author needs a clear browser workflow for a manuscript and its artwork.

## Decision

Use the existing Academy standalone-work kernel. Studio presents four explicit
stages: Import, Edit, Preview, Publish. Markdown remains the manuscript. Import
reads optional YAML front matter; unknown fields and malformed data are reported
rather than silently dropped. Plain Markdown remains supported. The author
supplies every word and claim classification. Export provides portable Markdown.
An imported `draft: false` never approves a release.

Keep title, summary, presentation, image references and claim declarations in
one private revision. Save them in one database transaction, with a prior
revision check to prevent overwriting a newer edit and a request identity for
safe save retries. Incomplete claims may be saved privately but block release.
Publication approves an exact saved revision; retries of that revision return
its existing public release. Changes create a new revision and a new version.

Artwork is first-party PNG, JPEG or WebP. Validate image bytes, dimensions,
accessible descriptions and budgets server-side. Store private artwork behind
revision authority checks. A release copies only referenced images and its
optional banner into its immutable artifact set. Public media delivery resolves
a public release projection, never arbitrary object keys or draft references.
Remote image embeds are not fetched. Reader and Studio preview use the same
post presentation. Blog cards and public metadata use the released banner.

The private API uses the signed session, including development. Institutional
publishing authority is checked by the existing server policy, not inferred
from a client-provided owner header or a file's contents. No new CMS or service.
Existing file-backed posts and URLs remain supported; import is a deliberate
move into Studio and does not silently edit or republish a repository post.

Distribution remains an action after native publication. This work does not
send newsletters or publish to external accounts without the author's action.
The live reader and blog use the API release; static HTML, RSS and sitemap
refresh through the existing site build. The UI explains this boundary.

## Consequences

A revision gains immutable editor metadata; a migration is required. Draft
artwork stays in the existing object store. Storage writes precede the database
commit; failed transactions can leave unreachable private objects, never a
public draft. YAML parsing and image verification use maintained libraries;
Markdown image discovery uses a parser, including reference-style images.

Validation covers import/export fidelity, stale saves and retries, authority,
private/public media separation, image limits, failed release preparation,
version stability, keyboard use and mobile layout. Synthetic writing stays in
tests; no article is invented or published as part of development.

Serves L1 (explicit stages and outcomes), L2/L10 (finite, focused editing),
L7 (portable files and protected drafts), L9 (private assets and no external
image tracking), and L12 (finish the author's publishing task). Violates none.
