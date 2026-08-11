# dotheory.org Launch Runbook

`dotheory.org` is the canonical public home of Digital Organism Theory.

## Production Shape

- `https://dotheory.org`: canonical GitHub Pages frontend.
- `https://www.dotheory.org`: DNS alias that redirects to the canonical apex.
- Cloud Run's generated HTTPS URL: initial orchestrator origin.
- `https://api.dotheory.org`: later orchestrator origin behind a Google Cloud
  global external Application Load Balancer.

Do not add wildcard DNS records. Do not expose model, Stripe, database, or
service-auth credentials through a `VITE_*` variable.

## 1. Secure The Accounts

1. Enable two-factor authentication on Squarespace, GitHub, Google Cloud, and
   Stripe.
2. Revoke any model API key that has appeared in source code or chat output.
3. Create a replacement `ORCHESTRATOR_TWIN_API_KEY` in Google Secret Manager.
4. Verify `dotheory.org` in the GitHub account's Pages domain settings. GitHub
   provides a `_github-pages-challenge-h3nok` TXT value for this step.

Never share account passwords. Complete sign-in and two-factor challenges in
the provider's own page.

## 2. Repair GitHub Pages

The `github-pages` environment currently rejects deployments from `main` before
the build starts.

In `h3nok/DOT`:

1. Open **Settings > Environments > github-pages**.
2. Under deployment branches, allow `main` or select all branches.
3. Open **Settings > Pages**.
4. Keep **GitHub Actions** as the publishing source.
5. Set the custom domain to `dotheory.org` before changing DNS.
6. Set the Actions variable `VITE_ORCHESTRATOR_URL` to the deployed Cloud Run
   service's generated `https://...run.app` URL.
7. After DNS and certificate provisioning complete, enable **Enforce HTTPS**.

The build emits `frontend/public/CNAME`, but account-level Pages configuration
is still required for an Actions-based deployment.

## 3. Add Squarespace DNS

Remove only conflicting Squarespace web-hosting records for `@` and `www`.
Preserve MX, SPF, DKIM, DMARC, verification, and unrelated TXT records.

| Type  | Host | Value                 |
| ----- | ---- | --------------------- |
| A     | @    | `185.199.108.153`     |
| A     | @    | `185.199.109.153`     |
| A     | @    | `185.199.110.153`     |
| A     | @    | `185.199.111.153`     |
| CNAME | www  | `h3nok.github.io`     |

IPv6 is optional. When enabled, add all four records:

| Type | Host | Value                  |
| ---- | ---- | ---------------------- |
| AAAA | @    | `2606:50c0:8000::153` |
| AAAA | @    | `2606:50c0:8001::153` |
| AAAA | @    | `2606:50c0:8002::153` |
| AAAA | @    | `2606:50c0:8003::153` |

Use a one-hour TTL during cutover when Squarespace permits it. DNS propagation
and managed HTTPS certificate issuance can take up to 24 hours.

## 4. Configure Cloud Run

Create these GitHub Actions variables:

```text
GCP_PROJECT_ID=<project-id>
GCP_REGION=us-central1
AR_REPO=dot-orchestrator
CLOUD_SQL_INSTANCE=dotheory-org:us-central1:dot-postgres
RUNTIME_SERVICE_ACCOUNT=dot-orchestrator-runtime@dotheory-org.iam.gserviceaccount.com
VITE_ORCHESTRATOR_URL=https://<cloud-run-service>.run.app
```

Create the Workload Identity Federation secrets documented in
`backend/orchestrator/.env.production.example`, then create every Secret Manager
secret referenced by `.github/workflows/ci.yml`. Important domain values are:

```text
ORCHESTRATOR_CORS_ORIGINS=["https://dotheory.org","https://www.dotheory.org"]
ORCHESTRATOR_FRONTEND_URL=https://dotheory.org
```

The first public release uses one scale-to-zero API instance, in-memory rate
limits, and an ephemeral filesystem for authenticated vault uploads. Book One,
the agent, and support use Cloud SQL; member uploads do not become durable until
managed object storage and the worker plane are deployed.

The frontend may safely call the generated Cloud Run URL. Do not create an
`api` DNS record until the global external Application Load Balancer has
reserved its IP address and provisioned a Google-managed certificate. Direct
Cloud Run domain mapping is preview and is not the production path.

## 5. Configure Stripe Support

Set the Stripe Checkout return origin to `https://dotheory.org`. Until
`api.dotheory.org` exists, register the webhook against the generated Cloud Run
URL:

```text
https://<cloud-run-service>.run.app/v1/support/webhook
```

After the load balancer is live, move the webhook to:

```text
https://api.dotheory.org/v1/support/webhook
```

Store the signing secret as `ORCHESTRATOR_STRIPE_WEBHOOK_SECRET` and run the
end-to-end checks in `docs/DONATION_SETUP.md` before accepting live support.

## 6. Verify The Cutover

```bash
dig +short A dotheory.org
dig +short CNAME www.dotheory.org
curl -I https://dotheory.org
curl -I https://www.dotheory.org
curl -fsS "$VITE_ORCHESTRATOR_URL/health/ready"
```

Confirm that a deep link such as
`https://dotheory.org/book/digital-organism-theory/preface` survives a direct
load and that social previews resolve `https://dotheory.org/og-image.png`.
