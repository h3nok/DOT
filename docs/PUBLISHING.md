# Publishing a post

## The American Millennial Manifesto

AMM's public home is `/amm`; its own feed is `/amm/feed.xml`. Open
`/studio/newsletter` for the owner publication desk, or choose **AMM newsletter**
in Writing Studio. The landing page contains the publication premise and links;
it does not contain invented editions.

AMM has its own mark, navigation, color system and reading shell, including
file-backed introductions and native Studio editions. Its analytical spine
follows **conditions → interpretation → conduct → feedback**, with passage links
into the introduction and an optional explanation of the connection to DOT.
Landing content lives in `frontend/src/content/amm.json`. The vector mark is
`frontend/public/amm/mark.svg`; regenerate the social card with
`node scripts/generate-amm-share.mjs <local-preview-origin>` from `frontend/`.

The opening piece, **The Anatomy of the Host**, remains the short introduction.
The AMM library also presents the two chapters and two letters supplied by the
author, with locally stored artwork. The linked LinkedIn versions (rather than
the different PDF text) are the initial chapter editions. Their publication dates
and original links are retained. Chapter One is explicitly an earlier edition
under revision, not a claim that its original framing is the author's final view.

In **AMM newsletter → Edit an existing manuscript**, open any of these five
pieces. Studio first opens an existing saved work by its permanent identifier.
Otherwise it imports the current public manuscript and exact image bytes into
an unsaved private draft. Save, preview, and approve a release as usual. A native
release takes over the existing `/essays/<slug>` reading address; the archive,
static HTML and feeds omit the superseded file copy. Immutable native version
links remain available. Withdrawing the latest release shows a withdrawal notice;
it never restores an older file edition or the previous native version. On API
failure a managed reader offers retry rather than silently presenting old text.

Chapter One has an **editorial revision** panel. Applying its proposed framing
changes two identified passages in the private draft only. It refuses to replace
already edited passages. The rest of the chapter and material claim declarations
still require author review before publication. The landing's revision notice
refers to the earlier source edition.

The erosion study is a reader-operated visual metaphor, not a measured trend or
forecast. The original illustration remains intact. 4Us links to the actual
movement at `https://sullix.com/venture`, described as in development.

### Editable figures

The four Chapter Two plots and the AI letter's electricity comparison are
`evidence-chart` fenced JSON blocks inside the Markdown. Change their numbers,
period, units, source links, status and limitations in Studio's manuscript editor;
preview uses the same accessible, interactive bars and full data table as the
public reader. Source numbers were transcribed from the author's published
figures and prose, **not independently verified**. Government and company figures
are attributed rather than endorsed; estimates and projections are distinguished.

Each figure requires a title, period, unit, status, limits, positive `maximum`,
and 2–24 `rows` with `label`, finite nonnegative `value`, `source` and HTTPS `url`.
The scale must contain every value and begins at zero. Native release validates
this server-side. Static HTML and RSS preserve a full table with sources and
limitations; email renders an untracked table and plain-text values. No external
chart service, data query, or executable expression is embedded.

```evidence-chart
{"title":"Your comparison","period":"State the period","unit":"State the unit","maximum":100,"status":"State verification status","limits":"Explain what this comparison cannot establish.","rows":[{"label":"First category","value":0,"source":"Name the source","url":"https://example.org/first"},{"label":"Second category","value":0,"source":"Name the source","url":"https://example.org/second"}]}
```

### New editions

1. Download the **AMM Markdown template**, write your edition, and import it in
   Writing Studio. Set `series: "The American Millennial Manifesto"` and
   `format: letter`. The **Write an AMM edition** link starts with these selected.
2. Add your images, source links and claim notes. Save privately, preview, and
   publish the complete edition. It appears in the AMM archive and general blog.
   Site builds refresh its static HTML and AMM RSS. Your original Markdown and
   released versions stay exportable through the existing writing workflow.
3. Return to the newsletter desk, choose the published edition and prepare its
   email preview. Email uses the exact released text; images stay in the linked
   web edition. Previewing sends nothing. Email length is bounded so the footer
   is not hidden by an oversized manuscript.
4. Review the subject, reply address, rendered email and audience. Explicitly
   approve the email. The audience is frozen at approval; later signups do not
   get an old edition accidentally. Each pending recipient is checked again
   before sending for unsubscribe or suppression.
5. Keep the desk open while sending. It processes bounded batches, with saved
   delivery records. **Pause after this batch**, close the page, or cancel the
   remainder. Reopen a mailing and **Resume remaining deliveries** to continue.
   Closing a tab cannot recall its current batch. Native publication is never
   rolled back because email fails.

Only readers who explicitly confirmed AMM are included. Other writing is an
unchecked signup option. Existing general readers were not migrated into AMM.
AMM signup is enabled only when the API advertises scoped publication support,
so a rolling deployment cannot accidentally subscribe someone to the general list.
The public flow is **Subscribe by email → confirm the emailed code → receive
future editions**. Confirmation does not automatically mail the existing archive.
Every mail includes leave-AMM and leave-all links. No subscriber list is sent
to LinkedIn or Substack; those platforms remain optional external distribution.

Provider **accepted** is distinct from **delivered to mail server**, and neither
promises a particular inbox folder. Definite rejections can be prepared for an
explicit retry. Uncertain or interrupted attempts are held for review in Resend
and never blindly retried. A signed callback updates operational delivery state;
bounces, complaints and provider suppression stop later newsletters to that
address. There are no open/click statistics.

### Sender setup before the first AMM email

Web publishing, signup and email previews do not activate newsletter delivery.
Set these runtime environment values through the existing deployment's Secret
Manager integration (the deployment preserves these optional names):

- `NEWSLETTER_POSTAL_ADDRESS`: the sender's public business/postal address.
- `NEWSLETTER_PUBLIC_API_URL`: the public HTTPS API origin.
- `NEWSLETTER_RESEND_DOMAIN_ID`: the verified Resend domain matching `EMAIL_FROM`.
- `NEWSLETTER_WEBHOOK_SECRET`: signing secret for `/v1/newsletters/webhook`.
- `NEWSLETTER_REPLY_TO`: monitored reply inbox; defaults to `henok@sullix.com`.
- `NEWSLETTER_ENABLED=true`: enable only after the sender setup is reviewed.

The existing `RESEND_API_KEY`, `EMAIL_FROM` and `JOIN_CONTACT_KEY` are reused.
The provider key needs permission to read that domain's configuration as well as
send. The desk checks verified domain status and requires **open tracking off**
and **click tracking off** before approval and each batch. Keep
`NEWSLETTER_SITE_URL` at its default `https://dotheory.org` in production.
Use a monitored sender with appropriate SPF/DKIM/DMARC configuration. Subscribe
the webhook to `email.delivered`, `email.bounced`, `email.complained`,
`email.suppressed`, and `email.failed`; no open/click events. Verify the webhook
and one-click unsubscribe endpoint in the deployed environment. Restrict ingress
log access: RFC 8058 provider links carry an unsubscribe capability in the URL;
human-facing links keep it in the browser fragment.

A ZIP code is not a complete sender address. Until the author supplies a public
mailing address, previews show an explicit placeholder and delivery stays disabled.
Never put the placeholder into production sender configuration.

No real mailing is created by setup. Publish the first email edition in Studio
and approve a test send explicitly before mailing readers.
Local tests use synthetic recipients and stubbed delivery. Apply migration 0022
before running the new reader and newsletter APIs locally.

Provider contracts checked October 15, 2026:
[idempotency window](https://resend.com/docs/dashboard/emails/idempotency-keys),
[domain/tracking status](https://resend.com/docs/api-reference/domains/get-domain),
[signed callbacks](https://resend.com/docs/webhooks/verify-webhooks-requests).

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
