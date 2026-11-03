import { api } from "../dot/orchestrator";
import { authedFetch } from "./orchestratorHttp";
import { ORCHESTRATOR_URL } from "./OrchestratorPublicationService";

export interface MembershipAvailability { open: boolean; available: boolean }
export interface MembershipProfile { id: string; display_name: string | null; role: string; status: string; joined_at: string }

export async function membershipAvailability(signal?: AbortSignal): Promise<MembershipAvailability> {
  const result = await api<MembershipAvailability>("/v1/auth/membership/status", { signal });
  if (!result.ok || !result.data || typeof result.data.open !== "boolean" || typeof result.data.available !== "boolean") throw new Error("Membership availability could not be checked.");
  return result.data;
}

async function membershipCall<T>(path: string, method = "GET"): Promise<T> {
  const response = await authedFetch(`${ORCHESTRATOR_URL.replace(/\/$/, "")}/v1/auth${path}`, { sessionOnly: true, method });
  if (!response.ok) throw new Error("The account request could not be completed. Please try again.");
  return response.json() as Promise<T>;
}
export const membershipProfile = () => membershipCall<MembershipProfile>("/membership/me");
export const closeFreeMembership = () => membershipCall<{ status: string }>("/membership/me", "DELETE");
export const signOutMembership = () => membershipCall<{ ok: boolean }>("/logout", "POST");
