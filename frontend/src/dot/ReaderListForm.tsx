import { Check, Loader2, Mail } from "lucide-react";
import React, { useId, useState } from "react";

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
}

const FIELD =
  "w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[color:var(--organism-accent-soft)]";
const ACTION =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1] disabled:opacity-50";

export const ReaderListForm: React.FC<ReaderListFormProps> = ({ source = "book" }) => {
  const { available, subscribe, confirm } = useReaderList();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"form" | "confirm" | "done">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const emailId = useId();
  const codeId = useId();

  if (available !== true) return null;

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
    <section className="mb-8 rounded-2xl border border-border/60 bg-foreground/[0.02] p-6">
      {stage === "done" ? (
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--organism-accent-soft)]">
            <Check className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="font-serif text-xl text-foreground">
              You will hear when there is more.
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Rarely, and only about the work. Every message carries a link that
              removes you in one click, with no account and no questions.
            </p>
          </div>
        </div>
      ) : (
        <>
          <h2 className="font-serif text-xl text-foreground">
            Hear when there is more to read.
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Book Two is being written. This is not membership and not a queue —
            an address, used rarely, and only for the work.
          </p>

          {stage === "form" ? (
            <form onSubmit={submitEmail} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label htmlFor={emailId} className="sr-only">
                Email address
              </label>
              <input
                id={emailId}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={FIELD}
              />
              <button type="submit" disabled={busy} className={`${ACTION} shrink-0`}>
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
              <label htmlFor={codeId} className="sr-only">
                Confirmation code
              </label>
              <input
                id={codeId}
                inputMode="numeric"
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="6-digit code"
                className={FIELD}
              />
              <button type="submit" disabled={busy} className={`${ACTION} shrink-0`}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm
              </button>
            </form>
          )}

          {stage === "confirm" && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              We sent a code to {email}. Confirming proves the address is yours —
              without it, anyone could put you on this list.
              {devCode ? ` Development code: ${devCode}.` : ""}
            </p>
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
