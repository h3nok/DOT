# ADR-0012: A member-funded support plane

- Status: Accepted
- Date: 2026-08-05
- Amends: [ADR-0009](0009-retire-flask-single-twin-service.md) (which said donations would be removed)
- Builds on: [ADR-0001](0001-member-funded-invite-only.md), [ADR-0007](0007-tenant-key-encryption.md)

## Context

ADR-0001 committed the platform to member funding and ruled out advertising. The
Flask prototype had a donations module, and ADR-0009 proposed dropping it along
with the rest of Flask. That was wrong: removing the only funding mechanism from
a movement that has ruled out ads leaves it with no way to exist.

The prototype could not be ported as written. Its defects were structural, not
incidental:

1. Stripe webhook signature verification was commented out, so anyone could POST
   a forged `invoice.payment_succeeded` and flip a subscription to active.
2. The ledger recorded the amount the _client_ claimed it had paid, not the
   amount Stripe reported.
3. The secret key defaulted to a placeholder string in source.
4. Supporter emails were stored in plaintext, contradicting ADR-0007.
5. `create-payment-intent` accepted an unbounded, client-chosen amount, with no
   rate limit and a wildcard CORS policy.

Defects 1, 2 and 5 are the same defect wearing three hats: the server treated
the client as an authority on money.

## Decision

Support becomes a first-class plane in the orchestrator at `/v1/support`, built
on one rule: **the client may express intent; only Stripe and the server may
establish fact.**

- **Prices are server-owned.** `SUPPORT_TIERS` lives in the service. A request
  names a tier, not a price. A custom amount is permitted only inside a declared
  range, enforced both at the schema boundary and in `resolve_amount`.
- **The ledger has exactly one writer:** `POST /v1/support/webhook`, and it
  refuses any payload whose Stripe signature does not verify. If
  `STRIPE_WEBHOOK_SECRET` is unset the endpoint fails closed rather than
  falling through.
- **Amounts are read from the provider's event object** (`amount_received`),
  never from client-controlled metadata.
- **`provider_ref` is unique**, so replayed webhooks are inert rather than
  double-counting.
- **Email is stored as a SHA-256 blind index** (`email_hash`), matching the
  posture `Member.email_hash` already takes. Stripe receives the address because
  it must issue a receipt; the DOT database never does.
- **No placeholder credentials.** When `STRIPE_SECRET_KEY` is absent, support is
  simply not configured: `/v1/support/options` returns an empty publishable key
  and the UI hides the surface.
- **Only aggregates are public.** `/v1/support/totals` returns a supporter count
  and a sum. There is no endpoint that lists who gave, or that looks a supporter
  up by email — the prototype's `GET /donations/subscriptions/<email>` is not
  ported.

Support is deliberately public and therefore carries no tenant binding under
ADR-0011; it is the same explicit exception that public publication delivery
takes. Rate limits stand in for tenancy here.

## Consequences

- The movement keeps a funding path, and it is one that survives an attacker
  who can send arbitrary HTTP requests.
- ADR-0009's "donations are removed" consequence is void. What is removed is the
  Flask implementation.
- Contributions are anonymous by default. Linking a contribution to a member id
  is possible later through `member_id`, but only when a supporter signs in and
  claims it — never by matching plaintext email.
- `stripe` becomes a runtime dependency of the orchestrator. It is imported
  defensively so the service still boots without it.
- Recurring support currently records a cadence but leans on Stripe for the
  subscription lifecycle; DOT stores the resulting events, not the schedule.
