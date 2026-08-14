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
  expiresAt?: string;
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

function responseError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;

  const body = payload as {
    detail?: unknown;
    error?: { message?: unknown };
  };
  if (typeof body.detail === "string") return body.detail;
  if (typeof body.error?.message === "string") return body.error.message;
  return fallback;
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
      try {
        const { res, payload } = await post("/otp/request", { email });
        if (!res.ok) {
          return {
            ok: false,
            error: responseError(payload, "Could not send code."),
          };
        }
        return { ok: true, devCode: payload?.dev_code };
      } catch {
        return {
          ok: false,
          error: "Sign-in is temporarily unavailable. Please try again.",
        };
      }
    },
    [],
  );

  const verifyCode = useCallback(
    async (
      email: string,
      code: string,
      displayName?: string,
    ): Promise<VerifyResult> => {
      try {
        const { res, payload } = await post("/otp/verify", {
          email,
          code,
          display_name: displayName,
        });
        if (!res.ok) {
          return {
            ok: false,
            error: responseError(payload, "Could not verify."),
          };
        }
        const verified: AuthUser | undefined = payload?.user;
        if (verified) setUser(verified);
        return { ok: true, user: verified };
      } catch {
        return {
          ok: false,
          error: "Sign-in is temporarily unavailable. Please try again.",
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await post("/logout").catch(() => undefined);
    setUser(null);
  }, []);

  const createInvite = useCallback(async (): Promise<InviteResult> => {
    try {
      const { res, payload } = await post("/invites");
      if (!res.ok) {
        return {
          ok: false,
          error: responseError(payload, "Could not create invitation."),
        };
      }
      const token =
        typeof payload?.token === "string" ? payload.token : undefined;
      if (!token) {
        return { ok: false, error: "The invitation response was incomplete." };
      }

      const url = new URL(
        import.meta.env.BASE_URL || "/",
        window.location.origin,
      );
      url.searchParams.set("invite", token);

      return {
        ok: true,
        token,
        link: url.toString(),
        expiresAt: payload?.expires_at,
      };
    } catch {
      return {
        ok: false,
        error: "Invitations are temporarily unavailable. Please try again.",
      };
    }
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
