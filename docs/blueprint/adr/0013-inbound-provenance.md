# ADR-0013: Inbound provenance — nothing arrives without a nameable reason

- **Status:** Proposed
- **Date:** 2026-08-05
- **Deciders:** Founder

## Context

ADR-0010 made the twin's outbound speech accountable: an answer whose `cites[]` is not a
subset of what retrieval returned is discarded. If the agent cannot name the node ids
behind a sentence, the sentence does not ship.

The membrane direction (`11-ATTENTION-MEMBRANE.md`) points Stay at the *inbound* half of
the same problem: members route newsletters, feeds, subscriptions, and eventually messages
and agent output through Stay, and Stay decides what reaches them. That delivery decision
is the most powerful thing the product will ever do. In every ad-funded system it is also
the least explainable, because unexplained placement *is* the revenue.

Today there is no inbound equivalent of citation enforcement. Without one, the filter is
asked to be trusted rather than made checkable, and "Stay decided" becomes exactly the
opaque authority the manifesto exists to refuse.

## Decision

**Every item delivered to a member carries an admission record, and delivery fails closed
without one.**

- **Admission record.** Each delivered item references: the **rule** that admitted it, the
  **source** node it came from, and optionally the **voucher** — the person or circle node
  that passed it along. All three are graph node/rule ids the member can open.
- **Fail closed.** An item whose admission record cannot be constructed is not delivered.
  It is held in a member-inspectable holding area, never silently dropped and never
  silently shown.
- **"Why am I seeing this" is first-class.** Every delivered item exposes its admission
  record in the UI and over the API. This is a product surface, not a debug view.
- **No system-injected content.** There is no privileged path that bypasses admission. A
  small closed set of operational messages (billing, security, service status) is
  permitted, is labeled as operational, and still carries a rule id.
- **Member-owned.** Admission records are exportable with the member's data and deleted
  with the item. They are provenance for the member, not analytics for us.
- **No engagement telemetry.** An admission record states *why an item was admitted*. It
  never records whether the member opened, dwelled on, or returned to it (L9, ADR-0007).

This mirrors ADR-0010 in the opposite direction and is testable the same way: an item
without a resolvable rule id, like an answer without a valid citation, does not ship.

## Consequences

- (+) The filter is auditable by the person it serves. "Why did this reach me" always has a
  concrete, openable answer.
- (+) Structurally forecloses paid placement and quiet editorial insertion: there is no code
  path that delivers without a member-visible rule (see ADR-0015).
- (+) Gives the `Discernment` capability something real to stand on — provenance for
  inbound attention, not just a reflective prompt.
- (+) Serves L3 (no feed), L4 (pull, not push), L9 (no surveillance), L12 (declared
  intention).
- (−) Every connector must carry provenance end to end; sources that cannot be attributed
  cannot be delivered. Some integrations become harder or impossible.
- (−) A holding area is another surface to design without turning it into an inbox with a
  badge. It must stay pull-only and finite.
- (−) Storage and join cost per delivered item.
- **Revisit if:** a delivery class emerges that genuinely cannot carry provenance and is
  still worth shipping — which would need a superseding ADR, not an exception in code.

## Alternatives considered

| Option                              | Pros                                    | Cons                                                              | Verdict      |
| ----------------------------------- | --------------------------------------- | ----------------------------------------------------------------- | ------------ |
| Trust the filter; no explanation    | Simplest; fastest to ship               | Recreates opaque ranking authority; unfalsifiable claims of calm   | Rejected     |
| Explanation as a best-effort UI hint | Cheap; no delivery-path constraint      | Drifts from reality the moment the pipeline changes                | Rejected     |
| Admission record, fail closed        | Checkable, exportable, forecloses capture | Constrains connectors; more storage                              | **Accepted** |
