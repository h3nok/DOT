# ADR-0053: A public invitation to conversation

- **Status:** Accepted
- **Date:** 2026-10-23
- **Deciders:** Founder, requesting a public launch centered on sharing experience, community, and both conversation and optional financial support

## Context

The public book and writing, private contact, verified reader list, invitation
requests, and optional author contributions already exist. A new visitor needs
to understand how to participate without confusing these separate relationships.
There is no shared discussion space ready to open to the public.

## Decision

Add `/community` as a public invitation. Begin with the existing, attributed
Book One passage about cultural contrast, sourced from the blog's starting
point. Create no new first-person story, biography, or essay.

Make a private writing conversation with Henok the primary action. Explain
that this is where community begins today and that a shared discussion space
is not open. Name simple expectations for speaking from experience, respectful
disagreement, permission to share another person's story, and free departure.

Keep reader updates, invitation requests, and optional one-time contributions
as separate choices using their existing routes. Requesting an invitation is
not admission. Neither subscribing nor contributing grants membership. Free
reading and the complete PDF remain available without any of these actions.
Keep the financial ask on this deeper page, not on the homepage or shared
footer (ADR-0022). Surface the invitation as a quiet homepage alternative and
a shared footer link.

Use the existing P3 FocusNav and public page/design foundations. Provide the
same substantive text, attribution, links, metadata, and sitemap entry in the
build-time HTML (ADR-0033). No new backend, address store, discussion service,
Attention OS primitive, or external distribution is introduced.

Serves L1 (clear expectations), L2/L3 (finite, reader-directed paths), L7
(honest availability and separate reversible choices), L9 (private contact
and explicit subscription), L10 (one primary invitation), and L12 (declared
conversation intent). Violates no manifesto law.

## Consequences

Readers can move from the author's experience to a real human conversation.
The founder still handles those conversations individually. Opening a shared
member space remains subject to the existing member readiness and data-rights
gates; the invitation page does not claim those gates have passed.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Immediately open a discussion network | Shared conversation | Requires moderation, member readiness, and data-rights work | Deferred |
| Leave participation scattered across existing routes | No new page | Readers must infer the relationship between each action | Rejected |
| Public invitation using existing working paths | Clear, small, honest launch | Conversations remain individual initially | Accepted |
