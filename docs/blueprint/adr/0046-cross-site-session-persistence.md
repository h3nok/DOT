# ADR-0046: Persist sign-in across the static website and API

- **Status:** Accepted
- **Date:** 2026-10-09
- **Deciders:** Founder, reporting that a valid code returns to the sign-in screen
- **Amends:** ADR-0003 session transport and CSRF baseline

## Context

The public website is hosted at dotheory.org; its API is served from a Cloud Run
hostname on run.app. The existing SameSite=Lax session cookie cannot accompany
cross-site fetch requests. A valid code therefore appears to work, but the
workspace reload loses authentication. The private inbox entry now exists;
this failure occurs after email verification rather than during page routing.

## Decision

In production and staging, issue host-only HttpOnly, Secure, SameSite=None,
Partitioned session cookies. Partitioning binds the API cookie to the website's
top-level site in supporting browsers. Local HTTP development retains Lax
without Secure or Partitioned. Use the same attributes and an immediate expiry
for logout. Append Partitioned to the serialized header for compatibility with
the production Python 3.12 runtime. Do not expose tokens to JavaScript or store
authentication material in localStorage.

Reject cookie-bearing state changes unless Origin exactly matches a configured
CORS origin, the configured frontend URL, or the API request's own origin.
Production and staging also reject missing Origin on these requests. Development
permits non-browser cookie clients without Origin. Safe reads, public requests
without a session cookie, and explicit Bearer service clients remain supported.
CORS stays restricted; response headers alone are not the mutation guard.

After code verification, the frontend must read the cookie-authenticated session
and confirm the same member before reloading. If the session was not retained,
keep the email and return to requesting a code with an explicit error. A
consumed code is not presented for another verification attempt.

Browser regression coverage uses intercepted, fictional API responses and an
opaque fixture cookie; it sends no email and accesses no production messages.
It covers sign-in, reload, logout, and a browser rejecting the cookie. Backend
tests cover production/development flags and trusted/foreign-origin mutations.

Serves L1 (clear outcomes), L7 (honest authentication and logout), and L9
(private sessions and guarded mutations). Violates none.

## Consequences

- Code verification and the saved session become separate, checked steps.
- Browsers without compatible cross-site cookie support receive an explicit
  failure instead of an apparent successful sign-in followed by a loop.
- Partitioned sessions are independent between different top-level sites.
- Cookie-based API clients in production must send a trusted Origin on writes;
  automation can continue using its existing explicit Bearer credentials.
- A future same-site API hostname can simplify cookie transport; it requires
  separate domain provisioning rather than being assumed to exist.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep Lax on the current cross-site API | Restrictive cookie | Browser sign-in fails after verification | Rejected |
| Store a token in localStorage | Avoids cookies | Exposes authentication to JavaScript; violates repo rules | Rejected |
| Secure partitioned cookie with an origin guard | Works with current hosting; private session transport | Requires compatible browser policy | Chosen |
| Provision a same-site API hostname now | Simpler site relationship | Requires unavailable cloud/DNS administration | Deferred |
