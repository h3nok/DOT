# ADR-0003: Server-enforced invite tokens (replace client-side validation)

- **Status:** Accepted
- **Date:** 2026-06-11
- **Deciders:** Founder, Principal Engineer

## Context

The current `InviteGatewayPage` validates access keys on the client — fine as a UX
prototype, but trivially bypassable and unsafe for a real invite-only network. The
backend also hardcodes a `SECRET_KEY` in `backend/src/main.py`.

## Decision

Invitations are **signed, single-use tokens validated server-side**:

- Token carries: issuer id, single-use nonce, optional expiry, and a quota decrement.
- Redemption is an authenticated, rate-limited, transactional server operation (consume
  token → create member → seed default attention preferences). Replay is rejected.
- Each member receives a small invite **quota**; growth is trust-gated (North Star §2).
- Sessions use short-lived access tokens + rotating refresh in HttpOnly/secure cookies;
  **passkeys/WebAuthn preferred** over passwords.
- **Secrets move to environment/secret manager**; the hardcoded dev secret is rotated and
  removed as the first backend task.

## Consequences

- (+) Real access control; tokens can't be forged or replayed.
- (+) Honest scarcity via quotas (Law L6), full audit trail.
- (−) Requires the real backend (ADR-0002) before invite-only is trustworthy; the static
  client prototype remains only for visual/UX work until then.
- **Security baseline:** server-side validation of all input, parameterized queries,
  CSRF on state-changing routes, rate limiting + lockout on auth/invite endpoints.

## Alternatives considered

| Option                                   | Pros                          | Cons                                | Verdict                 |
| ---------------------------------------- | ----------------------------- | ----------------------------------- | ----------------------- |
| Client-side key check (current)          | Zero backend                  | Bypassable; not real access control | Rejected for production |
| Server-enforced signed single-use tokens | Secure, auditable, quota-able | Needs backend                       | **Accepted**            |
