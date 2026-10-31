# ADR-0056: An owner people desk, with money left at the provider

- **Status:** Accepted
- **Date:** 2026-10-30
- **Deciders:** Founder, asking to manage subscribers and users from the platform
- **Builds on:** ADR-0003, ADR-0012, ADR-0019, ADR-0024, ADR-0025, ADR-0044, ADR-0054

## Context

The platform collected readers, join requests, members, and invitations, but the
owner could only reach them through raw API reads. No screen showed them. A join
request could never be answered, a subscriber could not be removed, and the
`suspended` member status was neither set nor enforced.

Invitations also did not work. The server required an `invite_token` at sign-in,
while the frontend never sent one and nothing read the invitation link. In
production an invited person was told that membership is by invitation.

## Decision

Add `/studio/people`, one owner-only desk showing one finite list at a time:
subscribers, requests, members, invitations, and support.

- **One gate.** `auth.require_steward` is the single owner check. It replaces the
  separate checks in the contact, site-content, join, and reader routes.
- **Subscribers.** The owner may remove one. It behaves as the reader's own
  unsubscribe link does, and the reader may subscribe again.
- **Requests.** Inviting emails a single-use link. Declining sends nothing. Both
  delete the row, as ADR-0019's retention rule requires. If the email fails, the
  request stays and that attempt's invitation is revoked, so no working link
  exists that nobody received.
- **Members.** Addresses remain a blind index (ADR-0007), so the list holds names
  and join dates, and a member can be found only by an address the owner already
  knows. Sign-in times are not shown: when someone was last here is not the
  owner's to watch (L9).
- **Suspension.** It blocks sign-in and ends sessions already issued, through one
  check that runs before every route. It is reversible and deletes nothing. Public
  reading stays open. Owner accounts cannot be suspended.
- **Invitations.** `/invite#token` redeems a link. The token stays in the fragment
  so it never reaches the static host, and analytics does not load on that page
  because Plausible reports the URL. Tokens are stored only as hashes, so a link
  is shown once.
- **Support.** The desk shows the existing totals and links to Stripe. It adds no
  ledger of who gave (ADR-0012). Zelle and Cash App stay outside it (ADR-0054).
- **No paid subscriptions.** Support remains voluntary and one-time. Stripe event
  mappings for subscriptions, which no code path could produce, are removed.

Serves L1 (legible actions), L2/L3 (finite lists, no ranking), L5 (no counters or
badges in navigation), L7 (honest failure and reversible suspension), L9 (no
per-person activity, no address exposure), and L10 (one view at a time). Violates
no manifesto law. Uses `FormField` from `attention-os`; no new primitive is
claimed, and P1, P4, and P5 remain absent.

## Consequences

- The owner can answer people from the site instead of the API.
- Invited people can sign in for the first time.
- Each request from a signed-in ordinary member adds one primary-key read.
- A signed-in member still has no member-only surface. Studio is owner-only, so
  inviting someone grants an account and little else until one is built.
- Members cannot be deleted from the desk, because member rows own tenant data
  across many tables. Erasure needs its own design and must also serve L7.
- `join_requests.status` is now always `pending`; a later migration can drop it.
- Revisit if recurring support is wanted: that needs a superseding ADR, because
  ADR-0012 defers it and ADR-0054 commits to no membership. It should use Stripe's
  Customer Portal so that cancelling stays easy.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep using raw API reads | Nothing to build | Requests cannot be answered; suspension is not real | Rejected |
| Move to a hosted members platform | Billing and members included | Another collector; loses sealed addresses and the laws as architecture | Rejected |
| Store readable member addresses | Easier to identify members | Breaks ADR-0007 and widens a breach | Rejected |
| Owner desk over existing tables, Stripe for money | Small, no migration, keeps privacy posture | Unnamed members can only be found by a known address | **Accepted** |
