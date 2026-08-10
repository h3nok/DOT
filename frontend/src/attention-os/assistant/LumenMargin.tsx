import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpenCheck,
  Coffee,
  Compass,
  CornerDownLeft,
  RotateCcw,
  Scale,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link } from "react-router-dom";
import { Streamdown } from "streamdown";
import { createMathPlugin } from "@streamdown/math";
import "katex/dist/katex.min.css";
import "streamdown/styles.css";
import type { AgentLens } from "../../dot/agent";
import NucleusMark from "../../dot/NucleusMark";
import {
  clearMarginSession,
  loadMarginSession,
  saveMarginSession,
  streamMarginAnswer,
  type MarginCitation,
  type MarginEventEnvelope,
  type MarginTurn,
  type ReaderAgentScope,
} from "./marginAgent";

type RunStatus =
  | "ready"
  | "finding"
  | "evidence"
  | "composing"
  | "streaming"
  | "failed";

const LENSES: Array<{
  id: AgentLens;
  label: string;
  Icon: typeof Compass;
}> = [
  { id: "ground", label: "Understand", Icon: BookOpenCheck },
  { id: "orient", label: "Locate", Icon: Compass },
  { id: "test", label: "Test", Icon: Scale },
];

const math = createMathPlugin({ singleDollarTextMath: true });

function createId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

function citationsFrom(value: unknown): MarginCitation[] {
  if (!Array.isArray(value)) return [];
  return value.filter((citation): citation is MarginCitation => {
    if (!citation || typeof citation !== "object") return false;
    const item = citation as Partial<MarginCitation>;
    return (
      typeof item.node_id === "string" &&
      typeof item.kind === "string" &&
      typeof item.label === "string"
    );
  });
}

function statusCopy(status: RunStatus, sourceCount: number) {
  switch (status) {
    case "finding":
      return "Finding released passages";
    case "evidence":
      return sourceCount === 1
        ? "Checking one passage"
        : `Checking ${sourceCount} passages`;
    case "composing":
      return "Writing from the evidence";
    case "streaming":
      return "Answering";
    case "failed":
      return "The book could not be reached";
    default:
      return "";
  }
}

function sourceLocator(citation: MarginCitation): string | null {
  const locator = citation.locator;
  if (!locator) return null;
  const section =
    typeof locator.section === "string" ? locator.section : undefined;
  const heading =
    typeof locator.heading === "string" ? locator.heading : undefined;
  return section ? `${section}${heading ? `#${heading}` : ""}` : null;
}

function MarginMessage({
  turn,
  streaming = false,
  reducedMotion,
  onCitation,
}: {
  turn: MarginTurn;
  streaming?: boolean;
  reducedMotion: boolean;
  onCitation: (citation: MarginCitation) => void;
}) {
  if (turn.role === "reader") {
    return <p className="lumen-reader-message">{turn.content}</p>;
  }

  return (
    <article className="lumen-answer">
      <div className="lumen-answer-mark" aria-hidden="true">
        <NucleusMark size={26} reducedMotion />
      </div>
      <div className="min-w-0 flex-1">
        <Streamdown
          mode={streaming ? "streaming" : "static"}
          controls={false}
          lineNumbers={false}
          skipHtml
          plugins={{ math }}
          urlTransform={() => null}
          animated={
            reducedMotion
              ? false
              : { animation: "fadeIn", duration: 140, sep: "word", stagger: 8 }
          }
          className="lumen-markdown"
        >
          {turn.content}
        </Streamdown>

        {turn.citations.length > 0 && (
          <ol className="lumen-citations" aria-label="Sources">
            {turn.citations.map((citation, index) => (
              <li key={`${citation.node_id}-${index}`}>
                <button
                  type="button"
                  onClick={() => onCitation(citation)}
                  disabled={!sourceLocator(citation)}
                  title={
                    sourceLocator(citation)
                      ? typeof citation.locator?.heading === "string"
                        ? "Open this passage in the book"
                        : "Open this section in the book"
                      : "This source has no reader location"
                  }
                >
                  <span>{index + 1}</span>
                  <span>{citation.label}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </article>
  );
}

export function LumenMargin({
  open,
  scope,
  onOpenChange,
  onClearSelection,
  onCitation,
}: {
  open: boolean;
  scope: ReaderAgentScope;
  onOpenChange: (open: boolean) => void;
  onClearSelection: () => void;
  onCitation: (citation: MarginCitation) => void;
}) {
  const [turns, setTurns] = useState<MarginTurn[]>(loadMarginSession);
  const [draft, setDraft] = useState<MarginTurn | null>(null);
  const [input, setInput] = useState("");
  const [lens, setLens] = useState<AgentLens>("ground");
  const [status, setStatus] = useState<RunStatus>("ready");
  const [sourceCount, setSourceCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const busy = draft !== null;

  useEffect(() => saveMarginSession(turns), [turns]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [draft?.content, open, reducedMotion, turns]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const suggestions = useMemo(() => {
    if (scope.selection) {
      return [
        "Explain this passage in ordinary language.",
        "How does this connect to the Experience Loop?",
        "What assumption should I question here?",
      ];
    }
    if (scope.sectionTitle) {
      return [
        `What is the central idea in ${scope.sectionTitle}?`,
        "Connect this chapter to the Experience Loop.",
        "Where does this chapter mark a limit or hypothesis?",
      ];
    }
    return [
      "Give me a plain-language map of Book One.",
      "Where should I begin if I care about conditioning?",
      "Which claims does the book leave open?",
    ];
  }, [scope.sectionTitle, scope.selection]);

  const handleEvent = (
    event: MarginEventEnvelope,
    answerBlocks: string[],
    citations: { current: MarginCitation[] },
  ) => {
    switch (event.type) {
      case "run.started":
        setStatus("finding");
        break;
      case "evidence.ready": {
        const count = Number(event.payload.source_count ?? 0);
        setSourceCount(Number.isFinite(count) ? count : 0);
        setStatus("evidence");
        break;
      }
      case "answer.composing":
        setStatus("composing");
        break;
      case "answer.block": {
        const index = Number(event.payload.index);
        const text = event.payload.text;
        if (Number.isInteger(index) && typeof text === "string") {
          answerBlocks[index] = text;
          setDraft((current) =>
            current
              ? { ...current, content: answerBlocks.filter(Boolean).join("\n\n") }
              : current,
          );
          setStatus("streaming");
        }
        break;
      }
      case "citation.ready":
        citations.current = citationsFrom(event.payload.citations);
        setDraft((current) =>
          current ? { ...current, citations: citations.current } : current,
        );
        break;
      case "run.failed":
        setStatus("failed");
        break;
      default:
        break;
    }
  };

  const ask = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || busy) return;

    const readerTurn: MarginTurn = {
      id: createId("reader"),
      role: "reader",
      content: question,
      citations: [],
    };
    const lumenTurn: MarginTurn = {
      id: createId("lumen"),
      role: "lumen",
      content: "",
      citations: [],
    };
    const priorTurns = turns;
    const answerBlocks: string[] = [];
    const citations = { current: [] as MarginCitation[] };
    let completed = false;
    let refusalCode: string | null = null;

    setTurns((current) => [...current, readerTurn]);
    setDraft(lumenTurn);
    setInput("");
    setError(null);
    setSourceCount(0);
    setStatus("finding");

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamMarginAnswer({
        question,
        lens,
        scope,
        history: priorTurns,
        signal: controller.signal,
        onEvent: (event) => {
          handleEvent(event, answerBlocks, citations);
          if (event.type === "run.refused") {
            refusalCode =
              typeof event.payload.code === "string"
                ? event.payload.code
                : "grounding_refused";
          }
          if (event.type === "run.completed") completed = true;
        },
      });

      if (!completed || answerBlocks.length === 0) {
        throw new Error("Lumen's answer ended before it was complete.");
      }
      setTurns((current) => [
        ...current,
        {
          ...lumenTurn,
          content: answerBlocks.filter(Boolean).join("\n\n"),
          citations: citations.current,
          refusalCode,
        },
      ]);
      setDraft(null);
      setStatus("ready");
    } catch (reason) {
      setDraft(null);
      if (controller.signal.aborted) {
        setStatus("ready");
      } else {
        setStatus("failed");
        setError(
          reason instanceof Error
            ? reason.message
            : "Lumen could not complete that answer.",
        );
      }
    } finally {
      abortRef.current = null;
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(input);
  };

  const handleComposerKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void ask(input);
    }
  };

  const clearSession = () => {
    abortRef.current?.abort();
    clearMarginSession();
    setTurns([]);
    setDraft(null);
    setError(null);
    setStatus("ready");
    inputRef.current?.focus();
  };

  const scopeTitle = scope.headingTitle ?? scope.sectionTitle ?? "Book One";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <Dialog.Portal>
        <Dialog.Overlay className="lumen-margin-overlay" />
        <Dialog.Content
          className="lumen-margin"
          aria-describedby="lumen-margin-scope"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <header className="lumen-margin-header">
            <div className="lumen-margin-identity">
              <NucleusMark size={32} reducedMotion={reducedMotion} />
              <div>
                <p>The DOT Companion</p>
                <Dialog.Title>Lumen</Dialog.Title>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="lumen-icon-button"
                onClick={clearSession}
                title="Start a new study session"
                aria-label="Start a new study session"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="lumen-icon-button"
                  aria-label="Close Lumen"
                  title="Return to reading"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </header>

          <div id="lumen-margin-scope" className="lumen-scope">
            <div className="min-w-0">
              <p>{scope.releaseLabel}</p>
              <strong>{scopeTitle}</strong>
              {scope.selection && <blockquote>“{scope.selection}”</blockquote>}
            </div>
            {scope.selection && (
              <button
                type="button"
                onClick={onClearSelection}
                aria-label="Clear selected passage"
                title="Ask from the whole section"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="lumen-lenses" aria-label="Reading lens">
            {LENSES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={lens === id}
                onClick={() => setLens(id)}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="lumen-conversation">
            {turns.length === 0 && !draft ? (
              <div className="lumen-welcome">
                <p className="lumen-welcome-kicker">In the margin</p>
                <h2>Stay with the difficult part.</h2>
                <p>
                  Lumen answers from the current Book One release and opens the
                  passages behind the answer.
                </p>
                <div className="lumen-suggestions">
                  {suggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      onClick={() => void ask(suggestion)}
                    >
                      <span>{suggestion}</span>
                      <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="lumen-turns">
                {turns.map((turn) => (
                  <MarginMessage
                    key={turn.id}
                    turn={turn}
                    reducedMotion={reducedMotion}
                    onCitation={onCitation}
                  />
                ))}
                {draft && (
                  <MarginMessage
                    turn={draft}
                    streaming
                    reducedMotion={reducedMotion}
                    onCitation={onCitation}
                  />
                )}
              </div>
            )}

            {(status !== "ready" || error) && (
              <div className="lumen-run-state" aria-live="polite">
                {status !== "failed" && <span aria-hidden="true" />}
                <p>{error ?? statusCopy(status, sourceCount)}</p>
                {status === "failed" && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStatus("ready");
                      inputRef.current?.focus();
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Try again
                  </button>
                )}
              </div>
            )}

            {turns.some((turn) => turn.role === "lumen") && (
              <Link to="/?support=open" className="lumen-support-link">
                <Coffee className="h-3.5 w-3.5" aria-hidden="true" />
                Help keep Lumen public
              </Link>
            )}
          </div>

          <footer className="lumen-composer-wrap">
            <form className="lumen-composer" onSubmit={submit}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, 2_000))}
                onKeyDown={handleComposerKey}
                rows={1}
                disabled={busy}
                placeholder="Ask about this passage…"
                aria-label="Ask Lumen"
              />
              {busy ? (
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  aria-label="Stop answer"
                  title="Stop answer"
                >
                  <Square className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send question"
                  title="Send question"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </form>
            <p>This study session stays in this browser tab.</p>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default LumenMargin;
