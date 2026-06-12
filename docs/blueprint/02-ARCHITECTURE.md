# Architecture Blueprint

> How the system is built so it can serve the founder's profile today and **scale to
> 100M+ members** without abandoning the Attention Manifesto. Decisions with meaningful
> trade-offs are captured as ADRs in `adr/`.

---

## 1. Guiding constraints

1. **Humane at scale.** No design that only works because we're small (e.g. no global feed ranking we'd later be tempted to "optimize for engagement").
2. **Privacy by default.** No third-party trackers, no ad SDKs, no behavioral profiling. Analytics are aggregate and privacy-preserving (Law L9).
3. **Stateless services, horizontally scalable.** Any instance can serve any request; state lives in datastores and caches, not process memory.
4. **Cost-honest.** Member-funded, so infra must be efficient; cache aggressively, push static to the edge.
5. **Reversible.** Members can export and delete their data (Law L7).

## 2. System shape (target)

```
                    ┌────────────────────────── Edge / CDN ──────────────────────────┐
                    │  Static public profile (SSG/prerender) · images · cached assets │
                    └───────────────┬─────────────────────────────────────────────────┘
                                    │ (dynamic, authenticated)
                          ┌─────────▼──────────┐        ┌───────────────────────┐
   Web client (SPA/SSG) ─►│   API Gateway /    │───────►│  Auth service          │ sessions/JWT,
   (React 19 + Vite)      │   BFF (stateless)  │        │  Invite service        │ invite tokens
                          └─────────┬──────────┘        └───────────┬───────────┘
                                    │                                │
              ┌─────────────────────┼────────────────────┐          │
              ▼                     ▼                    ▼           ▼
     ┌───────────────┐   ┌──────────────────┐  ┌────────────────┐  ┌──────────────┐
     │ Profile/Content│   │ Member service   │  │ Presence svc   │  │ Postgres     │
     │ service        │   │ (intentions,     │  │ (ephemeral,    │  │ (primary,    │
     │                │   │  attention budget)│  │  Redis pub/sub)│  │  partitioned)│
     └───────┬────────┘   └────────┬─────────┘  └───────┬────────┘  └──────┬───────┘
             │                     │                    │                  │
             ▼                     ▼                    ▼                  ▼
        Object store          Redis cache         Redis/streams      Read replicas
        (media, MDX)          (hot data)          (presence)         (scale reads)
```

## 3. Frontend architecture

- **Stack (keep):** React 19, Vite 6, TypeScript, Tailwind v4, shadcn/Radix, Framer Motion, three/R3F, react-router v7, MDX (`@mdx-js/rollup` + `gray-matter`).
- **Public profile** is **statically generated / prerendered** → served from the CDN edge. Cheap, instant, SEO-ready. No backend needed to view the profile.
- **Member interior** is the authenticated SPA, talking to the BFF.
- **Single canonical app entry.** Today `main.tsx` imports `AppOptimized.tsx` while `App.tsx` also exists — these must be consolidated to one router (see ADR-0005 / cleanup plan).

### Frontend module layout (target)

```
frontend/src/
├── app/                 # router, providers, layout shells (ONE entry)
├── attention-os/        # P1–P5 primitives — the heart (see North Star §5)
│   ├── focus-modes/     # P1  (wraps SoundscapeService + entrainment)
│   ├── reader/          # P2  bionic/guided distraction-free reader
│   ├── focus-nav/       # P3  single-focus navigation
│   ├── intention/       # P4  session intention + attention budget
│   └── presence/        # P5  presence + ambient signals (no notifications)
├── blocks/              # feature screens assembled FROM attention-os primitives
│   ├── profile/         # public profile (home, work, writing) — Phase 0/2
│   ├── invite/          # The Door (existing InviteGatewayPage refactors to here)
│   └── member/          # /home /read /focus /people /me
├── content/             # site.config.ts, MDX posts & projects
├── services/            # API clients (typed), SoundscapeService, etc.
└── shared/              # ui primitives (shadcn), contexts, lib, hooks
```

> **Rule:** member screens are _composed from_ `attention-os/` primitives. A screen that
> needs a feed, a counter, or a notification badge is a manifesto violation — escalate.

## 4. Backend architecture (owner: real backend, scale to 100M)

Pragmatic path: **start consolidated, design for split.** Don't build 9 microservices on
day one; build a clean modular monolith with hard module boundaries that can be peeled
into services when load demands.

- **Today:** existing Flask app (SQLite). Fine for prototyping, **not** for the target.
- **Target services (logical, may share a process early):**
  - **Auth** — session/JWT issuance, password/passkey, rate limiting.
  - **Invite** — invite tokens (signed, single-use, quota per member), redemption, audit trail.
  - **Member** — profile, intentions, attention budget, data export/delete.
  - **Content** — profile content, writing, media metadata (MDX/object store).
  - **Presence** — ephemeral who's-here, via Redis pub/sub; never persisted long-term.
- **Datastore:** **PostgreSQL** as primary (migrate off SQLite), read replicas for read scale, table partitioning + UUIDv7 keys for large tables. Redis for hot cache + presence + rate limiting. Object storage (S3/GCS/R2) for media and rendered MDX.
- **Statelessness:** services hold no session state in memory; horizontal autoscaling behind the gateway.
- **Caching:** edge cache for public profile; Redis for member hot paths; HTTP cache headers everywhere.

> Language note: the repo is Python/Flask today. Keep Flask for the foundation phase to
> move fast; ADR-0002 records the decision and the trigger conditions for moving to a
> higher-throughput stack (e.g. FastAPI/async, or Go) if/when profiling demands it.

## 5. Invite-only & auth (the access model)

- **Invite token** = signed, single-use credential with: issuer (member or founder), quota decrement, optional expiry, audit record. Validated server-side (never trust the client — the current static prototype must be replaced; see ADR-0003).
- **Redemption flow:** request/redeem at The Door → create member → consume token → seed default attention preferences.
- **Quotas:** each member gets a small number of invites; trust-gated growth (North Star §2), scarcity is honest (Law L6).
- **Sessions:** short-lived access token + rotating refresh, HttpOnly secure cookies; passkeys/WebAuthn preferred over passwords.
- **Abuse defense at scale:** per-IP and per-account rate limits, invite-token replay protection, bot defense at the edge — without surveilling members.

## 6. Analytics without surveillance (Law L9)

- **No third-party trackers, no ad pixels, ever.**
- Collect only **aggregate, privacy-preserving** signals server-side: intention-completion rate, focus sessions completed, error rates, performance. No per-user behavioral profiles, no cross-site tracking.
- Self-hostable, cookieless analytics (e.g. Plausible/Umami-style) for public-profile traffic only.
- The success metrics in Manifesto §5 are computed from these aggregates.

## 7. Performance budget (humane = fast)

- Public profile: LCP < 2.0s on 4G, CLS < 0.05, initial JS < 150KB gz.
- Member interior: interactions feel instant (<100ms perceived); lazy-load three.js/audio.
- Enforced in CI (Lighthouse budget — see CI workflow).

## 8. Deployment topology

- **Public profile:** static build → CDN/edge (current GitHub Pages works for Phase 0; move to a CDN that also fronts the API for Phase 1+).
- **API/services:** containerized, autoscaling (Cloud Run / ECS / Fly / K8s — ADR later), behind the gateway.
- **Data:** managed Postgres + managed Redis + object storage.
- **Secrets:** never in repo; env/secret manager. (Note: `backend/src/main.py` currently hardcodes a SECRET_KEY — flagged for ADR-0003 / immediate fix when backend work starts.)

## 9. Scale checklist (when traffic grows)

- [ ] Postgres read replicas + connection pooling (pgbouncer).
- [ ] Partition large tables (members, invites, sessions) by UUIDv7/time.
- [ ] Move presence fully to Redis streams; never to primary DB.
- [ ] Split hottest module out of the monolith into its own service.
- [ ] Edge-cache everything cacheable; stale-while-revalidate.
- [ ] Async job queue for non-interactive work (email, exports).

## 10. Security baseline (OWASP-aware)

- Server-side validation of every input incl. invite tokens; never trust client.
- Parameterized queries / ORM (no string-built SQL).
- HttpOnly/secure/SameSite cookies; CSRF protection on state-changing routes.
- Rate limiting + lockout on auth and invite endpoints.
- Rotate the hardcoded dev secret; load secrets from environment.
- Principle of least privilege for service credentials.
