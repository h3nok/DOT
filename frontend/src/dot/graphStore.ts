import type { DotNode, DotNodeKind } from "./types";

/**
 * Editable graph store — the data layer for the graph UI.
 *
 * The graph is a pure {@link DotNode} tree. These functions are immutable tree
 * operations (each returns a new tree) plus a thin localStorage persistence
 * layer, so any surface can add, edit, or remove nodes and have it survive a
 * reload. The seed graph ({@link ./profileGraph}) is the default; once a user
 * edits, their tree is stored and takes over until reset.
 */

export const GRAPH_STORAGE_KEY = "dot-profile-graph";
const GRAPH_SEED_VERSION = 3;

interface StoredGraph {
  fingerprint: string;
  graph: DotNode;
}

export interface NodeDraft {
  label: string;
  description?: string;
  body?: string;
  kind?: DotNodeKind;
  href?: string;
  image?: string;
}

/** A URL- and collision-resistant id derived from a label. */
export const genNodeId = (label: string) =>
  `${
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "node"
  }-${Math.random().toString(36).slice(2, 7)}`;

export function findNode(root: DotNode, id: string): DotNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

/** Resolve a path of ids (root-first) into the chain of nodes it addresses. */
export function resolveChain(root: DotNode, path: string[]): DotNode[] {
  const chain: DotNode[] = [root];
  let current = root;
  for (const id of path.slice(1)) {
    const next = current.children?.find((child) => child.id === id);
    if (!next) break;
    chain.push(next);
    current = next;
  }
  return chain;
}

export function updateNode(
  root: DotNode,
  id: string,
  patch: Partial<DotNode>,
): DotNode {
  if (root.id === id) return { ...root, ...patch };
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map((child) => updateNode(child, id, patch)),
  };
}

export function addChild(
  root: DotNode,
  parentId: string,
  child: DotNode,
): DotNode {
  if (root.id === parentId) {
    return { ...root, children: [...(root.children ?? []), child] };
  }
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map((node) => addChild(node, parentId, child)),
  };
}

export function removeNode(root: DotNode, id: string): DotNode {
  if (!root.children) return root;
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== id)
      .map((child) => removeNode(child, id)),
  };
}

export function draftToNode(draft: NodeDraft): DotNode {
  const label = draft.label.trim() || "Untitled";
  const href = draft.href?.trim();
  return {
    id: genNodeId(label),
    label,
    kind: draft.kind ?? "attribute",
    description: draft.description?.trim() || undefined,
    body: draft.body?.trim() || undefined,
    href: href || undefined,
    image: draft.image?.trim() || undefined,
  };
}

function isDotNode(value: unknown): value is DotNode {
  if (!value || typeof value !== "object") return false;
  const node = value as Record<string, unknown>;
  if (typeof node.id !== "string" || typeof node.label !== "string") return false;
  if (node.children === undefined) return true;
  return Array.isArray(node.children) && node.children.every(isDotNode);
}

function graphFingerprint(node: DotNode): string {
  const anatomy = `${node.id}(${(node.children ?? []).map((child) => graphAnatomy(child)).join(",")})`;
  return `v${GRAPH_SEED_VERSION}:${anatomy}`;
}

function graphAnatomy(node: DotNode): string {
  return `${node.id}(${(node.children ?? []).map(graphAnatomy).join(",")})`;
}

export function loadGraph(seed: DotNode): DotNode {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(GRAPH_STORAGE_KEY);
    if (!raw) return seed;
    const parsed: unknown = JSON.parse(raw);
    if (isDotNode(parsed)) return parsed.id === seed.id ? parsed : seed;
    if (parsed && typeof parsed === "object") {
      const stored = parsed as Partial<StoredGraph>;
      if (
        stored.fingerprint === graphFingerprint(seed) &&
        isDotNode(stored.graph)
      ) {
        return stored.graph;
      }
    }
  } catch {
    /* fall through to seed */
  }
  return seed;
}

export function saveGraph(root: DotNode, seed: DotNode): void {
  if (typeof window === "undefined") return;
  try {
    const stored: StoredGraph = {
      fingerprint: graphFingerprint(seed),
      graph: root,
    };
    window.localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function clearGraph(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GRAPH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
