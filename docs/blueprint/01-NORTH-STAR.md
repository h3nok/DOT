# North Star — Vision & The Attention OS

> Read `00-ATTENTION-MANIFESTO.md` first. This document turns the manifesto into a
> concrete product: the experience, the information architecture, and the reusable
> primitives ("the Attention OS") that every screen is built from.

---

## 1. One-line vision

> An invite-only home on the internet that **protects your attention instead of selling it** —
> starting as the founder's profile, growing one trusted invitation at a time.

## 2. Who & how it grows

- **Phase 0 — Profile.** The founder's public profile/portfolio is the front door. Anyone can view it.
- **Phase 1 — The Door.** The only way "in" is an **invitation**. The Invite Gateway is the threshold experience (already prototyped).
- **Phase 2 — Invite-only network.** Members can invite a limited number of others. Growth is intentional and trust-propagating, not viral-by-extraction.
- **Phase 3 — Scale.** Architecture must support 100M+ members _without_ changing the humane model (see `02-ARCHITECTURE.md`).

Growth is **trust-gated, not growth-hacked.** Invitations are scarce _because trust is_,
not as a FOMO mechanic (Law L6 — scarcity must be honest).

## 3. The two surfaces

1. **The Public Profile (unauthenticated).** Founder brand, work/portfolio, writing.
   Fast, beautiful, SEO-ready. This is what gets deployed first. The Invite Gateway is its only "join" action.
2. **The Member Interior (authenticated).** The invite-only experience built entirely
   from Attention OS primitives. No feed, no ads, no metrics.

## 4. Information architecture

```
PUBLIC
/                     Profile home (single focus: who I am + one primary action)
/work, /work/:slug    Portfolio + case studies
/writing, /writing/:slug   Long-form, reader-first
/invite               The Door (threshold / request-invite experience)

MEMBER (authenticated, behind invite)
/home                 Member home — declare today's intention, resume focus
/read                 Distraction-free reader + library
/focus                Focus session (soundscape/brainwave, timer, single task)
/people               Presence-based directory (who's here, no follower counts)
/me                   Profile, settings, attention budget, data export
/invite/manage        Issue & track your invitations
```

> Note: there is no `/feed`, no `/notifications`, no `/trending`. Their absence is the design.

## 5. The Attention OS — primitives

These are the five foundational primitives the owner selected. Each maps to manifesto
laws and is implemented as a reusable, composable module under
`frontend/src/attention-os/` (see architecture doc). Everything members touch is built
from these.

### P1 — Focus Modes (soundscape / brainwave entrainment)

- **What:** Optional alpha/gamma/ocean soundscapes and visual entrainment to deepen focus on the member's _own_ task. Already prototyped in `SoundscapeService` + `InviteGatewayPage`'s brainwave visualizer.
- **Laws:** L1 (calm, not rewarding), L12 (serves declared intention).
- **Contract:** `FocusModeProvider` exposes `{ mode, setMode, volume }`; never auto-starts; remembers preference; respects `prefers-reduced-motion` and audio autoplay policy.

### P2 — Reader (bionic / guided reading, distraction-free)

- **What:** A reading surface that removes everything but the words — optional bionic emphasis, reading guide line, adjustable measure/leading, reading-time estimate, and a clear _end_.
- **Laws:** L2 (natural completion), L10 (single focus), and "depth over breadth."
- **Contract:** `<Reader content={mdx} options={...} />`; no related-content rail, no autoplay-next, no inline CTAs competing with the text.

### P3 — Single-Focus Navigation

- **What:** Navigation that presents **one primary intentional action at a time**. No nav bar full of competing links, no infinite menus. A calm "command" surface to move deliberately.
- **Laws:** L3 (no feed), L10 (single focus).
- **Contract:** `<FocusNav primary={action} secondary={[...]} />` — exactly one primary action; secondary actions are demoted and quiet. Back/forward is always obvious (L7 reversible).

### P4 — Session Intention & Attention Budget

- **What:** On entering, the member optionally **declares an intention** ("read X", "write for 25m"). The system tracks gentle, non-judgmental time awareness against a self-set budget and offers a natural stopping point.
- **Laws:** L8 (time-well-spent), L11 (attention budget), L12 (declared intention).
- **Contract:** `IntentionProvider` → `{ intention, budget, elapsed, complete() }`; surfaces a calm "you've done what you came for" moment; **never** nags to stay.

### P5 — Presence & Ambient Signals (no notifications/counters)

- **What:** Replace badges/notifications/follower counts with **presence** (who is genuinely here now) and **ambient, batched signals** the member pulls when ready.
- **Laws:** L4 (pull not push), L5 (no counters), L6 (no FOMO).
- **Contract:** `usePresence()` returns coarse, privacy-preserving presence; signals are a quiet, user-opened tray — never a red badge, never a push.

## 6. Experience principles (applied)

- **Default to stillness.** Motion is purposeful and reduced-motion-safe.
- **One thing per screen.** If a screen has two primary actions, it's two screens.
- **Reward leaving.** Completion states celebrate finishing, not continuing.
- **No numbers that invite comparison.** Ever.
- **Speed is humane.** Sub-second, instant-feeling. Performance budget enforced in CI.

## 7. First shippable milestone (owner-selected: foundation first)

1. **Foundation** (this blueprint, agentic setup, structure, CI) ✅ in progress.
2. **Public Profile** rebuilt on the new UI + Attention OS primitives, deployable.
3. **The Door** (Invite Gateway) wired to the real invite backend.
4. **Member interior v1**: `/home` (intention) + `/read` (Reader) + `/focus` (Focus Modes).

## 8. Definition of done (foundation phase)

- Manifesto, North Star, Architecture, and ADRs committed under `docs/blueprint/`.
- `AGENTS.md` + copilot-instructions guide agents to build within the laws.
- Structure decided; legacy/duplicate files identified with a safe cleanup plan.
- CI gates (lint, typecheck, build) green.
- Attention OS primitive contracts (P1–P5) defined so screens can be assembled from them.
