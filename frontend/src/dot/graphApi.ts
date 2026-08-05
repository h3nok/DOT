import { api, PROFILE_OWNER_ID } from "./orchestrator";
import type { DotNode } from "./types";

/**
 * graphApi — the profile graph's link to the backend.
 *
 * The graph lives in two places: the server (the source of truth, shared across
 * every device and visitor) and localStorage (an offline cache + optimistic
 * layer). Server-side it is not a blob but real nodes joined by `contains`
 * edges, so the tree a visitor sees is the same graph the twin cites. Anyone can
 * read a published profile; only the signed-in owner can write one.
 */

export interface RemoteGraph {
  graph: DotNode | null;
  updatedAt: string | null;
}

interface ProfileGraphResponse {
  owner_id: string;
  graph: DotNode | null;
  updated_at: string | null;
}

/** Fetch the published profile graph. Returns null graph when none is stored. */
export async function fetchGraph(
  signal?: AbortSignal,
): Promise<RemoteGraph | null> {
  const result = await api<ProfileGraphResponse>(
    `/v1/graph/profile?owner_id=${encodeURIComponent(PROFILE_OWNER_ID)}`,
    { signal },
  );
  if (!result.ok || !result.data) return null;
  return {
    graph: result.data.graph ?? null,
    updatedAt: result.data.updated_at ?? null,
  };
}

/** Persist the profile graph. Requires an owner session. */
export async function publishGraph(graph: DotNode): Promise<boolean> {
  const result = await api<ProfileGraphResponse>("/v1/graph/profile", {
    method: "PUT",
    body: { graph },
  });
  return result.ok;
}
