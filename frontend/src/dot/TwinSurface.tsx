import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  BookOpen,
  ExternalLink,
  GitBranch,
  GraduationCap,
  GripVertical,
  MessageSquare,
  Plus,
  Scale,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { staggerChild, staggerContainer, useOrganismPulse } from "../organism";
import { PROFILE_OWNER_ID } from "./orchestrator";
import { TwinFeedback } from "./TwinFeedback";
import { NucleusMark } from "./NucleusMark";
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
import type { ReadingPosition } from "./bookCompanion";
import type { AgentLens } from "./agent";
import type { AgentWorkspaceRequest } from "./AgentWorkspace";

/** Whether this release names a backend at all; see the note in the empty state. */
const HAS_ORCHESTRATOR = Boolean(import.meta.env.VITE_ORCHESTRATOR_URL);

/**
 * How wide the reader last left the dock. Remembered, not re-asked.
 *
 * The width is the reader's, not a setting with two answers: how much room
 * Minty deserves depends on what they are doing with it, and that changes
 * within a single sitting. So the edge is draggable, and where they leave it
 * is where it opens next time.
 */
const SIDECAR_WIDTH_KEY = "dot.minty.sidecar";
/** A column beside the text — enough to ask, narrow enough to keep reading. */
const DOCKED_WIDTH = 416;
/** A passage and Minty's reading of it, side by side. */
const WIDE_WIDTH = 640;
/** Below this the transcript is a gutter, not a column. */
const MIN_WIDTH = 320;
/** The book keeps the majority of the window; a dock is not a takeover. */
const MAX_WIDTH_FRACTION = 0.6;
/** Past this the transcript needs its own measure rather than the full panel. */
const ROOMY_WIDTH = 560;

function maxSidecarWidth(): number {
  if (typeof window === "undefined") return WIDE_WIDTH;
  return Math.max(MIN_WIDTH, Math.round(window.innerWidth * MAX_WIDTH_FRACTION));
}

function clampSidecarWidth(width: number): number {
  return Math.min(Math.max(Math.round(width), MIN_WIDTH), maxSidecarWidth());
}

function loadSidecarWidth(): number {
  if (typeof window === "undefined") return DOCKED_WIDTH;
  try {
    const stored = window.localStorage.getItem(SIDECAR_WIDTH_KEY);
    // "docked"/"wide" are the two-state preference this replaced.
    if (stored === "wide") return clampSidecarWidth(WIDE_WIDTH);
    if (stored === "docked" || stored === null) return clampSidecarWidth(DOCKED_WIDTH);
    const parsed = Number.parseInt(stored, 10);
    return clampSidecarWidth(Number.isFinite(parsed) ? parsed : DOCKED_WIDTH);
  } catch {
    return DOCKED_WIDTH;
  }
}

function rememberSidecarWidth(width: number): void {
  try {
    window.localStorage.setItem(SIDECAR_WIDTH_KEY, String(Math.round(width)));
  } catch {
    // Storage can be refused; the choice still holds for this visit.
  }
}

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
  /**
   * What the reader has open, when Minty was opened from inside the book. It
   * travels with every question so a reference to "this" has something to
   * resolve against.
   */
  reading?: ReadingPosition | null;
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
      "What peer-reviewed research bears on the Painting model?",
    ],
  },
] as const;

function citationHref(citation: TwinCitation): string | null {
  const direct = citation.locator?.href;
  if (
    typeof direct === "string" &&
    (direct.startsWith("/") || direct.startsWith("https://"))
  ) {
    return direct;
  }
  const section = citation.locator?.section;
  if (typeof section !== "string") return null;
  const heading = citation.locator?.heading;
  return `/book/digital-organism-theory/${section}${
    typeof heading === "string" && heading ? `#${heading}` : ""
  }`;
}

function scholarHref(citation: TwinCitation): string | null {
  const href = citation.locator?.scholar_url;
  return typeof href === "string" && href.startsWith("https://scholar.google.com/")
    ? href
    : null;
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
    <section className="mt-5 border-t border-border/50 pt-4" aria-label="Answer sources">
      <p className="mb-3 flex items-center gap-2 dot-label">
        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
        Grounding
      </p>
      <ol className="space-y-1.5">
        {distinct.map((citation, index) => {
          const href = citationHref(citation);
          const scholar = scholarHref(citation);
          const research = citation.kind === "scholarly_work";
          const provider = citation.locator?.provider;
          const researchLabel =
            research && typeof provider === "string"
              ? `${provider} abstract`
              : "Research abstract";
          const external = href?.startsWith("https://") ?? false;
          return (
            <li
              key={`${citation.node_id}-${index}`}
              className="border-l border-[color:var(--organism-accent-soft)] bg-foreground/[0.025] px-3 py-3 dot-meta text-muted-foreground"
            >
              <div className="flex items-start gap-3">
                <span className="pt-0.5 font-mono text-[var(--organism-accent-strong)]">
                  [{String(index + 1).padStart(2, "0")}]
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-5 text-foreground/90">
                    {citation.label}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1 font-mono dot-micro uppercase text-muted-foreground">
                      {research ? (
                        <GraduationCap className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <BookOpen className="h-3 w-3" aria-hidden="true" />
                      )}
                      {research ? researchLabel : "Book One"}
                    </span>
                    {href ? (
                      external ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-[color:var(--organism-accent-strong)] hover:underline"
                        >
                          Open paper
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : (
                        <Link
                          to={href}
                          className="inline-flex items-center gap-1 font-medium text-[color:var(--organism-accent-strong)] hover:underline"
                        >
                          Open passage
                          <BookOpen className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpen(citation.node_id)}
                        className="font-medium text-[color:var(--organism-accent-strong)] hover:underline"
                      >
                        Open source
                      </button>
                    )}
                    {scholar ? (
                      <a
                        href={scholar}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium hover:text-foreground hover:underline"
                      >
                        Check Google Scholar
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

const AnswerMarkdown: React.FC<{ children: string }> = ({ children }) => (
  <div className="minty-answer font-serif text-base leading-7 text-foreground sm:text-[17px] sm:leading-8">
    <ReactMarkdown
      skipHtml
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children: heading }) => (
          <h2 className="mb-2 mt-5 text-xl font-semibold first:mt-0">{heading}</h2>
        ),
        h2: ({ children: heading }) => (
          <h2 className="mb-2 mt-5 text-xl font-semibold first:mt-0">{heading}</h2>
        ),
        h3: ({ children: heading }) => (
          <h3 className="mb-2 mt-4 text-base font-semibold">{heading}</h3>
        ),
        p: ({ children: paragraph }) => (
          <p className="mb-3 whitespace-pre-wrap last:mb-0">{paragraph}</p>
        ),
        // Quoted Book One passages. Set apart from Minty's own sentences by a
        // rule and a tint, so a reader can always see where the book stops and
        // the companion starts. The trailing "— Heading" line is dimmed and
        // letterspaced by the sibling rule below.
        blockquote: ({ children: quote }) => (
          <blockquote className="my-4 rounded-r-lg border-l-2 border-[color:var(--organism-accent-strong)] bg-foreground/[0.035] py-3 pl-4 pr-3 [&>p:last-child]:mb-0 [&>p:last-child]:font-mono [&>p:last-child]:dot-micro [&>p:last-child]:uppercase [&>p:last-child]:tracking-[0.14em] [&>p:last-child]:text-muted-foreground [&>p:last-child]:not-italic [&>p]:italic">
            {quote}
          </blockquote>
        ),
        ul: ({ children: list }) => (
          <ul className="mb-3 ml-5 list-disc space-y-1.5">{list}</ul>
        ),
        ol: ({ children: list }) => (
          <ol className="mb-3 ml-5 list-decimal space-y-1.5">{list}</ol>
        ),
        strong: ({ children: strong }) => (
          <strong className="font-semibold text-foreground">{strong}</strong>
        ),
        a: ({ href, children: link }) => {
          const safeHref =
            href?.startsWith("/") || href?.startsWith("https://") ? href : null;
          if (!safeHref) return <span>{link}</span>;
          const external = safeHref.startsWith("https://");
          return (
            <a
              href={safeHref}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="underline decoration-[var(--organism-accent-soft)] underline-offset-4 transition-colors hover:decoration-[var(--organism-accent-strong)]"
            >
              {link}
            </a>
          );
        },
        code: ({ children: code }) => (
          <code className="rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[0.82em]">
            {code}
          </code>
        ),
        pre: ({ children: code }) => (
          <pre className="my-4 max-w-full overflow-x-auto border-y border-border/50 bg-foreground/[0.025] px-4 py-3 font-mono text-xs leading-6">
            {code}
          </pre>
        ),
        table: ({ children: table }) => (
          <span className="my-4 block max-w-full overflow-x-auto border-y border-border/50">
            <table className="w-full border-collapse font-sans text-sm">{table}</table>
          </span>
        ),
        th: ({ children: heading }) => (
          <th className="border-b border-border/60 px-3 py-2 text-left text-xs font-semibold">
            {heading}
          </th>
        ),
        td: ({ children: cell }) => (
          <td className="border-b border-border/35 px-3 py-2 align-top text-sm">
            {cell}
          </td>
        ),
        img: () => null,
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);

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
      <p className="mb-2 flex items-center gap-2 dot-label">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--organism-accent-strong)" }}
          aria-hidden="true"
        />
        Minty
        {turn.source === "passages" && (
          <span
            className="dot-micro font-mono normal-case tracking-normal text-muted-foreground/80"
            title="No model answered this one. These are passages retrieved from the released text and quoted directly."
          >
            · quoted from Book One
          </span>
        )}
      </p>
      <AnswerMarkdown>{turn.content}</AnswerMarkdown>
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
  reading = null,
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
  const sidecar = variant === "sidecar";
  const [wideViewport, setWideViewport] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(min-width: 1024px)").matches,
  );
  // A sidecar is only genuinely modeless while the source remains visible next
  // to it. Below lg it fills the viewport and must keep the same focus and
  // scroll promises as the full-screen companion.
  const modal = !sidecar || !wideViewport;
  // How wide the dock stands, in px, dragged from its edge.
  const [width, setWidth] = useState(loadSidecarWidth);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startWidth: number;
    moved: boolean;
  } | null>(null);
  // Smoothed for display: the network delivers clumps, the reader sees writing.
  const smoothedStream = useSmoothedText(streamingText, reducedMotion);
  const pulse = useOrganismPulse();
  const endRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  /** Whether the transcript should follow new text. False once the reader scrolls up. */
  const stickToBottom = useRef(true);

  const streaming = streamingText !== null;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setWideViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!modal) return;
    document.documentElement.dataset.mintyModal = "true";
    return () => {
      delete document.documentElement.dataset.mintyModal;
    };
  }, [modal]);

  /**
   * Publish the dock's width to the document, where `--minty-sidecar-width`
   * turns it into both the panel's width and the reading page's inset. The
   * page cannot ask the panel how wide it is, so the panel says so once and
   * everything that has to make room reads the same answer — including while
   * the edge is being dragged, so the text reflows under the reader's hand.
   *
   * Below `lg` the panel covers the page rather than docking beside it, so the
   * variable is withdrawn and the page keeps its full width.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (!sidecar || !wideViewport) return;
    root.dataset.mintySidecar = "docked";
    root.style.setProperty("--minty-sidecar-width", `${width}px`);
    return () => {
      delete root.dataset.mintySidecar;
      root.style.removeProperty("--minty-sidecar-width");
    };
  }, [sidecar, wideViewport, width]);

  /** While the edge is held, the whole page is part of that one gesture. */
  useEffect(() => {
    if (!dragging) return;
    document.documentElement.dataset.mintyResizing = "true";
    return () => {
      delete document.documentElement.dataset.mintyResizing;
    };
  }, [dragging]);

  /** A window narrowed under the dock must not leave it wider than the rules. */
  useEffect(() => {
    const clamp = () => setWidth((current) => clampSidecarWidth(current));
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, []);

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

  /**
   * Follow the answer without commandeering the page.
   *
   * This used to call `endRef.scrollIntoView({ behavior: "smooth" })`, which has
   * two failures that compound. `scrollIntoView` scrolls *every* scrollable
   * ancestor, so in sidecar the book behind Minty moved too — the reader lost
   * their place in the text they opened Minty to ask about. And the effect
   * depends on the streamed text, which `useSmoothedText` advances on a 34ms
   * interval: a smooth scroll re-issued ~30 times a second is restarted before
   * any of them can finish, so the panel never settles.
   *
   * Writing `scrollTop` on the transcript alone cannot touch an ancestor, and
   * following only when the reader is already at the bottom means scrolling up
   * to re-read a citation is no longer undone on the next delta.
   */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !stickToBottom.current) return;
    if (typeof scroller.scrollTo === "function") {
      scroller.scrollTo({
        top: scroller.scrollHeight,
        // Easing is for a turn arriving; a moving stream target needs to be met,
        // not chased.
        behavior: reducedMotion || streaming ? "auto" : "smooth",
      });
    } else {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [turns, busy, smoothedStream, streaming, reducedMotion]);

  /** Near the bottom means "following"; anywhere else means the reader is reading. */
  const trackStickiness = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const distance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    stickToBottom.current = distance < 48;
  }, []);

  /**
   * The keyboard contract an overlay owes a reader.
   *
   * Minty is reached from a hero chip, a suggestion card, or a button inside the
   * book, so a member may well arrive without a mouse. Escape closes either
   * variant, the composer takes focus on open so the next keystroke is already
   * the question, and focus returns to whatever opened Minty on the way out
   * rather than being dropped at the top of the document.
   *
   * The trap is `focus`-only, and deliberately so. That variant sets
   * `aria-modal`, which tells assistive technology the rest of the page is
   * inert — a promise that is a lie unless Tab is genuinely held inside.
   * Sidecar promises the opposite: the passage stays live beside Minty, so the
   * reader must be able to tab back into the text while consulting it.
   */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    // On touch devices, auto-focusing the composer summons the keyboard before
    // the reader has oriented themselves — hostile on mobile (L1).
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (!isTouch) {
      composerRef.current?.focus();
    }

    const focusableItems = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !modal) return;

      const items = focusableItems();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = Boolean(active && panelRef.current?.contains(active));

      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [modal, onClose]);

  /**
   * Focus covers the whole viewport, so the field behind it must hold still —
   * scrolling a page you cannot see is how a reader loses their place. Sidecar
   * is exempt: scrolling the text under it is the entire point.
   */
  useEffect(() => {
    if (!modal) return;
    // The page scrolls on <html>, not <body>: locking the body alone leaves the
    // field free to move behind the scrim, which is what it did.
    const scroller = (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
    const previousOverflow = scroller.style.overflow;
    const previousPadding = scroller.style.paddingRight;
    // Replace the scrollbar with padding so locking does not shift the layout.
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    scroller.style.overflow = "hidden";
    if (gutter > 0) scroller.style.paddingRight = `${gutter}px`;
    return () => {
      scroller.style.overflow = previousOverflow;
      scroller.style.paddingRight = previousPadding;
    };
  }, [modal]);

  const openThread = async (id: string) => {
    if (busy) return;
    const messages = await loadThread(id);
    if (!messages) return;
    setThreadId(id);
    setTurns(messages);
    setEphemeral(false);
    setShowThreads(false);
  };

  const startNew = () => {
    if (busy) return;
    setThreadId(null);
    setTurns([]);
    setShowThreads(false);
    setEphemeral(authenticated !== true);
    if (authenticated !== true) clearEphemeralTurns();
  };

  const removeThread = async (id: string) => {
    if (busy) return;
    if (!(await deleteThread(id))) return;
    setThreads((current) => current.filter((thread) => thread.id !== id));
    if (id === threadId) startNew();
  };

  const send = async (question: string, requestedLens: AgentLens = lensId) => {
    const trimmed = question.trim();
    if (trimmed.length < 2 || busy) return;
    setValue("");
    setBusy(true);
    // Asking is itself a request to see the answer, so re-follow even if the
    // reader had scrolled up to re-read something before typing.
    stickToBottom.current = true;
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
          ? await sendMessage(trimmed, threadId, history, requestedLens, true, reading)
          : await (async () => {
              setStreamingText("");
              const streamed = await sendMessageStream(
                trimmed,
                history,
                requestedLens,
                (text) => setStreamingText(text),
                reading,
              );
              setStreamingText(null);
              // A null means streaming was unavailable; fall back to the
              // non-streaming public path rather than failing the question.
              return (
                streamed ??
                (await sendMessage(trimmed, threadId, history, requestedLens, false, reading))
              );
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
    } catch {
      const unavailable: TwinTurn = {
        id: `local-err-${Date.now()}`,
        role: "twin",
        content:
          "I could not complete that reading. Your question is still here; try again when the connection settles.",
        citations: [],
        refusal_code: "temporarily_unavailable",
      };
      setTurns((current) => {
        const next = [...current, unavailable];
        if (authenticated !== true) saveEphemeralTurns(next);
        return next;
      });
      setEphemeral(authenticated !== true);
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

  const applyWidth = (next: number) => {
    const clamped = clampSidecarWidth(next);
    setWidth(clamped);
    rememberSidecarWidth(clamped);
  };

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    // Without this the drag selects the transcript it passes over.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: width,
      moved: false,
    };
    setDragging(true);
  };

  const resize = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    // The dock is anchored right, so dragging its edge leftward widens it.
    const delta = drag.startX - event.clientX;
    if (Math.abs(delta) > 3) drag.moved = true;
    setWidth(clampSidecarWidth(drag.startWidth + delta));
  };

  const endResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    setDragging(false);
    if (drag.moved) {
      rememberSidecarWidth(width);
      return;
    }
    // A press that never moved is a click, and a click on the resize edge means
    // "give me the other size" rather than nothing at all.
    applyWidth(width >= WIDE_WIDTH ? DOCKED_WIDTH : WIDE_WIDTH);
  };

  const resizeByKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 96 : 24;
    const moves: Record<string, number> = {
      ArrowLeft: width + step,
      ArrowRight: width - step,
      Home: DOCKED_WIDTH,
      End: maxSidecarWidth(),
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    applyWidth(next);
  };

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-label="Minty, the DOT Companion"
      aria-modal={modal}
      className={
        sidecar
          // Docking only earns its keep where the text still has a readable
          // measure left over. Below `lg` a docked panel eats more than half
          // the window and the passage it is meant to sit beside becomes a
          // gutter, so Minty takes the full width there and is dismissed
          // rather than consulted alongside. Above it the width comes from
          // `--minty-sidecar-width`, which the reading page reads too.
          ? `fixed inset-y-0 right-0 z-[60] flex w-full flex-col lg:w-[var(--minty-sidecar-width)] ${
              // A transition would lag a width the reader is holding.
              reducedMotion || dragging ? "" : "lg:transition-[width] lg:duration-200"
            }`
          : "fixed inset-0 z-[60] flex flex-col"
      }
      initial={sidecar ? false : { opacity: 0 }}
      animate={sidecar ? { x: 0 } : { opacity: 1 }}
      exit={sidecar ? { x: "100%" } : { opacity: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : sidecar
            ? { duration: 0.24, ease: "easeOut" }
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
          // At 70% the field did not recede, it ghosted: the masthead and the
          // reading action stayed legible straight through Minty's empty middle
          // band, which reads as a rendering fault rather than depth. Take the
          // scrim to near-opaque so the field is *felt* behind the voice, not
          // read through it.
          className="absolute inset-0 cursor-default bg-background/95 backdrop-blur-xl"
        />
      )}

      {/* The dock's edge, and the way to move it.
          Standing on the seam rather than inside the chrome, it says what it
          does before it is used: this boundary is yours to move. Drag sets any
          width, a click swaps the two useful ones, and arrow keys do the same
          for a reader who never touches a pointer. */}
      {sidecar && wideViewport && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Minty"
          aria-valuenow={width}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={maxSidecarWidth()}
          tabIndex={0}
          title="Drag to resize · click for the other width"
          onPointerDown={startResize}
          onPointerMove={resize}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          onKeyDown={resizeByKey}
          className="group absolute inset-y-0 left-0 z-10 flex w-4 -translate-x-1/2 cursor-col-resize touch-none items-center justify-center focus:outline-none"
        >
          <span
            className={`flex h-12 w-4 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors group-hover:text-foreground group-focus-visible:border-[color:var(--organism-accent-strong)] group-focus-visible:text-foreground ${
              dragging
                ? "border-[color:var(--organism-accent-strong)] text-foreground"
                : "border-border/60"
            }`}
          >
            <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
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
        {/* In focus the column is a raised reading surface rather than bare text
            on the scrim: a hairline edge and its own ground give the words a
            place to sit, which is what makes this feel like somewhere you read
            rather than a panel that opened over the page. */}
        <div
          className={
            sidecar
              // Widening the dock buys room for the passage beside the answer,
              // not longer lines: past a comfortable measure the transcript
              // gets harder to read, not easier, so the column is capped and
              // centred once the panel is wider than it needs to be.
              ? `flex min-h-0 w-full flex-1 flex-col px-5 ${
                  width >= ROOMY_WIDTH ? "mx-auto max-w-2xl" : ""
                }`
              // Opaque on purpose. At 80% the homepage read straight through
              // the reading column, which is the same "ghosting rather than
              // depth" failure the scrim comment below already warns about.
              : "pointer-events-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden border-border/60 bg-background px-4 shadow-[0_1.5rem_4rem_-1.5rem_rgba(0,0,0,0.25)] sm:my-5 sm:max-w-3xl sm:rounded-xl sm:border sm:px-7"
          }
        >
          {/* One row of chrome, not three. Identity on the left, how the answer
              was produced on the right, and the way out. */}
          <header className="flex items-center justify-between gap-4 border-b border-border/40 pb-3.5 pt-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <NucleusMark size={28} thinking={busy} reducedMotion={reducedMotion} />
              <span className="font-serif text-base font-semibold leading-none text-foreground">
                Minty
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2 py-0.5 dot-label"
                title={
                  HAS_ORCHESTRATOR
                    ? "Every answer carries the Book One passages it used. Answers that fall back to direct quotation are marked as such."
                    : "This release has no model behind it. Answers are passages retrieved from Book One and quoted directly."
                }
              >
                <ShieldCheck
                  className="h-3 w-3 text-[var(--organism-accent-strong)]"
                  aria-hidden="true"
                />
                {HAS_ORCHESTRATOR ? "Source-checked" : "Quoted passages"}
              </span>
            </div>
            {/* Width lives on the dock's own edge, not in here. */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-full border border-border/50 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

      <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          {authenticated ? (
            <button
              type="button"
              onClick={() => setShowThreads((current) => !current)}
              className="flex items-center gap-1.5 rounded-full px-2 py-1 dot-label transition-colors hover:text-foreground"
            >
              <MessageSquare className="h-3 w-3" aria-hidden="true" />
              Saved sessions
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-1 dot-label">
              <MessageSquare className="h-3 w-3" aria-hidden="true" />
              Current tab
            </span>
          )}
          <button
            type="button"
            onClick={startNew}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full px-2 py-1 dot-label transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            New session
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
                    disabled={busy}
                    aria-label={`Delete ${thread.title}`}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <motion.div
          ref={scrollerRef}
          onScroll={trackStickiness}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          custom={reducedMotion}
          className={`min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain pr-1 ${
            empty ? "flex flex-col" : ""
          }`}
        >
          {empty && (
            // Auto margins rather than `justify-center`: this is a scroll
            // container, and on a short viewport centring by justification
            // clips the top of the block beyond reach.
            <motion.div variants={staggerChild} className="my-auto space-y-5 py-2">
              <div className="border-y border-border/40 py-4">
                <p className="dot-label">
                  Consulting
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                  {authenticated
                    ? "Your saved knowledge and released Book One canon. Academic abstracts are added when you ask for evidence."
                    : "Released Book One canon. Ask for evidence to compare it with academic abstracts; private documents remain private."}
                </p>
                {/* On a static release there is no model behind Minty, only the
                    released text and a ranking over it. It still cites what it
                    found and still refuses what it cannot ground — but it
                    returns passages rather than composing an answer, and a chat
                    window that does not say so is quietly promising a
                    conversation it cannot hold. */}
                {!HAS_ORCHESTRATOR && (
                  <p className="mt-2 dot-meta leading-5 text-muted-foreground/85">
                    Reading directly from the released text right now, so answers arrive as the
                    closest passages with their claim levels, not as composed prose.
                  </p>
                )}
              </div>

              <div>
                <p className="dot-label">
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
                        <span className="mt-1 block dot-micro leading-relaxed opacity-75">
                          {candidate.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="dot-label">
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
              <p className="mb-2 flex items-center gap-2 dot-label">
                <NucleusMark size={18} thinking reducedMotion={reducedMotion} />
                Minty
              </p>
              <div className="font-serif text-base leading-7 text-foreground sm:text-[17px] sm:leading-8">
                <span className="whitespace-pre-wrap">{smoothedStream}</span>
                <span
                  className="ml-0.5 inline-block h-4 w-[2px] animate-pulse align-middle"
                  style={{ background: "var(--organism-accent-strong)" }}
                  aria-hidden="true"
                />
              </div>
            </motion.article>
          ) : busy ? (
            /* The DOT mark itself at work while Minty gathers the thread: the
               same identity the site is built around, thinking. */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-5 py-10"
              aria-live="polite"
              role="status"
            >
              <NucleusMark size={86} thinking reducedMotion={reducedMotion} />
              <span className="font-serif text-base italic text-muted-foreground">
                Tracing the question through its sources…
              </span>
            </motion.div>
          ) : null}
          <div ref={endRef} />
        </motion.div>

        {ephemeral && (
          <p className="dot-micro text-muted-foreground">
            Temporary session · stored only in this browser tab.
          </p>
        )}

        {/* The composer: lens within reach, then the field to speak into. */}
        <div className="space-y-2.5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
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
                  disabled={busy}
                  aria-pressed={active}
                  title={candidate.description}
                  className={`dot-meta flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? "bg-[color:var(--organism-accent-strong)] text-background font-semibold"
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
            className="flex items-end gap-2"
          >
            <textarea
              ref={composerRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={`Ask through the ${lens.label.toLowerCase()} lens…`}
              aria-label="Ask Minty about Digital Organism Theory. Enter sends; Shift plus Enter adds a new line."
              rows={1}
              // The same page the home composer is: a cinnabar margin rule down the
              // inside edge, and the reader's words in the book's own serif.
              className="min-h-11 min-w-0 flex-1 resize-none rounded-lg border border-border/60 border-l-2 border-l-[color:var(--organism-accent-strong)]/45 bg-background/70 px-3.5 py-2.5 font-serif text-base leading-relaxed text-foreground outline-none transition-colors placeholder:font-sans placeholder:text-muted-foreground focus:border-[color:var(--organism-accent-strong)] focus:border-l-[color:var(--organism-accent-strong)] focus:ring-1 focus:ring-[color:var(--organism-accent-soft)]"
            />
            <button
              type="submit"
              disabled={value.trim().length < 2 || busy}
              aria-label="Send"
              // While Minty is working the button steps back to paper: the mark
              // is drawn in the accent, and on an accent-filled button it was
              // one solid shape thinking invisibly to itself.
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
                busy
                  ? "border border-border/60 bg-background"
                  : "bg-[color:var(--organism-accent-strong)] text-background"
              }`}
            >
              {busy ? (
                <NucleusMark size={22} thinking reducedMotion={reducedMotion} />
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
