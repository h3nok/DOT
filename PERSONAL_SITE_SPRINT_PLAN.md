# Personal Website & Portfolio — Complete Development Plan

> A personal brand landing page that showcases your portfolio (DOT, Avia/MedRoute, HKI, Sullix)
> and serves as your personal blog. This document is the single source of truth for architecture,
> design, content model, and the sprint-by-sprint execution plan.

---

## 1. Vision & Goals

**One-line vision:** A fast, elegant personal site that establishes your engineering brand, routes visitors into deep-dive portfolios, and hosts a first-class technical blog.

### Primary goals

1. **Landing / brand** — a memorable hero that says who you are and what you build.
2. **Portfolio hub** — curated project cards that link to (and optionally embed) DOT, Avia/MedRoute, HKI, and Sullix.
3. **Personal blog** — long-form technical writing with MDX, code highlighting, and math.
4. **Performance & polish** — Lighthouse 95+, accessible (WCAG AA), SEO-ready, dark/light.

### Non-goals (for v1)

- No CMS backend required at launch (content-as-code via MDX).
- No auth/accounts for visitors (the existing DOT auth stays inside the DOT project).
- No rewrite of the four portfolio apps — we **link/showcase**, not merge.

### Success metrics

- Lighthouse: Performance ≥ 95, Accessibility ≥ 95, SEO 100.
- LCP < 2.0s on 4G, CLS < 0.05, initial JS < 150KB gzipped on the landing.
- 100% of portfolio projects represented with a case-study page.
- Blog supports drafts, tags, RSS, and OG images.

---

## 2. Current State Assessment

### What already exists (reusable)

- **Strong frontend foundation** in `frontend/`: React 19, Vite, TypeScript, Tailwind v4, shadcn/ui (Radix), Framer Motion, react-router-dom v7.
- **Blog infrastructure**: `blocks/knowledge/blog/` with `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-prism-plus`, syntax highlighting.
- **Block-based architecture** documented in `ARCHITECTURE.md` (feature folders under `blocks/`).
- **Theme system**: `SimpleThemeContext`, `LogoContext`, settings page.
- **Design tokens**: fonts (Inter, JetBrains Mono, Playfair Display), cosmic theme.
- **Backend** (Flask + SQLite): user, donations (Stripe), metrics.

### Cleanup needed (debt observed)

- Duplicate/backup files in blog: `BlogPage-working.tsx`, `BlogPage.tsx.bak`. Remove.
- Many root-level `*_SUMMARY.md` docs — consolidate into `/docs`.
- DOT's philosophical branding is tightly coupled to the home/nav — must be decoupled from the personal brand.

### Key architectural tension

"DOT" is **both** the current app **and** one of the portfolio items. The personal site must become the umbrella; DOT becomes one showcased project. See decision in §3.

---

## 3. Architecture Decision

### Decision: Build a dedicated **personal-site** app; treat DOT as a showcased project.

We evolve the existing `frontend/` into a personal-brand shell rather than starting from zero (preserves the React 19 + Vite + Tailwind v4 + blog investment), but we **decouple** DOT-specific content into a `projects/dot` route/section so the personal brand is clean.

#### Options considered

| Option                                                               | Pros                                          | Cons                                         | Verdict                              |
| -------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------- | ------------------------------------ |
| **A. New standalone app, reuse DOT patterns**                        | Cleanest brand separation; no legacy coupling | Re-wire blog + theme; more upfront work      | Recommended if you want a hard reset |
| **B. Evolve `frontend/` into personal shell, DOT becomes a section** | Reuses blog, theme, design system; fastest    | Must untangle DOT-specific home/nav          | ✅ **Chosen** (best ROI)             |
| **C. Monorepo with shared design-system package**                    | Long-term scalable; shared UI lib             | Heavy setup; overkill for a personal site v1 | Defer to v2                          |

> If at any point the coupling proves painful, fall back to Option A — the design system and content model below are portable either way.

### Target tech stack

- **Framework:** React 19 + Vite + TypeScript (keep). _Optional upgrade path to Next.js noted in §11 for SSG/SEO; not required for v1 thanks to `vite-plugin-ssg`/prerender._
- **Styling:** Tailwind v4 + shadcn/ui (keep).
- **Animation:** Framer Motion + selective Three.js/R3F for hero accents.
- **Content:** MDX for blog + case studies (`@mdx-js/rollup`), frontmatter via `gray-matter`.
- **Routing:** react-router-dom v7 with a prerender step for static export.
- **Search:** client-side (FlexSearch) over a generated content index.
- **Deployment:** static build to Vercel/Netlify/Cloudflare Pages (CDN). Backend optional.
- **Backend (optional):** keep Flask only if you want contact form / newsletter / metrics; otherwise use a serverless function + a form service.

### Information architecture (sitemap)

```
/                      Landing (hero, featured work, latest posts, about teaser, contact CTA)
/about                 Bio, skills, experience, resume download
/work                  Portfolio grid (all projects, filterable by tag)
/work/dot              Case study: Digital Organisms Theory  (+ link/embed to live DOT)
/work/medroute         Case study: Avia / MedRoute
/work/hki              Case study: Hermetic Knowledge Isolation
/work/sullix           Case study: Sullix marketplace
/blog                  Blog index (search, tags, pagination)
/blog/:slug            Blog post (MDX, TOC, code, math, OG image)
/tags/:tag             Posts filtered by tag
/contact               Contact form + social links
/rss.xml /sitemap.xml  Generated feeds
```

### Proposed directory structure (within `frontend/src`)

```
src/
├── app/                      # Router, providers, layout shells
├── blocks/
│   ├── core/                 # Navigation, footer, theme (reused)
│   ├── landing/              # Hero, FeaturedWork, LatestPosts, AboutTeaser
│   ├── work/                 # Portfolio grid, ProjectCard, CaseStudyLayout
│   ├── blog/                 # (moved from knowledge/blog) index, post, editor
│   └── about/                # Bio, Skills, Timeline, Resume
├── content/
│   ├── posts/                # *.mdx blog posts (frontmatter)
│   ├── projects/             # *.mdx case studies (DOT, MedRoute, HKI, Sullix)
│   └── site.config.ts        # Name, socials, nav, SEO defaults
├── shared/
│   ├── components/ui/        # shadcn primitives (reused)
│   ├── contexts/             # Theme, AppState (reused)
│   ├── lib/                  # mdx loader, content index, seo, rss
│   └── hooks/
└── styles/                   # tokens, tailwind layers
```

---

## 4. Design System & Branding

- **Personal brand identity:** define name, tagline, logo/monogram, accent color, and voice. (DOT's red-dot logo stays with DOT.)
- **Tokens:** colors (light/dark), typography scale, spacing, radii, shadows, motion durations/easings. Centralize in `styles/tokens.css` + Tailwind theme.
- **Typography:** Playfair Display (display), Inter (body), JetBrains Mono (code) — already available.
- **Components to standardize:** Button, Card, Badge/Tag, Tabs, Tooltip, Dialog, ProjectCard, CaseStudyHeader, PostCard, TOC, CodeBlock, MathBlock, ThemeToggle, Footer.
- **Motion guidelines:** subtle, purposeful; respect `prefers-reduced-motion`.
- **Deliverable:** a `/styleguide` (dev-only) route rendering all primitives + tokens.

---

## 5. Content Model

### Blog post frontmatter (`content/posts/*.mdx`)

```yaml
---
title: "Post title"
slug: "post-title"
date: 2026-06-07
updated: 2026-06-08
excerpt: "One-sentence summary for cards and meta description."
tags: ["systems", "ai", "architecture"]
cover: "/images/posts/post-title/cover.png"
draft: false
readingTime: auto
---
```

### Project / case-study frontmatter (`content/projects/*.mdx`)

```yaml
---
name: "Hermetic Knowledge Isolation (HKI)"
slug: "hki"
order: 2
tagline: "The control framework for the agentic era."
role: "Creator / Lead Engineer"
period: "2024–2025"
stack: ["TypeScript", "Python", "RAG", "MCP"]
status: "Production (Fortune 15 retailer)"
links:
  repo: "https://github.com/..."
  live: "https://..."
  npm: "@hki/runtime"
cover: "/images/projects/hki/cover.png"
highlights:
  - "Validated across 14 enterprise domains"
  - "Signed-domain runtime + conformance harness"
featured: true
---
```

### Seed case studies (write these in Sprint 3)

- **DOT** — Digital Organisms Theory: philosophy + interactive consciousness UI.
- **Avia / MedRoute** — HIPAA-aware medical transport platform (Spring Boot + React + RN).
- **HKI** — AI agent isolation standard with npm/PyPI runtime + conformance.
- **Sullix** — contractor marketplace with AI matching + escrow.

---

## 6. Cross-Cutting Requirements

- **SEO:** per-page `<title>`/meta, canonical, OpenGraph/Twitter cards, JSON-LD (`Person`, `BlogPosting`), `sitemap.xml`, `robots.txt`, RSS.
- **Performance:** route-based code splitting, image optimization (AVIF/WebP, responsive `srcset`), font preload + `font-display: swap`, lazy-load Three.js hero, prerender/SSG for static routes.
- **Accessibility:** semantic landmarks, focus management, keyboard nav, color-contrast AA, `prefers-reduced-motion`, alt text, skip-to-content.
- **Analytics & privacy:** privacy-friendly analytics (Plausible/Umami), no cookie banner needed if cookieless.
- **CI/CD:** GitHub Actions — lint, typecheck, build, Lighthouse CI budget, deploy preview per PR.
- **Testing:** Vitest (unit), Playwright (e2e smoke: nav, blog render, project links), axe accessibility checks.
- **Error/observability:** error boundary, 404 page, optional Sentry.

---

## 7. Sprint Plan

> Cadence: 6 sprints. Treat each as ~1 week of focused effort (adjust to your pace).
> Each sprint has a **Goal**, **Tasks**, **Deliverables**, and **Acceptance criteria (DoD)**.

### Sprint 0 — Foundation & Decisions (setup)

**Goal:** Clean base, decisions locked, brand defined, pipeline green.

- [ ] Lock brand: name, tagline, monogram/logo, accent color, voice.
- [ ] Clean repo debt: remove `BlogPage-working.tsx`, `BlogPage.tsx.bak`; move root `*_SUMMARY.md` into `/docs`.
- [ ] Establish directory structure from §3; add `content/site.config.ts`.
- [ ] Add MDX pipeline (`@mdx-js/rollup`, `gray-matter`) + content loader util.
- [ ] Set up CI (lint, typecheck, build) + deploy preview to Vercel/Netlify.
- [ ] Create `/styleguide` route scaffold.
- **Deliverables:** green CI, deploy preview URL, brand brief, content config.
- **DoD:** `pnpm build` passes; preview deploys; tokens + one sample MDX render.

### Sprint 1 — Design System & Shell

**Goal:** Reusable design system + app shell (nav, footer, theme, layouts).

- [ ] Finalize tokens (colors, type scale, spacing, motion) in `styles/`.
- [ ] Build/curate primitives: Button, Card, Badge, Tabs, Tooltip, Dialog, ThemeToggle.
- [ ] Personal **Navigation** (decoupled from DOT) + **Footer** with socials.
- [ ] Root layout shells: `SiteLayout`, `CaseStudyLayout`, `BlogLayout`.
- [ ] `/styleguide` renders all primitives in light/dark.
- **Deliverables:** design-system components + styleguide page.
- **DoD:** all primitives keyboard-accessible, AA contrast, documented in styleguide.

### Sprint 2 — Landing & About

**Goal:** A compelling homepage and about page.

- [ ] **Hero** (Framer Motion + optional subtle R3F accent, reduced-motion safe).
- [ ] **Featured Work** strip (3–4 project cards pulled from `content/projects`).
- [ ] **Latest Posts** strip (from `content/posts`).
- [ ] **About teaser** + CTA to `/contact`.
- [ ] `/about`: bio, skills matrix, experience timeline, resume PDF download.
- **Deliverables:** `/` and `/about` complete.
- **DoD:** Lighthouse ≥ 95 on `/`; LCP < 2s; content driven by config/MDX.

### Sprint 3 — Portfolio & Case Studies

**Goal:** Portfolio hub + four real case studies.

- [ ] `/work` grid with tag filtering + `ProjectCard`.
- [ ] `CaseStudyLayout` (hero, role, stack, problem → approach → outcome, gallery, links).
- [ ] Write case studies: **DOT**, **MedRoute (Avia)**, **HKI**, **Sullix** (frontmatter + body).
- [ ] Capture screenshots / cover images for each project.
- [ ] Decide per-project: link out vs. embed live demo.
- **Deliverables:** `/work` + 4 case-study pages.
- **DoD:** every project has cover, tagline, stack, outcomes, and working external links.

### Sprint 4 — Blog System

**Goal:** First-class blog migrated to MDX with search, tags, RSS.

- [ ] Migrate blog from `knowledge/blog` to `blocks/blog`; render MDX.
- [ ] Post page: TOC, code highlighting (Prism), KaTeX math, reading time, prev/next.
- [ ] Index page: pagination, tag filter, client-side search (FlexSearch).
- [ ] `/tags/:tag`; generate `rss.xml` + per-post OG images.
- [ ] Write 2–3 launch posts (e.g., "Building HKI", "Why DOT", a technical deep-dive).
- **Deliverables:** complete blog with feeds and seed content.
- **DoD:** posts render with code+math; RSS valid; search returns results; OG images present.

### Sprint 5 — Polish, SEO, Launch

**Goal:** Production-ready, optimized, deployed to your domain.

- [ ] SEO: meta/OG/Twitter, JSON-LD (`Person`, `BlogPosting`), sitemap, robots.
- [ ] Performance pass: image optimization, code-split, font preload, lazy 3D.
- [ ] Accessibility audit (axe + manual keyboard pass) → fix issues.
- [ ] Contact: form (serverless or form service) + spam protection.
- [ ] Analytics (Plausible/Umami), 404 page, error boundary.
- [ ] Lighthouse CI budget enforced in CI; e2e smoke tests in Playwright.
- [ ] Domain + DNS + HTTPS; deploy production.
- **Deliverables:** live site on custom domain.
- **DoD:** Lighthouse P≥95/A≥95/SEO 100; e2e green; contact form delivers; analytics live.

### Post-launch backlog (v2)

- Newsletter (email capture + digest), comments (gisc/utterances), i18n,
  Next.js migration for SSR if needed, shared design-system package (monorepo),
  case-study video demos, dynamic OG image service.

---

## 8. Risks & Mitigations

| Risk                                 | Impact               | Mitigation                                                      |
| ------------------------------------ | -------------------- | --------------------------------------------------------------- |
| DOT/personal brand coupling is messy | Delays Sprint 1–2    | Decouple nav/home early in Sprint 0; isolate DOT to `/work/dot` |
| Three.js hero hurts performance      | Poor LCP             | Lazy-load, static fallback, reduced-motion guard                |
| Scope creep on case studies          | Slips launch         | Timebox each case study; ship link-out first, embed later       |
| SEO without SSR                      | Lower ranking        | Prerender/SSG static routes; add JSON-LD + sitemap              |
| Content backlog (writing posts)      | Empty blog at launch | Write 2–3 posts in Sprint 4 as a hard gate                      |

---

## 9. Definition of Done (project-level)

- All sitemap routes implemented and reachable from nav/footer.
- Four portfolio case studies live with real content + working links.
- Blog supports MDX, code, math, tags, search, RSS, OG images.
- Lighthouse: Performance ≥ 95, Accessibility ≥ 95, SEO 100.
- CI enforces lint + typecheck + build + Lighthouse budget; e2e smoke passes.
- Deployed to custom domain over HTTPS with analytics enabled.

---

## 10. Immediate Next Actions (start here)

1. Approve **Option B** architecture (or choose A).
2. Provide brand inputs: **name, tagline, accent color, social links, resume PDF**.
3. Confirm per project whether to **link out or embed** (DOT, MedRoute, HKI, Sullix).
4. Greenlight Sprint 0 — I will scaffold structure, MDX pipeline, CI, and the styleguide.

## 11. Optional: Next.js migration note

If SEO/SSR becomes critical, migrate the same `content/` + design system to Next.js (App Router) for SSG/ISR and built-in image/OG optimization. The content model in §5 is framework-agnostic, so this is a low-risk v2 move.
