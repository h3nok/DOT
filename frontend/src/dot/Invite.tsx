import { useState } from "react";
import { Check, Copy, Loader2, Send } from "lucide-react";
import { useAuth } from "./useAuth";
import { BloomSurface } from "./BloomSurface";
import { useOrganismPulse } from "../organism";

/**
 * Invite — a member opening the door for someone, from the centre of the graph.
 *
 * DOT is invite-only by design: attention is invited by clarity, not sold. A
 * signed-in member mints a tokenized invitation link (server-signed, expiring)
 * and shares it. It wears the same {@link BloomSurface} shell as every other
 * surface — there is no separate "invite page", only the graph extending a hand.
 */

interface InviteProps {
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  onClose: () => void;
}

export const Invite: React.FC<InviteProps> = ({
  origin,
  reducedMotion = false,
  onClose,
}) => {
  const { createInvite } = useAuth();
  const pulse = useOrganismPulse();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const mint = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await createInvite({
      email: email.trim() || undefined,
      note: note.trim() || undefined,
    });
    setBusy(false);
    if (!result.ok || !result.link) {
      setError(result.error ?? "Could not create invitation.");
      return;
    }
    setLink(result.link);
    pulse(0.6); // opening a door is a real act — the organism stirs
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy — select and copy the link manually.");
    }
  };

  return (
    <BloomSurface
      kicker="invite"
      title={link ? "The door is open" : "Open a door"}
      description={
        link
          ? "Share this link with someone whose attention you trust. It expires in 14 days."
          : "DOT grows by invitation, never by broadcast. Extend a hand to one person."
      }
      origin={origin}
      reducedMotion={reducedMotion}
      zIndex={50}
      size="sm"
      onClose={onClose}
    >
      {link ? (
        <div>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/80">
              {link}
            </span>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy invitation link"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <button
            type="button"
            onClick={() => {
              setLink(null);
              setEmail("");
              setNote("");
            }}
            className="mt-4 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Open another door
          </button>
        </div>
      ) : (
        <form onSubmit={mint}>
          <label className="mb-3 block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Their email{" "}
              <span className="normal-case opacity-60">(optional)</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="someone@example.com"
              className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[color:var(--organism-accent-soft)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              A note <span className="normal-case opacity-60">(optional)</span>
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Why you're inviting them."
              className="w-full resize-y rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-sm leading-6 outline-none transition-colors focus:border-[color:var(--organism-accent-soft)]"
            />
          </label>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-3 text-sm font-semibold text-foreground transition-opacity disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Create invitation <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}
    </BloomSurface>
  );
};

export default Invite;
