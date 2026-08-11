/**
 * supportLink — the funding path a static deployment can still offer.
 *
 * ADR-0012 gives support a server plane: the orchestrator owns the price list,
 * a signed webhook is the ledger's only writer, and the client is never an
 * authority on money. None of that changes here. Until that service is
 * deployed there is simply no server to ask, and `/v1/support/options`
 * correctly reports support closed.
 *
 * A provider-hosted Stripe Payment Link stands in for that window. Stripe still
 * owns the amount and issues the receipt, and DOT still learns nothing about
 * the supporter — the client never names a price, because the price lives in
 * the link. What is deferred is only DOT's own accounting, never the
 * supporter's safety. When the orchestrator ships, the server plane takes over
 * and this path goes quiet on its own.
 */

const RAW = import.meta.env.VITE_SUPPORT_PAYMENT_LINK?.trim() ?? "";

/**
 * A configured Stripe Payment Link, or null when no direct path exists.
 *
 * Only HTTPS is accepted: this URL sends a member to a page that will ask for
 * payment details, so a misconfiguration must fail closed rather than downgrade
 * the connection.
 */
export const SUPPORT_PAYMENT_LINK: string | null = /^https:\/\/\S+$/.test(RAW)
  ? RAW
  : null;
