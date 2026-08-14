import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  BookOpen,
  Braces,
  Compass,
  FileCheck2,
  MessageSquareText,
  PanelBottomOpen,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react";
import type { AgentLens } from "./agent";
import { NucleusMark } from "./NucleusMark";
import "./agent-workspace.css";

export interface AgentWorkspaceRequest {
  query: string;
  lens: AgentLens;
}

interface AgentWorkspaceProps {
  onSubmit: (request: AgentWorkspaceRequest) => void | Promise<void>;
  onOpenCompanion: () => void;
  busy?: boolean;
  focusActive?: boolean;
}

const LENSES = [
  {
    id: "orient",
    label: "Orient",
    icon: Compass,
    placeholder: "Ask Minty to locate an idea or chapter...",
    prompts: [
      "Open the canon",
      "Open the Book One concept map",
      "Where does the observer enter?",
    ],
  },
  {
    id: "ground",
    label: "Ground",
    icon: FileCheck2,
    placeholder: "Ask Minty for a grounded answer...",
    prompts: [
      "What does DOT actually claim?",
      "Which source explains attention?",
      "What is marked as speculation?",
    ],
  },
  {
    id: "test",
    label: "Test",
    icon: Scale,
    placeholder: "Ask Minty to test the argument...",
    prompts: [
      "Where is the evidence weakest?",
      "What would falsify this?",
      "Which claims need more support?",
    ],
  },
] as const;

export const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  onSubmit,
  onOpenCompanion,
  busy = false,
  focusActive = false,
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [lensId, setLensId] = useState<AgentLens>("orient");

  const lens = useMemo(
    () => LENSES.find((candidate) => candidate.id === lensId) ?? LENSES[0],
    [lensId],
  );

  const send = async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || busy) return;
    setValue("");
    await onSubmit({ query: trimmed, lens: lensId });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void send(value);
  };

  return (
    <div
      className={`agent-workspace pointer-events-none fixed inset-x-0 bottom-5 z-20 mx-auto flex w-full max-w-3xl flex-col items-center gap-3 px-4 ${
        focusActive ? "agent-workspace-focus" : ""
      }`}
    >
      <AnimatePresence>
        {open && (
          <motion.section
            key="workspace"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="agent-workspace-panel pointer-events-auto w-full"
            aria-label="Minty, the DOT Companion"
          >
            <div className="agent-workspace-header">
              <div className="min-w-0">
                <p className="agent-workspace-kicker">The DOT Companion</p>
                <h2>Minty</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenCompanion}
                  className="agent-icon-button"
                  title="Open Minty"
                  aria-label="Open Minty"
                >
                  <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="agent-icon-button"
                  title="Close workspace"
                  aria-label="Close workspace"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="agent-workspace-grid">
              <section className="agent-workspace-cell">
                <p className="agent-workspace-kicker">Scope</p>
                <div className="mt-3 space-y-2">
                  <div className="agent-scope-row">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    <span>Book One · Edition v2</span>
                  </div>
                  <div className="agent-scope-row">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>Public graph</span>
                  </div>
                  <div className="agent-scope-row">
                    <Braces className="h-4 w-4" aria-hidden="true" />
                    <span>Book-derived concept map</span>
                  </div>
                </div>
              </section>

              <section className="agent-workspace-cell">
                <p className="agent-workspace-kicker">Lens</p>
                <div className="agent-lens-grid mt-3">
                  {LENSES.map((candidate) => {
                    const Icon = candidate.icon;
                    const active = candidate.id === lens.id;
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => setLensId(candidate.id)}
                        aria-pressed={active}
                        className={`agent-lens-button ${active ? "agent-lens-button-active" : ""}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{candidate.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="agent-workspace-cell agent-workspace-cell-wide">
                <p className="agent-workspace-kicker">Begin</p>
                <div className="mt-3 grid gap-2">
                  {lens.prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void send(prompt)}
                      className="agent-prompt-row"
                    >
                      <span>{prompt}</span>
                      <ArrowUp className="h-3.5 w-3.5 rotate-45" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.35 }}
        className="pointer-events-auto flex w-full items-center gap-2"
      >
        <div className={`agent-command ${focused ? "agent-command-focus" : ""}`}>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="agent-command-tool"
            title={open ? "Close agent workspace" : "Open agent workspace"}
            aria-label={open ? "Close agent workspace" : "Open agent workspace"}
            aria-expanded={open}
          >
            <PanelBottomOpen className="h-4 w-4" aria-hidden="true" />
          </button>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={lens.placeholder}
            aria-label="Navigate or ask Minty about Book One"
            className="agent-command-input"
          />
          <button
            type="button"
            onClick={onOpenCompanion}
            className="agent-command-tool hidden sm:inline-flex"
            title="Open Minty"
            aria-label="Open Minty"
          >
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="submit"
            disabled={value.trim().length < 2 || busy}
            aria-label="Send"
            data-busy={busy ? "true" : undefined}
            className="agent-command-send"
          >
            {/* DOT's own mark thinking, not a borrowed spinner: the same
                identity that answers is the one that shows it is working. */}
            {busy ? (
              <NucleusMark size={18} thinking />
            ) : (
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default AgentWorkspace;
