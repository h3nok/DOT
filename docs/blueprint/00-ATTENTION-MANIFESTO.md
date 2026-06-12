# The Attention Manifesto

> The product principle, stated once, that every other decision derives from.
>
> **We do not sell attention. We protect and return it.**

This document studies how the attention economy is engineered to _extract_ attention,
and then inverts each tactic into a design law. It is the single source of truth for
"the experience system that focuses attention, not ads." Engineers and agents resolve
ambiguity by returning here.

---

## 1. The premise

The dominant model of consumer software is the **attention economy**: the product is
free, the user _is_ the product, and the buyer is the advertiser. Every design decision
is optimized for one number — **time-on-platform / engagement** — because attention is
inventory that is sold.

We are building the opposite. Our scarce resource to protect is **the member's
attention and intention**. Our success metric is not how long someone stays, but
**whether their time here was time well spent** and whether they leave to go do the
thing they came to do. This is only possible because we are **invite-only and
member-funded, never ad-funded.** That business-model choice is what makes humane
design economically honest — there is no incentive to hijack attention because no one
is buying it.

---

## 2. How attention is captured (the literature)

A short, faithful survey of the mechanisms persuasive-tech designers use. We name them
so we can refuse them.

| Source / concept                           | Mechanism                                                           | How it shows up in products                                           |
| ------------------------------------------ | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Fogg Behavior Model** (B = M·A·P)        | Trigger a behavior when motivation + ability are high, via a prompt | Notifications timed to peak vulnerability; one-tap actions            |
| **"Hooked" — Nir Eyal**                    | Trigger → Action → **Variable Reward** → Investment loop            | Pull-to-refresh, "what's new," sunk-cost profiles                     |
| **Variable-ratio reinforcement** (Skinner) | Unpredictable rewards are maximally compulsive (slot machine)       | Feeds, likes arriving at random intervals, loot mechanics             |
| **Removing stopping cues**                 | Eliminate natural "you're done" moments                             | Infinite scroll, autoplay-next, no end of feed                        |
| **Cialdini's 6 principles**                | Reciprocity, commitment, social proof, authority, liking, scarcity  | Read receipts, streaks, "12 friends liked this," "only 2 left"        |
| **Loss aversion / FOMO**                   | Fear of missing or losing more motivating than gain                 | Streaks (Snapchat/Duolingo), "you have unread…", disappearing stories |
| **Operant interruption**                   | Push notifications as engineered re-entry triggers                  | Red badge counts, buzzes, urgency color (red)                         |
| **Engagement-ranked feeds**                | Rank by predicted engagement → novelty + outrage bias               | Algorithmic timelines optimizing dwell time                           |
| **Vanity metrics**                         | Quantify the self to drive comparison and return visits             | Follower counts, view counts, leaderboards                            |
| **Dark patterns** (Brignull)               | Interface tricks against user interest                              | Confirmshaming, roach-motel cancellation, forced continuity, nagging  |
| **Surveillance capitalism** (Zuboff)       | Behavioral surplus → prediction → targeting                         | Tracking everywhere, profiling, data resale                           |
| **Brain-hijack critique** (Harris / CHT)   | The above compound into compulsion, not choice                      | "Time Well Spent" as the counter-movement                             |

**The common denominator:** these tactics route around conscious intention. They convert
_your_ goals into _their_ metric.

---

## 3. The inversion (our design laws)

For each extraction tactic, the law we follow instead. **These are binding.** A feature
that violates a law is rejected by default; exceptions require an ADR.

| #   | They do                                          | We do (LAW)                                                                                                |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| L1  | Variable rewards / slot-machine loops            | **Predictable & calm.** No randomized rewards. Interactions are deterministic and legible.                 |
| L2  | Remove stopping cues (infinite scroll, autoplay) | **Natural completion.** Everything has an end. Finite views, explicit "done," no autoplay-next.            |
| L3  | Engagement-ranked feeds                          | **No feed.** Content is sought, not served. Reverse-chronological or user-directed only.                   |
| L4  | Push notifications & red badges                  | **Pull, not push.** No interruptive notifications. Signals are ambient, batched, user-initiated.           |
| L5  | Vanity metrics (likes, followers, views)         | **No counters.** No public scores. Replace with _presence_ and _quality_ signals.                          |
| L6  | Streaks / FOMO / scarcity                        | **No manufactured loss.** No streaks, no "don't miss," no fake scarcity, no disappearing content pressure. |
| L7  | Dark patterns                                    | **Reversible & honest.** Leaving, cancelling, and exporting are as easy as joining. No confirmshaming.     |
| L8  | Optimize time-on-site                            | **Optimize time-well-spent.** We measure intention-completion and are happy when you leave.                |
| L9  | Surveillance / behavioral targeting              | **No surveillance.** No third-party trackers, no ad tech, privacy by default, data is the member's.        |
| L10 | Many competing CTAs / cluttered UI               | **Single focus.** One intentional action at a time. The interface gets out of the way.                     |
| L11 | Maximize sessions/DAU                            | **Respect the attention budget.** Members set intentions; we surface gentle time awareness.                |
| L12 | Hijack with motivation+ability+prompt            | **Serve declared intention.** The user states a goal; the system helps complete it, then stops.            |

---

## 4. What _brings_ attention (instead of capturing it)

The owner's question: _"What brings attention?"_ — i.e. what earns focus honestly rather
than stealing it. The literature on flow, depth, and intrinsic motivation points to:

- **Clarity of purpose.** A single, obvious next action. Cognitive load is the enemy of focus.
- **Depth over breadth.** Long-form, well-typeset reading; one thing done thoroughly beats ten skimmed.
- **Flow conditions** (Csikszentmihalyi): clear goals, immediate legible feedback, no interruptions, a sense of control.
- **Calm technology** (Weiser & Brown): tech that informs without demanding; moves between center and periphery of attention.
- **Earned trust / craft.** Beauty, speed, and reliability make people _want_ to attend. Performance is a humane feature.
- **Sensory focus aids.** Soundscapes / brainwave entrainment, distraction-free readers, reading guides — tools that deepen attention _on the member's own task_.
- **Presence over metrics.** Knowing a real person is here matters; a follower count does not.
- **Finishing.** Completion and rest are rewarding. A product that helps you _finish_ earns loyalty.

> Attention is not captured; it is **invited by clarity, deserved by craft, and returned by design.**

---

## 5. The metric we optimize

We explicitly **do not** track time-on-site, DAU-for-its-own-sake, session count, or
engagement as success. Instead:

- **Intention completion rate** — did members do what they came to do?
- **Time-well-spent (self-reported)** — a gentle, optional post-session reflection.
- **Calm score** — interruptions avoided, focus sessions completed.
- **Trust** — retention driven by value, measured without surveillance (aggregate, privacy-preserving).

These metrics can _go down_ when we succeed (a member finishes faster and leaves). That is
correct. See `02-ARCHITECTURE.md` for how analytics are collected without tracking.

---

## 6. How this binds the build

Every primitive in `01-NORTH-STAR.md` (Focus Modes, Reader, Single-Focus Navigation,
Session Intention & Attention Budget, Presence/Ambient Signals) is a direct implementation
of laws L1–L12. Every PR description should be able to answer: _which law does this serve,
and does it violate any?_ Agents: enforce this in review.
