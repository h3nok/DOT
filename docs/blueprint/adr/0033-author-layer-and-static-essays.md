# ADR-0033: The Author Layer — About, Static Essays, and Page Text Without JavaScript

- **Status:** Proposed
- **Date:** 2026-09-30
- **Deciders:** Founder (site shape chosen 2026-09-30: dotheory.org stays theory-led and gains an author layer)

## Context

dotheory.org is becoming the author's main public home. People who meet the work
elsewhere — a podcast, a talk, a shared chapter — then look for the person: who
writes this, what else they have written, how to hear again, and how to reach
them. The site answered none of those. It had no author page, no writing outside
Book One, no contact route, and no privacy statement, and its one quiet door
("Join the readers' list") opened the circle's invitation queue — the collapse
ADR-0025 exists to prevent.

Every page was also an empty `<div id="root">` to anything that does not run
JavaScript: most AI crawlers and assistants, several search engines, archival
tools, and readers who switch scripts off. Per-route metadata told them what a
page was called; none of them could read a sentence of it. For a body of work that
people increasingly find by asking an assistant, unreadable text is unfindable
work.

ADR-0030 makes the essay an Academy kind. The kernel's authoring path (Studio,
then a release) depends on production sign-in, which cannot send mail yet, and on
durable object storage, which production does not have. Waiting for both would
keep the author from publishing at all.

## Decision

1. **About (`/about`).** One record, `src/content/author.json`, is read by the page,
   the site colophon, `siteConfig`, and the build. The page is the Person that
   every work names in structured data (`/about#person`). Its account of where the
   work comes from is quoted from the released preface, not a second biography.
   Optional fields (email, credentials, photo) render only once filled.
2. **Essays (`/essays`, `/essays/:slug`) ship as static releases before the kernel
   is public.** One Markdown file per essay in `src/content/essays/`, with front
   matter the build validates: title, summary, date, and the claim levels the essay
   uses (required, per ADR-0030), plus the concepts it builds on. Files starting
   with `_` and essays marked `draft: true` never publish. Essays are read in the
   Reader primitive (P2) with Book One's concept definitions, and each one ends
   with what it builds on, a way to respond, and the way back — never "read next".
   They are not canon (doc 14 P5). Like `doctrineData.ts`, they stay importable
   into the kernel later (doc 15 Phase 2).
3. **An RSS feed (`/feed.xml`)** carries every essay whole: pulled by a reader's own
   software, reverse-chronological, with no tracking.
4. **A reader-list page (`/readers`) and a leave page (`/readers/leave#<token>`).**
   The colophon's reader-list link goes to the open door, never the circle's queue.
   The leave token rides in the URL fragment, which no server log or page counter
   receives, and leaving happens when the page opens (ADR-0025's single click).
5. **Privacy (`/privacy`)** states what the site handles, which outside services
   process what, and how to have data deleted. A feature that starts handling
   personal data changes this page in the same commit.
6. **Every public page carries its own text.** The build writes each page's text
   into `#root`. An inline script marks the document before first paint in any
   browser that runs scripts, which hides that copy, and the app replaces it on
   start. It is the same text a reader sees — never a different page for crawlers.
7. **One colophon** closes the home, Academy, open-seams, and author-layer pages:
   About · Essays · RSS (once an essay exists) · Reader list · Privacy. There is no
   funding ask (ADR-0022).
8. **The service worker reads released text from the network first.** Chapter and
   essay URLs are not content-hashed, so a cache-first copy outlives its text.

Serves L2 (lists and essays end), L3 (sought, not served), L4 (the feed is pulled),
L5 (nothing counted), L7 (leaving takes one click; data practices are stated), L9
(no new third party, and every existing one is named), and L10 (one quiet footer).

## Consequences

- (+) A visitor can find who writes, how to reach them, and how to hear again.
  Search engines can join the book, the essays, and the author into one entity.
- (+) Readers without JavaScript, and crawlers that do not render, get the full text
  of every chapter, concept, essay, and author page.
- (+) Publishing an essay is committing one Markdown file. The build refuses one
  that does not declare its claim levels.
- (−) Until the kernel imports them, essays exist outside the Academy's release
  model: no immutable versioned URL, and revisions are tracked only by git history
  and the `updated` field.
- (−) The copy for readers without JavaScript is faithful text in plain
  presentation: no concept sheets and no claim-level styling.
- (−) Contact goes through LinkedIn until `author.email` is set, and the domain
  cannot receive mail until it has MX records.
- (−) A committed draft is public in the repository even while the site withholds it.
- **Revisit if** the kernel's authoring path works in production (then essays
  move to kernel releases through an importer), or search engines treat the
  prerendered copy as a page distinct from the app.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Wait for the Academy kernel to publish essays | One release pipeline from the start | Blocked on production email and durable storage; the author cannot publish meanwhile | Rejected |
| Substack or Medium as the essay home | Built-in discovery network | Hands reader addresses to a profiling platform (ADR-0025) and splits the author's identity from the site | Rejected as the home; cross-posting with a canonical link stays open |
| Full server-side rendering with hydration | One DOM for every reader | Every surface (the organism field, motion, local preferences) would have to render on a server | Deferred |
| A `<noscript>` copy | Needs no script | Readability-style extractors drop `noscript` content | Rejected |
| Prerendered text left visible until the app starts | Text appears sooner | The text vanishes while the route loads, then returns | Rejected |
| Static essays with prerendered page text | Ships now; importable later | Essays exist outside the kernel until imported | **Accepted** |
