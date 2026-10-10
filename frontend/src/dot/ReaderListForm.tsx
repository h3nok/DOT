import { Check, Loader2, Mail } from "lucide-react";
import React, { useEffect, useId, useRef, useState } from "react";

import READERS from "../content/readers.json";
import { useReaderList, type ReaderSource } from "./useReaderList";

/**
 * ReaderListForm — "tell me when there is more", at the end of the reading path.
 *
 * The open door of ADR-0025, and deliberately not the invite queue: someone who
 * just finished Book One is not asking to be admitted to anything, and routing
 * them into a queue would tell them they are waiting on a decision that was
 * never about them.
 *
 * What it refuses to do is as load-bearing as what it does. No subscriber count
 * and no "join N readers" (L5 — a public counter invites comparison). No
 * urgency, no scarcity, no second ask if they decline. The confirmation step is
 * not friction to be optimised away: without it this is a list anyone can put
 * anyone else on.
 *
 * When the server is unreachable or the list is closed it renders nothing. A
 * dead form at the end of a book is worse than no form, and the reader has just
 * finished reading — this is the wrong moment to explain our infrastructure.
 */

interface ReaderListFormProps {
  /** Where the address was offered, for the steward's coarse sense of reach. */
  source?: ReaderSource;
  /**
   * Shown instead of the form once the list is known to be closed. Defaults to
   * nothing, which suits the end of a book; a page that exists only for the
   * list has to say something.
   */
  fallback?: React.ReactNode;
  /** A status failure is not evidence that the steward closed the list. */
  unavailableFallback?: React.ReactNode;
  /** An explicit loading state for the dedicated list page; book endings stay quiet. */
  loadingFallback?: React.ReactNode;
}

const FIELD =
  "w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[color:var(--organism-accent-soft)]";
const ACTION =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1] disabled:opacity-50";

export const ReaderListForm: React.FC<ReaderListFormProps> = ({
  source = "book",
  fallback = null,
  unavailableFallback = null,
  loadingFallback = null,
}) => {
  const { available, availabilityError, subscribe, confirm } = useReaderList();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"form" | "confirm" | "done">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const emailId = useId();
  const codeId = useId();
  const emailInput = useRef<HTMLInputElement>(null);
  const codeInput = useRef<HTMLInputElement>(null);
  const previousStage = useRef(stage);

  useEffect(() => {
    if (stage === "confirm") codeInput.current?.focus();
    if (stage === "form" && previousStage.current === "confirm") emailInput.current?.focus();
    previousStage.current = stage;
  }, [stage]);

  if (availabilityError) return <>{unavailableFallback}</>;
  if (available === false) return <>{fallback}</>;
  if (available !== true) return <>{loadingFallback}</>;

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { accepted, error: failed } = await subscribe(email.trim(), source);
    setBusy(false);
    if (failed || !accepted) {
      setError(failed ?? "That did not go through. Try again.");
      return;
    }
    setDevCode(accepted.dev_code ?? null);
    setStage("confirm");
  };

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { error: failed } = await confirm(email.trim(), code.trim());
    setBusy(false);
    if (failed) {
      setError(failed);
      return;
    }
    setStage("done");
  };

  return (
    <section className="reader-list-form mb-8 rounded-2xl border border-border/60 bg-foreground/[0.02] p-6" aria-busy={busy}>
      {stage === "done" ? (
        <div className="flex items-start gap-3" role="status">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--organism-accent-soft)]">
            <Check className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="font-serif text-xl text-foreground">
              You’re on the reader list.
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              You’ll receive occasional emails about new writing. Every message carries a link that
              removes you in one click, with no account and no questions.
            </p>
          </div>
        </div>
      ) : (
        <>
          <h2 className="font-serif text-xl text-foreground">
            {stage === "confirm" ? "Check your email." : READERS.formTitle}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {stage === "confirm" ? `Enter the six-digit code sent to ${email}.` : READERS.formDescription}
          </p>

          {stage === "form" ? (
            <form onSubmit={submitEmail} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label htmlFor={emailId} className="text-xs font-medium text-foreground">
                Email address
              </label>
              <input
                id={emailId}
                ref={emailInput}
                type="email"
                required
                disabled={busy}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={`reader-list-field ${FIELD}`}
              />
              <button type="submit" disabled={busy} className={`reader-list-submit ${ACTION} shrink-0`}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send me a code
              </button>
            </form>
          ) : (
            <form onSubmit={submitCode} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label htmlFor={codeId} className="text-xs font-medium text-foreground">
                Confirmation code
              </label>
              <input
                id={codeId}
                ref={codeInput}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                disabled={busy}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="6-digit code"
                className={`reader-list-field ${FIELD}`}
              />
              <button type="submit" disabled={busy} className={`reader-list-submit ${ACTION} shrink-0`}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm
              </button>
            </form>
          )}

          {stage === "confirm" && (
            <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
              <p>Nothing is sent until you confirm. If the code has expired, request a fresh one.
                {devCode ? ` Development code: ${devCode}.` : ""}
              </p>
              <button type="button" disabled={busy} className="reader-list-change mt-1 min-h-11 underline underline-offset-4 disabled:opacity-50" onClick={() => {
                setStage("form"); setCode(""); setError(null); setDevCode(null);
              }}>Change address or request a new code</button>
            </div>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs text-[color:var(--destructive,#b45309)]">
          {error}
        </p>
      )}
    </section>
  );
};
