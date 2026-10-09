# ADR-0041: About as the independent builder's personal home

- **Status:** Accepted
- **Date:** 2026-10-07
- **Deciders:** Founder (personal builder site, products, résumé, and contract inquiries)
- **Amends:** ADR-0033 (the scope of `/about`)

## Context

The founder is moving into independent contract work building digital assets.
The existing About page explains the book's author but does not expose the
recorded products, professional background, or a clear project inquiry.

## Decision

Use `/about` as the founder's personal builder home. Lead with independent
building, a finite portfolio, capabilities, and professional background. Keep
the author identity `/about#person`, original author summary, and released
preface; writing remains a distinct section of the personal page.

Keep positioning in `src/content/builder.json` and project facts in
`src/content/projects.json`, consumed by both the live page and static route
materialization. `author.json` remains the identity and credential source.
Do not invent employers, client results, biographies, or résumé assets. An
optional `resumeUrl` can link to a supplied résumé; until then the page shows
existing project roles and education and offers a full résumé request.

The primary action opens an email brief using the configured public contact,
with scope, audience, timeline, and budget prompts. With no email configured,
use the existing LinkedIn contact. Inquiries require no sign-in and create no
new application storage or third-party integration. Products without a real
destination remain descriptive rather than linking to unrelated pages.

Serves L2 (finite sections), L7 (honest destinations and résumé availability),
L9 (no tracking or inquiry collection), L10 (one prominent project action),
and L12 (supports a visitor seeking a builder). Violates no manifesto laws.

## Consequences

- Visitors can assess work and start a contract conversation from one page.
- Products and professional background are readable without JavaScript.
- The Academy and fixed publication boundaries retain their existing routes.
- Email composition depends on the visitor's email setup; the plain address
  and public profiles remain available for direct contact.
- A full downloadable résumé requires an author-supplied document or URL.
- Revisit if inquiries need a managed workflow rather than direct email.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| Keep About centered only on the book | Existing shape | Hides builder work and contract intent | Rejected |
| Separate portfolio domain | Independent branding | Splits identity and duplicates content | Deferred |
| Store inquiries in a new contact backend | Managed intake | Adds storage and privacy obligations before needed | Deferred |
| Personal builder home with direct contact | Meets the founder's intent using existing facts | Full résumé still needs a supplied asset | Chosen |
