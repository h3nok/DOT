import { useCallback, useEffect, useState } from "react";

/**
 * useInviteArrival — resolve an invitation the visitor arrived with.
 *
 * DOT is invite-only. When someone opens a link like `/DOT/?invite=<token>`,
 * this reads the token, validates it server-side (the client is never trusted),
 * and surfaces who invited them and any note — so the graph can welcome them
 * with a bloom instead of a gate. Dismissing strips the param from the URL so a
 * refresh stays quiet.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);

export interface InviteArrival {
  from?: string | null;
  to?: string | null;
  note?: string | null;
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
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/invite/check?token=${encodeURIComponent(token)}`,
          { credentials: "include", cache: "no-store" },
        );
        const payload = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && payload?.success) {
          setArrival(payload.data as InviteArrival);
          setOpen(true);
        }
      } catch {
        /* a bad link simply doesn't open a welcome */
      }
    })();
    return () => {
      cancelled = true;
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
