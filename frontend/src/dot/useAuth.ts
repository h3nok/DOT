import { useCallback, useEffect, useState } from "react";

// All auth routes now live in the orchestrator at /v1/auth/*.
// The Flask /api/otp/* routes are no longer used.
const ORCHESTRATOR_BASE = (
  import.meta.env.VITE_ORCHESTRATOR_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const AUTH_BASE = `${ORCHESTRATOR_BASE}/v1/auth`;

export interface AuthUser {
  id: string;
  display_name: string | null;
  role: string;
  is_owner: boolean;
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
  const res = await fetch(`${AUTH_BASE}${path}`, {
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
      const res = await fetch(`${AUTH_BASE}/session`, {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await res.json().catch(() => ({}));
      setUser(payload?.user ?? null);
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
        return { ok: false, error: payload?.detail || "Could not send code." };
      }
      return { ok: true, devCode: payload?.dev_code };
    },
    [],
  );

  const verifyCode = useCallback(
    async (
      email: string,
      code: string,
      displayName?: string,
    ): Promise<VerifyResult> => {
      const { res, payload } = await post("/otp/verify", {
        email,
        code,
        display_name: displayName,
      });
      if (!res.ok) {
        return { ok: false, error: payload?.detail || "Could not verify." };
      }
      const verified: AuthUser | undefined = payload?.user;
      if (verified) setUser(verified);
      return { ok: true, user: verified };
    },
    [],
  );

  const logout = useCallback(async () => {
    await post("/logout").catch(() => undefined);
    setUser(null);
  }, []);

  const createInvite = useCallback(async (): Promise<InviteResult> => {
    const { res, payload } = await post("/invites");
    if (!res.ok) {
      return {
        ok: false,
        error: payload?.detail || "Could not create invitation.",
      };
    }
    return { ok: true, token: payload?.token };
  }, []);

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
