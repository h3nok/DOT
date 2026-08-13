# ADR-0019: A verified request-to-join queue, with sealed contact addresses

- **Status:** Accepted
- **Date:** 2026-08-11
- **Deciders:** Founder
- **Narrows:** [ADR-0007](0007-blind-infrastructure-and-app-layer-encryption.md), which
  requires this document for any feature that must retain readable contact data
- **Builds on:** [ADR-0001](0001-member-funded-invite-only.md),
  [ADR-0003](0003-server-enforced-invites.md)

## Context

ADR-0001 makes growth trust-gated: invitations are issued, never claimed. That
settles who is admitted. It was silently read as also settling whether the
platform may learn who is interested, and the result was a public surface with no
way for a reader to raise a hand at all. Someone could finish 22,572 words, agree
with the argument, and have no available action.

Two mechanisms were considered and rejected before this one.

A public queue — GitHub Discussions or Issues on the public repository — needs no
new code. It also publishes every requester's address-adjacent identity and their
stated reason. That is the same public list ADR-0012 refuses for supporters,
wearing different clothes, and it would be the first place the platform leaked
the people it exists to protect.

A `mailto:` link retains nothing and is the correct fallback for a static
release, which is why it survives as one. It cannot verify that an address is
real, so the resulting list is unverifiable by construction, and it puts no
bound on what arrives.

The remaining option requires retaining a contact address, which ADR-0007
prohibits by default: private member data is encrypted before persistence, and
identity is looked up through blind indexes only. `Member` accordingly keeps only
`email_hash`. ADR-0007 anticipates this collision and names the escape: such a
feature "must receive explicit founder approval and a narrower ADR documenting
scope, retention, and user consent." This is that ADR.

## Decision

A request to join is recorded server-side, proved against the address given, and
stored so that only a running service holding a key can read it.

- **Scope.** One address and one optional reason (≤600 characters) per person,
  in `join_requests`. Nothing else about the requester is stored, and this table
  is the only place in the system that retains a recoverable address.
- **Consent.** The address is typed into a field whose stated purpose is that a
  human can answer it. The surface says, before submission, that it is stored
  encrypted, never published, and never sold.
- **Verification.** A six-digit code proves control of the address. Sign-in and
  join share the OTP table, so every code now carries a `purpose`, and both
  flows filter on it: **a code issued for the queue can never be redeemed for a
  session.**
- **Sealing, not plaintext.** The address is encrypted with Fernet
  (`app.core.contact`) under `JOIN_CONTACT_KEY`, held in the secret store and
  never in the database. A dump yields nothing on its own. `email_hash` sits
  beside it as the blind index so dedupe and lookup never unseal anything.
  `JOIN_CONTACT_KEY_PREVIOUS` is tried on open, so rotation is not a cliff.
- **Fail closed.** With no key configured the queue refuses requests and reports
  itself closed, exactly as the support plane does without its Stripe keys. The
  platform never accepts an address it cannot store as promised.
- **The queue is never public.** Reading it requires the owner write scope. There
  is no endpoint returning a count, a position, or a length — to anyone.
- **No scarcity, ever.** No queue position, no people-ahead, no estimated wait,
  no "spots left". ADR-0004 bans manufactured urgency and every one of those
  numbers is a lever for it. Asking twice refreshes one row rather than
  inflating anything.
- **Retention.** A row lives until the request is answered or the person asks for
  it to be removed. Nothing here feeds analytics, logs, or model training.

## Consequences

- (+) The movement can finally grow: interest becomes a list a person can act on,
  without becoming a public one.
- (+) Verification makes the list meaningful — an unverified queue is a list of
  addresses anyone can put anyone else on.
- (+) The `purpose` column closes a real hole that would otherwise have opened the
  moment two flows shared one code table.
- (−) One recoverable-secret surface now exists where previously there were none.
  Its blast radius is prospective members' addresses, and it depends on key
  hygiene rather than on the impossibility of decryption.
- (−) Key loss orphans pending requests. They are shown to the steward as
  unreadable rather than hidden, so the failure is visible instead of silent.
- (−) `cryptography` becomes a runtime dependency of the orchestrator.
- **Revisit if:** the queue is ever asked to hold more than an address and a
  reason, or if anything wants to display its size. Both change the trade this
  ADR makes.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| Public queue (Discussions/Issues) | No new code; zero infrastructure | Publishes who asked and why — the exact list the platform refuses to keep | Rejected |
| `mailto:` only | Retains nothing; no third party | Cannot verify an address; unbounded and unstructured | Kept as the static fallback |
| Plaintext address column | Simple; trivially answerable | Puts every prospective member's address in every backup and log | Rejected |
| Hash only, no recoverable address | Perfectly consistent with ADR-0007 | Nobody can be answered, which is the entire purpose | Rejected |
| Sealed address + blind index | Answerable, verified, dump-resistant | One recoverable-secret surface; key hygiene matters | **Accepted** |
