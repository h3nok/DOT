# ADR-0025: Two doors — the circle is invited, the reader list is open

- **Status:** Accepted
- **Date:** 2026-08-15
- **Deciders:** Founder

## Context

ADR-0001 makes growth invite-only and trust-gated, and ADR-0019 built the verified queue
that records who asked. Both govern **membership**: who is admitted to the circle, its
surfaces, and its obligations.

Book One is published and free to read (ADR-0023). Someone who finds it through a podcast
or a conference talk, reads it, and wants to know when Book Two lands is not asking to be
admitted to anything. Routing that person into the invite queue is wrong in both
directions: it tells them they are waiting on a decision that was never about them, and it
fills the steward's queue with people who never wanted membership.

Refusing to hold any address at all is the other failure. A reader who arrives from a talk
and has no way to hear again is a reader the work loses permanently, and the loss is
invisible.

Reading and belonging are different relationships. They should have different doors.

## Decision

Two mechanisms, kept separate at every layer.

**The circle** — unchanged. Invite-only per ADR-0001, `join_requests`, `/v1/join`. A
request is a request; admission is issued, never claimed.

**The reader list** — open. `reader_subscriptions`, `/v1/readers`. Anyone may subscribe.

Constraints on the reader list:

- **Double opt-in.** An address is held only after a code proves the person controls it.
  An unconfirmed row is never a subscriber and is never sent to. This is the same rule as
  the join queue and for the same reason: without it, a list is a list of addresses anyone
  can put anyone else on.
- **Sealed at rest.** Fernet-sealed via `app.core.contact` with a blind index beside it
  (ADR-0007), so lookup and dedupe never unseal. Unavailable sealing means the endpoint
  refuses rather than storing an address it promised to protect.
- **Leaving takes one click and no account.** Every message carries an unsubscribe link
  bearing a high-entropy token; the server stores only its SHA-256. Unsubscribing requires
  no sign-in, no reason, and no confirmation step. A list you cannot leave is a trap, and
  the manifesto has no exemption for our own mailing list.
- **No public count.** The size of the list is never rendered to readers (ADR-0004 L5). It
  is instrumentation for the steward, like ADR-0024's aggregates.
- **No behavioural mail.** No open-tracking pixels, no click-through rewriting, no
  per-reader engagement scoring, no re-engagement sequences triggered by silence. L9's
  ban on profiling does not stop at the browser.
- **Subscribing admits nobody.** A reader-list row confers no membership and no path to
  it. The two tables are never joined.

## Consequences

- (+) A reader met at a talk can be reached again without being told they are in a queue.
- (+) ADR-0001 keeps its meaning: membership stays scarce and issued, and is not
  accidentally widened by a book launch.
- (−) Two address stores to hold, seal, and honour deletion across. Accepted: collapsing
  them is what this ADR exists to prevent.
- (−) The steward must not mail the list often enough to need engagement metrics to
  justify it. That constraint is intended.
- **Revisit if:** readers begin using the list as a de-facto circle, which would mean the
  circle is not offering what membership is supposed to mean.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| One queue for both | Already built; one store | Collapses reading and belonging; misleads readers and pollutes the steward's queue | Rejected |
| No list at all | Nothing held; maximally consistent with invite-only | Every reader arriving from a talk is lost silently | Rejected |
| Third-party (Substack, Mailchimp) | No storage burden; ships today | Hands every reader's address to a profiling platform — the exact harm L9 names | Rejected |
| Two doors, one sealed store each | Preserves both commitments; each door says what it is | Two stores to maintain | **Accepted** |
