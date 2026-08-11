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
import { staggerChild, staggerContainer, useOrganismPulse } from "../organism";
import { PROFILE_OWNER_ID } from "./orchestrator";
import { TwinFeedback } from "./TwinFeedback";
import {
  deleteThread,
  clearEphemeralTurns,
  listThreads,
  loadEphemeralTurns,
  loadThread,
  saveEphemeralTurns,
  sendMessage,
  sendMessageStream,
  type TwinCitation,
  type TwinThread,
  type TwinTurn,
} from "./twinChat";
import type { AgentLens } from "./agent";
import type { AgentWorkspaceRequest } from "./AgentWorkspace";

/**
 * Minty — the conversation at the centre of the graph.
 *
 * The nucleus opens one conversational companion rather than a second answer
 * surface. Minty can navigate the graph, quote Book One, and test its claims;
 * the identity stays the same whether the answer came from the orchestrator or
 * the local released-text index.
 *
 * Every answer carries the ids it was grounded in, and those render as chips
 * that open the source. A claim you cannot walk back to its origin is exactly
 * what this platform exists to refuse.
 */

interface TwinSurfaceProps {
  /** Screen-space nucleus centre. Reserved for the aperture origin; the field
      form reads from the layout, not a bloom point, so this is currently unused. */
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  initialRequest?: (AgentWorkspaceRequest & { id: number }) | null;
  onClose: () => void;
  /** Open the graph node behind a citation. */
  onOpenNode: (nodeId: string) => void;
  /**
   * How Minty holds the screen. `focus` (the default) is the field receding —
   * the home nucleus's voice, full attention. `sidecar` docks Minty to the
   * right edge beside the text, for asking while reading.
   */
  variant?: "focus" | "sidecar";
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

/**
 * useSmoothedText — reveal streamed text as if it is being written.
 *
 * Gemini delivers the answer in a few large deltas, so raw streaming arrives in
 * clumps. This reveals the accumulated target at a steady word cadence instead,
 * so the answer reads as continuous composition rather than a series of dumps.
 * When the target stops growing (stream finished), it settles to the full text.
 */
function useSmoothedText(target: string | null, reducedMotion: boolean): string {
  const [shown, setShown] = useState("");
  const shownRef = useRef("");

  useEffect(() => {
    if (target === null) {
      shownRef.current = "";
      setShown("");
      return;
    }
    // Reduced motion: show everything immediately; the cadence is the animation.
    if (reducedMotion) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    if (target.length < shownRef.current.length) {
      // A new answer started shorter than the last — reset.
      shownRef.current = "";
    }
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const current = shownRef.current;
      if (current.length >= target.length) return;
      // Advance to the end of the next word so the reveal moves in word units.
      let next = target.indexOf(" ", current.length + 1);
      if (next === -1) next = target.length;
      else next += 1;
      shownRef.current = target.slice(0, next);
      setShown(shownRef.current);
    };
    const id = window.setInterval(tick, 34);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [target, reducedMotion]);

  // When the target is null (idle) show nothing; otherwise the smoothed prefix.
  return target === null ? "" : shown;
}

const Citations: React.FC<{
  citations: TwinCitation[];
  onOpen: (nodeId: string) => void;
}> = ({ citations, onOpen }) => {
  // The model cites every chunk it drew on; several chunks often share one
  // passage. Collapse to one chip per distinct label so "Grounded in" reads as
  // a set of sources, not a stack of duplicates.
  const seen = new Set<string>();
  const distinct = citations.filter((citation) => {
    const key = citation.label ?? citation.node_id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (distinct.length === 0) return null;
  return (
    <div className="mt-4 border-l-2 pl-4" style={{ borderColor: "var(--organism-accent-soft)" }}>
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        Grounded in
      </p>
      <div className="flex flex-wrap gap-1.5">
        {distinct.map((citation, index) => {
          const href = citationHref(citation);
          const className =
            "rounded-md border border-[color:var(--organism-accent-soft)] bg-foreground/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground";
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

const Turn: React.FC<{
  turn: TwinTurn;
  onOpen: (id: string) => void;
  feedback?: { subjectOwnerId: string; lens: AgentLens; authenticated: boolean };
}> = ({ turn, onOpen, feedback }) => {
  const mine = turn.role === "member";

  // The member's question is a quiet, right-aligned aside. Minty's answer is the
  // substance — set in the reader's serif with room to breathe, not a chat bubble.
  if (mine) {
    return (
      <motion.div variants={staggerChild} className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-foreground/[0.06] px-3.5 py-2 text-sm leading-relaxed text-foreground/90">
          {turn.content}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.article variants={staggerChild} className="max-w-full">
      <p className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--organism-accent-strong)" }}
          aria-hidden="true"
        />
        Minty
      </p>
      <p className="whitespace-pre-wrap font-serif text-[15px] leading-[1.75] text-foreground">
        {turn.content}
      </p>
      <Citations citations={turn.citations} onOpen={onOpen} />
      {feedback && turn.refusal_code === null && (
        <TwinFeedback
          subjectOwnerId={feedback.subjectOwnerId}
          lens={feedback.lens}
          authenticated={feedback.authenticated}
        />
      )}
    </motion.article>
  );
};

export const TwinSurface: React.FC<TwinSurfaceProps> = ({
  reducedMotion = false,
  initialRequest = null,
  onClose,
  onOpenNode,
  variant = "focus",
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
  // The in-progress answer text while a public answer streams in. Null when idle.
  const [streamingText, setStreamingText] = useState<string | null>(null);
  // Smoothed for display: the network delivers clumps, the reader sees writing.
  const smoothedStream = useSmoothedText(streamingText, reducedMotion);
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
  }, [turns, busy, smoothedStream, reducedMotion]);

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
      // Visitors get the answer streamed live; a signed-in member's thread is
      // persisted server-side, which streams nothing yet, so it stays on the
      // whole-answer path for now.
      const outcome =
        authenticated === true
          ? await sendMessage(trimmed, threadId, history, requestedLens, true)
          : await (async () => {
              setStreamingText("");
              const streamed = await sendMessageStream(
                trimmed,
                history,
                requestedLens,
                (text) => setStreamingText(text),
              );
              setStreamingText(null);
              // A null means streaming was unavailable; fall back to the
              // non-streaming public path rather than failing the question.
              return streamed ?? (await sendMessage(trimmed, threadId, history, requestedLens, false));
            })();
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
      setStreamingText(null);
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

  const sidecar = variant === "sidecar";

  return (
    <motion.div
      role="dialog"
      aria-label="Minty, the DOT Companion"
      aria-modal={!sidecar}
      className={
        sidecar
          ? "fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col sm:w-[26rem]"
          : "fixed inset-0 z-[60] flex flex-col"
      }
      initial={sidecar ? { x: "100%" } : { opacity: 0 }}
      animate={sidecar ? { x: 0 } : { opacity: 1 }}
      exit={sidecar ? { x: "100%" } : { opacity: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : sidecar
            ? { type: "spring", stiffness: 320, damping: 34 }
            : { duration: 0.5, ease: "easeOut" }
      }
    >
      {/* Focus: the field recedes behind a quiet scrim (Doc 12 Field→Focus).
          Sidecar: no scrim — the text stays visible; Minty docks beside it. */}
      {!sidecar && (
        <button
          type="button"
          aria-label="Close Minty"
          onClick={onClose}
          className="absolute inset-0 cursor-default bg-background/70 backdrop-blur-md"
        />
      )}

      {/* The voice flows down from the nucleus in a single reading column —
          full-width and centred in focus, a solid panel at the edge in sidecar. */}
      <div
        className={
          sidecar
            ? "relative flex min-h-0 flex-1 flex-col overflow-hidden border-l border-border/60 bg-background shadow-[-1.5rem_0_3rem_rgba(0,0,0,0.12)]"
            : "pointer-events-none relative flex min-h-0 flex-1 flex-col items-center overflow-hidden"
        }
      >
        <div
          className={
            sidecar
              ? "flex min-h-0 w-full flex-1 flex-col px-5"
              : "pointer-events-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-6"
          }
        >
          {/* Aperture: Minty's mark and name, quiet, at the top of the column. */}
          <header className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-2.5">
              <span
                className="organism-pulse-dot inline-flex h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--organism-accent-strong)" }}
                aria-hidden="true"
              />
              <span className="font-serif text-lg font-semibold text-foreground">
                Minty
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                the DOT companion
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full border border-border/50 p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2.5">
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
            <Turn
              key={turn.id}
              turn={turn}
              onOpen={onOpenNode}
              feedback={{
                subjectOwnerId: PROFILE_OWNER_ID,
                lens: lensId,
                authenticated: authenticated === true,
              }}
            />
          ))}

          {/* While a public answer streams, the prose appears as it is written
              (smoothed — the network delivers clumps, the reader sees writing).
              Citations attach only when the validated `done` event arrives. */}
          {busy && streamingText !== null && streamingText.length > 0 ? (
            <motion.article
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-full"
              aria-live="polite"
            >
              <p className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                <span
                  className="organism-pulse-dot inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--organism-accent-strong)" }}
                  aria-hidden="true"
                />
                Minty
              </p>
              <p className="whitespace-pre-wrap font-serif text-[15px] leading-[1.75] text-foreground">
                {smoothedStream}
                <span
                  className="ml-0.5 inline-block h-4 w-[2px] animate-pulse align-middle"
                  style={{ background: "var(--organism-accent-strong)" }}
                  aria-hidden="true"
                />
              </p>
            </motion.article>
          ) : busy ? (
            /* The aperture breathing while Minty gathers the thread — present,
               not a faint footnote. Rings dilate outward from the mark. */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-5 py-10"
              aria-live="polite"
              role="status"
            >
              <span className="relative flex h-14 w-14 items-center justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute rounded-full border"
                    style={{ borderColor: "var(--organism-accent-soft)" }}
                    initial={{ opacity: 0 }}
                    animate={
                      reducedMotion
                        ? { opacity: 0.3 }
                        : { scale: [0.4, 1.5], opacity: [0.6, 0] }
                    }
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 2.4,
                            repeat: Infinity,
                            delay: i * 0.8,
                            ease: "easeOut",
                          }
                    }
                  />
                ))}
                <span
                  className="organism-pulse-dot relative inline-block h-3 w-3 rounded-full"
                  style={{ background: "var(--organism-accent-strong)" }}
                  aria-hidden="true"
                />
              </span>
              <span className="font-serif text-[15px] italic text-muted-foreground">
                Minty is reading…
              </span>
            </motion.div>
          ) : null}
          <div ref={endRef} />
        </motion.div>

        {ephemeral && (
          <p className="text-[10px] text-muted-foreground">
            Temporary session · stored only in this browser tab.
          </p>
        )}

        {/* The composer: lens within reach, then the field to speak into. */}
        <div className="space-y-2.5 pb-6 pt-2">
          <div
            role="group"
            aria-label="Reading lens"
            className="inline-flex items-center gap-0.5 rounded-full border border-border/50 bg-background/50 p-0.5"
          >
            {LENSES.map((candidate) => {
              const Icon = candidate.icon;
              const active = candidate.id === lens.id;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => setLensId(candidate.id)}
                  aria-pressed={active}
                  title={candidate.description}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    active
                      ? "bg-foreground/[0.08] text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {candidate.label}
                </button>
              );
            })}
          </div>
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
              aria-label="Ask Minty about Digital Organism Theory"
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
        </div>
      </div>
        </div>
      </div>
    </motion.div>
  );
};
