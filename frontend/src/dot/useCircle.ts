import { useCallback, useEffect, useState } from "react";

/**
 * useCircle — the networking client, personal-first.
 *
 * Reads the owner's circle from `/api/circle`. The circle begins with just the
 * owner and grows one accepted invitation at a time, so for a fresh profile it
 * is intentionally quiet. Reads are public (the profile can show "a circle of
 * N"); joining happens through the invite-accept flow.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);

export interface CircleMember {
  name: string;
  note?: string | null;
  joined_at?: string | null;
}

export interface Circle {
  owner: string;
  count: number;
  members: CircleMember[];
}

export function useCircle(owner = "self") {
  const [circle, setCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/circle?owner=${encodeURIComponent(owner)}`,
        { credentials: "include", cache: "no-store" },
      );
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload?.success) setCircle(payload.data as Circle);
    } catch {
      /* keep prior */
    } finally {
      setLoading(false);
    }
  }, [owner]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { circle, loading, refresh };
}

/** Accept an invitation the visitor arrived with (requires a session). */
export async function acceptInvite(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/invite/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    });
    const payload = await res.json().catch(() => ({}));
    return res.ok && Boolean(payload?.success);
  } catch {
    return false;
  }
}
