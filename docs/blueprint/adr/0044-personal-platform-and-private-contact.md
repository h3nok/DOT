# ADR-0044: Personal platform and private contact

- **Status:** Accepted
- **Date:** 2026-10-09
- **Deciders:** Founder, requesting a public personal platform with every contact purpose handled here; confirmed henok@sullix.com for all messages
- **Amends:** ADR-0041's email-client-only project inquiry

## Context

The portfolio, résumé, personal blog, and inquiry now share a site. A visitor
still needs an email application to start a project discussion. The homepage
also needs clear professional paths alongside the founder's personal inquiry.

## Decision

Identify the founder on the homepage and offer finite, colored destinations
for work, writing, and conversation. Keep the founder's supplied definition of
Love, source attribution, and boundaries between experience and hypothesis.
Do not invent a biography, case study, product results, or endorsements.
Generate original typographic share cards from the same author and blog records,
so personal links present work and writing rather than inheriting a book cover.

Add public `/contact` with six explicit purposes: project, collaboration,
writing, speaking, general, and privacy. Project timeline and budget are
optional. Collect no attachment, subscription, account, or visitor tracking.
Require permission to use the supplied details to respond. Keep direct email
visible during loading, outages, and normal operation. Static HTML includes
the real contact address and next steps when JavaScript is unavailable.

The orchestrator stores name, email, message, organization, timeline, and
budget in one sealed payload using the existing contact encryption key. Reply
text is sealed separately. Purpose, timestamps, status, and random submission
references are operational metadata. HMAC fingerprints compare retries without
keeping plaintext. Bind public intake to the configured founder tenant and
recipient; reject client-supplied recipients or ownership fields. Validate
server-side, limit public requests, and discard honeypot submissions.

A receipt means durable acceptance by the inbox. An owner email notice through
the existing Resend integration is attempted afterward; its failure does not
discard the inquiry. Do not send an automatic email to an unverified visitor.
Production availability requires encryption, configured contact, and real mail
configuration. Deployment runs migration 0020 before the new API is enabled.

Protect `/studio/inbox` with verified owner/admin authorization on the server.
An ordinary member's write scope is insufficient. The owner's signed-in member
ID and the founder's public tenant ID differ; inbox queries bind the trusted
configured tenant only after owner authorization. Postgres forces row-level
security; the query guard and explicit predicates cover local SQLite tests.

The private workspace provides explicit replies, archive/reopen, JSON download,
and confirmed permanent deletion. Reply retries retain their original provider
idempotency reference, including uncertain delivery. A lease prevents concurrent
attempts. Refuse retries beyond 23 hours because provider deduplication expires
after 24 hours. Say “accepted for email delivery,” not “delivered.” Keep replies
going to henok@sullix.com using the site's existing verified sending address.
Deleting removes database messages and replies; email mailbox copies remain a
separate obligation. Privacy copy describes this accurately, without a promised
retention period or response deadline.

Reuse P3 FocusNav and extend it with one-destination IntentCard. Add native
FormField and a narrow IntentionPicker with labeled radio choices. The latter
does not implement P4's full attention-budget contract. P1 and P5 remain absent.
Honor reduced motion, Still appearance, dark mode, contrast, keyboard operation,
and narrow screens. No counters, polling, badges, pop-ups, or ranked inbox.

Serves L1 (legible choices), L2/L3 (finite destinations and inbox pages), L7
(honest receipts, export and deletion), L9 (sealed private details and consent),
L10 (one action per destination), and L12 (declared visitor purpose). Violates
no manifesto law. Publishing remains subject to the repository verification
gate; external posts and newsletter campaigns require their separate actions.

## Consequences

- Visitors can make contact without an account or configured email application.
- Henok can handle the whole conversation in the owner workspace or by email.
- The existing mail provider and encryption key become contact dependencies.
- The site now holds conversation data; requests for copies and deletion must
  be handled through the inbox and any delivered mailbox copies.
- Revisit abuse controls if actual spam exceeds the rate limit and honeypot;
  revisit tenancy if the site becomes a multi-author public platform.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Email links only | Minimal storage | No native receipt or managed conversation | Retained as fallback |
| Third-party embedded intake | Quick setup | Another collector, weaker visual and privacy control | Rejected |
| Native sealed inbox in the existing orchestrator | Coherent interface, private ownership, real receipt | Storage and delivery obligations | Chosen |
