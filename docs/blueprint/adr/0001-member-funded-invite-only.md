# ADR-0001: Member-funded, invite-only — never ad-funded

- **Status:** Accepted
- **Date:** 2026-06-11
- **Deciders:** Founder

## Context

The product's entire premise (see `00-ATTENTION-MANIFESTO.md`) is to protect attention
rather than sell it. The business model is not a marketing detail — it is the mechanism
that makes humane design economically honest. If advertisers ever became the buyer, every
manifesto law would be under constant commercial pressure to break.

## Decision

The platform is **member-funded and invite-only**. We will **never** run third-party ads,
sell attention, or embed behavioral ad/tracking SDKs. Growth is trust-gated invitations,
not viral extraction.

## Consequences

- (+) Removes the incentive that produces dark patterns and engagement-maximizing feeds.
- (+) Justifies "no surveillance" (Law L9) as architecture, not just policy.
- (−) Slower, smaller growth; revenue must come from membership/value, not scale-for-ads.
- **Revisit if:** the funding model is fundamentally reconsidered — which would require
  re-deriving the manifesto, not just this ADR.

## Alternatives considered

| Option                        | Pros                           | Cons                                                 | Verdict      |
| ----------------------------- | ------------------------------ | ---------------------------------------------------- | ------------ |
| Ad-funded / freemium-with-ads | Fast scale, free to users      | Destroys the premise; incentivizes attention capture | Rejected     |
| Member-funded invite-only     | Aligns incentives with members | Slower growth                                        | **Accepted** |
