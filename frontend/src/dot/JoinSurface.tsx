import { ArrowUpRight, Check, Loader2, Mail } from "lucide-react";
import React, { useState } from "react";

import { BloomSurface } from "./BloomSurface";
import { JOIN_IS_EMAIL, JOIN_URL } from "./joinLink";
import { useJoin } from "./useJoin";

/**
 * JoinSurface — the door into an invite-only platform, stated honestly.
 *
 * The hard part is not the mechanism, it is the truth: there is no guaranteed
 * entry, requests are read by one person, and an answer may take a while.
 * Saying that plainly costs some conversion and buys the only thing worth
 * having here — that nobody arrives feeling misled (L7).
 *
 * No queue position, no counter, no waiting-list theatre: the number of people
 * ahead of you is exactly the manufactured urgency ADR-0004 forbids, and the
 * server offers no endpoint that would let this screen invent one.
 *
 * Three states, in order of preference: the verified queue when a server is
 * reachable, a plain link to write to the steward when it is not, and an honest
 * "not open yet" when neither exists.
 */

interface JoinSurfaceProps {
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  /** "h1" on the /join route, where this surface is the page itself. */
  titleAs?: "h1" | "h2";
  onClose: () => void;
}

const FIELD =
  "w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[color:var(--organism-accent-soft)]";
const ACTION =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1] disabled:opacity-50";

export const JoinSurface: React.FC<JoinSurfaceProps> = ({
  origin,
  reducedMotion = false,
  titleAs,
  onClose,
}) => {
  const { available, request, verify } = useJoin();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"form" | "verify" | "done">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const shell = {
    origin,
    reducedMotion,
    titleAs,
    zIndex: 58,
    size: "sm" as const,
    onClose,
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { accepted, error: failure } = await request(email, reason);
    setBusy(false);
    if (failure || !accepted) {
      setError(failure ?? "That did not go through. Try again.");
      return;
    }
    setDevCode(accepted.dev_code ?? null);
    setStage("verify");
  };

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { ok, error: failure } = await verify(email, code);
    setBusy(false);
    if (!ok) {
      setError(failure ?? "That code did not work.");
      return;
    }
    setStage("done");
  };

  // Waiting on the server's answer about whether the door exists at all.
  if (available === null) {
    return (
      <BloomSurface kicker="join" title="One moment" {...shell}>
        <div className="flex justify-center py-8">
          <Loader2
            className="h-5 w-5 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </BloomSurface>
    );
  }

  // No server. A plain address still reaches a human, with no third party and
  // no public list — see joinLink.
  if (!available) {
    if (!JOIN_URL) {
      return (
        <BloomSurface
          kicker="join"
          title="Not open yet"
          description="Invitations are not being requested here until there is somewhere for a request to land."
          {...shell}
        >
          <p className="py-4 text-sm italic leading-relaxed text-muted-foreground">
            Reading stays free and complete in the meantime. Book One, the concept map, and the
            register of open questions need no account and never will.
          </p>
        </BloomSurface>
      );
    }
    return (
      <BloomSurface
        kicker="invite-only"
        title="Ask to join"
        description="DOT grows one trusted invitation at a time, which is the reason it can refuse advertising and engagement ranking."
        {...shell}
        footer={
          <a
            href={JOIN_URL}
            {...(JOIN_IS_EMAIL ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            className={ACTION}
          >
            {JOIN_IS_EMAIL ? (
              <Mail className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            )}
            {JOIN_IS_EMAIL ? "Write to Henok" : "Request an invitation"}
          </a>
        }
      >
        <div className="flex flex-col gap-4 py-1 text-sm leading-relaxed text-muted-foreground">
          <p>
            Tell me who you are and what you would want to do here. Disagreeing with the book is
            a perfectly good reason — the register of open questions exists because the argument
            is meant to be pushed on.
          </p>
          <p>
            Requests are read by one person, so an answer can take a while, and there is no
            guarantee of one. Nothing about reading changes either way.
          </p>
          <p className="dot-meta leading-5 text-muted-foreground/80">
            There is no queue position and no waiting list to watch. Your request is not
            published anywhere.
          </p>
        </div>
      </BloomSurface>
    );
  }

  if (stage === "done") {
    return (
      <BloomSurface
        kicker="thank you"
        title="Your address is confirmed"
        description="The request is on the list. It will be read by a person, not sorted by a score."
        {...shell}
      >
        <div className="flex flex-col items-center gap-4 py-7 text-center">
          <Check className="h-7 w-7 text-[color:var(--organism-accent-strong)]" />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            There is nothing to check back on and nothing to watch. If an invitation is right,
            it arrives at this address. Reading stays free and complete either way.
          </p>
        </div>
      </BloomSurface>
    );
  }

  if (stage === "verify") {
    return (
      <BloomSurface
        kicker="invite-only"
        title="Confirm your address"
        description={`A six-digit code is on its way to ${email}. It confirms the address is yours — nothing more.`}
        {...shell}
        footer={
          <button type="submit" form="join-verify" disabled={busy} className={ACTION}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Confirm
          </button>
        }
      >
        <form id="join-verify" onSubmit={submitCode} className="flex flex-col gap-3 py-1">
          <label className="sr-only" htmlFor="join-code">
            Six-digit code
          </label>
          <input
            id="join-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            className={`${FIELD} text-center font-mono tracking-[0.4em]`}
          />
          {devCode && (
            <p className="dot-meta text-muted-foreground">
              No mail provider is configured, so the code is{" "}
              <span className="font-mono text-foreground">{devCode}</span>.
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </form>
      </BloomSurface>
    );
  }

  return (
    <BloomSurface
      kicker="invite-only"
      title="Ask to join"
      description="DOT grows one trusted invitation at a time, which is the reason it can refuse advertising and engagement ranking."
      {...shell}
      footer={
        <button
          type="submit"
          form="join-request"
          disabled={busy || email.trim().length < 3}
          className={ACTION}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Ask to join
        </button>
      }
    >
      <form id="join-request" onSubmit={submitRequest} className="flex flex-col gap-3 py-1">
        <label className="sr-only" htmlFor="join-email">
          Your email address
        </label>
        <input
          id="join-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          className={FIELD}
        />
        <label className="sr-only" htmlFor="join-reason">
          Why you want to join
        </label>
        <textarea
          id="join-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          maxLength={600}
          placeholder="What would you want to do here? Disagreeing with the book counts."
          className={`${FIELD} resize-none`}
        />
        <p className="dot-meta leading-5 text-muted-foreground/80">
          Your address is confirmed by a code, then stored encrypted so it can be answered and
          nothing else. It is never published, never sold, and there is no queue position to
          watch.
        </p>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </form>
    </BloomSurface>
  );
};

export default JoinSurface;
