# ADR-0054: Confirmed direct author-support destinations

- **Status:** Accepted
- **Date:** 2026-10-23
- **Deciders:** Founder, preferring Zelle or direct Cash App support
- **Extends:** ADR-0012 and ADR-0035

## Context

Author support currently opens Stripe checkout. The founder prefers direct
support through Zelle or Cash App. These transfers cannot be verified by the
existing Stripe webhook and must not be treated as card-payment facts.

## Decision

Publish only founder-confirmed payment destinations in `content/support.json`:
an enrolled Zelle email or U.S. mobile number and recipient name, and/or an
HTTPS payment link on `cash.app`. Empty destinations remain unavailable. The
shared resolver rejects incomplete recipients and unsafe link destinations
in both the app and build-time HTML. No recipient is inferred from the public
contact address or the author's name.

When configured, direct support opens first. The reader chooses a method;
Zelle shows copyable recipient details and banking-app instructions, and
Cash App opens the confirmed external link on request. Keep card checkout as
an explicit secondary choice, with a return to direct methods. Existing
Stripe return URLs still use provider verification.

Do not load payment-app SDKs, embed bank screens, collect banking credentials,
or claim that copying/opening confirms payment. Direct transfers stay outside
the Stripe ledger and are confirmed in the original bank or payment app.
The existing voluntary, one-time, no-membership, free-reading, and 30-day
refund commitments remain. Terms and Privacy distinguish the payment paths.

Serves L1 (clear recipient and method), L7 (honest confirmation and refunds),
L9 (no payment credentials or provider SDKs), L10 (one selected method), and
L12 (voluntary author support). Violates no manifesto law. No new Attention
OS primitive is claimed.

## Consequences

Direct support works without an orchestrator and requires manual reconciliation
by the author. It does not provide automatic receipts or verified settlement
inside DOT. Changing a destination requires founder confirmation and a new
site build. A payment provider's own availability and account eligibility
remain outside the site's control.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Stripe only | Existing verified ledger | Does not express the founder's preference | Retained as secondary |
| Confirmed direct destinations | Small, static, no credentials | No automatic on-site confirmation | Accepted |
| Build a payment-app API and new ledger | Could automate reconciliation | Requires provider access and more private data | Deferred |
