import React from "react";
import { current, origin, type ThreadStep } from "./threadPath";

/**
 * The Thread — a hairline record of this session's attention (doc 12 §3).
 *
 * Not breadcrumbs: this is chronology, not hierarchy. It is session-local and
 * never persisted, it always shows where the session began, and any point on it
 * can be walked back to. It is a record for the member, never a measurement.
 */

interface ThreadLineProps {
  thread: ThreadStep[];
  /** Return focus to a step already on the thread. */
  onWalkBack: (id: string) => void;
  onClear: () => void;
  reducedMotion?: boolean;
}

export const ThreadLine: React.FC<ThreadLineProps> = ({
  thread,
  onWalkBack,
  onClear,
  reducedMotion = false,
}) => {
  if (thread.length < 2) return null;

  const start = origin(thread);
  const here = current(thread);

  return (
    <nav
      aria-label="This session's thread"
      className="pointer-events-auto flex max-w-full items-center gap-2 overflow-hidden"
    >
      <ol className="flex min-w-0 items-center gap-1.5">
        {thread.map((step, index) => {
          const isCurrent = step.id === here?.id;
          return (
            <li key={step.id} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="h-px w-4 shrink-0 bg-[color:var(--organism-accent-soft)] opacity-60"
                />
              )}
              <button
                type="button"
                onClick={() => onWalkBack(step.id)}
                aria-current={isCurrent ? "step" : undefined}
                title={
                  index === 0 ? `Where this session began: ${step.label}` : step.label
                }
                className={[
                  "min-w-0 truncate font-mono dot-micro uppercase tracking-[0.18em]",
                  reducedMotion ? "" : "transition-opacity duration-300",
                  isCurrent
                    ? "text-foreground opacity-100"
                    : "text-muted-foreground opacity-60 hover:opacity-100",
                ].join(" ")}
              >
                {step.label}
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={onClear}
        title={`Clear the thread (began at ${start?.label ?? ""})`}
        className="dot-micro shrink-0 font-mono uppercase tracking-[0.18em] text-muted-foreground/50 transition-colors hover:text-foreground"
      >
        clear
      </button>
    </nav>
  );
};
