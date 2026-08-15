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

```bash
cd backend/orchestrator
../../.venv/bin/alembic upgrade head
```

The first migration creates durable run tables and Publication Studio MVP tables.

## Book One digital edition commerce

The complete web reader remains public. The downloadable PDF is a $20 one-time purchase
delivered only to an authenticated member with an active entitlement.

Configure:

```bash
ORCHESTRATOR_STRIPE_SECRET_KEY=...
ORCHESTRATOR_STRIPE_WEBHOOK_SECRET=...
ORCHESTRATOR_BOOK_ONE_PDF_PATH=/app/private/books/digital-organism-theory-book-one.pdf
```

The production image includes the protected PDF at the default path. Stripe must send
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, and
`charge.refunded` to `POST /v1/support/webhook`. That endpoint verifies the Stripe
signature before dispatching support events or commerce entitlement events. A checkout
return URL is never proof of payment.
