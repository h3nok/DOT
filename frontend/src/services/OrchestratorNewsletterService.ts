import { authedFetch } from "./orchestratorHttp";
import { ORCHESTRATOR_URL } from "./OrchestratorPublicationService";

export interface NewsletterReadiness { ready: boolean; reason: string | null; missing: string[] }
export interface NewsletterCampaign {
  id: string; title: string; work_id: string; release_number: number; payload_hash: string;
  approved_at: string | null; cancelled_at: string | null; eligible_readers: number;
  counts: Record<string, number>;
  envelope: { title: string; subject: string; html: string; text: string; from: string; reply_to: string; postal_address: string; url: string };
}
const base = `${ORCHESTRATOR_URL.replace(/\/$/, "")}/v1/newsletters`;
async function request<T>(path: string, json?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await authedFetch(base + path, { sessionOnly: true, method: json === undefined ? "GET" : "POST", json, signal });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: unknown; error?: { message?: unknown } } | null;
    const detail = payload?.detail ?? payload?.error?.message;
    throw new Error(typeof detail === "string" ? detail : "The newsletter request could not be completed.");
  }
  return response.json() as Promise<T>;
}
export const newsletterStatus = (signal?: AbortSignal) => request<NewsletterReadiness>("/status", undefined, signal);
export const newsletterCampaigns = (signal?: AbortSignal) => request<NewsletterCampaign[]>("/campaigns", undefined, signal);
export const prepareNewsletter = (workId: string, number: number) => request<NewsletterCampaign>("/campaigns", { work_id: workId, release_number: number });
export const approveNewsletter = (campaign: NewsletterCampaign) => request<NewsletterCampaign>(`/campaigns/${encodeURIComponent(campaign.id)}/approve`, { approved: true, payload_hash: campaign.payload_hash });
export const dispatchNewsletter = (id: string) => request<NewsletterCampaign>(`/campaigns/${encodeURIComponent(id)}/dispatch`, {});
export const cancelNewsletter = (id: string) => request<NewsletterCampaign>(`/campaigns/${encodeURIComponent(id)}/cancel`, {});
export const retryRejectedNewsletter = (id: string) => request<NewsletterCampaign>(`/campaigns/${encodeURIComponent(id)}/retry-rejected`, {});
