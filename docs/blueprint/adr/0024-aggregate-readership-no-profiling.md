# ADR-0024: Aggregate readership without behavioural profiling

- **Status:** Accepted
- **Date:** 2026-08-15
- **Deciders:** Founder

## Context

ADR-0004 L9 forbids behavioural trackers, and `manifesto-laws.test.ts` enforces it by
scanning for `gtag`, `fbq`, `mixpanel`, `posthog`, `@segment/`, `googletagmanager` and
`amplitude`. The law has been read since as a ban on *all* measurement, so the public
reader has shipped with none.

That reading costs more than it protects. Book One is published and the steward cannot
distinguish "nobody has found this" from "people are reading and not writing back."
Those call for opposite responses, and without the distinction every decision about the
book — where to speak, what to write next, whether the reader's structure works — is
made blind. Refusing to look is not a form of respect for the reader; it is a refusal to
learn whether the work reaches anyone.

L9's stated rationale is "no third-party tracking or behavioural profiling." The harm it
names is the *dossier*: an identifier that follows a person between sites and sessions,
accumulating a record that can later be joined, sold, subpoenaed, or breached. Counting
how many times a page was served creates no such record.

## Decision

The public surfaces may carry **Plausible Analytics**, and no other analytics.

- Configured by `VITE_PLAUSIBLE_DOMAIN`, a bare hostname. **Unset means unmeasured**, and
  no third-party request is made — the default for forks, local builds, and any steward
  who wants none. There is no fallback domain.
- `VITE_PLAUSIBLE_SRC` may point at a self-hosted instance; it must be HTTPS.
- The only permitted collection is aggregate: pageviews, referrers, countries, and the
  reading routes themselves. No cookie, no `localStorage`, no device fingerprint, no
  cross-site identifier, nothing persisted on the reader's device, and no per-person row
  that could later be unsealed. `src/lib/analytics.ts` is the single injection point.
- Nothing measured here may be shown back to readers as a public counter. L5 stands: this
  is instrumentation for the steward, never a vanity metric on the page.

L9's forbidden list is unchanged and still enforced. This ADR does not widen it; it
records that counting readers was never what L9 prohibited.

## Consequences

- (+) The steward can tell whether the book is being read, and act on it.
- (+) The privacy commitment is kept in the strong form that matters: there is no
  per-person record to leak, because none is created.
- (−) A third-party script is now on the critical path when configured. It is deferred,
  and a fork or a cautious steward disables it by leaving one variable unset.
- (−) Aggregate data cannot answer who a reader is or what they read in sequence. This is
  the intended limit, not a gap to close later.
- **Revisit if:** Plausible changes its data practices, or the reader surfaces need
  per-person analysis — which would require a superseding ADR, not a configuration change.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| No analytics (status quo) | Maximally cautious; nothing to leak | Cannot distinguish no readers from silent readers; every downstream decision made blind | Rejected |
| Google Analytics / PostHog | Rich funnels, free tier, familiar | Behavioural profiling and cross-site identity — the exact harm L9 names | Rejected; still banned |
| Server-side log counting | No third party at all | The reader is a static Pages deploy with no server in the request path | Rejected as unavailable |
| Self-hosted Plausible | No third party; same aggregate model | Another service to run and secure for one number | Supported via `VITE_PLAUSIBLE_SRC`, not required |
| Plausible (hosted) | Cookieless, no fingerprint, no per-person record, aggregate only | A third-party request when enabled | **Accepted** |

## Amendment, 2026-10-31: enforce the pageview boundary locally

The current upstream tracker initializes engagement collection alongside
pageviews: [initialization](https://github.com/plausible/analytics/blob/master/tracker/src/plausible.js)
and [engagement payloads](https://github.com/plausible/analytics/blob/master/tracker/src/engagement.js).
That adds scroll depth and active time beyond this ADR's permitted collection.

Use the existing Plausible service through its documented
[Events API](https://plausible.io/docs/events-api), with one locally controlled
pageview sender in `src/lib/analytics.ts`. Do not load the remote tracker.
The only event name is `pageview`; payloads contain the configured domain,
public page URL without query or fragment, and referring origin only.
The browser sends no credentials or Referer header. No client identifier,
scroll measurement, active time, custom event, or storage write is added.

The existing domain and HTTPS source configuration remain compatible; the
source's origin selects `/api/event`, and its script is not fetched. Unset
configuration, local/foreign hosts, Do Not Track, Global Privacy Control,
automation, and the existing `plausible_ignore` opt-out disable collection.
Reading that one existing opt-out flag is permitted; writing device storage
or collecting an identifier remains forbidden. Private, preview, invitation,
and unsubscribe routes are excluded. Initial public loads and SPA route changes
count once per displayed path; fragment and query changes do not count.

This preserves the existing aggregate readership capability and serves L7,
L8, and L9. It does not authorize completion funnels, PDF-download events, or
new collection. Counts require the steward's private Plausible dashboard; a
working sender alone does not establish readership or improvement.
