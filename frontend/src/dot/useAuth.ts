import { useCallback, useEffect, useState } from "react";

/**
 * useAuth — OTP sign-in for the owner.
 *
 * Talks to the Flask OTP routes (`/api/otp/*`). The flow is two steps: request
 * a code to an email, then verify the 6-digit code, which sets a signed,
 * httpOnly session cookie. The hook tracks the current session so the graph can
 * unlock authoring for the owner and the profile graph can publish to the
 * server. Cookies travel via the same-origin dev proxy, so no token is exposed
 * in the bundle.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);

export interface AuthUser {
  id: number;
  email: string;
  is_owner: boolean;
  name?: string | null;
}

interface RequestResult {
  ok: boolean;
  error?: string;
  /** Present only in local dev (no email provider configured). */
  devCode?: string;
}

interface VerifyResult {
  ok: boolean;
  error?: string;
  user?: AuthUser;
}

interface InviteResult {
  ok: boolean;
  error?: string;
  link?: string;
  token?: string;
}

async function post(path: string, body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => ({}));
  return { res, payload };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/otp/session`, {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await res.json().catch(() => ({}));
      setUser(payload?.data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestCode = useCallback(
    async (email: string): Promise<RequestResult> => {
      const { res, payload } = await post("/otp/request", { email });
      if (!res.ok) {
        return { ok: false, error: payload?.error || "Could not send code." };
      }
      return { ok: true, devCode: payload?.data?.dev_code };
    },
    [],
  );

  const verifyCode = useCallback(
    async (email: string, code: string): Promise<VerifyResult> => {
      const { res, payload } = await post("/otp/verify", { email, code });
      if (!res.ok) {
        return { ok: false, error: payload?.error || "Could not verify." };
      }
      const verified: AuthUser | undefined = payload?.data?.user;
      if (verified) setUser(verified);
      return { ok: true, user: verified };
    },
    [],
  );

  const logout = useCallback(async () => {
    await post("/otp/logout").catch(() => undefined);
    setUser(null);
  }, []);

  const createInvite = useCallback(
    async (input?: {
      email?: string;
      note?: string;
    }): Promise<InviteResult> => {
      const { res, payload } = await post("/invite/create", input ?? {});
      if (!res.ok) {
        return {
          ok: false,
          error: payload?.error || "Could not create invitation.",
        };
      }
      return {
        ok: true,
        link: payload?.data?.link,
        token: payload?.data?.token,
      };
    },
    [],
  );

  return {
    user,
    loading,
    isOwner: Boolean(user?.is_owner),
    requestCode,
    verifyCode,
    logout,
    createInvite,
    refresh,
  };
}
