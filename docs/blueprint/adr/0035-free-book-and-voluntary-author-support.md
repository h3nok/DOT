# ADR-0035: Free Book One and voluntary author support

- **Status:** Proposed
- **Date:** 2026-10-01
- **Deciders:** Founder
- **Supersedes:** ADR-0023's Book One purchase and download gate
- **Builds on:** ADR-0012 and ADR-0022

## Context

The founder chose a free complete online book and a free PDF, without an account
or email requirement, with voluntary support kept separate. Calling the existing
mandatory $20 purchase a donation would not implement that decision.

The existing public support plane already supplies bounded custom amounts,
one-time provider-hosted checkout, verified returns, and signed webhook
settlement. It must not become an access-control mechanism.

## Decision

- Publish the complete Book One PDF beside its static reading units. Serve it
  from the frontend/CDN without a backend, account, email, or payment dependency.
  Keep the editable Word manuscript private.
- Generate the public PDF and backend delivery copy together from the canonical
  manuscript; require identical bytes in release tests.
- Make the existing backend PDF delivery endpoint public. Advertise a zero price
  and availability based on the artifact, not Stripe configuration.
- Retire Book One purchase checkout with HTTP 410. Preserve historical private
  purchase records, signed payment settlement, and refund handling; neither a
  purchase nor a refund affects public PDF access.
- Offer "Support the author" separately on the book's access page. Reuse the
  public support ledger with the accounting purpose `author`, independent
  writing and research. Do not grant membership, access, placement, or standing.
- Suggest a changeable, one-time $20 contribution. Apply the support plane's
  existing server-enforced card-contribution range (USD $2–$5,000). A reader
  choosing zero uses the free download, not a zero-dollar checkout.
- Keep the author contribution at its own `/support?purpose=author` address,
  with an obvious close action returning to the book. Return checkout to that
  address, verify the provider status, and surface verification failures rather
  than claiming success or encouraging a second payment.
- Call this support or a contribution, not a charitable or tax-deductible
  donation. Do not imply that contributions are accepted until checkout and
  receipts are configured.
- Keep the homepage theory-led: no funding ask beside its reading action, no
  pop-ups, nags, donor counts, or urgency.

Enforcement: frontend access and metadata tests require a direct free PDF link
and no public DOCX; release tests compare both PDFs and the manuscript checksum.
Backend tests require anonymous downloads with Stripe disabled, explicit missing
artifact errors, retired checkout for both visitors and members, and preserved
historical settlement/refunds. Support tests enforce exact minor-unit input,
separate accounting, and no success claim when confirmation fails.

## Consequences

This serves **L1, L7, L8, L9, and L10 and violates none**. Reading and keeping the
book are independent of ability to pay. The public release also remains usable
when the orchestrator or payment provider is unavailable.

The PDF is intentionally public and cannot be revoked through an entitlement.
Support income is voluntary rather than guaranteed sales revenue. Hosting and
payment fees remain real; deployment still requires a configured Stripe account
and signed webhook delivery before contributions can open.

Revisit if voluntary support cannot sustain the work, or the founder chooses a
different commercial artifact. Do not quietly reintroduce a paywall on this PDF.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Rename the paid PDF a donation | Little implementation work | Misrepresents compulsory payment | Rejected |
| Free reader, paid PDF | Predictable price | Keeps the account/payment gate the founder removed | Superseded |
| Zero-dollar checkout | One payment-shaped flow | Unnecessary provider and email dependency for free reading | Rejected |
| Free PDF and separate voluntary support | Honest access, low friction, existing payment infrastructure | Uncertain income; artifact cannot be revoked | Chosen by founder; formal ADR status remains Proposed |
