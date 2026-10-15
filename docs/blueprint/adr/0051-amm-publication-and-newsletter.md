# ADR-0051: AMM as a distinct publication and newsletter

- **Status:** Accepted
- **Date:** 2026-10-15
- **Deciders:** Founder, requesting AMM's own landing page, identity and complete newsletter
- **Extends:** ADR-0025, ADR-0040, ADR-0050 and the newsletter portion of proposed ADR-0039

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
uses their terms and a short attributed excerpt. The supplied illustration keeps
its full framing and dimensions in a lighter web encoding, with a text description
and a full-size view. There is no government-source shelf; individual pieces
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

The landing's analytical spine follows the supplied introduction: conditions →
interpretation → conduct → feedback. Its connection to DOT's Experience Loop is
explicit and expandable. A keyboard-operable tab sequence reveals one mechanism
and a supporting manuscript passage at a time, without timers or automatic
advancement. The static HTML contains every explanation. The authored prose is
unchanged. The metaphor and process lens organize inquiry, rather than certifying
particular empirical claims. Numbers and institutional sources require methods,
context, and limitations.

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

AMM signup requires an advertised publication capability from the API to avoid
consent drift during frontend/backend rolling deployment. Postal placeholders
are preview text only; real sending remains disabled without complete setup.
