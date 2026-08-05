import { api, PROFILE_OWNER_ID } from "./orchestrator";
import type { DotNode } from "./types";

/**
 * The graph agent — the chat brain that turns a question into an action.
 *
 * It is graph-aware first: a question that names a node ("show me your work",
 * "open stay") resolves to that node, so the chat *navigates the organism* and
 * blooms the matching content page from the centre. Anything else is answered —
 * by the backend twin when reachable, and by a calm local fallback otherwise.
 *
 * The twin at `/v1/twin/ask` only answers from nodes it actually retrieved and
 * returns the node ids behind every answer (ADR-0010). An answer with no
 * citations is not shown as a twin answer. Asking requires a session; visitors
 * without one get the local fallback rather than an open model endpoint.
 */

export interface AgentNode {
  id: string;
  label: string;
}

export interface AgentCitation {
  node_id: string;
  kind: string;
  label: string;
}

export type AgentResult =
  | { kind: "open"; node: DotNode; trail: AgentNode[] }
  | {
      kind: "answer";
      title: string;
      text: string;
      source: "backend" | "local";
      citations?: AgentCitation[];
    };

interface Indexed {
  node: DotNode;
  trail: DotNode[];
}

/** Flatten the tree into nodes with their ancestor trail (for "open" focus). */
function indexNodes(root: DotNode, trail: DotNode[] = []): Indexed[] {
  const here: Indexed = { node: root, trail };
  const childTrail = [...trail, root];
  const descendants = (root.children ?? []).flatMap((child) =>
    indexNodes(child, childTrail),
  );
  return [here, ...descendants];
}

const STOP = new Set([
  "show",
  "me",
  "open",
  "go",
  "to",
  "the",
  "a",
  "an",
  "your",
  "my",
  "of",
  "tell",
  "about",
  "what",
  "is",
  "whats",
  "who",
  "where",
  "find",
  "take",
  "i",
  "want",
  "see",
  "please",
  "can",
  "you",
  "read",
  "view",
  "get",
  "with",
  "and",
  "for",
  "on",
  "at",
  "node",
  "page",
]);

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));

/** Score a node against query tokens by label/description/body overlap. */
function scoreNode(indexed: Indexed, tokens: string[]): number {
  const { node } = indexed;
  if (node.id === "self") return 0; // never "open" the root from chat
  const label = node.label.toLowerCase();
  const haystack =
    `${label} ${node.description ?? ""} ${node.body ?? ""}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (label === token) score += 12;
    else if (label.includes(token)) score += 6;
    if (haystack.includes(token)) score += 2;
  }
  // Prefer shallower, named matches.
  score -= indexed.trail.length * 0.25;
  return score;
}

export function resolveNode(root: DotNode, query: string): AgentResult | null {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;
  const ranked = indexNodes(root)
    .map((indexed) => ({ indexed, score: scoreNode(indexed, tokens) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 6) return null;
  return {
    kind: "open",
    node: best.indexed.node,
    trail: best.indexed.trail.map((n) => ({ id: n.id, label: n.label })),
  };
}

interface TwinAskResponse {
  answer: string;
  citations: AgentCitation[];
  grounded: boolean;
  refusal_code: string | null;
}

async function askBackend(question: string): Promise<AgentResult | null> {
  const result = await api<TwinAskResponse>("/v1/twin/ask", {
    method: "POST",
    body: { question, owner_id: PROFILE_OWNER_ID },
  });
  const data = result.data;
  // A refusal is a real outcome, not an error: fall back rather than invent.
  if (!result.ok || !data || !data.grounded || !data.answer) return null;
  return {
    kind: "answer",
    title: "Answer",
    text: data.answer,
    source: "backend",
    citations: data.citations,
  };
}

function answerLocally(root: DotNode, query: string): AgentResult {
  const q = query.toLowerCase();
  if (/who|about|yourself|you\b/.test(q) && root.body) {
    return {
      kind: "answer",
      title: root.label,
      text: root.body,
      source: "local",
    };
  }
  if (/privacy|data|store|retain/.test(q)) {
    return {
      kind: "answer",
      title: "Privacy",
      text: "Questions here are not retained. This surface answers only from public graph context and never infers private facts.",
      source: "local",
    };
  }
  const names = (root.children ?? []).map((c) => c.label).join(", ");
  return {
    kind: "answer",
    title: "Try a node",
    text: `I navigate this graph. Ask me to open one of: ${names}. Or ask about the work, the doctrine, or the writing.`,
    source: "local",
  };
}

/**
 * Resolve a chat query into an action: open a matching node, or answer it.
 * Node navigation wins; otherwise the backend twin answers, with a local
 * fallback so the chat always responds.
 */
export async function runAgent(
  root: DotNode,
  query: string,
): Promise<AgentResult> {
  const trimmed = query.trim();
  const node = resolveNode(root, trimmed);
  if (node) return node;
  const backend = await askBackend(trimmed);
  if (backend) return backend;
  return answerLocally(root, trimmed);
}
