import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowUp,
  BookOpen,
  GitBranch,
  Loader2,
  MessageSquare,
  Plus,
  Scale,
  Trash2,
} from "lucide-react";

import { BloomSurface } from "./BloomSurface";
import { staggerChild, staggerContainer, useOrganismPulse } from "../organism";
import {
  deleteThread,
  clearEphemeralTurns,
  listThreads,
  loadEphemeralTurns,
  loadThread,
  saveEphemeralTurns,
  sendMessage,
  type TwinCitation,
  type TwinThread,
  type TwinTurn,
} from "./twinChat";
import type { AgentLens } from "./agent";
import type { AgentWorkspaceRequest } from "./AgentWorkspace";

/**
 * Lumen — the conversation at the centre of the graph.
 *
 * The nucleus opens one conversational companion rather than a second answer
 * surface. Lumen can navigate the graph, quote Book One, and test its claims;
 * the identity stays the same whether the answer came from the orchestrator or
 * the local released-text index.
 *
 * Every answer carries the ids it was grounded in, and those render as chips
 * that open the source. A claim you cannot walk back to its origin is exactly
 * what this platform exists to refuse.
 */

interface TwinSurfaceProps {
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  initialRequest?: (AgentWorkspaceRequest & { id: number }) | null;
  onClose: () => void;
  /** Open the graph node behind a citation. */
  onOpenNode: (nodeId: string) => void;
}

const LENSES = [
  {
    id: "orient",
    label: "Locate",
    description: "Find the clearest idea or passage.",
    icon: BookOpen,
    prompts: [
      "Where should I begin with Book One?",
      "Where does the observer enter the inquiry?",
    ],
  },
  {
    id: "ground",
    label: "Ground",
    description: "Read the claim with its boundary intact.",
    icon: GitBranch,
    prompts: [
      "How does Book One define a Digital Organism?",
      "What does DOT claim about Fear and Love?",
    ],
  },
  {
    id: "test",
    label: "Test",
    description: "Expose alternatives and unpaid debts.",
    icon: Scale,
    prompts: [
      "Where is the evidence weakest?",
      "What would distinguish Little c from a neural account?",
    ],
  },
] as const;

function citationHref(citation: TwinCitation): string | null {
  const direct = citation.locator?.href;
  if (typeof direct === "string" && direct.startsWith("/")) return direct;
  const section = citation.locator?.section;
  if (typeof section !== "string") return null;
  const heading = citation.locator?.heading;
  return `/book/digital-organism-theory/${section}${
    typeof heading === "string" && heading ? `#${heading}` : ""
  }`;
}

const Citations: React.FC<{
  citations: TwinCitation[];
  onOpen: (nodeId: string) => void;
}> = ({ citations, onOpen }) => {
  if (citations.length === 0) return null;
  return (
    <div className="mt-3 border-t border-border/40 pt-2.5">
      <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
        Grounded in
      </p>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((citation, index) => {
          const href = citationHref(citation);
          const className =
            "rounded-md border border-[color:var(--organism-accent-soft)] bg-foreground/[0.03] px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground";
          if (href) {
            return (
              <Link
                key={`${citation.node_id}-${index}`}
                to={href}
                className={className}
                title="Open the cited Book One passage"
              >
                {citation.label}
              </Link>
            );
          }
          return (
            <button
              key={`${citation.node_id}-${index}`}
              type="button"
              onClick={() => onOpen(citation.node_id)}
              className={className}
              title="Open this knowledge node"
            >
              {citation.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Turn: React.FC<{ turn: TwinTurn; onOpen: (id: string) => void }> = ({
  turn,
  onOpen,
}) => {
  const mine = turn.role === "member";
  return (
    <motion.div
      variants={staggerChild}
      className={`flex ${mine ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
          mine
            ? "bg-foreground/[0.06] text-foreground"
            : "border border-border/50 bg-background/60 text-foreground"
        }`}
      >
        <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
          {mine ? "You" : "Lumen"}
        </p>
        <p className="whitespace-pre-wrap leading-relaxed">{turn.content}</p>
        {!mine && <Citations citations={turn.citations} onOpen={onOpen} />}
      </div>
    </motion.div>
  );
};

export const TwinSurface: React.FC<TwinSurfaceProps> = ({
  origin,
  reducedMotion = false,
  initialRequest = null,
  onClose,
  onOpenNode,
}) => {
  const [turns, setTurns] = useState<TwinTurn[]>([]);
  const [threads, setThreads] = useState<TwinThread[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showThreads, setShowThreads] = useState(false);
  const [ephemeral, setEphemeral] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [lensId, setLensId] = useState<AgentLens>("ground");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const pulse = useOrganismPulse();
  const endRef = useRef<HTMLDivElement>(null);

  const refreshThreads = useCallback(async () => {
    const { threads: found, authenticated: signedIn } = await listThreads();
    setThreads(found);
    setAuthenticated(signedIn);
    if (!signedIn) {
      const localTurns = loadEphemeralTurns();
      setTurns(localTurns);
      setEphemeral(localTurns.length > 0);
    }
  }, []);

  useEffect(() => {
    void refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [turns, reducedMotion]);

  const openThread = async (id: string) => {
    const messages = await loadThread(id);
    if (!messages) return;
    setThreadId(id);
    setTurns(messages);
    setEphemeral(false);
    setShowThreads(false);
  };

  const startNew = () => {
    setThreadId(null);
    setTurns([]);
    setShowThreads(false);
    setEphemeral(authenticated !== true);
    if (authenticated !== true) clearEphemeralTurns();
  };

  const removeThread = async (id: string) => {
    if (!(await deleteThread(id))) return;
    setThreads((current) => current.filter((thread) => thread.id !== id));
    if (id === threadId) startNew();
  };

  const send = async (question: string, requestedLens: AgentLens = lensId) => {
    const trimmed = question.trim();
    if (trimmed.length < 2 || busy) return;
    setValue("");
    setBusy(true);
    const memberTurn: TwinTurn = {
      id: `local-${Date.now()}`,
      role: "member",
      content: trimmed,
      citations: [],
      refusal_code: null,
    };
    const history = turns
      .filter((turn) => turn.refusal_code === null)
      .map((turn) => ({ role: turn.role, content: turn.content }));
    const withQuestion = [...turns, memberTurn];
    setTurns(withQuestion);
    if (authenticated !== true) saveEphemeralTurns(withQuestion);
    try {
      const outcome = await sendMessage(
        trimmed,
        threadId,
        history,
        requestedLens,
        authenticated === true,
      );
      if (!outcome) {
        // The thread is gone server-side. Say so plainly rather than looping.
        setThreadId(null);
        setTurns((current) => [
          ...current,
          {
            id: `local-err-${Date.now()}`,
            role: "twin",
            content: "I lost that thread. Ask again and I will start a new one.",
            citations: [],
            refusal_code: "thread_lost",
          },
        ]);
        return;
      }
      setTurns((current) => {
        const next = [...current, outcome.turn];
        if (outcome.ephemeral) saveEphemeralTurns(next);
        return next;
      });
      setEphemeral(outcome.ephemeral);
      if (outcome.thread) {
        setThreadId(outcome.thread.id);
        void refreshThreads();
      }
      pulse(1);
    } finally {
      setBusy(false);
    }
  };

  const sendRef = useRef(send);
  sendRef.current = send;
  const handledInitialRequest = useRef<number | null>(null);
  useEffect(() => {
    if (
      !initialRequest ||
      authenticated === null ||
      handledInitialRequest.current === initialRequest.id
    ) {
      return;
    }
    handledInitialRequest.current = initialRequest.id;
    setLensId(initialRequest.lens);
    void sendRef.current(initialRequest.query, initialRequest.lens);
  }, [authenticated, initialRequest]);

  const empty = turns.length === 0;
  const lens = LENSES.find((candidate) => candidate.id === lensId) ?? LENSES[0];

  return (
    <BloomSurface
      kicker="The DOT Companion"
      title="Lumen"
      description="Book One in conversation. Substantive answers return to a passage."
      origin={origin}
      reducedMotion={reducedMotion}
      zIndex={60}
      size="lg"
      onClose={onClose}
      footer={
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(value);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={`Ask through the ${lens.label.toLowerCase()} lens…`}
            aria-label="Ask Lumen about Digital Organism Theory"
            className="min-w-0 flex-1 rounded-full border border-border/50 bg-background/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[color:var(--organism-accent-soft)]"
          />
          <button
            type="submit"
            disabled={value.trim().length < 2 || busy}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-background transition-opacity disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </form>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          {authenticated ? (
            <button
              type="button"
              onClick={() => setShowThreads((current) => !current)}
              className="flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageSquare className="h-3 w-3" aria-hidden="true" />
              Saved sessions
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <MessageSquare className="h-3 w-3" aria-hidden="true" />
              Current tab
            </span>
          )}
          <button
            type="button"
            onClick={startNew}
            className="flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            new session
          </button>
        </div>

        <AnimatePresence>
          {showThreads && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1 overflow-hidden"
            >
              {threads.length === 0 && (
                <li className="px-1 py-2 text-xs text-muted-foreground">
                  No saved threads yet.
                </li>
              )}
              {threads.map((thread) => (
                <li key={thread.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void openThread(thread.id)}
                    className="flex-1 truncate rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                  >
                    {thread.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeThread(thread.id)}
                    aria-label={`Delete ${thread.title}`}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          custom={reducedMotion}
          className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1"
        >
          {empty && (
            <motion.div variants={staggerChild} className="space-y-5 py-2">
              <div className="border-y border-border/40 py-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  Consulting
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                  {authenticated
                    ? "Your saved knowledge and released Book One canon."
                    : "Released Book One canon. Private documents remain private."}
                </p>
              </div>

              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  Choose a lens
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {LENSES.map((candidate) => {
                    const Icon = candidate.icon;
                    const active = candidate.id === lens.id;
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => setLensId(candidate.id)}
                        aria-pressed={active}
                        className={`min-h-24 rounded-lg border p-3 text-left transition-colors ${
                          active
                            ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] text-foreground"
                            : "border-border/50 text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span className="mt-3 block text-xs font-semibold">
                          {candidate.label}
                        </span>
                        <span className="mt-1 block text-[10px] leading-relaxed opacity-75">
                          {candidate.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  Begin here
                </p>
                <div className="mt-2 grid gap-2">
                  {lens.prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void send(prompt)}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-[color:var(--organism-accent-soft)] hover:text-foreground"
                    >
                      <span>{prompt}</span>
                      <ArrowUp
                        className="h-3.5 w-3.5 rotate-45"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {turns.map((turn) => (
            <Turn key={turn.id} turn={turn} onOpen={onOpenNode} />
          ))}
          <div ref={endRef} />
        </motion.div>

        {ephemeral && (
          <p className="text-[10px] text-muted-foreground">
            Temporary session · stored only in this browser tab.
          </p>
        )}
      </div>
    </BloomSurface>
  );
};
