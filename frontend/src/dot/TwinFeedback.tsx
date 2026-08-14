import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { api } from "./orchestrator";
import type { AgentLens } from "./agent";

/**
 * TwinFeedback — a member's quiet verdict on one answer (L8).
 *
 * This is accountability, not engagement: two plain words, no counts, no score,
 * nothing public. The rating is recorded against the member's own session and
 * never carries the question or the answer. Shown only to a signed-in member;
 * a visitor reading public canon has no session to hold a verdict to.
 */

interface TwinFeedbackProps {
  /** Whose twin produced the answer. */
  subjectOwnerId: string;
  lens: AgentLens;
  /** Whether the reader is a signed-in member. */
  authenticated: boolean;
}

type Verdict = "helpful" | "not_helpful";

export const TwinFeedback: React.FC<TwinFeedbackProps> = ({
  subjectOwnerId,
  lens,
  authenticated,
}) => {
  const [sent, setSent] = useState<Verdict | null>(null);
  const [busy, setBusy] = useState(false);

  // Feedback is a member's signal; without a session there is nothing to hold
  // it to, so the control simply is not offered.
  if (!authenticated) return null;

  const submit = async (rating: Verdict) => {
    if (busy || sent) return;
    setBusy(true);
    const result = await api<{ id: string }>("/v1/twin/feedback", {
      method: "POST",
      body: { rating, lens, subject_owner_id: subjectOwnerId },
    });
    setBusy(false);
    if (result.ok) setSent(rating);
  };

  if (sent) {
    return (
      <p className="mt-2 flex items-center gap-1.5 dot-meta text-muted-foreground">
        <Check className="h-3 w-3" aria-hidden="true" />
        Noted — thank you.
      </p>
    );
  }

  const buttonClass =
    "dot-meta flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40";

  return (
    <div className="mt-2 flex items-center gap-1" role="group" aria-label="Was this answer useful?">
      <span className="mr-1 dot-meta text-muted-foreground">Was this useful?</span>
      <button
        type="button"
        onClick={() => void submit("helpful")}
        disabled={busy}
        aria-label="Mark helpful"
        className={buttonClass}
      >
        <ThumbsUp className="h-3 w-3" aria-hidden="true" />
        Helpful
      </button>
      <button
        type="button"
        onClick={() => void submit("not_helpful")}
        disabled={busy}
        aria-label="Mark not helpful"
        className={buttonClass}
      >
        <ThumbsDown className="h-3 w-3" aria-hidden="true" />
        Not it
      </button>
    </div>
  );
};

export default TwinFeedback;
