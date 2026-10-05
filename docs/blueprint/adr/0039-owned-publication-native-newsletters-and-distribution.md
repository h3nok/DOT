# ADR-0039: Owned publication, native newsletters, optional distribution

- **Status:** Proposed
- **Date:** 2026-10-05
- **Deciders:** Founder

## Context

The founder wants this website to be the publication platform: complete books,
essays, analysis, and newsletters, with LinkedIn/Substack used for discovery and
outreach. A page listing an external article does not fulfill that intention.
The Millennial Manifesto is a separate applied-DOT book project, not merely a
newsletter and not automatically a continuation of Book One.

The repo already has book/publication APIs, static essays with RSS/prerendering,
the Academy release kernel, and a sealed verified reader list. It lacks the owned
newsletter issue/campaign/distribution loop specified here. Production readiness
has not been established. A second CMS would duplicate editorial authority and
introduce a migration before native publishing is usable.

Accepted ADR-0030 separates books from living works. Accepted ADR-0025 rejects
handing the reader list to profiling platforms. Neither is superseded here.

## Decision

1. Make the native release the authoritative complete publication. Maintain
   immutable versions, provenance, owned URLs, matching HTML without JavaScript,
   RSS and portable artifacts. Keep existing book and essay links valid.
2. Extend the current orchestrator, workers and delivery pipeline. Keep books in
   `publication`, standalone writing in the Academy release contract, newsletter
   envelopes/campaigns in `readers`, and external-copy records in a bounded
   connector workflow. Do not create a second editorial content store.
3. Publish newsletter issues to the website independently of email. Reference
   exact released content; approve each send separately. Keep reader consent,
   preferences, unsubscribe and address ownership here under ADR-0025.
4. Adapt the current email transport for delivery only, after production privacy,
   unsubscribe, authentication and operational gates pass. No contact-list
   transfer, tracking pixels, rewritten links or engagement profiling.
5. Use reviewed manual distribution packages for LinkedIn/Substack initially.
   External API automation requires verified platform capability and permissions.
   Separate external subscriptions from the owned list; never silently sync them.
6. Model The Millennial Manifesto as a distinct applied-book project. Link its
   source letters and newsletter issues without automatically inserting them
   into a manuscript or changing Book One's canon.

The detailed contract and staged gates are in
[doc 16](../16-OWNED-PUBLICATION-PLATFORM.md). This extends the publication track
in docs 14/15 and the static-first bridge of proposed ADR-0033. Implementation
requires founder acceptance; no existing accepted decision is silently changed.

## Enforcement

Implementation must add schema constraints and scoped authorization for exactly
one valid release target; immutable issue/release manifests; delivery uniqueness
per campaign/subscription; public-projection tests excluding drafts; and tested
consent rechecks at dispatch. Provider payload tests reject pixels/tracking links,
callback tests enforce signatures/replay protection, and connector tests reject
subscriber-list transfer. Cross-platform outages cannot fail a native release.
Import parity, no-JS/browser reading, export/restore, and `make verify` are gates.
These checks are proposed requirements, not tests already implemented.

Serves L1, L2, L3, L4, L7, L9, L10 and L12; violates none. External profiling or
list transfers prohibited by ADR-0025 require a separate superseding decision.

## Consequences

- Readers can read the complete work without an external account; distribution
  channels can change without taking the publication record with them.
- Existing domain boundaries and the static publishing bridge remain usable.
- Newsletter delivery costs, sender reputation, suppression and recovery become
  our operational responsibility. Email providers still see delivery addresses.
- Owning a list does not provide Substack's discovery automatically. Manual
  cross-posting takes editorial time; unsupported automation is deliberately absent.
- Two release domains need a typed common delivery catalogue, not a merged schema.
- **Revisit if:** measured editorial burden justifies a CMS adapter, verified
  platform APIs permit useful automation, or a provider cannot meet the privacy
  and one-click-leave requirements. Do not abandon owned URLs/list portability.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| External-link directory | Quick to display | No complete owned publication; access depends on third parties | Rejected |
| Substack as the primary home/list | Managed publishing and discovery | Splits authority and conflicts with ADR-0025 for the owned list | Rejected |
| Ghost/WordPress as a second CMS | Mature editorial/newsletter tools | Competing stores, migration and privacy/identity integration burden | Deferred |
| Build new publishing/mail microservices | Independent components | Premature deployment and operational complexity | Rejected |
| Extend native releases, archive and delivery; reviewed outward distribution | Owned record; reuses existing stack; incremental | Must implement editorial UX and reliable delivery | Proposed |