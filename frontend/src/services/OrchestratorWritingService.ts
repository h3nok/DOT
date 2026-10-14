import { authedFetch } from "./orchestratorHttp";
import { ORCHESTRATOR_URL } from "./OrchestratorPublicationService";

export interface WritingWorkspace { id: string; title: string; slug: string }
export interface WritingWork { id: string; canonical_slug: string; kind: string; lifecycle_state: string }
export interface WritingRevision { id: string; title: string; summary: string | null; revision_number: number }
export interface WritingPresentation {
  format: "essay" | "case-study" | "letter";
  series: string;
  cover: { path: string; alt: string; caption: string } | null;
  levels: Array<Exclude<WritingClaim["level"], "">>;
  concepts: string[];
  published?: string | null;
  updated?: string | null;
}
export interface WritingAsset {
  id?: string; path: string; src: string; width: number; height: number; bytes: number;
  data_base64?: string; source_revision_id?: string;
}
export const emptyPresentation = (): WritingPresentation => ({ format: "essay", series: "", cover: null, levels: [], concepts: [] });
export interface WritingDraft {
  title: string; summary: string; body: string; claims?: WritingClaim[];
  presentation?: WritingPresentation; assets?: WritingAsset[];
  revisionId?: string; revisionNumber?: number;
}
export interface WritingClaim {
  statement: string;
  level: "" | "Observation" | "Model" | "Hypothesis" | "Speculation";
  origin: "author_originated" | "sourced" | "no_external_source";
  source: string;
}
export const emptyClaim = (): WritingClaim => ({ statement: "", level: "", origin: "author_originated", source: "" });
export interface WritingRelease { release_number: number; release_status: string }
export interface ReleasedWriting {
  work_id: string; work_slug: string; title: string; summary: string | null;
  kind: string; release_number: number; released_at: string;
  withdrawn_at: string | null;
  presentation?: WritingPresentation;
  cover?: { src: string; alt: string; caption?: string; width: number; height: number } | null;
}
export interface WritingDelivery {
  manifest?: {
    title: string; summary: string | null;
    release: { number: number };
    revision: { content_hash: string };
    claims: { statement: string; epistemic_level: string; origin: string }[];
    sources?: { external_uri: string; locator: string | null; relation: string }[];
    presentation?: WritingPresentation;
    assets?: Array<WritingAsset & { sha256: string }>;
  };
  body_ref?: string;
  withdrawn?: boolean;
  title?: string;
  reason?: string;
}

const base = `${ORCHESTRATOR_URL.replace(/\/$/, "")}/v1/academy`;
const space = import.meta.env.VITE_ACADEMY_SPACE_SLUG || "dot-academy";

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload?.detail ?? payload?.error?.message;
    throw new Error(typeof detail === "string" ? detail : `The writing request could not complete (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

async function privateRequest<T>(path: string, payload?: unknown, signal?: AbortSignal): Promise<T> {
  return json<T>(await authedFetch(`${base}${path}`, {
    sessionOnly: true, method: payload === undefined ? "GET" : "POST", json: payload, signal,
  }));
}

export const fetchWritingWorkspace = (signal?: AbortSignal) => privateRequest<WritingWorkspace>(`/workspace?space=${encodeURIComponent(space)}`, undefined, signal);
export const fetchWritingWorks = (spaceId: string, signal?: AbortSignal) => privateRequest<WritingWork[]>(`/spaces/${encodeURIComponent(spaceId)}/works`, undefined, signal);
export const createWritingWork = (spaceId: string, slug: string) => privateRequest<WritingWork>(`/spaces/${encodeURIComponent(spaceId)}/works`, { kind: "essay", canonical_slug: slug });
export async function fetchWritingDraft(workId: string): Promise<WritingDraft | null> {
  const revisions = await privateRequest<WritingRevision[]>(`/works/${encodeURIComponent(workId)}/revisions`);
  const revision = revisions.sort((first, second) => second.revision_number - first.revision_number)[0];
  if (!revision) return null;
  const response = await authedFetch(`${base}/revisions/${encodeURIComponent(revision.id)}/body?include_claims=true`, { sessionOnly: true });
  if (!response.ok) throw new Error("The saved manuscript could not be opened.");
  const editor = await response.json() as { body: string; claims: WritingClaim[]; presentation?: WritingPresentation; assets?: WritingAsset[] };
  return {
    title: revision.title, summary: revision.summary || "", body: editor.body, claims: editor.claims,
    revisionId: revision.id, revisionNumber: revision.revision_number,
    presentation: editor.presentation ?? emptyPresentation(),
    assets: (editor.assets ?? []).map(asset => ({ ...asset, src: writingMediaUrl(asset.src) })),
  };
}

export const writingMediaUrl = (path: string): string => path.startsWith("/v1/") ? `${ORCHESTRATOR_URL.replace(/\/$/, "")}${path}` : path;

export function saveWritingSnapshot(workId: string, draft: WritingDraft, claims: WritingClaim[], requestId: string, baseRevisionId: string | null) {
  return privateRequest<WritingRevision>(`/works/${encodeURIComponent(workId)}/drafts`, {
    request_id: requestId, base_revision_id: baseRevisionId,
    title: draft.title, summary: draft.summary, body: draft.body, claims,
    presentation: draft.presentation ?? emptyPresentation(),
    assets: (draft.assets ?? []).map(({ path, data_base64, source_revision_id }) => (
      data_base64 !== undefined ? { path, data_base64 } : { path, source_revision_id }
    )),
  });
}

export async function releaseSavedWriting(workId: string, revisionId: string): Promise<WritingRelease> {
  const release = await privateRequest<WritingRelease>(`/works/${encodeURIComponent(workId)}/releases`, { revision_id: revisionId, visibility: "public" });
  if (release.release_status !== "released") throw new Error("The saved revision has not been published.");
  return release;
}

export async function fetchReleasedWriting(signal?: AbortSignal): Promise<ReleasedWriting[]> {
  const entries = await json<ReleasedWriting[]>(await fetch(`${base}/delivery/catalog?space=${encodeURIComponent(space)}`, { signal, cache: "no-store" }));
  return entries.filter((entry) => entry.kind === "essay" && !entry.withdrawn_at).map(entry => ({
    ...entry, cover: entry.cover ? { ...entry.cover, src: writingMediaUrl(entry.cover.src) } : null,
  }));
}

export const writingRoute = (workId: string, version?: number) => `/writing/${encodeURIComponent(workId)}${version ? `/releases/${version}` : ""}`;

export async function fetchWritingDelivery(workId: string, version?: number, signal?: AbortSignal): Promise<{ delivery: WritingDelivery; body: string }> {
  const path = `/delivery/works/${encodeURIComponent(workId)}${version ? `/releases/${version}` : ""}`;
  const delivery = await json<WritingDelivery>(await fetch(`${base}${path}`, { signal, cache: "no-store" }));
  if (delivery.withdrawn) return { delivery, body: "" };
  if (!delivery.body_ref || !delivery.manifest) throw new Error("The release is incomplete.");
  const body = await fetch(`${base}/delivery/body/${delivery.body_ref.split("/").map(encodeURIComponent).join("/")}`, { signal });
  if (!body.ok) throw new Error("The released text could not be loaded.");
  if (delivery.manifest.assets) delivery.manifest.assets = delivery.manifest.assets.map(asset => ({ ...asset, src: writingMediaUrl(asset.src) }));
  return { delivery, body: await body.text() };
}
