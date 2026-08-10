# ADR-0019: Free reading with a paid fixed edition

- **Status:** Proposed
- **Date:** 2026-08-08
- **Deciders:** Founder

## Context

Book One is a complete public web publication and a fixed v2 PDF. Readers need durable,
portable ownership without turning access to the work into a paywall. Contributions under
ADR-0012 are gifts, so presenting one as a book purchase would be misleading. ADR-0015 also
forbids revenue that changes what reaches a member or how it is ordered.

## Decision

The complete web edition remains readable without payment or an account. A separate,
server-priced product sells the immutable v2 PDF for a published fixed price. The server
owns the product identifier, release identifier, format, and amount; the client cannot
define any of them.

Stripe hosts checkout. On return, the orchestrator retrieves the Checkout Session directly
from Stripe and grants the PDF only when its payment state and product metadata match this
release. The session identifier acts as short-lived purchase evidence and must not be put in
analytics, logs, or shared caches. Book sales do not write to or impersonate the support
ledger, and this first implementation does not claim webhook-ledger settlement.

The page must state that online reading is complete and free. It may offer ownership, but
must not use urgency, scarcity, behavioral targeting, affiliate placement, or obstruct the
free reader.

## Consequences

- (+) Reading remains universally available while buyers receive a portable fixed copy.
- (+) Pricing and authorization are server-controlled and independently testable.
- (+) Revenue is for the author's artifact, not for passage, ordering, or attention.
- (+) Hosted checkout limits payment-data exposure in this system.
- (-) A buyer needs the Checkout return link to obtain the file again in this first version.
- (-) Refunds and durable purchase recovery require a future sales ledger and signed webhook
  workflow before they can be automated.
- **Revisit if:** another format is sold, durable libraries or redownloads are introduced, or
  fulfillment moves from direct Checkout Session verification to a sales ledger.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Paywall the web reader | Familiar commerce model | Violates free passage and reader trust | Rejected |
| Rebrand support checkout as a sale | Reuses existing UI and ledger | Misstates a contribution and lacks fulfillment semantics | Rejected |
| Client-defined price and artifact | Flexible experiments | Allows tampering and breaks release authority | Rejected |
| Free web edition plus server-owned fixed copy | Honest access and ownership | Requires separate fulfillment | **Accepted** |