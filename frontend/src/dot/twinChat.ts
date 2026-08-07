import { api, PROFILE_OWNER_ID } from "./orchestrator";
import type { AgentCitation, AgentLens } from "./agent";
import {
  answerFromBook,
  type CompanionHistoryTurn,
} from "./bookCompanion";

/**
 * twinChat — the conversation transport for Lumen at the centre of the graph.
 *
 * Lumen only answers from material it retrieved and names the ids behind
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
  /** Absent when the server thread could not be reached or there is no session. */
  thread?: TwinThread;
  turn: TwinTurn;
  /** True when the thread is held in memory only. */
  ephemeral: boolean;
}

const EPHEMERAL_SESSION_KEY = "dot-lumen-session-v1";
const MAX_EPHEMERAL_TURNS = 24;

function isTwinTurn(value: unknown): value is TwinTurn {
  if (!value || typeof value !== "object") return false;
  const turn = value as Partial<TwinTurn>;
  return (
    typeof turn.id === "string" &&
    (turn.role === "member" || turn.role === "twin") &&
    typeof turn.content === "string" &&
    Array.isArray(turn.citations)
  );
}

export function loadEphemeralTurns(): TwinTurn[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.sessionStorage.getItem(EPHEMERAL_SESSION_KEY) ?? "[]",
    ) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter(isTwinTurn).slice(-MAX_EPHEMERAL_TURNS)
      : [];
  } catch {
    return [];
  }
}

export function saveEphemeralTurns(turns: readonly TwinTurn[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      EPHEMERAL_SESSION_KEY,
      JSON.stringify(turns.slice(-MAX_EPHEMERAL_TURNS)),
    );
  } catch {
    // A blocked storage API must not block the conversation itself.
  }
}

export function clearEphemeralTurns(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(EPHEMERAL_SESSION_KEY);
  } catch {
    // Session storage is a convenience, never a requirement.
  }
}

/** Server-managed history requires a session; public answers do not. */
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
    return { threads: [], authenticated: false };
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
  history: readonly CompanionHistoryTurn[] = [],
  lens: AgentLens = "ground",
  authenticated = false,
): Promise<SendOutcome | null> {
  if (threadId || authenticated) {
    const result = await api<SendResponse>("/v1/twin/conversations/messages", {
      method: "POST",
      body: {
        question,
        lens,
        ...(threadId
          ? { conversation_id: threadId }
          : { owner_id: PROFILE_OWNER_ID }),
      },
    });

    if (result.ok && result.data && result.data.answer.grounded) {
      return {
        thread: result.data.conversation,
        turn: turnFrom(`turn-${Date.now()}`, result.data.answer),
        ephemeral: false,
      };
    }

    // A thread that vanished server-side must not strand the member in a dead
    // conversation; the caller restarts rather than retrying into the same 404.
    if (result.status === 404 && threadId) return null;

    if (result.ok && result.data && !result.data.answer.refusal_code) {
      return {
        thread: result.data.conversation,
        turn: turnFrom(`turn-${Date.now()}`, result.data.answer),
        ephemeral: false,
      };
    }
  }

  // Released canon is public. Visitor history is sent as bounded, untrusted
  // context and is never written by this endpoint.
  const open = await api<AskAnswer>("/v1/twin/public/ask", {
    method: "POST",
    body: {
      question,
      owner_id: PROFILE_OWNER_ID,
      lens,
      history: history.slice(-6),
    },
  });
  if (open.ok && open.data && (open.data.grounded || !open.data.refusal_code)) {
    return { turn: turnFrom(`turn-${Date.now()}`, open.data), ephemeral: true };
  }

  const local = await answerFromBook(question, lens, history);
  if (local) {
    return { turn: turnFrom(`turn-${Date.now()}`, local), ephemeral: true };
  }

  if (open.ok && open.data) {
    return { turn: turnFrom(`turn-${Date.now()}`, open.data), ephemeral: true };
  }
  return {
    turn: turnFrom(`turn-${Date.now()}`, {
      answer:
        "I could not locate a released Book One passage for that question. Name a concept or ask where the book sets a claim boundary.",
      citations: [],
      grounded: false,
      refusal_code: "no_grounded_context",
    }),
    ephemeral: true,
  };
}
