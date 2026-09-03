# ADR-0032: One Platform Kernel, Many Institutions

- **Status:** Proposed
- **Date:** 2026-09-02
- **Deciders:** Founder, future stewards
- **Builds on:** ADR-0002, ADR-0011, ADR-0030, ADR-0031
- **Consolidates:** design content of docs 04, 05, 10, 13 into doc 14; roadmaps
  of docs 06, 09 into doc 15

## Context

ADR-0030 made the website a living academy; ADR-0031 chose a versioned
relational kernel for it. Doc 13 designed that kernel for DOT Academy with a
multi-institution escape hatch (`academy_space_id`), but left program taxonomy
fixed and the generalization implicit. Meanwhile the blueprint had grown to
thirteen overlapping design docs, several describing as "scaffolded" a backend
that now has twelve working domains — agents and contributors were reading
stale claims as fact.

Two forces:

- The platform's ambition is explicitly larger than one institution: new
  intellectual work, new models, new academies. Retrofitting institutional
  isolation into a live scholarly record later would be the single most
  dangerous migration this system could face.
- Building a generic "academy builder" before a second real institution exists
  would be speculative product surface with no user.

## Decision

1. **The Academy kernel is institution-generic from its first migration.** The
   *space* is the kernel's tenancy primitive. Every kernel table carries a
   NOT NULL space key (directly or via its parent) and row-level security by
   space. DOT Academy is space row 1, seeded by data, not privileged by code.
2. **Programs become per-space data** (`academy_programs`); the eight work
   kinds remain a closed, schema-gated platform union because epistemic
   contracts attach to kinds.
3. **Authority is only ever a scoped role grant under a versioned policy**,
   resolved per space. Custody, authorship, founder identity, and
   infrastructure access confer no editorial power.
4. **Creating a second institution requires zero code changes** — a row, a
   policy, a seed. But no multi-space administration UI ships before a real
   second institution exists.
5. **The blueprint consolidates to two authoritative design files:** doc 14
   (architecture) and doc 15 (implementation plan). Docs 06 and 09 are
   superseded as plans; docs 04, 05, 10, 13 become reference annexes. Where an
   annex and doc 14 differ, doc 14 wins; ADRs outrank both.
6. **Public URL namespace is fixed now:** space 1 owns `/academy/...`; later
   spaces mount at `/a/{space-slug}/...`. Slugs are never recycled.

## Enforcement

- Schema: NOT NULL space foreign keys + `FORCE ROW LEVEL SECURITY` on every
  private kernel table; transaction-bound `app.academy_space_id` derived
  server-side only.
- CI: a cross-space isolation suite creates two spaces and proves neither can
  read or write the other, and that custody grants no editorial transition
  (doc 15, Phase 1 gate — the phase cannot be claimed without it).
- Review: PRs touching `app/domains/academy/` must cite the doc 14 invariant
  (P1–P14) they serve.

## Consequences

**Positive.** Institutional isolation is a constraint, not a convention. The
platform can host a second theory or school without a rewrite. Contributors
have one architecture file and one plan instead of thirteen partial ones.

**Negative.** Space scoping adds a join and a policy check to every kernel
query from day one, paid mostly for a single-tenant reality. Two docs must now
be actively maintained as code moves — staleness there is a bug. Program
flexibility means DOT Academy's three-program structure is editorial
discipline, not schema.

**Revisit if** a second institution's governance genuinely cannot be expressed
as policy + grants (trigger: first real onboarding), or if space-scoped RLS
shows measurable query cost at scale (trigger: profiling evidence, per
ADR-0031's read-model seams).

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Build single-tenant for DOT Academy, generalize later | Simpler queries now | Retrofitting tenancy into a live scholarly record; historically how isolation bugs are born | Rejected |
| Fork the codebase per institution | Total isolation | Divergence, no shared preservation/verification machinery, N maintenance burdens | Rejected |
| Full multi-tenant product now (builder UI, self-serve spaces) | Marketable platform | Speculative surface before a second real institution; violates "no theater" | Rejected |
| Space-generic kernel, data-seeded institutions, no builder UI | Isolation guaranteed early, zero speculative UI | Slight day-one complexity tax | **Proposed** |
