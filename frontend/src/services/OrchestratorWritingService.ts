import { authedFetch } from "./orchestratorHttp";
import { ORCHESTRATOR_OWNER_ID, ORCHESTRATOR_URL } from "./OrchestratorPublicationService";

export interface WritingWorkspace { id: string; title: string; slug: string }
export interface WritingWork { id: string; canonical_slug: string; kind: string; lifecycle_state: string }
export interface WritingRevision { id: string; title: string; summary: string | null; revision_number: number }
export interface WritingDraft { title: string; summary: string; body: string; claims?: WritingClaim[] }
export interface WritingClaim {
  statement: string;
  level: "" | "Observation" | "Model" | "Hypothesis" | "Speculation";
  origin: "author_originated" | "sourced";
  source: string;
}
export interface WritingRelease { release_number: number; release_status: string }
export interface ReleasedWriting {
  work_id: string; work_slug: string; title: string; summary: string | null;
  kind: string; release_number: number; released_at: string;
  withdrawn_at: string | null;
}
export interface WritingDelivery {
  manifest?: {
    title: string; summary: string | null;
    release: { number: number };
    revision: { content_hash: string };
    claims: { statement: string; epistemic_level: string; origin: string }[];
    sources?: { external_uri: string; locator: string | null; relation: string }[];
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
    const text = await response.text();
    throw new Error(text || `Writing request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

async function privateRequest<T>(path: string, payload?: unknown, signal?: AbortSignal): Promise<T> {
  return json<T>(await authedFetch(`${base}${path}`, {
    ownerId: ORCHESTRATOR_OWNER_ID, method: payload === undefined ? "GET" : "POST", json: payload, signal,
  }));
}

export const fetchWritingWorkspace = (signal?: AbortSignal) => privateRequest<WritingWorkspace>(`/workspace?space=${encodeURIComponent(space)}`, undefined, signal);
export const fetchWritingWorks = (spaceId: string, signal?: AbortSignal) => privateRequest<WritingWork[]>(`/spaces/${encodeURIComponent(spaceId)}/works`, undefined, signal);
export const createWritingWork = (spaceId: string, slug: string) => privateRequest<WritingWork>(`/spaces/${encodeURIComponent(spaceId)}/works`, { kind: "essay", canonical_slug: slug });
export const saveWritingRevision = (workId: string, draft: WritingDraft) => privateRequest<WritingRevision>(`/works/${encodeURIComponent(workId)}/revisions`, {
  title: draft.title.trim(), summary: draft.summary.trim() || null, body_markdown: draft.body,
});

export async function fetchWritingDraft(workId: string): Promise<WritingDraft | null> {
  const revisions = await privateRequest<WritingRevision[]>(`/works/${encodeURIComponent(workId)}/revisions`);
  const revision = revisions.sort((first, second) => second.revision_number - first.revision_number)[0];
  if (!revision) return null;
  const response = await authedFetch(`${base}/revisions/${encodeURIComponent(revision.id)}/body?include_claims=true`, { ownerId: ORCHESTRATOR_OWNER_ID });
  if (!response.ok) throw new Error("The saved manuscript could not be opened.");
  const editor = await response.json() as { body: string; claims: WritingClaim[] };
  return { title: revision.title, summary: revision.summary || "", body: editor.body, claims: editor.claims };
}

async function attachClaims(revision: WritingRevision, claims: WritingClaim[]) {
  for (const [index, claim] of claims.entries()) {
    const key = `claim-${index + 1}`;
    await privateRequest(`/revisions/${encodeURIComponent(revision.id)}/claims`, {
      canonical_key: key, statement: claim.statement.trim(), epistemic_level: claim.level, origin: claim.origin,
    });
    if (claim.origin === "sourced" && claim.source.trim()) {
      await privateRequest(`/revisions/${encodeURIComponent(revision.id)}/sources`, { claim_key: key, external_uri: claim.source.trim() });
    }
  }
}

export async function saveWritingDraft(workId: string, draft: WritingDraft, claims: WritingClaim[]) {
  const annotated = claims.filter((claim) => claim.statement.trim());
  if (annotated.some((claim) => !claim.level)) throw new Error("Choose a level for every entered claim before saving.");
  const revision = await saveWritingRevision(workId, draft);
  await attachClaims(revision, annotated);
  return revision;
}

export async function releaseWriting(workId: string, draft: WritingDraft, claims: WritingClaim[]): Promise<WritingRelease> {
  if (!claims.length || claims.some((claim) => !claim.statement.trim() || !claim.level || (claim.origin === "sourced" && !/^https?:\/\//i.test(claim.source)))) {
    throw new Error("Every material claim needs a statement, level, and source where declared sourced.");
  }
  const revision = await saveWritingDraft(workId, draft, claims);
  const release = await privateRequest<WritingRelease>(`/works/${encodeURIComponent(workId)}/releases`, { revision_id: revision.id, visibility: "public" });
  if (release.release_status !== "released") throw new Error("The revision was saved, but the public release did not complete.");
  return release;
}

export async function fetchReleasedWriting(signal?: AbortSignal): Promise<ReleasedWriting[]> {
  const entries = await json<ReleasedWriting[]>(await fetch(`${base}/delivery/catalog?space=${encodeURIComponent(space)}`, { signal, cache: "no-store" }));
  return entries.filter((entry) => entry.kind === "essay" && !entry.withdrawn_at);
}

export const writingRoute = (workId: string, version?: number) => `/writing/${encodeURIComponent(workId)}${version ? `/releases/${version}` : ""}`;

export async function fetchWritingDelivery(workId: string, version?: number, signal?: AbortSignal): Promise<{ delivery: WritingDelivery; body: string }> {
  const path = `/delivery/works/${encodeURIComponent(workId)}${version ? `/releases/${version}` : ""}`;
  const delivery = await json<WritingDelivery>(await fetch(`${base}${path}`, { signal, cache: "no-store" }));
  if (delivery.withdrawn) return { delivery, body: "" };
  if (!delivery.body_ref || !delivery.manifest) throw new Error("The release is incomplete.");
  const body = await fetch(`${base}/delivery/body/${delivery.body_ref.split("/").map(encodeURIComponent).join("/")}`, { signal });
  if (!body.ok) throw new Error("The released text could not be loaded.");
  return { delivery, body: await body.text() };
}