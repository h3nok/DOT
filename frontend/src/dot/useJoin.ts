import { useCallback, useEffect, useState } from "react";

import { api } from "./orchestrator";

/**
 * useJoin — the request-to-join client.
 *
 * The server owns everything that matters here: whether the queue is open at
 * all, whether an address is real, and what happens next. This asks and
 * reports. It deliberately learns nothing about queue length or position —
 * there is no endpoint for it, because there is no such number to show.
 */

export type JoinStage = "form" | "verify" | "done";

export interface JoinRequestAccepted {
  status: string;
  expires_in: number;
  /** Only present when no mail provider is configured (local development). */
  dev_code?: string | null;
}

export function useJoin() {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void api<{ available: boolean }>("/v1/join/status").then((result) => {
      if (!active) return;
      // A failed call means no reachable server, which is not the same as a
      // server saying "closed" — both end in the same fallback, but the surface
      // needs to be able to tell that the door is missing rather than shut.
      setAvailable(result.ok ? Boolean(result.data?.available) : false);
    });
    return () => {
      active = false;
    };
  }, []);

  const request = useCallback(
    async (
      email: string,
      reason: string,
    ): Promise<{ accepted?: JoinRequestAccepted; error?: string }> => {
      const result = await api<JoinRequestAccepted>("/v1/join/requests", {
        method: "POST",
        body: { email, reason: reason.trim() || undefined },
      });
      if (!result.ok || !result.data) {
        return { error: result.error ?? "That did not go through. Try again." };
      }
      return { accepted: result.data };
    },
    [],
  );

  const verify = useCallback(
    async (email: string, code: string): Promise<{ ok: boolean; error?: string }> => {
      const result = await api<{ status: string }>("/v1/join/requests/verify", {
        method: "POST",
        body: { email, code: code.trim() },
      });
      return result.ok
        ? { ok: true }
        : { ok: false, error: result.error ?? "That code did not work." };
    },
    [],
  );

  return { available, request, verify };
}
