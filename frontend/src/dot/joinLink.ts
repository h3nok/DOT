/**
 * joinLink — where a request to join is sent, on a deployment with no server.
 *
 * ADR-0001 makes growth trust-gated: DOT is invite-only and an invitation is
 * issued, never claimed. That governs *who gets in*; it has never meant the
 * platform should refuse to learn who is interested. Until the server-side,
 * rate-limited queue exists (ADR-0003), a request has to land somewhere.
 *
 * Deliberately not a public queue. GitHub Issues and Discussions on a public
 * repository would publish every requester's name and reason, which is the same
 * public list ADR-0012 refuses for supporters, wearing different clothes. A
 * `mailto:` reaches the steward directly with no third party and no audience;
 * an HTTPS form endpoint is equally acceptable if it is private.
 *
 * Unset means joining is not open, and the surface says so plainly rather than
 * pretending at a door that opens onto nothing.
 */

const RAW = import.meta.env.VITE_JOIN_URL?.trim() ?? "";

/** A configured request-to-join target, or null when joining is not open. */
export const JOIN_URL: string | null = /^(https:\/\/|mailto:)\S+$/.test(RAW)
  ? RAW
  : null;

/** True when the request leaves the browser as an email rather than a page. */
export const JOIN_IS_EMAIL = JOIN_URL?.startsWith("mailto:") ?? false;
