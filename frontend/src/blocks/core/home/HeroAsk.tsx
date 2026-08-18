import { GitBranch, Scale, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { InkNib, InkStroke } from "../../../shared/Ink";
import { SAMPLE_QUESTIONS, type HeroAskRequest } from "./heroData";
import type { AgentLens } from "../../../dot/agent";

const FEATURED_COMMANDS = [
  { command: "/claim", question: SAMPLE_QUESTIONS[0] },
  { command: "/critique", question: SAMPLE_QUESTIONS[2] },
] as const;

interface HeroAskProps {
  onAsk: (request: HeroAskRequest) => void;
  className?: string;
}

export function HeroAsk({ onAsk, className = "" }: HeroAskProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedLens, setSelectedLens] = useState<AgentLens>("ground");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [strokeWidth, setStrokeWidth] = useState(0);

  /**
   * The stroke is exactly as long as what has been written.
   *
   * A rule spanning the whole field underlines mostly empty paper, which is a
   * form control's habit, not a pen's — ink only exists where the nib has been.
   * Width is measured from a mirror of the text in the same face and size,
   * because the input itself will not report the width of its own value.
   */
  useLayoutEffect(() => {
    const mirror = measureRef.current;
    const input = inputRef.current;
    if (!mirror || !input) return;
    // A touched-down nib leaves a mark before any letter does; an empty focused
    // field gets that and nothing more.
    const written = mirror.offsetWidth;
    const room = input.clientWidth;
    setStrokeWidth(query ? Math.min(written, room) : 0);
  }, [query, isFocused]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        !(document.activeElement as HTMLElement)?.isContentEditable
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (query) {
        setQuery("");
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || trimmed === "/" || isSubmitting) return;

    const command = FEATURED_COMMANDS.find(
      (item) => item.command === trimmed.toLowerCase(),
    );
    const request = command
      ? { query: command.question.text, lens: command.question.lens }
      : { query: trimmed, lens: selectedLens };

    setIsSubmitting(true);
    setTimeout(() => {
      onAsk(request);
      setQuery("");
      setIsSubmitting(false);
    }, 120);
  };

  const handlePromptClick = (question: (typeof SAMPLE_QUESTIONS)[number]) => {
    setSelectedLens(question.lens);
    setIsFocused(false);
    inputRef.current?.blur();
    onAsk({ query: question.text, lens: question.lens });
  };

  const showCommands = query.trim() === "" || query.trim() === "/";
  const sendable = Boolean(query.trim()) && query.trim() !== "/";

  /**
   * Where the writing has got to, in the mark's terms rather than the form's.
   * `poised` is a nib touched to paper; `writing` is a stroke being laid down;
   * `striking` is the hand lifting away. The CSS reads only this attribute, so
   * the appearance never has to re-derive the form's booleans.
   */
  const penState = isSubmitting
    ? "striking"
    : sendable
      ? "writing"
      : isFocused
        ? "poised"
        : "resting";

  return (
    <div className={`space-y-3 ${className}`}>
      <form onSubmit={submit} className="relative w-full">
        <div className="home-ask" data-pen={penState}>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              isFocused
                ? "Ask Minty or enter a / command…"
                : "Ask Minty about Book One…"
            }
            aria-label="Ask a question about Digital Organism Theory"
            className="home-ask__input placeholder:text-muted-foreground/55"
          />

          {/* Mirrors the value in the same face so the stroke can be measured
              against real text rather than an estimate. */}
          <span ref={measureRef} className="home-ask__measure" aria-hidden="true">
            {query}
          </span>

          {/* The mark the pen leaves. It is the whole of the pen we show. */}
          <InkStroke width={strokeWidth} className="home-ask__stroke" />

          {/* Lens stance mode toggle */}
          <button
            type="button"
            onClick={() => setSelectedLens((prev) => (prev === "ground" ? "test" : "ground"))}
            title={
              selectedLens === "ground"
                ? "Lens: Ground (cite source passages) — click to switch to Test"
                : "Lens: Test (scrutinize & find weak points) — click to switch to Ground"
            }
            className={`hidden sm:inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              selectedLens === "test"
                ? "border-[color:var(--organism-accent-strong)]/40 bg-[color:var(--organism-accent-strong)]/10 text-[color:var(--organism-accent-strong)] font-semibold"
                : "border-border/30 text-muted-foreground/60 hover:text-foreground"
            }`}
          >
            {selectedLens === "test" ? (
              <>
                <Scale className="h-3 w-3" aria-hidden="true" />
                <span>Test</span>
              </>
            ) : (
              <>
                <GitBranch className="h-3 w-3" aria-hidden="true" />
                <span>Ground</span>
              </>
            )}
          </button>

          {/* Clear button when query is present */}
          {query.trim() && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-foreground/[0.04] hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}

          {/* Quick slash shortcut indicator */}
          {!query.trim() && !isFocused && (
            <kbd
              aria-hidden="true"
              className="hidden sm:inline-flex shrink-0 items-center justify-center rounded-md border border-border/30 bg-foreground/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/50 select-none"
              title="Press / to search"
            >
              /
            </kbd>
          )}

          <button
            type="submit"
            disabled={!sendable || isSubmitting}
            aria-label="Send"
            className="home-ask__nib"
          >
            <InkNib charged={sendable} className="home-ask__nib-mark" />
          </button>
        </div>

        {showCommands && (
          <div
            id="minty-command-suggestions"
            className="home-ask-command-menu"
            aria-label="Sample Minty commands"
          >
            {FEATURED_COMMANDS.map(({ command, question }) => (
              <button
                key={command}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handlePromptClick(question)}
                className="home-ask-command"
              >
                <kbd>{command}</kbd>
                <span>{question.text}</span>
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
