/**
 * The Thread — the path of this session's attention (doc 12 §3).
 *
 * Session-local and never persisted: a stored thread is a behaviour log, which
 * L9 forbids. Kept as pure functions so the rules are testable without a DOM.
 */

export interface ThreadStep {
  id: string;
  label: string;
}

/** Beyond this the thread compresses from the start; it never scrolls forever. */
export const MAX_THREAD_STEPS = 12;

/**
 * Append a step. Re-entering the node you are already on is not a move, and
 * returning to a node already on the thread rewinds to it rather than looping.
 */
export function appendStep(thread: ThreadStep[], step: ThreadStep): ThreadStep[] {
  const last = thread[thread.length - 1];
  if (last?.id === step.id) return thread;

  const existing = thread.findIndex((entry) => entry.id === step.id);
  if (existing !== -1) return thread.slice(0, existing + 1);

  const next = [...thread, step];
  return next.length > MAX_THREAD_STEPS ? next.slice(next.length - MAX_THREAD_STEPS) : next;
}

/** Walk back to a step already on the thread; unknown ids leave it untouched. */
export function walkBackTo(thread: ThreadStep[], id: string): ThreadStep[] {
  const index = thread.findIndex((entry) => entry.id === id);
  return index === -1 ? thread : thread.slice(0, index + 1);
}

/** Where this session entered. */
export function origin(thread: ThreadStep[]): ThreadStep | null {
  return thread[0] ?? null;
}

/** Where attention rests now. */
export function current(thread: ThreadStep[]): ThreadStep | null {
  return thread[thread.length - 1] ?? null;
}

export function clearThread(): ThreadStep[] {
  return [];
}
