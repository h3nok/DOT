# ADR-0059: Open free membership, separate from newsletter consent

- **Status:** Accepted
- **Date:** 2026-11-03
- **Deciders:** Founder, explicitly selecting “Open free membership” for AMM
- **Supersedes:** ADR-0001 and ADR-0025 only where they require an invitation for account admission; their attention, privacy, and separate-consent requirements remain binding
- **Builds on:** ADR-0003, ADR-0007, ADR-0046, ADR-0051, ADR-0056

## Context

The founder requested membership and newsletter work and chose open free
membership. Earlier production sign-in refused a new account without an
invitation. Changing only the signup label would misrepresent that server rule.
The existing verified-email authentication, member roles, people desk, and
separate publication subscriptions provide the foundation.

## Decision

Allow new verified accounts without invitations when
`ORCHESTRATOR_OPEN_MEMBERSHIP_ENABLED=true`. Enable that setting for the public
release. Keep deployments closed by default unless configured deliberately.
Existing invitation links and the historical request queue remain available;
an invitation is no longer a prerequisite for open membership.

Reuse the existing sign-in OTP and HttpOnly session cookie. Create the account
only after successful verification. Suspended accounts remain barred; public
registration cannot override a suspension. An ordinary account receives only
its own member scope, never owner publishing or address-access authority.

Membership is free, with no payment, list subscription, or advertising attached.
AMM email signup remains a separate, publication-specific double opt-in. No
welcome campaign, external post, or contact-list transfer runs on registration.

Provide `/amm/membership` for joining, reading paths, optional correspondence,
and account controls, using the existing P3 FocusNav. Do not claim a shared
discussion room or manuscript access is available. Keep the complete manuscript
download withheld until its own server-side access policy is implemented.

Members can export their membership profile, sign out, or close membership.
Closure removes the display name, marks the account closed, consumes unused
sign-in codes, and increments a session version. All older member credentials
then remain invalid even after verified rejoining. Preserve the one-way email
index and owned-work references; full erasure remains the existing privacy
request workflow. Explain retention and separate newsletter departure plainly.
Owner accounts cannot close themselves through this member endpoint.

Reuse `/studio/people` for owner management. AMM links into the same subscriber
view with its publication filter, and into the member view. Do not build another
membership or address store.

Serves L1 (clear access), L2/L3 (finite intentional paths), L7 (free choice,
export, departure, and honest retention), L9 (no profiling or list transfer),
L10 (one primary reading action), and L12 (separate declared intentions).
Violates no manifesto law. Free membership does not alter the ban on ads,
selling attention, trackers, feeds, public scores, or manufactured scarcity.

## Consequences

Open registration increases abuse exposure, so verification, code expiry,
attempt limits, cooldowns, and endpoint rate limits stay enforced. A migration
adds the session version with default zero, preserving existing accounts and
owner sessions. Public signup reports actual email availability; it cannot
claim success when verification or the browser session fails.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| Invitation-only accounts | Existing policy | Conflicts with the founder's explicit choice | Superseded for admission |
| Rename subscribers as members | Fast | Confuses email consent with an account | Rejected |
| Paid membership | Funding mechanism | Not requested; introduces billing | Rejected |
| Open verified free accounts with separate email consent | Meets the chosen model; reuses existing auth | Requires departure and operational safeguards | Accepted |
