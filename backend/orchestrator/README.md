# DOT FastAPI Orchestrator

This is the isolated service scaffold for the Knowledge & Publication OS. It owns new
publication, ingestion, AI, export/delete, and workflow APIs while the legacy Flask app
continues to serve the current prototype shell.

## Local setup

From the repo root:

```bash
make install-orchestrator
make orchestrator-services-up
make start-orchestrator
```

In another terminal:

```bash
make start-orchestrator-worker
```

Run tests:

```bash
make test-orchestrator
```

## Profile delivery smoke

The frontend profile route reads the latest published profile release manifest from the
orchestrator. For a local end-to-end smoke:

```bash
ORCHESTRATOR_POSTGRES_PORT=15432 \
ORCHESTRATOR_REDIS_PORT=16379 \
ORCHESTRATOR_MINIO_PORT=19000 \
ORCHESTRATOR_MINIO_CONSOLE_PORT=19001 \
make orchestrator-services-up

ORCHESTRATOR_DATABASE_URL=postgresql+asyncpg://dot:dot@localhost:15432/dot_orchestrator \
make migrate-orchestrator

ORCHESTRATOR_DATABASE_URL=postgresql+asyncpg://dot:dot@localhost:15432/dot_orchestrator \
make seed-profile-delivery

ORCHESTRATOR_DATABASE_URL=postgresql+asyncpg://dot:dot@localhost:15432/dot_orchestrator \
ORCHESTRATOR_REDIS_URL=redis://localhost:16379/0 \
ORCHESTRATOR_LOCAL_OBJECT_STORE_ROOT=.data/orchestrator-objects \
make start-orchestrator
```

Then open `http://127.0.0.1:5173/DOT/profile`. The delivery panel should show
`Release v1` and the seeded profile sections.

## Local auth scaffold

Private routes require `X-Owner-Id` while `ORCHESTRATOR_AUTH_MODE=local_header`.

Build the production image from the repository root so the released Book One
canon is included for the post-migration ingestion job:

```bash
docker build -f backend/orchestrator/Dockerfile -t dot-orchestrator .
```
This is a development adapter for the future gateway/session verifier. Do not expose
private production routes without replacing or constraining this adapter at the gateway.

The service shell now follows the existing `ai-platform` FastAPI pattern:

- structured JSON logs with request IDs and conservative private-content redaction;
- `/health`, `/healthz`, `/ready`, `/readyz`, and `/health/ready` aliases;
- production config validation that blocks local-header auth in staging/production;
- JWT auth mode for the future BFF/gateway boundary;
- consistent service-error primitives for domain code.

## Migrations

### Personal contact

`/v1/contact/status` reports whether native intake is configured. Set
`ORCHESTRATOR_CONTACT_EMAIL=henok@sullix.com` and
`ORCHESTRATOR_CONTACT_OWNER_ID=henok`, retain the existing `JOIN_CONTACT_KEY`,
`RESEND_API_KEY`, and verified `EMAIL_FROM`, then apply migration 0020.
Never put the mail or encryption keys in frontend configuration.

`POST /v1/contact/messages` accepts purpose-limited, validated details with an
`Idempotency-Key`. The private `/v1/contact/inbox` routes require an owner/admin
session, not an ordinary member. The frontend workspace is `/studio/inbox`.
Inbox acceptance and email acceptance are distinct; failed owner notices do
not discard inquiries. Reply retries reuse their original key and stop after
23 hours pending a provider delivery check. Archive retains data; confirmed
deletion removes the stored message and replies. Email mailbox copies remain
separate. See ADR-0044 for encryption, authorization, and privacy obligations.

```bash
cd backend/orchestrator
../../.venv/bin/alembic upgrade head
```

The first migration creates durable run tables and Publication Studio MVP tables.

## Writing and outward distribution

Studio at `/studio/writing` is the editor for new essays and letters. Save private
revisions, classify material claims, then approve a public release. The complete
release immediately appears in `/blog`; its immutable reader URL can be copied
to any channel. Scheduled Pages builds refresh the RSS and link-preview HTML
every 15 minutes. Do not create another Markdown essay as a new editorial source.

After release, the distribution panel copies complete formatted text, downloads
HTML/Markdown, and records external published links for that exact version.
Substack publication posts and Medium imports require review in their own editor.
Medium's import accepts the original URL and preserves the canonical source;
wait for the next Pages build before importing a newly released URL. Owned reader
addresses are never transferred or emailed by this workflow.

Optional automatic LinkedIn sharing publishes a **link post**, not a native
article or newsletter. To activate it:

1. Create a LinkedIn developer application for the author's publishing account.
   Enable **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect**.
   Register exactly
   `https://dot-orchestrator-api-dqkd5azinq-uc.a.run.app/v1/distribution/linkedin/callback`
   in its authorized redirect URLs.
2. Store the application's client ID, client secret, that redirect URI, and a
   dedicated Fernet key in Secret Manager under
   `ORCHESTRATOR_LINKEDIN_CLIENT_ID`, `ORCHESTRATOR_LINKEDIN_CLIENT_SECRET`,
   `ORCHESTRATOR_LINKEDIN_REDIRECT_URI`, and `ORCHESTRATOR_PUBLISHING_TOKEN_KEY`.
   Generate the key locally with the existing cryptography dependency:
   `python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'`.
   Give the existing runtime service account secret access. Keep these values
   out of source control, browser storage, frontend environment, and chat.
3. Deploy through CI, which includes all four optional secrets only when all
   exist. Sign in as the author, open Studio, select **Connect LinkedIn**, and
   approve `openid profile w_member_social`. The connection opens in a new tab
   so the manuscript remains in its original tab. Return to it to refresh status.
4. Select **Also share a link on LinkedIn** only for a piece the author wants to
   distribute. Native publication finishes before sharing. The released title,
   summary, and immutable URL are posted without generating new author prose.

Tokens are encrypted and scoped to the signed-in owner and actor. Disconnect
deletes the local credential; revoke the grant in LinkedIn as well to remove
provider permission. Expired grants must be reconnected. A confirmed rejection
can be retried explicitly. An uncertain result is never resent automatically:
check LinkedIn and record its published URL, or use the external editor after
confirming no post was created. Review recorded links yourself; they are not
independently verified. Changing the encryption key requires reconnecting accounts.

Capability references: [LinkedIn sharing](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin),
[Medium importing](https://help.medium.com/hc/en-us/articles/213480228-API-Importing),
[Substack API scope](https://substack.com/api-tos). See ADR-0040.

## Free Book One and voluntary author support

The complete web reader and downloadable PDF are free, with no account or payment
required (ADR-0035). The frontend serves a static PDF; the existing backend
download endpoint is also public. Missing artifacts return an explicit 503.
The catalog reports price zero and artifact availability independently of Stripe.
Book purchase checkout now returns 410 rather than collecting payment.

Optional one-time author support uses `/v1/support/checkout-sessions` with purpose
`author`, a preset tier or a bounded custom amount, and no member authentication.
Its existing card-contribution range is $2–$5,000; zero uses the free download.
Support never creates an entitlement or opens membership.

To enable support, configure:

```bash
ORCHESTRATOR_STRIPE_SECRET_KEY=...
ORCHESTRATOR_STRIPE_WEBHOOK_SECRET=...
ORCHESTRATOR_BOOK_ONE_PDF_PATH=/app/private/books/digital-organism-theory-book-one.pdf
```

The production image includes the backend PDF at the default path. Stripe must send
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, and
`charge.refunded` to `POST /v1/support/webhook`. That endpoint verifies the Stripe
signature before dispatching support events or historical commerce entitlement events.
Historical settlements and refunds are preserved, but never revoke free download
access. A checkout return URL is never proof of payment; the UI verifies it with
Stripe and surfaces verification failures. This serves L1/L7/L8/L9/L10 and violates none.
