/**
 * Steward-editable public copy (ADR-0021).
 *
 * The released wording is compiled into the bundle. This service fetches only
 * the *overrides* the steward has published, so every failure mode here — no
 * orchestrator configured, network down, empty database — degrades to the
 * released copy rather than to a blank surface. Nothing on this path is allowed
 * to throw into a render.
 */

import { authedFetch } from "./orchestratorHttp";

const ORCHESTRATOR_URL: string = (
  import.meta.env.VITE_ORCHESTRATOR_URL || ""
).replace(/\/$/, "");

/** With no orchestrator configured the site is simply the released edition. */
export const siteContentAvailable = (): boolean => Boolean(ORCHESTRATOR_URL);

const url = (path: string): string => `${ORCHESTRATOR_URL}${path}`;

export type SiteContentBlocks = Readonly<Record<string, string>>;

export interface SiteContentDraft {
  key: string;
  published_value: string | null;
  draft_value: string | null;
  updated_at: string | null;
  published_at: string | null;
}

/**
 * Published overrides only. Returns `{}` on any failure — a reader must never
 * see an error because the copy service is unreachable.
 */
export async function fetchPublishedContent(
  signal?: AbortSignal,
): Promise<SiteContentBlocks> {
  if (!siteContentAvailable()) return {};

  try {
    const response = await fetch(url("/v1/site-content"), {
      signal,
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) return {};
    const payload = (await response.json()) as { blocks?: SiteContentBlocks };
    return payload?.blocks ?? {};
  } catch {
    return {};
  }
}

export async function fetchDrafts(signal?: AbortSignal): Promise<SiteContentDraft[]> {
  if (!siteContentAvailable()) return [];

  try {
    const response = await authedFetch(url("/v1/site-content/drafts"), { signal });
    if (!response.ok) return [];
    const payload = (await response.json()) as { blocks?: SiteContentDraft[] };
    return payload?.blocks ?? [];
  } catch {
    return [];
  }
}

async function detailOf(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null);
  const detail = (payload as { detail?: unknown } | null)?.detail;
  return typeof detail === "string" ? detail : `Request failed (${response.status}).`;
}

/**
 * Save a block. Writes are the one path here that surfaces failure, because a
 * steward who thinks an edit saved when it did not is worse off than one told.
 */
export async function saveBlock(
  key: string,
  value: string,
  options: { publish?: boolean } = {},
): Promise<void> {
  if (!siteContentAvailable()) {
    throw new Error("No orchestrator is configured for this build.");
  }

  const response = await authedFetch(url(`/v1/site-content/${encodeURIComponent(key)}`), {
    method: "PUT",
    json: { value, publish: options.publish ?? false },
  });
  if (!response.ok) throw new Error(await detailOf(response));
}

/** Drop the override so the released wording takes over again. */
export async function revertBlock(key: string): Promise<void> {
  if (!siteContentAvailable()) return;

  const response = await authedFetch(url(`/v1/site-content/${encodeURIComponent(key)}`), {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 404) throw new Error(await detailOf(response));
}
