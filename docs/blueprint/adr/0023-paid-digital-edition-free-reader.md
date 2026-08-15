# ADR-0023: Paid digital edition, free complete reader

- **Status:** Proposed
- **Date:** 2026-08-15
- **Deciders:** Founder

## Context

Book One has two distinct forms. The living web reader is the public canon and supports
citation previews, reading paths, concept trails, and grounded inquiry. The downloadable
PDF is a stable ownership artifact for offline study, annotation, and reference.

Serving the PDF from the frontend public directory makes its URL permanently public and
prevents authentication or purchase enforcement. Reusing the support ledger would also
violate ADR-0012: support purpose is accounting context and must never alter access.

The movement needs member-funded revenue without making funding a condition of reading or
coupling payment to ranking, placement, or what reaches a member.

## Decision

- Keep the complete living web reader public and free.
- Sell the Book One digital PDF as a one-time, authenticated purchase at a server-owned
  launch price of **USD $20.00**.
- Treat the purchase as commerce, not a donation. Commerce has its own purchase and
  entitlement records; support contributions never grant access.
- Create checkout only for an authenticated member. The client names the product, never
  the amount.
- Grant an entitlement only from a Stripe event whose signature verifies and whose
  provider-reported product, amount, currency, purchase id, and member id match the pending
  server record.
- Remove the PDF from all publicly served frontend assets. Deliver it only through an
  authenticated backend endpoint that checks an active entitlement on every request.
- Revoke the entitlement when the settled purchase is refunded.
- Keep purchase status private to the purchasing member. Do not publish buyer counts,
  sales totals, or ownership badges.

Enforcement:

- Database uniqueness permits at most one active entitlement per member and product.
- API tests require authentication for checkout and download, reject unentitled downloads,
  pin the server-owned price, and prove that unsigned or mismatched events cannot grant
  access.
- Frontend tests assert that no direct public PDF URL is rendered.
- The manifesto-law test continues to forbid public vanity counters and attention traps.

## Consequences

- (+) Book One remains fully readable regardless of ability to pay.
- (+) PDF ownership becomes a direct, transparent way to fund the movement.
- (+) Copying a frontend URL cannot bypass access control.
- (+) Stripe and the server, not the browser, establish payment fact.
- (-) Offline ownership now requires both membership and payment.
- (-) Refunds, entitlement repair, and customer support become operational responsibilities.
- (-) The backend must stream the PDF or later issue short-lived object-store URLs.
- **Revisit if:** authenticated purchase materially suppresses readership, support burden
  exceeds revenue, or a privacy-preserving gift flow is required.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep the PDF public and ask for optional support | Lowest friction | The ownership artifact does not fund itself; URLs cannot be revoked | Rejected |
| Put the complete reader behind payment | Stronger revenue gate | Makes funding a condition of reading and weakens the public canon | Rejected |
| Let support contributions unlock the PDF | Reuses existing checkout | Violates ADR-0012 and confuses donation with purchase | Rejected |
| Free complete reader plus paid authenticated PDF | Preserves access while funding ownership | Requires commerce and entitlement infrastructure | **Accepted for implementation; ADR remains Proposed until founder acceptance** |
