import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";

/**
 * GraphChat — the way you talk to the organism.
 *
 * A single quiet input at the bottom centre, with a first-move scaffold:
 * suggested prompts as tappable chips so a visitor is never staring at an empty
 * field wondering where to begin. Ask it to open a world ("show me your work")
 * and it navigates the graph, blooming that content from the centre; ask a
 * question and it answers (backend twin, local fallback).
 */

interface GraphChatProps {
  onSubmit: (query: string) => void | Promise<void>;
  busy?: boolean;
  placeholder?: string;
  /** First-move prompts shown above the bar while the field is empty. */
  suggestions?: string[];
}

export const GraphChat: React.FC<GraphChatProps> = ({
  onSubmit,
  busy = false,
  placeholder = "Ask the graph, or name a world to open…",
  suggestions = [],
}) => {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const send = async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || busy) return;
    setValue("");
    await onSubmit(trimmed);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(value);
  };

  const showSuggestions = suggestions.length > 0 && value.length === 0 && !busy;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 mx-auto flex w-full max-w-xl flex-col items-center gap-3 px-4">
      {/* Suggested first moves. */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto flex flex-wrap items-center justify-center gap-2"
          >
            {suggestions.map((prompt, i) => (
              <motion.button
                key={prompt}
                type="button"
                onClick={() => void send(prompt)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: 0.04 * i, type: "spring", stiffness: 400, damping: 25 }}
                className="organism-alive rounded-full border border-white/10 dark:border-white/5 bg-background/40 px-3.5 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-xl shadow-lg transition-colors hover:border-[color:var(--organism-accent-soft)] hover:text-foreground hover:bg-background/60"
              >
                {prompt}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, type: "spring", stiffness: 200, damping: 26 }}
        className="pointer-events-auto flex w-full items-center gap-2"
      >
        <div
          className={`organism-alive relative flex w-full items-center gap-2 rounded-full border bg-background/30 py-2.5 pl-4 pr-2 backdrop-blur-3xl transition-colors ${
            focused
              ? "border-primary/50 shadow-[0_0_30px_var(--organism-accent-soft)]"
              : "border-white/10 dark:border-white/5 shadow-[var(--premium-shadow)]"
          }`}
        >
          {/* Gradient accent line — connecting the chat to the living graph. */}
          <span
            className="pointer-events-none absolute inset-x-4 bottom-0 h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, var(--organism-accent-soft), transparent)",
              opacity: focused ? 0.8 : 0.3,
              transition: "opacity 300ms ease",
            }}
            aria-hidden="true"
          />
          <Sparkles
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--organism-accent)" }}
            aria-hidden="true"
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            aria-label="Ask the graph"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={value.trim().length < 2 || busy}
            aria-label="Send"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-background transition-opacity disabled:opacity-40"
            style={{ background: "var(--organism-accent-strong)" }}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default GraphChat;
