# ADR-0004: Attention OS primitives — no feed, no counters, no push

- **Status:** Accepted
- **Date:** 2026-06-11
- **Deciders:** Founder, Principal Engineer

## Context

The member experience must implement the manifesto, not just gesture at it. Without a
hard architectural commitment, the easy path (a feed, like counts, push notifications)
re-creates the attention economy.

## Decision

All member-facing screens are **composed exclusively from five primitives** under
`frontend/src/attention-os/` — Focus Modes (P1), Reader (P2), Single-Focus Navigation
(P3), Session Intention & Attention Budget (P4), Presence & Ambient Signals (P5)
(contracts in North Star §5). The following are **architecturally absent**:

- No engagement-ranked **feed** (Law L3).
- No public **counters / vanity metrics** (Law L5).
- No interruptive **push notifications or badges** (Law L4).
- No **infinite scroll / autoplay-next** (Law L2).

A screen requiring any of the above is a manifesto violation and requires a superseding
ADR with explicit justification — it cannot be merged silently.

## Consequences

- (+) The humane model is enforced by structure, not goodwill.
- (+) Reusable primitives accelerate building new screens.
- (−) Some "standard" engagement features are simply unavailable; product must solve
  retention through value and craft instead.
- **Enforcement:** PR review (human + agent) checks "which law does this serve / violate?"
  Lint/architecture rules may later forbid notification/badge components in `blocks/member`.

## Alternatives considered

| Option                                          | Pros               | Cons                               | Verdict      |
| ----------------------------------------------- | ------------------ | ---------------------------------- | ------------ |
| Build conventional social UI, "be tasteful"     | Familiar, fast     | Drifts straight back to extraction | Rejected     |
| Primitive-composed, feature-absent architecture | Enforces manifesto | Less familiar to build             | **Accepted** |
