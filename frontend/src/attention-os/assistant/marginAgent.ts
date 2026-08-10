import { createParser } from "eventsource-parser";
import type { AgentLens } from "../../dot/agent";
import {
  ORCHESTRATOR_BASE,
  PROFILE_OWNER_ID,
} from "../../dot/orchestrator";

export interface ReaderAgentScope {
  releaseId: string;
  editionSlug: string;
  releaseLabel: string;
  sectionSlug?: string;
  sectionTitle?: string;
  headingSlug?: string;
  headingTitle?: string;
  selection?: string;
}

export interface MarginCitation {
  node_id: string;
  kind: string;
  label: string;
  locator?: Record<string, unknown> | null;
}

export interface MarginTurn {
  id: string;
  role: "reader" | "lumen";
  content: string;
  citations: MarginCitation[];
  refusalCode?: string | null;
}

export type MarginRunEvent =
  | "run.started"
  | "scope.resolved"
  | "evidence.ready"
  | "answer.composing"
  | "answer.block"
  | "citation.ready"
  | "run.refused"
  | "run.completed"
  | "run.failed";

export interface MarginEventEnvelope {
  v: 1;
  run_id: string;
  seq: number;
  type: MarginRunEvent;
  payload: Record<string, unknown>;
}

const SESSION_KEY = "dot-lumen-margin-v1";
const MAX_TURNS = 20;

function isCitation(value: unknown): value is MarginCitation {
  if (!value || typeof value !== "object") return false;
  const citation = value as Partial<MarginCitation>;
  return (
    typeof citation.node_id === "string" &&
    typeof citation.kind === "string" &&
    typeof citation.label === "string"
  );
}

function isTurn(value: unknown): value is MarginTurn {
  if (!value || typeof value !== "object") return false;
  const turn = value as Partial<MarginTurn>;
  return (
    typeof turn.id === "string" &&
    (turn.role === "reader" || turn.role === "lumen") &&
    typeof turn.content === "string" &&
    Array.isArray(turn.citations) &&
    turn.citations.every(isCitation)
  );
}

export function loadMarginSession(): MarginTurn[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.sessionStorage.getItem(SESSION_KEY) ?? "[]",
    ) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter(isTurn).slice(-MAX_TURNS)
      : [];
  } catch {
    return [];
  }
}

export function saveMarginSession(turns: readonly MarginTurn[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify(turns.slice(-MAX_TURNS)),
    );
  } catch {
    // The study session remains usable when browser storage is unavailable.
  }
}

export function clearMarginSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Session storage is optional.
  }
}

function historyFrom(turns: readonly MarginTurn[]) {
  return turns.slice(-6).map((turn) => ({
    role: turn.role === "reader" ? "member" : "twin",
    content: turn.content,
  }));
}

export async function streamMarginAnswer({
  question,
  lens,
  scope,
  history,
  signal,
  onEvent,
}: {
  question: string;
  lens: AgentLens;
  scope: ReaderAgentScope;
  history: readonly MarginTurn[];
  signal: AbortSignal;
  onEvent: (event: MarginEventEnvelope) => void;
}): Promise<void> {
  const response = await fetch(`${ORCHESTRATOR_BASE}/v1/twin/public/runs`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      owner_id: PROFILE_OWNER_ID,
      lens,
      history: historyFrom(history),
      scope: {
        release_id: scope.releaseId,
        edition_slug: scope.editionSlug,
        section_slug: scope.sectionSlug,
        heading_slug: scope.headingSlug,
        selection: scope.selection,
      },
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(
      response.status === 429
        ? "Lumen needs a quiet minute before another question."
        : "Lumen could not reach the released book.",
    );
  }

  let parseFailure: Error | null = null;
  const parser = createParser({
    maxBufferSize: 256_000,
    onEvent: (message) => {
      try {
        const parsed = JSON.parse(message.data) as MarginEventEnvelope;
        if (
          parsed.v !== 1 ||
          typeof parsed.run_id !== "string" ||
          typeof parsed.seq !== "number" ||
          typeof parsed.type !== "string" ||
          !parsed.payload ||
          typeof parsed.payload !== "object"
        ) {
          throw new Error("Lumen returned an unknown stream event.");
        }
        onEvent(parsed);
      } catch (error) {
        parseFailure =
          error instanceof Error
            ? error
            : new Error("Lumen returned an unreadable stream event.");
      }
    },
    onError: () => {
      parseFailure = new Error("Lumen's response stream was interrupted.");
    },
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    parser.feed(decoder.decode(value, { stream: true }));
    if (parseFailure) throw parseFailure;
  }
  parser.feed(decoder.decode());
  parser.reset({ consume: true });
  if (parseFailure) throw parseFailure;
}
