import { useCallback, useEffect, useRef, useState } from "react";
import type { DotNode } from "./types";
import {
  addChild,
  clearGraph,
  draftToNode,
  loadGraph,
  type NodeDraft,
  removeNode,
  saveGraph,
  updateNode,
} from "./graphStore";
import { fetchGraph, publishGraph } from "./graphApi";

export type SyncStatus = "idle" | "loading" | "saving" | "saved" | "error";

/**
 * useEditableGraph — stateful graph editing, synced to the backend.
 *
 * The graph lives in three layers: the seed (built-in default), localStorage
 * (offline cache + instant load), and the server (source of truth, shared
 * everywhere). On mount it loads the cache instantly, then reconciles with the
 * server. Owner edits persist to the cache immediately and publish to the
 * server (debounced). Visitors only read.
 */
export function useEditableGraph(seed: DotNode, owner = false) {
  const [root, setRoot] = useState<DotNode>(() => loadGraph(seed));
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Distinguish the server-reconciliation write from genuine user edits so we
  // don't echo a freshly-fetched graph straight back to the server.
  const hydratedRef = useRef(false);
  const publishTimer = useRef<number | null>(null);

  // Reconcile with the server once on mount: the server graph wins when present.
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetchGraph(controller.signal)
      .then((remote) => {
        if (remote?.graph) {
          hydratedRef.current = true;
          setRoot(remote.graph);
          saveGraph(remote.graph, seed);
          setUpdatedAt(remote.updatedAt);
        }
        setStatus("idle");
      })
      .catch(() => setStatus("idle"));
    return () => controller.abort();
  }, [seed]);

  // Cache every change locally for instant subsequent loads and offline use.
  useEffect(() => {
    saveGraph(root, seed);
  }, [root, seed]);

  // Publish owner edits to the server, debounced. Skips the reconciliation echo.
  useEffect(() => {
    if (!owner) return;
    if (hydratedRef.current) {
      hydratedRef.current = false;
      return;
    }
    if (publishTimer.current) window.clearTimeout(publishTimer.current);
    setStatus("saving");
    publishTimer.current = window.setTimeout(async () => {
      const ok = await publishGraph(root);
      setStatus(ok ? "saved" : "error");
      if (ok) setUpdatedAt(new Date().toISOString());
      window.setTimeout(() => setStatus("idle"), 1600);
    }, 700);
    return () => {
      if (publishTimer.current) window.clearTimeout(publishTimer.current);
    };
  }, [root, owner]);

  const create = useCallback((parentId: string, draft: NodeDraft) => {
    const child = draftToNode(draft);
    setRoot((current) => addChild(current, parentId, child));
    return child.id;
  }, []);

  const edit = useCallback((id: string, draft: NodeDraft) => {
    setRoot((current) =>
      updateNode(current, id, {
        label: draft.label.trim() || "Untitled",
        kind: draft.kind,
        description: draft.description?.trim() || undefined,
        introduction: draft.introduction?.trim() || undefined,
        actionLabel: draft.actionLabel?.trim() || undefined,
        body: draft.body?.trim() || undefined,
        href: draft.href?.trim() || undefined,
        image: draft.image?.trim() || undefined,
      }),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setRoot((current) => removeNode(current, id));
  }, []);

  const reset = useCallback(() => {
    clearGraph();
    setRoot(seed);
  }, [seed]);

  return { root, create, edit, remove, reset, status, updatedAt };
}
