# Publishing a post

## Publish in Writing Studio

Open `/studio/writing` and sign in with the founder account. This is the browser
workflow for private manuscripts and images. You do not need a Git commit to
publish a Studio post.

1. **Import:** choose your `.md` file, or start a blank draft. Optional YAML
   front matter supplies title, summary, format, series and banner settings.
   Plain Markdown works too; an opening `# Title` becomes the title field.
   Malformed or unknown metadata produces an error without replacing your draft.
2. **Edit:** revise the text, title and summary. Add banner and inline images.
   Files are matched to their Markdown paths by filename; use distinct names.
   Choose **Use as banner**, add its description and optional caption. To place
   another image in the text, describe it and choose **Insert in text**.
   Existing `![description](path "caption")` and reference-style images work.
3. **Save private revision:** saves the manuscript, presentation, image files and
   claim notes together. Ctrl/Cmd+S does the same. Claim notes can remain
   incomplete while drafting. Save is explicit; typing alone is not a backup.
4. **Preview:** review the same post typography and image layout readers receive.
5. **Publish:** finish the material claim declarations, save, open Preview, then
   approve that exact saved revision. The complete piece appears in the blog
   and receives a stable `/writing/<work-id>/releases/<version>` address.

The four tabs show **Import → Edit → Preview → Publish**; private Save is always
available below the current step. The visible state distinguishes unsaved edits,
private revisions and published versions. A failed save retains your edits.
Retrying the same save or release does not duplicate it. If another tab saved a
newer revision, download your changes, then reopen the work and reconcile them.
The site warns before replacing unsaved text or leaving by a page link; browser
history navigation may not provide the same warning, so save before navigating.

A release never changes when you edit its draft. To correct a published post,
open it under **Your writing**, edit, save, preview and publish a new version.
To bring in a revised file, open the existing work first, then choose Import.
This replaces its private manuscript and settings, retaining attached images and
the publication address. Choose New writing before importing a separate post.
Previous version links keep their original text and artwork. Unused attached
images stay private. Remote image embeds are not supported. The image budgets
and composition guidance below apply to Studio too; at most 16 images can be
attached to one draft.

**Download .md** exports the current text, metadata and claim notes. Image bytes
are separate: download each attached image from its card, retaining its filename
and folder path. Reimport the Markdown and attach those images to restore a copy.
The exported `draft: true` is descriptive: importing `draft: false` never publishes.
Studio supports ordinary YAML, including quoted and multiline values, plus this
optional claim-note block (supply your own statements and classifications):

```yaml
claims:
  - statement: ""
    level: ""
    origin: author_originated
    source: ""
```

Levels are `Observation`, `Model`, `Hypothesis`, or `Speculation`. Sourced claims
need a valid HTTP(S) source URL. `no_external_source` is also available. Imported
`published`, `updated`, `levels` and `concepts` are preserved in the export;
actual public version dates come from release time. No date schedules a release.

After publication, separate distribution tools prepare complete copies with
public artwork URLs for Substack or Medium, or share a link on LinkedIn after
an explicit click. Publishing here sends no social post or email. The live blog
and reader update immediately; RSS, sitemap and static search/share metadata
refresh on the next successful site build (the existing scheduled workflow).
External caches can take longer.

Development uses the configured API, normally your local orchestrator through
the Vite proxy. Local posts are not production posts. Production needs migration
`0021_writing_draft_metadata` and the existing founder steward grant; deployment
runs both migration and provisioning before replacing the API. For a local
Workspace seeded only with the old `henok` development handle, run from
`backend/orchestrator` against your **local database**:

```bash
ACADEMY_STEWARD_EMAIL=nkenok@gmail.com ../../.venv/bin/python3 scripts/seed_academy_space.py
```

## Alternative: publish from the repository

Choose one source for each piece. Importing a repository post into Studio does
not update the original file-backed post; publishing both creates two posts.
Studio exports include nested claim notes and full YAML. The repository parser
below uses a narrower flat format, so a Studio export is not a drop-in repository
post without adapting its metadata.

The file is the source. One Markdown file supplies the reading page, blog entry,
RSS text, search description, and sharing metadata. Posts can be essays, case
studies, or letters; an optional series groups the work by name.

### 1. Create

From `frontend/`:

```bash
pnpm post:new my-post
```

This creates `src/content/essays/my-post.md` with `draft: true` and a folder
`src/content/essays/my-post/` for its images. Existing files are never overwritten.
The filename becomes the permanent address: `https://dotheory.org/essays/my-post`.
Keep that filename after publication so incoming links continue working.

### 2. Write and illustrate

Edit the front matter, then write ordinary Markdown below it:

```markdown
---
title: Your title
summary: A short, specific introduction to the piece.
published: 2026-10-14
format: essay
levels: [observation, model]
draft: true
cover: my-post/cover.webp
cover_alt: Describe the visible subject, rather than repeating the title.
cover_caption: Optional context and image credit.
# series: The American Millennial Manifesto
# updated: 2026-10-20
# concepts: [digital-organism]
---

Start with the piece itself. The page already displays its title and summary.

## First section

Your text, with [sources](https://example.com) where needed.

![An explanation of the diagram](my-post/diagram.png "Diagram caption and credit.")
```

Front matter uses one `key: value` per line, `[a, b]` lists, and `true`/`false`.
It does not accept multiline YAML values. Keep the title under 140 characters
and summary under 280. `format` accepts `essay`, `case-study`, or `letter`.
`series` is a label, not a second publication or an automatic external post.
`levels` declares the kinds of claims used: `observation`, `model`, `hypothesis`,
`speculation`. Choose the ones the actual piece uses; a case study does not need
DOT concepts. `concepts` is optional and links to existing concept-map entries.

The body supports headings, quotes, lists, source links, tables, fenced code,
math, and standard Markdown images (including reference-style images). Raw HTML
is skipped. Use `##` for sections; avoid repeating the page title as `#`.

#### Image design

- **One banner:** a photograph, illustration, or real product image that belongs
  to this piece. Recommended **1600 × 900**, WebP or JPEG. It appears above the
  reading column, in the archive, and in link-preview metadata. It is optional;
  text-only posts retain a complete layout and the site's writing share image.
- **Inline figures:** diagrams, screenshots, or photographs placed where the
  reader needs them. The optional quoted image title becomes a visible caption.
  Prefer an annotated detail over an unreadable full-screen screenshot.
- **Accessible text:** describe each image in its alt text; put context and
  credits in captions. Keep essential arguments in the body, not only in pixels.
- **Consistent composition:** give banners a clear subject and room around it.
  Keep important details near the center because archive thumbnails crop to 4:3.
  The reading page preserves the full image without cropping or text overlays.

Use lowercase filenames in this post's folder: `my-post/cover.webp`. PNG, JPEG,
and WebP are supported. Images must be under **750 KB each**, at most **6000 px**
on either side, and **4 MB total per post**. Banners must be at least **1200 px**
wide, with a landscape ratio from **1.5:1 to 2.2:1**. Export at the desired size
before adding it; this pipeline validates images but does not resize them.
Only explicitly referenced images are deployed. Content-hashed image URLs keep
revisions from displaying stale artwork. Remote image embeds are rejected;
link to an external source instead, or use a local image you have rights to.

Do not put unpublished media in `public/`: everything there is deployed.
**This repository is public. A committed draft or image is readable on GitHub,
even when `draft: true` keeps it off the website.** Keep private working material
outside the repository, or use the authenticated Writing Studio.

### 3. Preview and check

```bash
pnpm post:preview
pnpm post:check
```

The first command starts a localhost-only Vite server and opens
`/_preview/essays`. Choose a post to see the actual reading page, including drafts.
Refresh after editing. Check a narrow phone width, light/dark themes, figure
legibility, captions, links, and the ending. The preview lists all local posts;
`post:check` identifies which are drafts and which will be released.

The check catches malformed fields, claim levels, missing images, missing alt
text, broken concept references, and image budgets. Draft previews, their API,
and draft media are development-only and never emitted into the production build.

### 4. Release

Set `published` to the intended publication date and change `draft: true` to
`draft: false` only when the piece is ready. The date is a displayed date, **not
a scheduling switch**: a non-draft publishes on the next successful deployment.

```bash
pnpm post:check
cd ..
make verify
```

Review the diff, then commit the Markdown and its referenced images. Pushing
`main` triggers the existing Pages deployment. After it succeeds, check the
public post, `/blog`, and `/feed.xml`. The build adds the post's static HTML,
canonical URL, Article metadata, share image, RSS entry, and sitemap entry.
An image or link preview already cached by another platform can take time to
refresh even after the site's deployment succeeds.

For corrections, edit the same file and add or update `updated: YYYY-MM-DD`.
Git records file revisions; file-backed posts do not have immutable version URLs.
To withdraw a post from the current website build, set `draft: true` and redeploy.
Previously distributed copies, public Git history, and external caches remain.

### 5. Share deliberately

Publish here first. Share the public link on LinkedIn or other channels. For
Substack or Medium, manually reuse the text and local images, and include a link
to the original. This file workflow does not automatically publish to external
accounts or send a reader-list email. RSS updates when the deployment succeeds.

The authenticated `/studio/writing` flow remains available for private revisions
and immutable releases with its own distribution controls. Choose one source
for a piece; publishing it through both paths creates two posts. The banner and
local-file commands described here apply to Markdown posts.
