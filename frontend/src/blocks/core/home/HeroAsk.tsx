import { motion } from "framer-motion";
import { ArrowUp, CornerDownLeft, Sparkles } from "lucide-react";
import { useState } from "react";

import { SAMPLE_QUESTIONS, type HeroAskRequest } from "./heroData";

/**
 * The one question a visitor is actually holding, asked here.
 *
 * Most people arriving at a theory do not want a table of contents; they want to
 * find out whether it says anything to them. This is that door — a plain field
 * and four questions someone might genuinely be carrying: what the work claims,
 * what it says about the reader's own life, where it is weakest, and what kind
 * of claim it is making at all. Scepticism is a legitimate reason to be here, so
 * two of the four openings are adversarial.
 *
 * The suggestions are not engagement bait: they are finite, they never refresh,
 * and each one hands the reader straight to a grounded answer with its sources
 * rather than into a conversation designed to continue.
 */

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
    <div className={`space-y-5 ${className}`}>
      <form onSubmit={submit} className="relative w-full">
        <div
          className={`flex items-center overflow-hidden rounded-2xl border transition-all duration-200 ${
            isFocused
              ? "border-[color:var(--organism-accent-strong)] bg-foreground/[0.025] ring-2 ring-[color:var(--organism-accent-soft)]/40 shadow-sm"
              : "border-border/50 bg-foreground/[0.015] hover:border-[color:var(--organism-accent-strong)]/40 hover:bg-foreground/[0.025]"
          }`}
        >
          {/* Search/Ask Icon */}
          <div className="pl-4 pr-1 text-[color:var(--organism-accent-strong)]">
            <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask Minty about the theory…"
            aria-label="Ask a question about Digital Organism Theory"
            className="h-13 w-full bg-transparent px-3 text-[14px] font-normal text-foreground outline-none placeholder:text-muted-foreground/60"
          />

          {/* Submit button & shortcut indicator */}
          <div className="flex items-center gap-2 pr-3">
            {query.trim() ? (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                type="submit"
                aria-label="Submit inquiry"
                className="inline-flex h-8.5 items-center gap-1.5 rounded-xl bg-[color:var(--organism-accent-strong)] px-3.5 text-xs font-semibold text-background transition-transform active:scale-[0.98]"
              >
                <span>Ask</span>
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              </motion.button>
            ) : (
              <span className="dot-chip hidden sm:inline-flex border border-border/40 bg-foreground/[0.03] text-muted-foreground">
                <CornerDownLeft className="h-2.5 w-2.5" />
                <span>Enter</span>
              </span>
            )}
          </div>
        </div>
      </form>

      {/* ── Symmetrical Centered Sample Inquiry Chips ────────────────────────── */}
      <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
        <span className="dot-label mr-1 hidden sm:inline">Try asking:</span>
        {SAMPLE_QUESTIONS.map((question) => (
          <motion.button
            key={question.text}
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAsk({ query: question.text, lens: question.lens })}
            className="group inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-foreground/[0.015] px-3.5 py-1.5 text-xs text-muted-foreground transition-all hover:border-[color:var(--organism-accent-strong)]/40 hover:bg-foreground/[0.035] hover:text-foreground"
          >
            <span>{question.text}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
