import { useCallback, useEffect, useState } from "react";

import { api } from "./orchestrator";

/**
 * useInviteArrival — resolve an invitation the visitor arrived with.
 *
 * DOT is invite-only. When someone opens a link like `/DOT/?invite=<token>`,
 * this reads the token, validates it server-side (the client is never trusted),
 * and surfaces who invited them — so the graph can welcome them with a bloom
 * instead of a gate. The server never returns who the invite was addressed to;
 * a link in the wrong hands must not leak a stranger's address. Dismissing
 * strips the param from the URL so a refresh stays quiet.
 */

export interface InviteArrival {
  valid: boolean;
  invited_by?: string | null;
  expires_at?: string | null;
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("invite");
  return value && value.trim() ? value.trim() : null;
}

export function useInviteArrival() {
  const [token] = useState<string | null>(() => readToken());
  const [arrival, setArrival] = useState<InviteArrival | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    (async () => {
      const result = await api<InviteArrival>(
        `/v1/auth/invites/check?token=${encodeURIComponent(token)}`,
        { signal: controller.signal },
      );
      // A spent or unknown link simply doesn't open a welcome.
      if (!result.ok || !result.data?.valid) return;
      setArrival(result.data);
      setOpen(true);
    })();
    return () => {
      controller.abort();
    };
  }, [token]);

  const dismiss = useCallback(() => {
    setOpen(false);
    if (typeof window !== "undefined" && token) {
      const url = new URL(window.location.href);
      url.searchParams.delete("invite");
      window.history.replaceState({}, "", url.toString());
    }
  }, [token]);

  return { open, arrival, token, dismiss };
}
