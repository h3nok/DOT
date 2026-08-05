import { useCallback, useEffect, useState } from "react";

import { api } from "./orchestrator";

/**
 * useCircle — the networking client, personal-first.
 *
 * A circle is the set of members who joined through your invitations. It is
 * yours and nobody else's: the server only ever returns the signed-in member's
 * own circle, so this hook reads nothing until there is a session. It begins
 * empty and grows one accepted invitation at a time.
 */

export interface CircleMember {
  display_name: string | null;
  joined_at: string | null;
}

export interface Circle {
  owner_id: string;
  count: number;
  members: CircleMember[];
}

export function useCircle(enabled = true) {
  const [circle, setCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setCircle(null);
      setLoading(false);
      return;
    }
    const result = await api<Circle>("/v1/auth/circle");
    if (result.ok && result.data) setCircle(result.data);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { circle, loading, refresh };
}

/** Accept an invitation the visitor arrived with (requires a session). */
export async function acceptInvite(token: string): Promise<boolean> {
  const result = await api<{ accepted: boolean }>("/v1/auth/invites/accept", {
    method: "POST",
    body: { token },
  });
  return result.ok;
}
