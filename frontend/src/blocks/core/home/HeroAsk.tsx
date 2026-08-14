import { ArrowUp, GitBranch, Scale, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

  return (
    <div className={`space-y-3 ${className}`}>
      <form onSubmit={submit} className="relative w-full">
        <div
          className={`dot-surface flex items-center gap-2.5 rounded-2xl border px-3.5 backdrop-blur-xl transition-all duration-300 shadow-lg ${
            isFocused
              ? "border-[color:var(--organism-accent-strong)]/50 bg-background/70 shadow-[color:var(--organism-accent-strong)]/8 ring-1 ring-[color:var(--organism-accent-soft)]/20"
              : "border-border/20 bg-background/40 shadow-black/[0.03] hover:border-border/40 hover:bg-background/55"
          }`}
        >
          {/* Accent dot / pulse indicator */}
          <span
            className={`h-2 w-2 shrink-0 rounded-full transition-all duration-500 ${
              isSubmitting
                ? "scale-150 bg-[color:var(--organism-accent-strong)] shadow-[0_0_12px_var(--organism-accent-strong)]"
                : isFocused
                ? "bg-[color:var(--organism-accent-strong)] shadow-[0_0_8px_var(--organism-accent-soft)]"
                : "bg-[color:var(--organism-accent-strong)]/40"
            }`}
          />

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
            className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60 sm:h-14"
          />

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
            disabled={!query.trim() || query.trim() === "/" || isSubmitting}
            aria-label="Send"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
              query.trim() && query.trim() !== "/"
                ? "bg-[color:var(--organism-accent-strong)] text-background shadow-md shadow-[color:var(--organism-accent-strong)]/25 hover:scale-[1.03] active:scale-[0.97]"
                : "bg-foreground/[0.06] text-muted-foreground/40"
            }`}
          >
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
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
