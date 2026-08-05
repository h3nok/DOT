import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";

import { BloomSurface } from "./BloomSurface";
import { staggerChild, staggerContainer, useOrganismPulse } from "../organism";
import {
  deleteThread,
  listThreads,
  loadThread,
  sendMessage,
  type TwinCitation,
  type TwinThread,
  type TwinTurn,
} from "./twinChat";
import type { DotNode } from "./types";

/**
 * TwinSurface — the conversation at the centre of the graph.
 *
 * The nucleus is not a node about the member; it *is* the member's twin. Tapping
 * it opens this, so the graph reads as one thing that can be spoken to rather
 * than a diagram with a search box bolted underneath. The surrounding nodes are
 * what the twin knows; the centre is who it is.
 *
 * Every answer carries the ids it was grounded in, and those render as chips
 * that open the source. A claim you cannot walk back to its origin is exactly
 * what this platform exists to refuse.
 */

interface TwinSurfaceProps {
  self: DotNode;
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  onClose: () => void;
  /** Open the graph node behind a citation. */
  onOpenNode: (nodeId: string) => void;
}

const OPENERS = [
  "What are you working on?",
  "What do you believe about attention?",
  "What should I read first?",
];

const Citations: React.FC<{
  citations: TwinCitation[];
  onOpen: (nodeId: string) => void;
}> = ({ citations, onOpen }) => {
  if (citations.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {citations.map((citation) => (
        <button
          key={citation.node_id}
          type="button"
          // A document passage has no node to open; only graph citations lead
          // somewhere, so the rest stay legible but inert.
          onClick={() =>
            citation.kind === "chunk" ? undefined : onOpen(citation.node_id)
          }
          className={`rounded-full border border-[color:var(--organism-accent-soft)] bg-foreground/[0.03] px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors ${
            citation.kind === "chunk"
              ? "cursor-default"
              : "hover:bg-foreground/[0.08] hover:text-foreground"
          }`}
          title={citation.kind === "chunk" ? "From your vault" : "Open this node"}
        >
          {citation.label}
        </button>
      ))}
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
        <p className="whitespace-pre-wrap leading-relaxed">{turn.content}</p>
        {!mine && <Citations citations={turn.citations} onOpen={onOpen} />}
      </div>
    </motion.div>
  );
};

export const TwinSurface: React.FC<TwinSurfaceProps> = ({
  self,
  origin,
  reducedMotion = false,
  onClose,
  onOpenNode,
}) => {
  const [turns, setTurns] = useState<TwinTurn[]>([]);
  const [threads, setThreads] = useState<TwinThread[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showThreads, setShowThreads] = useState(false);
  const [ephemeral, setEphemeral] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const pulse = useOrganismPulse();
  const endRef = useRef<HTMLDivElement>(null);

  const refreshThreads = useCallback(async () => {
    const { threads: found } = await listThreads();
    setThreads(found);
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
    setShowThreads(false);
  };

  const startNew = () => {
    setThreadId(null);
    setTurns([]);
    setShowThreads(false);
  };

  const removeThread = async (id: string) => {
    if (!(await deleteThread(id))) return;
    setThreads((current) => current.filter((thread) => thread.id !== id));
    if (id === threadId) startNew();
  };

  const send = async (question: string) => {
    const trimmed = question.trim();
    if (trimmed.length < 2 || busy) return;
    setValue("");
    setBusy(true);
    setTurns((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        role: "member",
        content: trimmed,
        citations: [],
        refusal_code: null,
      },
    ]);
    try {
      const outcome = await sendMessage(trimmed, threadId);
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
      setTurns((current) => [...current, outcome.turn]);
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

  const empty = turns.length === 0;

  return (
    <BloomSurface
      kicker="digital twin"
      title={self.label}
      description={self.description}
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
            placeholder={`Ask ${self.label} anything…`}
            aria-label={`Ask ${self.label}`}
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
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowThreads((current) => !current)}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <MessageSquare className="h-3 w-3" aria-hidden="true" />
          {threads.length > 0 ? `${threads.length} threads` : "threads"}
        </button>
        <button
          type="button"
          onClick={startNew}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          new
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
        className="max-h-[46vh] space-y-2.5 overflow-y-auto pr-1"
      >
        {empty && (
          <motion.div variants={staggerChild} className="space-y-3 py-2">
            {self.body && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {self.body}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {OPENERS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void send(prompt)}
                  className="rounded-full border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[color:var(--organism-accent-soft)] hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
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
          Not signed in — this conversation is not being saved.
        </p>
      )}
    </BloomSurface>
  );
};
