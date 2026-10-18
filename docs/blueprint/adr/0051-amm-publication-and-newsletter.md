# ADR-0051: AMM as a distinct publication and newsletter

- **Status:** Accepted
- **Date:** 2026-10-15
- **Deciders:** Founder, requesting AMM's own landing page, identity and complete newsletter
- **Extends:** ADR-0025, ADR-0040, ADR-0050 and the newsletter portion of proposed ADR-0039
- **Later amendment:** ADR-0052 replaces the pictures-only hero with the founder-requested transparent Host loop; other media remains still.

## Context

The American Millennial Manifesto has been an external series link inside the
personal blog. The founder wants an independent editorial identity within this
platform, examining domination, extraction and private power in American life.
The existing manuscript and immutable release system already supports letters,
artwork, sources and claims. The reader list has confirmation and unsubscribe,
but no edition delivery. The deployed API has no continuously running mail worker.

## Decision

Give AMM `/amm`, its own masthead and author-supplied illustration, a chronological
archive, a dedicated RSS channel, and a scoped signup. The landing expresses the
founder's stated premise and questions; it does not invent essays or evidence.
Existing external letters retain their original location and provenance. The
author selected The Anatomy of the Host as the introductory reading; its supplied
Markdown is prepared in the file-backed publication pipeline without rewriting
its prose. The larger PDF and Word files remain working manuscripts. The landing
uses their terms and a short attributed excerpt. The author’s supplied pictures replace the earlier poster covers. The landing
uses `host2.png`, the cow, Leech and mirror, preserving its supplied transparency; the
chapters use the Leech and labeled Host. Images sit directly on the page without
frames or dark panels. Responsive web encodings retain the complete artwork.
The source images are not repainted. The author chose pictures only; no motion-study player or video load. There is no government-source shelf; individual pieces
carry their own evidence and distinguish it from interpretation. An official
source does not settle a claim by virtue of its institutional status.
The separate in-development book remains a book, with no automatic manuscript
changes. Ordinary AMM reading requires no account.

Use the existing Markdown pipeline. The exact series name selects an edition
for AMM's archive. Studio offers that name and an AMM-specific template. The
native reader keeps its stable URL, sources and immutable version addresses.
Static entries, metadata, sitemap and RSS refresh through the existing build.
P2 BookMarkdown remains the reading primitive. AMM wraps public PageShell in a
publication shell: a flame mark, charcoal/paper/red tokens, publication navigation,
and its own footer. This identity follows file-backed essays, Studio releases,
the newsletter desk, and AMM unsubscribe. DOT remains a quiet lineage link; its
ambient field and duplicate floating control are hidden while AMM is mounted.
Shared reader preferences remain available. This is public editorial UI, not a
claim to have implemented the absent P1/P4/P5 primitives.

The landing opens with moral erosion, the supplied frameless
Host artwork, and one action into Chapter One. A named “Before you read” overview
then introduces conditioning, fear, self-protection, moral erosion, and
accountability. A keyboard-operable concept explorer shows one explanation and
question at a time. Three separate scrolling sections then examine status,
harm, and accountability, each with its related questions about conduct. The distinction
between conditioning, temperament, coercion, and responsibility remains
reader-opened. Overview copy uses the same named override registry as the owner
editor and static build. Static HTML includes every explanation.

The home retains the publication's original width, with bounded reading measures
and larger body type. The artwork opens the shared inspection primitive: readers can zoom, close
it, and return focus to their place. No media plays automatically. The open flame
mark has no surrounding tile; its initial kindling ends within four seconds.
Reduced motion, saved stillness, and a disabled environment keep it still.
Footer marks and the transparent favicon are static.

The manuscript path presents three chapters in reading order, with each chapter's
own artwork, followed by the latest letter. The finite archive and scoped email
signup live at `/amm/editions`. Previously shared chapter, archive, and signup
fragments redirect there without changing consent. Manuscript reading pages show
their contents, current position, and a next part without automatic advancement.
Owner editing stays separate from immutable published editions.

The power explainer is retained at `/amm/power` for development, with no incoming
public links and no search or sitemap inclusion. Earlier money and capital guide
routes redirect to `/amm`. The explainer's shared primitives, named copy fields,
and static rendering remain available for further author revision. Figures
organize AMM's argument rather than certify empirical claims; amounts require
sources, methods, and limitations.

The personal Blog uses the same Host illustration and AMM mark alongside Book
One, then a chronological image-led archive with finite pages. About presents
4Us, Sullix, and the supplied career through shared editorial primitives. Open
surfaces retain theme tokens without enclosing artwork in panels. These changes
serve L1, L2, L3, L7, L9, and L10: deliberate reading, clear completion, recoverable
editing, local media, and focused navigation. No manifesto law is violated.

Subscriptions are unique by address fingerprint and publication (`all` or `amm`).
Existing rows retain `all`; no existing reader acquires AMM consent by migration.
AMM signup optionally includes other writing with an unchecked control. The OTP
purpose binds the exact selection. Confirmation cannot be replayed to widen it.
Emails provide leave-AMM and leave-all links, plus an RFC 8058 POST endpoint.
Human links retain fragment tokens; one-click provider URLs necessarily carry a
limited unsubscribe capability. Hosting/request-log access must be restricted.
All subscription addresses remain sealed, with no membership relationship.

`/studio/newsletter` is an owner-only desk: write, publish, preview email, approve
and send. A campaign references one exact public Academy release via a foreign
key. Preparing checks publisher authority, public status, series and content
hash. Its envelope contains only released content and sender settings. Approval
freezes both envelope and recipient identities transactionally. Publication
alone sends nothing. A correction can be explicitly mailed as a new version.

Delivery uses durable recipient records and bounded batches under signed owner
authority. The owner keeps the desk open while sending, can pause or cancel, and
can resume saved pending work. The current batch may finish after page closure.
This is an explicit initial operational limit, not a background-worker guarantee.
Each attempt rechecks consent, suppression, withdrawal and cancellation. Atomic
claims and unique campaign/subscription records prevent concurrent duplicate
dispatch. Provider idempotency is additional protection. Unknown outcomes are
held permanently for manual review; only definite rejections can be explicitly
prepared for retry. No claim of exactly-once SMTP delivery or inbox placement.
The domain logic can be moved behind a durable worker without changing consent,
approval or recipient identity. No scheduler is activated in this increment.

Use the existing Resend processor for individual delivery. Require configured
sender/footer, reply address, HTTPS links, webhook secret, verified domain with
both tracking settings disabled, and an explicit operator enable flag. Missing
setup leaves previews and web publication usable. Render bounded HTML/plain text
with no raw HTML or remote images, and include one-click leave headers. Signed,
timestamp-checked operational callbacks are deduplicated. Bounces, complaints
and suppression stop later newsletter mail; they do not disable sign-in codes.
Provider acceptance and delivery are distinct states. No real edition or test
email is sent by the implementation task.
Outgoing editions carry a publication tag. Account-wide callbacks for unrelated
sign-in or contact mail are acknowledged without retaining their payloads; an
AMM receipt that precedes its send-response record still asks the provider to retry.
Email identifies the publication as its sender display name while keeping the
existing verified sender address. It carries the full released text and the
publication's typographic identity without loading a remote logo or tracking pixel.

## Consequences and validation

This adds a migration, mail setup and owner delivery operations. Recipient rows
retain operational evidence to prevent duplicate sending. The subscriber list
is never transferred to LinkedIn/Substack. A Studio-released email edition and
production sender configuration are needed before a real newsletter can launch.
Static-file AMM posts enter the archive/RSS; emailing requires deliberately
importing and releasing them through Studio, preserving publication provenance.

Tests cover scope-bound confirmation, separate unsubscribe, public-only release
selection, permission denial, exact preview approval, frozen audiences, consent
rechecks, cancellation, uncertain delivery, signed callbacks and suppression.
Browser checks cover mobile layout, empty/error archives and explicit sending.
`make verify` remains the release gate. Sender authentication and a real received
message require an operational check after setup and explicit send approval.

Serves L1/L2/L3 (predictable, finite publication), L4/L12 (chosen subscriptions),
L7 (leave and portable Markdown), L9 (sealed contacts and untracked delivery),
and L10 (separate writing, reading and sending). Violates none.


## Existing manuscripts, revisions and inspectable figures

The author requested self-contained copies of two published chapters and two
letters, and direct website editing. These and the supplied introduction form
an explicit managed manuscript library. The initial Markdown files retain the
published source wording and local media. Studio adoption reuses a work with the
same canonical slug, imports only when none exists, and never auto-releases.
The first native release takes over the file-backed reading URL. Public archives,
RSS and static pages deduplicate by that explicit library; unrelated matching
slugs are not adopted. Latest-release selection precedes withdrawal filtering,
preventing an older version from silently resurfacing. Managed readers fail
closed on API errors rather than substituting outdated source text.

Chapter One's proposed framing is a separate private editing action with guards
against replacing already changed passages. The original remains an earlier
published edition until the author approves a replacement. This serves L1, L3
and L7: intentional revision, stable reading addresses and preserved history.

The reader primitive now accepts bounded `evidence-chart` data in Markdown.
Figures are local, reader-controlled, source-attributed and explicitly unverified
where verification is pending. No percentages are invented for the erosion art;
it is labeled as a visual metaphor. The same data becomes a table in static HTML,
RSS and email. Server release validation rejects invalid scales and missing
provenance. This serves L2, L3 and L9 without trackers or engagement mechanics.

The figure supports optional observed, estimate and projection kinds, validated
by both the editor and the release boundary. Projections use hatching and a
dashed outline on the same zero-based scale. Sources and limitations remain
visible, with the complete data available as a table. The AI letter's two energy
values match the cited report; matching a citation does not independently
validate its forecast or establish the manuscript's account of power.

AMM signup requires an advertised publication capability from the API to avoid
consent drift during frontend/backend rolling deployment. Postal placeholders
are preview text only; real sending remains disabled without complete setup.

## Contextual owner editing

Each AMM reading page offers its signed-in owner a direct editing entry. Original
file manuscripts open through the existing private import path; adopted manuscripts
open their latest private revision. Published versions remain immutable. The AMM
desk lists the public page editor, introduction, both chapters and letters explicitly.

Landing, archive and signup copy use ADR-0021’s plain-text overrides, with stable named fields grouped
by section at `/studio/pages/amm`. Routing, layout, consent rules and publication
identity are not arbitrary editable JSON. Draft loading fails visibly before
editing is possible. Writes from this editor check the prior update timestamp;
a stale tab cannot overwrite or publish a newer edit. A failed save retains its
text. Drafts and publication remain separate actions. Both the live page and the
static build resolve the same field registry; static search previews refresh on
the next build. The editor states this boundary. Private calls use the signed
session in development too. Server-side steward authority remains mandatory.

Controls compose the existing DotButton with AMM variants and a reusable labeled
field. Styles live in dedicated CSS files, preserving shared appearance and touch targets.
Chapter and edition artwork and copy share one native reading link and keyboard
stop. A shared finite-choice control supports pointer, arrow-key and Home/End
navigation. Interaction feedback follows hover, focus and press; movement respects
both system reduced motion and the reader's saved stillness preference. These
controls preserve deliberate navigation and finite reading (L1, L2 and L3).
This serves L1 (explicit actions), L7 (private drafts and recoverable failures),
L9 (no remote embeds) and L12 (complete the publishing task), violating none.

## Amendment — 2026-10-17: A flame through the reading

The founder requested the AMM flame in place of the scrolling sections' plain
vertical rule, and more imagery. The shared ScrollStory accepts an optional
decorative marker beside each step label; its default rule remains available to
other explainers. AMM composes that slot with its existing vector mark. The
current step burns in color, with a single brief response when the reader reaches
it. Other steps recede. System reduced motion, saved stillness and environment-off
disable that response. Native scrolling, reading order and `aria-current` remain
the source of position; no additional menu or automatic advancement is introduced.

The pinned scene follows the concept: the Host's reflection, pressure at home,
the anatomy of power, and erosion. Each concern also carries the corresponding
scene. These are existing authored visual metaphors; the original `host.png` is
served as responsive WebP derivatives. A shared media map drives the live page
and static rendering. Only one scene is visible at a time, its dimensions stay
stable, and the overview's full-size inspection remains available.

Serves L1 (predictable response), L2 (finite reading), L9 (local images), and L10
(one concept and scene at a time). No manifesto law is violated.

The home now presents the central argument, its concepts and the reader's
questions only. A single closing `Read the manifesto.` action opens the existing
manuscript at `/amm/editions#amm-chapters`; chapter previews and the latest-letter
card live on that publication page. The central claim is a plain-text field in
the existing owner editor and is included in static HTML. The flame-guided
reading, native scrolling and existing bookmarks are preserved. This serves
L2 (a clear ending), L3 (deliberate reading) and L10 (one focus), violating none.

## Release refinement — economic conditions and everyday conduct

The home now opens with “An extractive economy. The culture that sustains it.”
The founder clarified that its purpose is a pragmatic diagnosis of the economic
environment, cultural assumptions, and everyday conduct. Landing copy describes
those relationships without giving personal advice, assuming the reader's
emotional state, or asking them to join a movement. The promise of getting ahead
is explicitly quoted as an object of analysis. Six finite concepts pair a
cultural message with an exact, attributed sentence from the existing chapters.
The illustration stays pinned while the reader scrolls; on phones it is bounded
to leave room for the text. Reading remains native and has no automatic advance.

The overview introduction gives its economic claim the main visual emphasis,
with a quieter section label and a bounded explanatory measure. Its attributed
quotation sits beside the argument on wide screens and follows it on phones.
The introduction grows with its content instead of filling a viewport. A native
chapter link makes its source inspectable; changing the cited chapter through
the owner editor updates that destination in both React and static HTML.
The founder requested the existing AMM flame in place of this quotation's
vertical rule. The mark stays still and decorative, and wraps above the quote
when large text needs its full width. The excerpt uses its complete first
sentence, leaving the chapter's internal cross-reference in the linked source.
The opening presents AMM as a diagnosis of the economic environment, with a
direct critical voice and a consistent flame identity. 4Us remains the economic
initiative it sponsors; newsletter consent remains a subscription to writing.

The page identifies Digital Organism Theory as its theoretical framework,
presents the three published chapters with reading times, and names its
sponsorship of 4Us.
The 4Us section describes the sponsored initiative and its development stage
without a recruitment request. The masthead and footer provide explicit paths
back to DOT. The archive and subscription retain their own address and existing
bookmarks. No manuscript
prose is rewritten, and no fourth chapter or delivery schedule is invented.

Opening copy, chapter introductions, quotations, and lineage text share the
existing owner-editor registry and static rendering. The opening paragraph is
named in the editor's initially open section without changing its saved key.
The reading action appears immediately. Optional entry effects reveal keyboard
destinations on focus and honor system reduced motion and saved stillness.

This serves L1 (predictable presentation), L2/L3 (finite, reader-directed
reading), L7 (recoverable editing and visible keyboard destinations), and L10/L12
(a clear reading action that serves the reader's intention). The public hero
retains only the motion exception already recorded in ADR-0052. No other law is
violated.
