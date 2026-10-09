# ADR-0043: Personal writing home for the independent builder launch

- **Status:** Accepted
- **Date:** 2026-10-09
- **Deciders:** Founder, through the request to prepare the career-change platform
  for the end of October, with building and inquiry given equal prominence

## Context

The About page now presents the founder's products, contract services, supplied
career, résumé, and project contact. The blog still describes all writing as
applied DOT, although the founder also wants to publish about software, AI, and
independent product building. He chose The Millennial Manifesto as a named series
within his personal blog, rather than the identity of the entire blog.

Native writing and optional external distribution already have an accepted
contract in ADR-0040. Newsletter campaign delivery remains a separate milestone;
the broader newsletter specification in ADR-0039/doc 16 is still proposed.

## Decision

Use `/blog` as the founder's personal writing home. Give practical building and
inquiry equal space in its introduction, with real destinations to the product
portfolio and Book One. Keep one finite chronological archive of actual public
releases, including the existing static essay bridge. Do not fabricate posts,
publication dates, classifications, or case studies to fill it.

Present The Millennial Manifesto as a distinct series within that page. Retain
the existing LinkedIn issue and clearly identify its external destination.
This presentation does not cancel the separate applied-book project, copy a
letter into either book, or create a second editorial source.

The blog is the durable web archive; a newsletter is an optional delivery and
editorial format for selected writing. RSS provides a working, account-free
way to follow native releases. The reader list retains its existing confirmation,
availability, consent, privacy, and one-click-leave behavior. Linking to it does
not activate email campaigns or silently subscribe existing readers to a new
series. LinkedIn remains a discovery and external publication channel.

Reuse the current Studio, immutable releases, full-text exports, canonical URLs,
and source-backed reader. No CMS migration or new service is needed for this
milestone. The public page contains reading and contact actions; authoring and
distribution controls remain private. Shared `blog.json` supplies visible
positioning, build-time HTML, page metadata, and the RSS description.

The founder subsequently requested a more visual, distinctive, lively page.
Use original code-native editorial illustrations for the masthead, the two
entry paths, and archive thumbnails, plus a torch-themed cover treatment for
the named series. These are decorative art, not scientific diagrams, product
screenshots, the supplied raster logo, or invented publication covers. Keep
the real series and its existing letter prominent while the native archive is
empty. Do not create fictional articles to populate the design.

Motion consists of a finite entrance of at most 1.3 seconds and small responses
to hover or keyboard focus. Honor both `prefers-reduced-motion` and the existing
Still appearance setting. Keep dark and high-contrast presentation legible.
SVG and CSS require no external image requests, new dependencies, continuous
animation loop, pointer tracking, or additional content metadata.

Use the existing P3 FocusNav for following and project contact. The archive
keeps ten-item pages, explicit navigation, keyboard focus on the writing after
paging, partial-failure recovery, and completion. No absent Attention OS
primitive is claimed. Introduce no trackers, public audience counts, pop-ups,
forced subscription, engagement ranking, or artificial publishing deadline.

Serves L1 (legible reading paths), L2/L3 (finite chronological writing),
L7 (honest publication and subscription status), L8 (useful work), L9 (owned
reader consent), L10 (one primary action within each navigation surface), and
L12 (reading or project contact by declared intent). Violates no manifesto law.

## October launch acceptance plan

These are dated preparation gates, not claims that production is already ready
or scheduled actions that authorize publication or email sends.

| Window | Work | Acceptance gate |
| --- | --- | --- |
| October 9–15 | Refine the personal blog and portfolio; verify mobile, keyboard, dark appearance, canonical HTML, RSS, résumé, and contact paths | Repository verification passes; inspect the actual reader and client journeys |
| October 16–22 | Prepare one founder-written product case study and one founder-written inquiry piece in Studio | Real examples, declared claim levels, accurate sources, reviewed web/print previews; no invented results or client endorsements |
| October 23–29 | Verify production author access, native release/storage delivery, backups, reader consent, mail configuration, and unsubscribe; prepare outward copies | A real release is readable without an account and matches its export; email delivery is enabled only after its separate operational and consent gates pass |
| October 30–31 | Review final public copy, links, contact receipt, résumé, first releases, and sharing packages | Founder approves the concrete release and launch; publishing, email, and external sharing remain separate explicit actions |

For the product case study, the editorial brief is: the real problem, the
people served, the founder's actual role, the architecture and trade-offs,
what was shipped, evidence of the result, and what remains incomplete. For the
inquiry piece: the question, direct experience, interpretation, relevant
sources, and what would change the author's view. These are writing briefs,
not ghostwritten essays or promised outcomes.

### First technical case study: Sullix

The founder selected **Sullix — AI and product architecture** as the first
technical case study. This is an unpublished editorial brief for the founder
to develop in Studio, not an article or a claim of production results.

- **Working title:** From workflow to AI-native product: the architecture behind
  Sullix.
- **Reader:** A founder or product lead considering an AI-enabled product, who
  needs to understand how Henok approaches both the system and its delivery.
- **Purpose:** Show a concrete problem, the founder's decisions and contribution,
  and the evidence behind the resulting behavior.
- **Suggested scope:** One actual construction or real-estate workflow, supported
  by a small architecture diagram and a real example. Estimating, contractor
  matching, or investment underwriting are candidates; select the example with
  the clearest evidence and permission to show it.

The supplied résumé identifies Henok as Co-Founder & Principal Engineer from
December 2025 onward. It describes contractor discovery, project execution,
payments, and compliance; agents FORGE, SCOUT, SENTINEL, LEDGER, and PROCURE;
the context-aware FARO assistant; and investment analysis. It also describes
React/TypeScript, tRPC/Express, PostgreSQL/Redis, model routing, and release
governance. Those are source material to confirm and narrow for this article,
not independent proof of customer adoption or production operation. The
portfolio currently supplies no public Sullix demo or repository link.

| Part | Questions for the founder | Evidence to prepare |
| --- | --- | --- |
| The problem | Who needed this workflow? What did they have to do before Sullix, and where did that process fail? | A real scenario with sensitive details removed; distinguish observed needs from assumptions |
| Responsibility and scope | What did you personally design or implement? What did collaborators contribute? What is shipped, in pilot, or still planned? | A precise account of role and current release status |
| One complete workflow | What information enters the product, which decisions occur, and what does the user receive or do next? | A permitted screenshot or walkthrough of an actual workflow |
| Architecture | Where do model calls, tools, persisted product state, and user decisions meet? Which actions require authorization? | A diagram checked against the real implementation; distinguish proposed elements |
| Trade-offs | Which two or three decisions mattered most? What alternatives did you consider, and what constraints changed the choice? | Specific examples from orchestration, context, model routing, data boundaries, or rollout |
| Reliability and limits | How are uncertain output, failed tools, retries, recovery, and consequential actions handled? What remains unresolved? | A redacted failure example, test, or trace that the founder is allowed to publish |
| Result | What behavior can you demonstrate today? What changed, and what evidence supports that conclusion? | Measured results only where available; otherwise clearly describe demonstrated behavior and remaining limits |
| Relevance to client work | What can a prospective client learn about your approach from these decisions? | A brief connection to the existing project inquiry, without promises of the same outcome |

Before release, verify every diagram and claim with the founder, confirm that
shared artifacts may be public, and remove customer data, credentials, and
private implementation details. Do not invent efficiency percentages, revenue,
adoption, benchmarks, endorsements, or a public product URL. A useful case study
can honestly describe what was built and tested when measured impact is not
available.

Publish the reviewed full piece through the native release path. Prepare a
short LinkedIn introduction pointing to that canonical release and an optional
reader email only after their respective release and delivery gates are met.
The brief does not authorize either external action. Give the first inquiry
piece the same editorial care and prominence; choosing Sullix does not turn
the blog into a technical-only publication.

Evaluate launch through meaningful conversations, useful inquiries, completed
reading, and publication reliability. Do not add public vanity metrics or
behavioral profiling to measure it.

## Consequences

The personal identity can carry client work and philosophical inquiry without
making every technical article a DOT claim. Readers can find the owned archive
even if a distribution platform changes. The series can develop its own voice
while sharing the same reading and publishing foundation.

An empty native archive remains honest. The existing book and external letter
provide real reading while the founder prepares new work. Owning the platform
still requires production checks and an editorial habit; a refreshed landing
page does not prove newsletter delivery or launch readiness.

Revisit if a real volume of published writing warrants topic/series metadata and
filtered archives, or if measured editorial burden justifies a CMS adapter.
Do not create those migrations merely to display empty categories.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| The Millennial Manifesto as the whole blog | Strong publication identity | Limits the personal career and practical building context | Rejected by founder |
| Separate sites for technical writing and inquiry | Strong topical separation | More maintenance, identities, and publishing paths before launch | Deferred |
| External newsletter platform as the primary home | Managed publication tools | Splits the owned record and introduces a migration | Deferred |
| Personal blog, named series, optional email and external copies | One owned home with clear reading and client paths | Requires real authored pieces and operational readiness | Accepted |
