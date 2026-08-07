# ADR-0015: No paid passage — revenue never varies with what reaches a member

- **Status:** Proposed
- **Date:** 2026-08-05
- **Deciders:** Founder

## Context

ADR-0001 forbids advertising and selling attention. That closes the obvious door. Becoming
the membrane opens a subtler one.

Once members route their subscriptions and sources through Stay, publishers, services, and
agent vendors acquire a direct commercial interest in *passage* — being admitted, being
ordered first, being summarized favorably, being exempt from a filter. The offers will not
arrive labeled as advertising. They arrive as partner integrations, certified-source
programs, priority delivery, revenue sharing on subscriptions we route, affiliate
commissions on purchases we facilitate, or a listing fee to appear in a directory of
connectors.

Each is individually defensible and collectively fatal: the moment our revenue depends on
what passes through the membrane, the membrane is no longer working for the member. This
is the precise mechanism by which ad blockers became acceptable-ads programs and browser
defaults became the most valuable real estate on the internet.

The cost of prohibiting this today is zero. The cost of prohibiting it after the first
partner contract is the contract, and probably the principle.

## Decision

**No party other than the member may pay to influence what reaches that member, in what
order, or how it is presented.** Revenue must be invariant to delivery outcomes.

Specifically prohibited:

- Paid placement, priority delivery, or paid exemption from a member's filter.
- Publisher, service, or vendor fees for inclusion, certification, or connector listing.
- Affiliate commissions, referral fees, or revenue share that vary with what a member is
  shown, opens, or buys through Stay.
- Sponsored summaries, sponsored briefs, sponsored twin answers, or paid-for phrasing.
- Selling access to the policy layer, the admission path, or placement in defaults.

Permitted:

- Member subscriptions and member-directed support (ADR-0001, ADR-0012).
- Flat, published, outcome-independent fees for infrastructure a member asks us to run.
- Unpaid, member-initiated connectors to any service, including services we compete with.

**Test to apply to any proposed revenue:** if the amount we are paid changes because a
member saw, ordered, opened, or acted on one thing rather than another, it is prohibited.

Default ordering, default rule templates, and the connector directory are governed by this
ADR: those positions are never for sale at any price.

## Consequences

- (+) Keeps the membrane's incentives aligned with the member at the exact point of maximum
  temptation.
- (+) Makes ADR-0013's admission records meaningful: there is no commercial admission
  reason, so the member-visible rule is the whole truth.
- (+) Preserves the honesty of L3, L5, L8, L9 as the product gains distribution power.
- (−) Forecloses the largest and easiest revenue line a successful membrane would have.
  Subscription pricing must therefore be sufficient on its own, which constrains the cost
  model (notably per-item inference; see ADR-0014).
- (−) We will decline partnerships that competitors accept, and will be slower to build out
  connector breadth without vendor co-funding.
- **Revisit if:** never, in the sense that changing this changes the product. Any
  reconsideration requires re-deriving ADR-0001 and the manifesto, not a superseding ADR
  alone.

## Alternatives considered

| Option                                        | Pros                                    | Cons                                                                    | Verdict      |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------- | ------------ |
| Allow clearly-labeled paid placement          | Large revenue; "transparent"            | Labeling does not remove the incentive; ordering becomes the product     | Rejected     |
| Allow affiliate revenue only                  | Feels invisible to the member           | Directly couples our income to what we show; corrupts summaries          | Rejected     |
| Paid connector certification                  | Funds integration work                  | Sells the directory and the defaults, which are the membrane's power     | Rejected     |
| Revenue invariant to delivery                 | Incentives stay aligned; simple to test | Leaves money on the table; subscription must carry the whole cost model  | **Accepted** |
