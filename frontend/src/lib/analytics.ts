/** Aggregate public pageviews only (ADR-0024): no remote tracker, client identity,
 * scroll measurements, active-time measurements, or custom events. */
const DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim() ?? "";
const SRC = import.meta.env.VITE_PLAUSIBLE_SRC?.trim() || "https://plausible.io/js/script.js";
const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
export const ANALYTICS_DOMAIN = DOMAIN_PATTERN.test(DOMAIN) ? DOMAIN.toLowerCase() : null;
const installed = new WeakSet<Window>();

// Deliberately finite. Private, invitation, unsubscribe and preview paths are absent.
const PUBLIC_PATH = /^(?:\/|\/(?:about|contact|community|blog|film|films|videos|applied|support|join|publications|readers|privacy|terms)|\/academy(?:\/films)?|\/doctrine(?:\/[a-z0-9-]+)?|\/amm(?:\/(?:power|capital|editions))?|\/essays(?:\/[a-z0-9-]+)?|\/writing\/[a-z0-9-]+(?:\/releases\/\d+)?|\/book\/digital-organism-theory(?:\/[a-z0-9-]+)?|\/read\/[a-z0-9-]+\/[a-z0-9-]+(?:\/[a-z0-9-]+)?)$/i;

function endpoint(): string | null {
  try {
    const source = new URL(SRC);
    if (source.protocol !== "https:" || source.username || source.password) return null;
    return `${source.origin}/api/event`;
  } catch { return null; }
}

function optedOut(win: Window): boolean {
  const navigator = win.navigator as Navigator & { globalPrivacyControl?: boolean };
  if (navigator.doNotTrack === "1" || navigator.doNotTrack === "yes" || navigator.globalPrivacyControl || navigator.webdriver) return true;
  try {
    // Honor the existing Plausible opt-out. Never create or update device storage.
    return win.localStorage.getItem("plausible_ignore") === "true";
  } catch { return true; }
}

function referralOrigin(value: string): string {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.origin : "";
  } catch { return ""; }
}

/** Install once; navigation continues normally if measurement is disabled or fails. */
export function initAnalytics(doc: Document | undefined = globalThis.document): boolean {
  const win = doc?.defaultView;
  const destination = endpoint();
  if (!ANALYTICS_DOMAIN || !win || !destination || installed.has(win)) return false;
  const host = win.location.hostname.toLowerCase();
  if (win.location.protocol !== "https:" || (host !== ANALYTICS_DOMAIN && !host.endsWith(`.${ANALYTICS_DOMAIN}`)) || optedOut(win)) return false;
  // Invitation URLs carry a private token. Do not install measurement there.
  if (/^\/invite\/?$/.test(win.location.pathname)) return false;
  installed.add(win);
  const domain = ANALYTICS_DOMAIN;
  const referrer = referralOrigin(doc.referrer);
  let previousPath: string | undefined;

  function pageview() {
    if (!win) return;
    const path = win.location.pathname.replace(/\/+$/, "") || "/";
    if (path === previousPath) return;
    previousPath = path;
    if (!PUBLIC_PATH.test(path) || optedOut(win)) return;
    const body = JSON.stringify({ name: "pageview", url: `${win.location.origin}${path}`, domain, referrer });
    try {
      void win.fetch(destination!, {
        method: "POST", body, headers: { "Content-Type": "text/plain" },
        credentials: "omit", referrerPolicy: "no-referrer", keepalive: true, mode: "cors",
      }).catch(() => { /* An unavailable counter must never interrupt reading. */ });
    } catch { /* Fetch may be unavailable or blocked by the reader. */ }
  }

  for (const method of ["pushState", "replaceState"] as const) {
    const original = win.history[method];
    win.history[method] = function (...args: Parameters<History[typeof method]>) {
      original.apply(this, args);
      pageview();
    };
  }
  win.addEventListener("popstate", pageview);
  pageview();
  return true;
}
