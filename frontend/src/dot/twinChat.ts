import { api, PROFILE_OWNER_ID } from "./orchestrator";
import type { AgentCitation } from "./agent";

/**
 * twinChat — the conversation client for the twin at the centre of the graph.
 *
 * The twin only answers from material it retrieved and names the ids behind
 * every claim (ADR-0010), so a citation is not decoration: an answer without
 * one has not been grounded, and this module keeps that distinction visible to
 * the surface rather than flattening it into plain text.
 *
 * Threads are stored server-side for a signed-in member. A visitor without a
 * session gets an ephemeral thread held in memory only — the same conversation,
 * simply not retained. That difference is stated in the UI rather than hidden.
 */

export interface TwinCitation extends AgentCitation {
  locator?: Record<string, unknown> | null;
}

export interface TwinTurn {
  id: string;
  role: "member" | "twin";
  content: string;
  citations: TwinCitation[];
  refusal_code: string | null;
  created_at?: string;
}

export interface TwinThread {
  id: string;
  title: string;
  subject_owner_id: string;
  message_count: number;
  created_at: string;
  last_message_at: string | null;
}

interface AskAnswer {
  answer: string;
  citations: TwinCitation[];
  grounded: boolean;
  refusal_code: string | null;
}

interface SendResponse {
  conversation: TwinThread;
  answer: AskAnswer;
}

interface ThreadResponse {
  conversation: TwinThread;
  messages: TwinTurn[];
}

export interface SendOutcome {
  /** Absent when the twin could not be reached or the member has no session. */
  thread?: TwinThread;
  turn: TwinTurn;
  /** True when the thread is held in memory only. */
  ephemeral: boolean;
}

/** A session is required to reach the twin; that is a boundary, not an error. */
export const isUnauthenticated = (status: number) =>
  status === 401 || status === 403;

export async function listThreads(): Promise<{
  threads: TwinThread[];
  authenticated: boolean;
}> {
  const result = await api<{ conversations: TwinThread[] }>(
    "/v1/twin/conversations",
  );
  if (!result.ok) {
    return { threads: [], authenticated: !isUnauthenticated(result.status) };
  }
  return { threads: result.data?.conversations ?? [], authenticated: true };
}

export async function loadThread(id: string): Promise<TwinTurn[] | null> {
  const result = await api<ThreadResponse>(`/v1/twin/conversations/${id}`);
  if (!result.ok || !result.data) return null;
  return result.data.messages;
}

export async function deleteThread(id: string): Promise<boolean> {
  const result = await api<never>(`/v1/twin/conversations/${id}`, {
    method: "DELETE",
  });
  return result.ok;
}

function turnFrom(id: string, answer: AskAnswer): TwinTurn {
  return {
    id,
    role: "twin",
    content: answer.answer,
    citations: answer.citations ?? [],
    refusal_code: answer.refusal_code,
  };
}

/**
 * Send a question. Returns the twin's turn plus the thread it now belongs to.
 * A visitor without a session still gets an answer; it is simply not stored.
 */
export async function sendMessage(
  question: string,
  threadId: string | null,
): Promise<SendOutcome | null> {
  const result = await api<SendResponse>("/v1/twin/conversations/messages", {
    method: "POST",
    body: {
      question,
      ...(threadId ? { conversation_id: threadId } : { owner_id: PROFILE_OWNER_ID }),
    },
  });

  if (result.ok && result.data) {
    return {
      thread: result.data.conversation,
      turn: turnFrom(`turn-${Date.now()}`, result.data.answer),
      ephemeral: false,
    };
  }

  // A thread that vanished server-side must not strand the member in a dead
  // conversation; the caller restarts rather than retrying into the same 404.
  if (result.status === 404 && threadId) return null;

  const ask = await api<AskAnswer>("/v1/twin/ask", {
    method: "POST",
    body: { question, owner_id: PROFILE_OWNER_ID },
  });
  if (ask.ok && ask.data) {
    return { turn: turnFrom(`turn-${Date.now()}`, ask.data), ephemeral: true };
  }
  return null;
}
