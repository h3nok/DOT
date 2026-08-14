import { ArrowUp } from "lucide-react";
import { useState } from "react";

import { SAMPLE_QUESTIONS, type HeroAskRequest } from "./heroData";

interface HeroAskProps {
  onAsk: (request: HeroAskRequest) => void;
  className?: string;
}

export function HeroAsk({ onAsk, className = "" }: HeroAskProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onAsk({ query: trimmed, lens: "ground" });
    setQuery("");
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <form onSubmit={submit} className="relative w-full">
        <div
          className={`dot-surface flex items-center gap-3 rounded-2xl border px-4 backdrop-blur-xl transition-all duration-300 shadow-lg ${
            isFocused
              ? "border-[color:var(--organism-accent-strong)]/50 bg-background/70 shadow-[color:var(--organism-accent-strong)]/8 ring-1 ring-[color:var(--organism-accent-soft)]/20"
              : "border-border/20 bg-background/40 shadow-black/[0.03] hover:border-border/40 hover:bg-background/55"
          }`}
        >
          {/* Accent dot — the organism's presence in the input */}
          <span
            className={`h-2 w-2 shrink-0 rounded-full transition-all duration-500 ${
              isFocused
                ? "bg-[color:var(--organism-accent-strong)] shadow-[0_0_8px_var(--organism-accent-soft)]"
                : "bg-[color:var(--organism-accent-strong)]/40"
            }`}
          />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask a question — answers cite Book One directly"
            aria-label="Ask a question about Digital Organism Theory"
            className="h-14 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/35"
          />

          <button
            type="submit"
            disabled={!query.trim()}
            aria-label="Send"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
              query.trim()
                ? "bg-[color:var(--organism-accent-strong)] text-background shadow-md shadow-[color:var(--organism-accent-strong)]/25"
                : "bg-foreground/[0.06] text-muted-foreground/40"
            }`}
          >
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {SAMPLE_QUESTIONS.map((question, index) => (
          <button
            key={question.text}
            type="button"
            onClick={() => onAsk({ query: question.text, lens: question.lens })}
            className={`min-h-11 items-center rounded-full border border-border/20 px-3 py-1 dot-meta text-muted-foreground/60 transition-all hover:border-[color:var(--organism-accent-strong)]/30 hover:text-foreground sm:min-h-0 ${
              index < 2 ? "inline-flex" : "hidden sm:inline-flex"
            }`}
          >
            {question.text}
          </button>
        ))}
      </div>
    </div>
  );
}
