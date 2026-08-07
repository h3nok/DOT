import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Hammer,
  X,
} from "lucide-react";
import {
  fetchOrchestratorReadiness,
  type OrchestratorReadiness,
} from "../../services/OrchestratorPublicationService";
import type { DoctrineNode } from "../../content/doctrine/doctrineData";

// Orchestrator presence for the reading surface.
//
// The orchestrator is the movement's nervous system. On every reading node it
// is *present*: a live status, an organism-aware reading presence (screen +
// scroll time), and a scaffold of node-scoped tools. Each node in the graph
// will gain real orchestrator tools; this surface is where they live.

type Status = "ready" | "degraded" | "offline" | "checking";

interface NodeTool {
  id: string;
  label: string;
  hint: string;
  icon: typeof Hammer;
  /** Tools that need a live orchestrator are gated on readiness. */
  needsOrchestrator: boolean;
  /** Route to open, or undefined for scaffolded (not-yet-wired) tools. */
  to?: string;
}

const NODE_TOOLS: NodeTool[] = [
  {
    id: "source",
    label: "Open source passage",
    hint: "Read the Book One passage behind this concept",
    icon: BookOpen,
    needsOrchestrator: false,
    to: "node-source",
  },
  {
    id: "open",
    label: "Open in orchestrator",
    hint: "Inspect readiness, validation, and manifests",
    icon: ArrowUpRight,
    needsOrchestrator: false,
    to: "/orchestrator",
  },
];

const statusColor = (status: Status) =>
  status === "ready"
    ? "var(--surface-accent)"
    : status === "degraded"
      ? "#d97706"
      : status === "offline"
        ? "color-mix(in oklch, var(--surface-fg) 38%, transparent)"
        : "var(--surface-muted)";

const statusLabel: Record<Status, string> = {
  ready: "live",
  degraded: "degraded",
  offline: "offline",
  checking: "linking…",
};

interface OrchestratorNodeToolsProps {
  node: DoctrineNode;
}

export const OrchestratorNodeTools = ({
  node,
}: OrchestratorNodeToolsProps) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("checking");
  const [readiness, setReadiness] = useState<OrchestratorReadiness | null>(
    null,
  );

  // Poll orchestrator readiness so its presence is live.
  useEffect(() => {
    let cancelled = false;
    const controllerRef: { current: AbortController | null } = {
      current: null,
    };

    const check = async () => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const next = await fetchOrchestratorReadiness(controller.signal);
        if (cancelled) return;
        setReadiness(next);
        setStatus(next.status === "ready" ? "ready" : "degraded");
      } catch {
        if (cancelled) return;
        setReadiness(null);
        setStatus("offline");
      }
    };

    void check();
    const id = window.setInterval(check, 15000);
    return () => {
      cancelled = true;
      controllerRef.current?.abort();
      window.clearInterval(id);
    };
  }, []);

  const online = status === "ready" || status === "degraded";
  const runTool = (tool: NodeTool) => {
    if (tool.needsOrchestrator && status !== "ready") return;
    if (tool.to === "node-source") {
      navigate(node.source.href);
      setOpen(false);
      return;
    }
    if (tool.to) {
      navigate(tool.to);
      setOpen(false);
    }
  };

  return (
    <>
      {/* Presence pill — always visible, quiet, organism-aware. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="organism-alive fixed bottom-5 left-4 z-40 inline-flex items-center gap-2 rounded-full border py-2 pl-2.5 pr-3.5 text-[12px] font-semibold backdrop-blur-2xl transition-colors"
        style={{
          borderColor: "var(--surface-hairline)",
          background: "var(--surface-panel)",
          boxShadow: "var(--surface-shadow)",
          color: "var(--surface-muted)",
        }}
        aria-label="Open orchestrator tools for this idea"
        title="Orchestrator tools"
      >
        <span className="relative flex h-3 w-3 items-center justify-center">
          <span
            className="absolute inline-flex h-3 w-3 rounded-full"
            style={{
              background: statusColor(status),
              opacity: online ? 0.35 : 0.2,
              animation:
                online && !prefersReducedMotion
                  ? "doctrinePulse 2.4s ease-in-out infinite"
                  : undefined,
            }}
          />
          <span
            className="relative inline-flex h-1.5 w-1.5 rounded-full"
            style={{ background: statusColor(status) }}
          />
        </span>
        <span className="text-[color:var(--surface-fg)]">Orchestrator</span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] sm:inline">
          {statusLabel[status]}
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 cursor-default"
              style={{
                background:
                  "color-mix(in oklch, var(--surface-bg) 58%, transparent)",
              }}
              aria-label="Close orchestrator tools"
            />
            <motion.aside
              initial={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -40 }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -40 }
              }
              transition={{ duration: 0.28 }}
              className="fixed inset-y-0 left-0 z-50 w-full max-w-sm overflow-y-auto border-r p-6 backdrop-blur-2xl"
              style={{
                borderColor: "var(--surface-border)",
                background: "var(--surface-panel)",
                boxShadow: "var(--surface-shadow)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity
                    className="h-4 w-4"
                    style={{ color: "var(--surface-accent)" }}
                  />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--surface-accent)]">
                    Orchestrator
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-[color:var(--surface-muted)] transition-colors hover:text-[color:var(--surface-fg)] [&_svg]:pointer-events-none"
                  style={{ borderColor: "var(--surface-hairline)" }}
                  aria-label="Close orchestrator tools"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Live status */}
              <div
                className="mt-5 rounded-xl border p-4"
                style={{
                  borderColor: "var(--surface-hairline)",
                  background:
                    "color-mix(in oklch, var(--surface-fg) 3%, transparent)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[color:var(--surface-fg)]">
                    Presence
                  </span>
                  <span
                    className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em]"
                    style={{ color: statusColor(status) }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: statusColor(status) }}
                    />
                    {statusLabel[status]}
                  </span>
                </div>
                {readiness ? (
                  <p className="mt-2 font-mono text-[11px] text-[color:var(--surface-muted)]">
                    {readiness.service} · v{readiness.version}
                  </p>
                ) : (
                  <p className="mt-2 font-mono text-[11px] text-[color:var(--surface-muted)]">
                    Orchestrator not reachable — tools that need it wait.
                  </p>
                )}
              </div>

              {/* Node-scoped tools */}
              <div className="mt-6">
                <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--surface-muted)]">
                  <Hammer className="h-3.5 w-3.5" />
                  Tools for “{node.title}”
                </p>
                <div className="mt-3 grid gap-2">
                  {NODE_TOOLS.map((tool) => {
                    const gated = tool.needsOrchestrator && status !== "ready";
                    const Icon = tool.icon;
                    const scaffolded = !tool.to;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => runTool(tool)}
                        disabled={gated || scaffolded}
                        className="group flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors enabled:hover:border-[color:var(--surface-accent)] disabled:cursor-not-allowed disabled:opacity-55"
                        style={{
                          borderColor: "var(--surface-hairline)",
                          background:
                            "color-mix(in oklch, var(--surface-fg) 2%, transparent)",
                        }}
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            className="h-4 w-4 shrink-0"
                            style={{ color: "var(--surface-accent)" }}
                          />
                          <span>
                            <span className="block text-sm font-semibold text-[color:var(--surface-fg)]">
                              {tool.label}
                            </span>
                            <span className="block text-[11px] text-[color:var(--surface-muted)]">
                              {tool.hint}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--surface-muted)]">
                          {scaffolded ? "soon" : gated ? "waiting" : "open"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <style>{`
        @keyframes doctrinePulse {
          0%, 100% { transform: scale(1); opacity: 0.32; }
          50% { transform: scale(1.85); opacity: 0; }
        }
      `}</style>
    </>
  );
};

export default OrchestratorNodeTools;
