/**
 * The orchestrator's authenticated fetch.
 *
 * Identity travels in the session cookie, so every call must send credentials.
 * `X-Owner-Id` is the orchestrator's `local_header` development adapter — the
 * server refuses to boot with that mode in production/staging, and a production
 * build must never assert whose data it is asking for.
 */

const DEV_OWNER_ID: string =
  import.meta.env.VITE_ORCHESTRATOR_OWNER_ID ||
  import.meta.env.VITE_PROFILE_DELIVERY_OWNER_ID ||
  "henok";

export interface AuthedInit extends Omit<RequestInit, "body"> {
  /** Development-only owner assertion. Ignored in production builds. */
  ownerId?: string;
  /** Serialized as a JSON body with the matching content type. */
  json?: unknown;
  idempotencyKey?: string;
}

export function authedFetch(url: string, init: AuthedInit = {}): Promise<Response> {
  const { ownerId, json, idempotencyKey, headers, ...rest } = init;

  const merged: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  };
  if (import.meta.env.DEV) merged["X-Owner-Id"] = ownerId ?? DEV_OWNER_ID;
  if (json !== undefined) merged["Content-Type"] = "application/json";
  if (idempotencyKey) merged["Idempotency-Key"] = idempotencyKey;

  return fetch(url, {
    cache: "no-store",
    ...rest,
    credentials: "include",
    headers: merged,
    body: json === undefined ? undefined : JSON.stringify(json),
  });
}
