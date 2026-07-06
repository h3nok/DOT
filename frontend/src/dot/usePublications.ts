import { useCallback, useEffect, useState } from "react";

/**
 * usePublications — the publication platform client.
 *
 * Talks to the Flask publications routes (`/api/publications*`). A publication
 * is durable work: the owner drafts it, then *releases* it (which stamps a
 * version + date and makes that release a stable, shareable object). Visitors
 * see released work; the owner sees drafts too and can publish. Reads are
 * public; writes ride the same session cookie as the rest of authoring.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);

export interface Publication {
  id: string;
  title: string;
  essence?: string | null;
  body?: string | null;
  status: "draft" | "released";
  version: number;
  released_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PublicationDraft {
  title: string;
  essence?: string;
  body?: string;
}

interface MutationResult {
  ok: boolean;
  error?: string;
  publication?: Publication;
}

async function call(path: string, method: string, body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    cache: "no-store",
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => ({}));
  return { res, payload };
}

export function usePublications(owner = "self") {
  const [items, setItems] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { res, payload } = await call(
        `/publications?owner=${encodeURIComponent(owner)}`,
        "GET",
      );
      if (res.ok && payload?.success) {
        setItems(payload.data.publications ?? []);
      }
    } catch {
      /* leave prior items in place */
    } finally {
      setLoading(false);
    }
  }, [owner]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (draft: PublicationDraft): Promise<MutationResult> => {
      const { res, payload } = await call("/publications", "POST", {
        owner,
        ...draft,
      });
      if (!res.ok) return { ok: false, error: payload?.error };
      await refresh();
      return { ok: true, publication: payload?.data?.publication };
    },
    [owner, refresh],
  );

  const update = useCallback(
    async (id: string, draft: PublicationDraft): Promise<MutationResult> => {
      const { res, payload } = await call(`/publications/${id}`, "PUT", {
        owner,
        ...draft,
      });
      if (!res.ok) return { ok: false, error: payload?.error };
      await refresh();
      return { ok: true, publication: payload?.data?.publication };
    },
    [owner, refresh],
  );

  const release = useCallback(
    async (id: string): Promise<MutationResult> => {
      const { res, payload } = await call(
        `/publications/${id}/release`,
        "POST",
        {
          owner,
        },
      );
      if (!res.ok) return { ok: false, error: payload?.error };
      await refresh();
      return { ok: true, publication: payload?.data?.publication };
    },
    [owner, refresh],
  );

  const remove = useCallback(
    async (id: string): Promise<MutationResult> => {
      const { res, payload } = await call(
        `/publications/${id}?owner=${encodeURIComponent(owner)}`,
        "DELETE",
      );
      if (!res.ok) return { ok: false, error: payload?.error };
      await refresh();
      return { ok: true };
    },
    [owner, refresh],
  );

  return { items, loading, refresh, create, update, release, remove };
}
