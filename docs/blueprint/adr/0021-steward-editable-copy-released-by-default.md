# ADR-0021: Steward-Editable Public Copy, Released By Default

- **Status:** Accepted
- **Date:** 2026-08-12
- **Deciders:** Founder
- **Amends:** ADR-0020 (public entry is release-controlled)

## Context

ADR-0020 made the public homepage release-controlled and explicitly refused to
hydrate it from the editable profile graph. That decision was correct about the
danger it named: a cached or server-published **draft** could silently replace
the released public proposition, leaving an old or half-written front door up.

But it resolved that danger by removing editing altogether, which has its own
cost. Every word on the public surfaces now requires a code change, a review, a
build, and a deploy. For prose that the author revises by feel — a sentence that
lands wrong, a paragraph that sounds louder than intended — that loop is long
enough that the wording stays wrong.

The two goals are not actually in conflict. ADR-0020's hazard was specifically
*drafts and stale caches reaching readers*, not *the author editing their own
words*.

## Decision

Public copy is compiled into the bundle as the released wording, and the
orchestrator stores only **published overrides** on top of it.

- Each block has a stable dotted key (`home.lede`) shared by the compiled-in
  default and its override, so the two are matched by meaning, not by position.
- A block carries a **draft** and a **published** value. The public read path
  (`GET /v1/site-content`, unauthenticated) returns published values only. A
  draft is visible to the steward alone.
- **Absence means released.** No row, no orchestrator, a failed request, or an
  empty database all resolve to the compiled-in wording. `fetchPublishedContent`
  never throws into a render; it returns `{}`.
- Clearing a block deletes the override rather than publishing an empty string,
  so "select all, delete" restores the released copy instead of blanking a
  public surface.
- Writes require the **steward** role specifically. A signed-in member cannot
  edit the public surfaces (`require_steward`, 403).
- Editing is opt-in per session. The steward is a reader by default; blocks
  become editable only after edit mode is deliberately turned on, and signing
  out drops it.

## Consequences

**Positive.** The author can fix a sentence in place, in context, without a
deploy. The public surfaces cannot go blank, because the failure direction is
always toward the released edition. ADR-0020's actual hazard is closed more
tightly than before: a draft has no path to a reader at all.

**Negative.** Public copy now has two sources — the bundle and the database —
and reading the source file no longer tells you with certainty what a visitor
sees. The drafts view (`GET /v1/site-content/drafts`) is the way to check.
Overrides are also not in git, so they are not code-reviewed and not covered by
the manifesto-law scan; a steward can publish copy that the linter would have
caught. That is an accepted trade for the shorter loop, and it is bounded by the
fact that only the steward can write.

**Revisit if** overrides start carrying structure rather than sentences (lists,
links, markup), or if more than one person gains write access. Either would mean
this has outgrown a copy-override table and wants the publication pipeline.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Leave copy in code (ADR-0020 as written) | Reviewed, versioned, lint-covered | A wrong sentence takes a deploy to fix | Rejected — the loop is the problem |
| Hydrate the page from the profile graph | Already built | Exactly the hazard ADR-0020 named: drafts and stale caches reach readers | Rejected |
| Full CMS for public surfaces | Structured, previewable | Far past the need; a new surface to secure and maintain | Rejected as premature |
| Published overrides on compiled-in defaults | Short loop, cannot blank a page, drafts stay private | Two sources of copy; overrides escape review | **Chosen** |
