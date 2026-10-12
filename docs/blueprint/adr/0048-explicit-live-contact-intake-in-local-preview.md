# ADR-0048: Explicit live contact intake in the local preview

- **Status:** Accepted
- **Date:** 2026-10-12
- **Deciders:** Founder (make the contact form reach his inbox)
- **Extends:** ADR-0044

## Context

The deployed contact form is available, but the local backend has no contact
sealing key or mail configuration. The founder encountered an unavailable form
while reviewing the site locally and asked for submissions to reach his inbox.
Production does not allow local browser origins through its CORS policy.

## Decision

Allow an explicit `DOT_CONTACT_PREVIEW_TARGET` HTTPS origin in local Vite
configuration. Only public contact status and message submission are proxied to
that origin. Local submissions then reach the deployed private inbox and use its
existing email notices. All Studio, session, and private inbox calls retain their
normal local backend. Open the deployed Studio to review these live messages.

The proxy strips cookies and authorization headers and does not relay Set-Cookie.
It cannot forward private inbox paths. Production builds disable the override,
even when the local setting is present. The default remains an isolated local
stack; the example configuration states that opting in sends real messages.
No mail or encryption credentials are copied into the frontend or local backend.

Serves L7 (explicit configuration and truthful receipts), L9 (limited data and
credential scope), and L12 (messages reach the intended owner). Violates no law.

## Consequences

The founder can review a working form locally against the real intake without
changing other local services or weakening production CORS. An opted-in preview
depends on network access. Live submissions are retained in the deployed inbox,
not the local development database; sending test messages must be deliberate.

## Alternatives considered

- Copy production mail and encryption keys locally: unnecessary credential exposure.
- Point the entire local application at production: mixes unrelated development work with live data.
- Expand production CORS for local previews: changes the wider authenticated API boundary.
- Proxy only explicitly configured public intake: chosen for its narrow scope.
