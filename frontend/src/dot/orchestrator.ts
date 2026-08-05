/**
 * orchestrator — the one place the frontend learns where the backend lives.
 *
 * There used to be two backends and four different base-URL conventions. There
 * is now one service (ADR-0009), so there is one base URL and one fetch helper.
 * Everything goes through here so that auth, credentials and error shape are
 * decided once instead of per hook.
 */

export const ORCHESTRATOR_BASE = (
  import.meta.env.VITE_ORCHESTRATOR_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

/** The profile whose graph this deployment publishes at the root URL. */
export const PROFILE_OWNER_ID = import.meta.env.VITE_PROFILE_OWNER_ID || "self";

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

/**
 * Call the orchestrator. Always sends the session cookie; never throws, so
 * callers branch on `ok` rather than wrapping every call in try/catch.
 */
export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<ApiResult<T>> {
  const { method = "GET", body, signal, headers = {} } = options;
  try {
    const res = await fetch(`${ORCHESTRATOR_BASE}${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      signal,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (res.status === 204) return { ok: true, status: 204 };

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error:
          (payload && (payload.detail || payload.error)) ||
          `Request failed (${res.status})`,
      };
    }
    return { ok: true, status: res.status, data: payload as T };
  } catch (error) {
    if (signal?.aborted) return { ok: false, status: 0, error: "aborted" };
    return { ok: false, status: 0, error: "The service is unreachable." };
  }
}
