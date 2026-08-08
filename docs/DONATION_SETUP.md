# Support Setup

DOT accepts voluntary support through a provider-hosted Stripe Checkout page.
The product calls these **contributions**, not charitable donations: no
tax-deductibility is promised.

## Product Contract

- Contributions are one-time in the first public release.
- Amounts and funding purposes are defined by the server.
- Stripe hosts payment entry and sends the receipt.
- Returning to DOT is not proof of payment.
- Only a webhook with a valid Stripe signature may settle the ledger.
- DOT stores the verified amount, purpose, status, provider reference, and a
  one-way hash of the receipt email. It does not store card details or plaintext
  receipt email.
- Contributions never alter access, visibility, or standing.

## Configuration

Set these values in the orchestrator environment:

```env
ORCHESTRATOR_STRIPE_SECRET_KEY=sk_live_...
ORCHESTRATOR_STRIPE_WEBHOOK_SECRET=whsec_...
ORCHESTRATOR_FRONTEND_URL=https://your-public-dot-domain.example
```

Both Stripe secrets are required. When either is missing,
`GET /v1/support/options` reports `available: false` and checkout remains
closed. Hosted Checkout does not require a Stripe key in the browser.

Apply migrations before starting the public service:

```bash
make migrate-orchestrator
```

## Stripe Webhook

Create a Stripe webhook endpoint for:

```text
https://your-api-domain.example/v1/support/webhook
```

The current ledger understands these event types:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

Copy that endpoint's signing secret into
`ORCHESTRATOR_STRIPE_WEBHOOK_SECRET`. Never commit live keys.

## Launch Check

1. Open the support surface and confirm the three funding purposes.
2. Complete a test Checkout Session through Stripe.
3. Confirm the return surface verifies the Session before thanking the
   supporter.
4. Confirm the signed webhook changes the contribution from `pending` to
   `succeeded`.
5. Replay the webhook and confirm totals do not change.
6. Refund the test payment and confirm the ledger becomes `refunded`.

Recurring support remains closed until subscription creation, cancellation,
renewal, and failed-payment recovery are implemented and tested end to end.
