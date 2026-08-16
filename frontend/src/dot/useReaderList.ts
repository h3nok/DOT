import { useCallback, useEffect, useState } from "react";

import { api } from "./orchestrator";

/**
 * useReaderList — the open door (ADR-0025).
 *
 * `useJoin` asks to be let in and waits on a person. This asks for nothing but
 * a way to hear again, and no one decides anything about it. Keeping the two
 * clients separate is the point: reading is not belonging, and a shared client
 * would be the first place that distinction quietly collapsed.
 *
 * There is no subscriber count here and no endpoint that would produce one.
 */

export interface ReaderSubscribeAccepted {
  status: string;
  expires_in: number;
  /** Only present when no mail provider is configured (local development). */
  dev_code?: string | null;
}

/** Where the address was offered. A closed set the server also enforces. */
export type ReaderSource = "book" | "front" | "talk" | "concept" | "unknown";

export function useReaderList() {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void api<{ available: boolean }>("/v1/readers/status").then((result) => {
      if (!active) return;
      // A failed call means no reachable server, which is not the same as a
      // server saying "closed". Both end in the same fallback; the surface
      // still needs to be able to tell a missing door from a shut one.
      setAvailable(result.ok ? Boolean(result.data?.available) : false);
    });
    return () => {
      active = false;
    };
  }, []);

  const subscribe = useCallback(
    async (
      email: string,
      source: ReaderSource,
    ): Promise<{ accepted?: ReaderSubscribeAccepted; error?: string }> => {
      const result = await api<ReaderSubscribeAccepted>("/v1/readers/subscribe", {
        method: "POST",
        body: { email, source },
      });
      if (!result.ok || !result.data) {
        return { error: result.error ?? "That did not go through. Try again." };
      }
      return { accepted: result.data };
    },
    [],
  );

  const confirm = useCallback(
    async (
      email: string,
      code: string,
    ): Promise<{ token?: string; error?: string }> => {
      const result = await api<{ status: string; unsubscribe_token: string }>(
        "/v1/readers/confirm",
        { method: "POST", body: { email, code } },
      );
      if (!result.ok || !result.data) {
        return { error: result.error ?? "That code did not work." };
      }
      return { token: result.data.unsubscribe_token };
    },
    [],
  );

  const unsubscribe = useCallback(async (token: string): Promise<boolean> => {
    // The server answers identically for a real and an unknown token, so there
    // is nothing here to branch on and nothing to report back but "done".
    const result = await api<{ status: string }>("/v1/readers/unsubscribe", {
      method: "POST",
      body: { token },
    });
    return result.ok;
  }, []);

  return { available, subscribe, confirm, unsubscribe };
}
