import { ORCHESTRATOR_URL } from "./OrchestratorPublicationService";
import { authedFetch, type AuthedInit } from "./orchestratorHttp";

export interface Subscriber { id: string; email: string | null; publication: string; confirmed_at: string | null }
export interface JoinRequest { id: string; email: string | null; reason: string | null; created_at: string }
export interface Member { id: string; display_name: string | null; role: string; status: "active" | "suspended"; invited_by: string | null; joined_at: string }
export interface Invitation { id: string; status: "open" | "accepted" | "revoked" | "expired"; accepted_by: string | null; created_at: string; expires_at: string }
export interface SupportTotals { supporters: number; total_minor: number; currency: string }

const base = ORCHESTRATOR_URL.replace(/\/$/, "");

async function call<T>(path: string, init: AuthedInit = {}): Promise<T> {
  const response = await authedFetch(`${base}${path}`, { sessionOnly: true, ...init });
  if (!response.ok) {
    let detail: unknown;
    try { detail = (await response.json()).detail; } catch { /* The response may not be JSON. */ }
    throw new Error(typeof detail === "string" ? detail : "That did not go through. Try again.");
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

const id = (value: string) => encodeURIComponent(value);

export const fetchSubscribers = (signal?: AbortSignal) => call<{ readers: Subscriber[] }>("/v1/readers", { signal }).then(result => result.readers);
export const removeSubscriber = (reader: string) => call<void>(`/v1/readers/${id(reader)}`, { method: "DELETE" });

export const fetchJoinRequests = (signal?: AbortSignal) => call<{ requests: JoinRequest[] }>("/v1/join/requests", { signal }).then(result => result.requests);
export const inviteRequester = (request: string) => call<{ dev_link: string | null }>(`/v1/join/requests/${id(request)}/invite`, { method: "POST" });
export const declineRequest = (request: string) => call<void>(`/v1/join/requests/${id(request)}`, { method: "DELETE" });

export const fetchMembers = (signal?: AbortSignal) => call<{ members: Member[] }>("/v1/auth/members", { signal }).then(result => result.members);
export const findMember = (email: string) => call<{ members: Member[] }>("/v1/auth/members/find", { method: "POST", json: { email } }).then(result => result.members);
export const setMemberStatus = (member: string, status: Member["status"]) => call<{ status: Member["status"] }>(`/v1/auth/members/${id(member)}`, { method: "PATCH", json: { status } });

export const fetchInvitations = (signal?: AbortSignal) => call<{ invites: Invitation[] }>("/v1/auth/invites", { signal }).then(result => result.invites);
export const revokeInvitation = (invite: string) => call<void>(`/v1/auth/invites/${id(invite)}`, { method: "DELETE" });

export const fetchSupportTotals = (signal?: AbortSignal) => call<SupportTotals>("/v1/support/totals", { signal });
export const checkInvitation = (token: string, signal?: AbortSignal) =>
  fetch(`${base}/v1/auth/invites/check?token=${encodeURIComponent(token)}`, { signal, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" })
    .then(response => { if (!response.ok) throw new Error("The invitation could not be checked. Try again."); return response.json() as Promise<{ valid: boolean; invited_by: string | null; expires_at: string | null }>; });
