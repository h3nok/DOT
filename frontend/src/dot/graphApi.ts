import type { DotNode } from "./types";

/**
 * graphApi — the profile graph's link to the backend.
 *
 * The graph lives in two places: the server (the source of truth, shared across
 * every device and visitor) and localStorage (an offline cache + optimistic
 * layer). This client speaks to the Flask `/profile/graph` route: anyone can
 * read; only the owner (holding the token) can write.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);

const OWNER_ID = import.meta.env.VITE_PROFILE_OWNER_ID || "self";
const OWNER_TOKEN = import.meta.env.VITE_OWNER_TOKEN || "dev-owner-token";

export interface RemoteGraph {
  graph: DotNode | null;
  updatedAt: string | null;
}

/** Fetch the published profile graph. Returns null graph when none is stored. */
export async function fetchGraph(
  signal?: AbortSignal,
): Promise<RemoteGraph | null> {
  try {
    const res = await fetch(
      `${API_BASE}/profile/graph?owner=${encodeURIComponent(OWNER_ID)}`,
      { cache: "no-store", signal },
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const data = payload?.data;
    if (!data) return null;
    return { graph: data.graph ?? null, updatedAt: data.updated_at ?? null };
  } catch {
    return null;
  }
}

/** Persist the profile graph (owner only). Returns true on success. */
export async function publishGraph(graph: DotNode): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/profile/graph`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // Legacy fallback for token-based deploys; the authed session cookie is
        // the primary authorization and travels via credentials below.
        "X-Owner-Token": OWNER_TOKEN,
      },
      credentials: "include",
      body: JSON.stringify({ owner: OWNER_ID, graph }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
