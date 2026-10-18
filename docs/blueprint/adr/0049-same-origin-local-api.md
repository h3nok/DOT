# ADR-0049: Keep local sign-in on the frontend's origin

- **Status:** Accepted
- **Date:** 2026-10-14
- **Amends:** ADR-0046 cross-site session persistence (local development only)

## Context

The local frontend is commonly opened at localhost, while the configured API
is http://127.0.0.1:8000. These are different browser sites. The API's local
HttpOnly, SameSite=Lax cookie is rejected on cross-site verification, so an
accepted code is immediately followed by a missing session. The frontend's
session confirmation correctly refuses to enter the workspace.

## Decision

For Vite development only, proxy `/__dot-api/v1/` to the configured HTTP
loopback API origin (and forward its health endpoints). Point the browser's existing orchestrator clients to
`/__dot-api`. Default to http://127.0.0.1:8000; support localhost and IPv6
loopback as explicit targets. Reject credentials, paths, queries and fragments
on local targets. Remote URLs and production builds retain their normal URL.

Preserve Host and Origin so the backend's existing origin guard checks writes
against the browser's actual origin, including alternate local preview ports.
Forward the original session cookie and Set-Cookie unchanged. Do not weaken
cookie attributes, inject identity, expose tokens to JavaScript, or add a
production API proxy. The local API must still be running and authenticate
requests normally. The separate opt-in live contact-intake proxy keeps its
public-only routes and strips authentication as before.

Browser tests use a dedicated port and never reuse an existing server: another
repository's Vite server was already occupying the default test port. An
explicit DOT_E2E_PORT supports a free port without changing application config.

## Validation

Reproduce the original localhost-to-127.0.0.1 failure with fictional browser
responses. Cover local cookie retention, workspace reload, logout, production
cookie behavior and missing-session recovery. Exercise the real Vite proxy
against an isolated HTTP fixture, checking forwarded headers and rejecting
foreign-origin writes. No emails or production accounts are needed.

Serves L1 (predictable sign-in), L7 (honest session confirmation and logout),
and L9 (HttpOnly sessions and origin checks). Violates none.
