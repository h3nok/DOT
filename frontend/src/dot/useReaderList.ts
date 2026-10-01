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

/**
 * Leave the list. Needs no session and asks no status first, so the page a
 * message links to can call it the moment it opens.
 */
export async function leaveReaderList(token: string): Promise<boolean> {
  // The server answers identically for a real and an unknown token, so there
  // is nothing here to branch on and nothing to report back but "done".
  const result = await api<{ status: string }>("/v1/readers/unsubscribe", {
    method: "POST",
    body: { token },
  });
  return result.ok;
}

export function useReaderList() {
  const [availability, setAvailability] = useState<{
    available: boolean | null;
    error: string | null;
  }>({ available: null, error: null });

  useEffect(() => {
    let active = true;
    void api<{ available: boolean }>("/v1/readers/status").then((result) => {
      if (!active) return;
      if (!result.ok) {
        setAvailability({
          available: false,
          error: result.error ?? "The reader list could not be reached.",
        });
        return;
      }
      if (typeof result.data?.available !== "boolean") {
        setAvailability({
          available: false,
          error: "The reader list returned an unexpected response.",
        });
        return;
      }
      setAvailability({ available: result.data.available, error: null });
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

  return {
    available: availability.available,
    availabilityError: availability.error,
    subscribe,
    confirm,
    unsubscribe: leaveReaderList,
  };
}
