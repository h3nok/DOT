import { authedFetch } from "./orchestratorHttp";
import { ORCHESTRATOR_URL } from "./OrchestratorPublicationService";

export type DistributionPlatform = "linkedin" | "substack" | "medium";
export interface LinkedInConnection {
  configured: boolean;
  connected: boolean;
  display_name: string | null;
  expires_at: string | null;
}
export interface DistributionCopy {
  platform: DistributionPlatform;
  status: "sending" | "published" | "failed" | "needs_review" | "recorded";
  external_url: string | null;
  error_code: string | null;
}

const base = `${ORCHESTRATOR_URL.replace(/\/$/, "")}/v1/distribution`;
async function request<T>(path: string, json?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await authedFetch(`${base}${path}`, { method: json === undefined ? "GET" : "POST", json, signal });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: unknown; error?: { message?: unknown } } | null;
    const message = payload?.detail ?? payload?.error?.message;
    throw new Error(typeof message === "string" ? message : "The distribution request could not be completed.");
  }
  return response.json() as Promise<T>;
}
const releasePath = (workId: string, number: number) => `/works/${encodeURIComponent(workId)}/releases/${number}`;

export const fetchLinkedInConnection = (signal?: AbortSignal) => request<LinkedInConnection>("/linkedin", undefined, signal);
export const authorizeLinkedIn = () => request<{ authorization_url: string }>("/linkedin/authorize", { approved: true });
export const fetchDistributionCopies = (workId: string, number: number, signal?: AbortSignal) => request<DistributionCopy[]>(`${releasePath(workId, number)}/copies`, undefined, signal);
export const shareReleasedWritingOnLinkedIn = (workId: string, number: number) => request<DistributionCopy>(`${releasePath(workId, number)}/linkedin`, { approved: true });
export const recordDistributionCopy = (workId: string, number: number, platform: DistributionPlatform, url: string) => request<DistributionCopy>(`${releasePath(workId, number)}/copies`, { platform, url });
export async function disconnectLinkedIn() {
  const response = await authedFetch(`${base}/linkedin`, { method: "DELETE" });
  if (!response.ok) throw new Error("The connection could not be removed. Please try again.");
}
