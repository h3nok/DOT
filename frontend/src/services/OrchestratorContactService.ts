import { ORCHESTRATOR_URL } from "./OrchestratorPublicationService";
import { authedFetch } from "./orchestratorHttp";

export type ContactPurpose = "project" | "collaboration" | "writing" | "speaking" | "general" | "privacy";
export interface ContactDraft {
  purpose: ContactPurpose;
  name: string;
  email: string;
  message: string;
  organization: string;
  timeline: string;
  budget: string;
  consent: boolean;
  website: string;
}
export interface ContactMessage extends Omit<ContactDraft, "consent" | "website"> {
  id: string;
  status: "new" | "replied" | "archived";
  notification_status: string;
  created_at: string;
}
export interface ContactReply { id: string; status: string; created_at: string; message: string | null; submission_key: string }
export interface ContactConversation extends ContactMessage { replies: ContactReply[] }

const base = `${ORCHESTRATOR_URL.replace(/\/$/, "")}/v1/contact`;

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail: unknown;
    try { detail = (await response.json()).detail; } catch { /* The response may not be JSON. */ }
    throw new Error(typeof detail === "string" ? detail : response.status === 429
      ? "Please wait before sending another message, or use email."
      : "That did not go through. Your message is still here; try again or use email.");
  }
  return response.json() as Promise<T>;
}

export const fetchContactStatus = (signal?: AbortSignal) => fetch(`${base}/status`, { signal, cache: "no-store" }).then(read<{ available: boolean }>);
export const sendContactMessage = (draft: ContactDraft, key: string) => fetch(`${base}/messages`, {
  method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(draft),
}).then(read<{ status: "received"; reference: string }>);

export const fetchContactInbox = (page: number, status: string, signal?: AbortSignal) => authedFetch(`${base}/inbox?page=${page}${status ? `&status=${encodeURIComponent(status)}` : ""}`, { sessionOnly: true, signal }).then(read<{ messages: ContactMessage[]; has_more: boolean; page: number }>);
export const fetchContactConversation = (id: string) => authedFetch(`${base}/inbox/${encodeURIComponent(id)}`, { sessionOnly: true }).then(read<ContactConversation>);
export const updateContactStatus = (id: string, status: ContactMessage["status"]) => authedFetch(`${base}/inbox/${encodeURIComponent(id)}`, { sessionOnly: true, method: "PATCH", json: { status } }).then(read<{ status: ContactMessage["status"] }>);
export const sendContactReply = (id: string, message: string, key: string) => authedFetch(`${base}/inbox/${encodeURIComponent(id)}/replies`, { sessionOnly: true, method: "POST", json: { message }, idempotencyKey: key }).then(read<{ status: "sent" | "failed"; id: string }>);
export async function deleteContactConversation(id: string) {
  const response = await authedFetch(`${base}/inbox/${encodeURIComponent(id)}`, { sessionOnly: true, method: "DELETE" });
  if (!response.ok) throw new Error("The conversation could not be deleted. Try again.");
}
