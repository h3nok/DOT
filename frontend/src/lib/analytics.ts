/**
 * analytics — how many people read, and nothing about who they are.
 *
 * ADR-0004 L9 forbids behavioural trackers, and it means it: no `gtag`, no
 * `fbq`, no Segment, no session recording, no cross-site identity. That law
 * bans *profiling*, not *counting*. Publishing a book to nobody and publishing
 * it to a thousand readers are different facts, and the steward is entitled to
 * know which one is happening (ADR-0024).
 *
 * Plausible is the one measurement that survives the law: no cookies, no
 * localStorage, no fingerprint, no cross-site identifier, nothing persisted on
 * the reader's device, and no per-person record to unseal later. It reports
 * aggregates — pageviews, referrers, countries — and cannot answer "what did
 * this person read," which is exactly the question DOT refuses to be able to
 * answer about anyone.
 *
 * Unset means unmeasured, and that has to keep working: a fork, a local build,
 * or a steward who wants no analytics at all sets nothing and no third-party
 * request is made. There is no default domain and no silent fallback.
 */

/** Plausible's hosted script. Override to run a self-hosted instance. */
const DEFAULT_SRC = "https://plausible.io/js/script.js";

const DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim() ?? "";
const SRC = import.meta.env.VITE_PLAUSIBLE_SRC?.trim() || DEFAULT_SRC;

/** Marks the injected tag so a re-entrant call cannot double-count a pageview. */
const MARKER = "data-dot-analytics";

/** A bare hostname — `dotheory.org`. Not a URL, and never a wildcard. */
const DOMAIN_PATTERN = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

/** True when a measurable domain is configured. */
export const ANALYTICS_DOMAIN: string | null = DOMAIN_PATTERN.test(DOMAIN)
  ? DOMAIN
  : null;

/**
 * Inject the counter, once, if one is configured.
 *
 * Returns whether a script was added, so the caller and the tests can tell
 * "measuring" from "deliberately not measuring" without reading the DOM.
 */
export function initAnalytics(doc: Document | undefined = globalThis.document): boolean {
  if (!ANALYTICS_DOMAIN || !doc) return false;
  if (!SRC.startsWith("https://")) return false;
  if (doc.querySelector(`script[${MARKER}]`)) return false;

  const script = doc.createElement("script");
  script.defer = true;
  script.src = SRC;
  script.setAttribute("data-domain", ANALYTICS_DOMAIN);
  script.setAttribute(MARKER, "");
  doc.head.appendChild(script);
  return true;
}
