import { motion } from "framer-motion";
import { Check, Heart, Loader2 } from "lucide-react";
import React, { useState } from "react";

import { staggerChild } from "../organism";
import { BloomSurface } from "./BloomSurface";
import { formatAmount, useSupport, type SupportTier } from "./useSupport";

/**
 * SupportSurface — how the movement is funded.
 *
 * DOT has ruled out advertising, which leaves exactly one honest option: the
 * people it serves pay for it. This surface says that plainly and asks once.
 *
 * The amounts here are labels, not prices — the server decides what a tier
 * costs, so nothing a visitor edits in this component can change what is
 * charged. When no payment provider is configured the surface never renders.
 */

interface SupportSurfaceProps {
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  onClose: () => void;
}

const TIER_COPY: Record<string, { name: string; line: string }> = {
  seed: { name: "Seed", line: "Keeps the lights on for a day." },
  steward: {
    name: "Steward",
    line: "Pays for a month of storage and compute.",
  },
  patron: { name: "Patron", line: "Funds a feature that belongs to everyone." },
};

export const SupportSurface: React.FC<SupportSurfaceProps> = ({
  origin,
  reducedMotion = false,
  onClose,
}) => {
  const { options, totals, loading, available, createIntent } = useSupport();
  const [selected, setSelected] = useState<string>("steward");
  const [customAmount, setCustomAmount] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  const currency = options?.currency ?? "usd";

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { intent, error: failure } = await createIntent({
      tier: selected,
      customAmountMinor:
        selected === "custom"
          ? Math.round(Number(customAmount) * 100)
          : undefined,
      cadence: recurring ? "recurring" : "one_time",
      email,
    });
    setBusy(false);
    if (failure || !intent) {
      setError(failure ?? "Something went wrong.");
      return;
    }
    // Handing off to the provider's confirmation step; nothing is recorded
    // here, because only the verified webhook may write to the ledger.
    setOpened(true);
  };

  if (loading) return null;

  // A node that opens nothing is a dead end, so say plainly that funding is
  // closed rather than swallowing the tap.
  if (!available) {
    return (
      <BloomSurface
        kicker="support"
        title="Not open yet"
        description="Contributions aren't being accepted right now. Nothing to do here — the work continues either way."
        origin={origin}
        reducedMotion={reducedMotion}
        zIndex={58}
        size="sm"
        onClose={onClose}
      >
        <p className="py-4 text-sm italic leading-relaxed text-muted-foreground">
          DOT takes no advertising. When funding opens, it opens here, and every
          contribution stays a hashed record rather than a profile.
        </p>
      </BloomSurface>
    );
  }

  if (opened) {
    return (
      <BloomSurface
        kicker="thank you"
        title="Held"
        description="Your contribution is with the payment provider now. Nothing is recorded here until they confirm it."
        origin={origin}
        reducedMotion={reducedMotion}
        zIndex={58}
        size="sm"
        onClose={onClose}
      >
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <Check className="h-8 w-8 text-[color:var(--organism-accent-strong)]" />
          <p className="max-w-xs text-sm italic leading-relaxed text-muted-foreground">
            DOT stores a hashed record of your contribution and nothing else —
            no address, no profile, no list you can be sold from.
          </p>
        </div>
      </BloomSurface>
    );
  }

  return (
    <BloomSurface
      kicker="support"
      title="Keep this unowned"
      description="DOT takes no advertising, so it is funded by the people who use it. Give once, or hold it open monthly."
      origin={origin}
      reducedMotion={reducedMotion}
      zIndex={58}
      size="md"
      onClose={onClose}
      footer={
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1] disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className="h-4 w-4" />
          )}
          Continue
        </button>
      }
    >
      <ul className="space-y-2.5">
        {(options?.tiers ?? []).map((tier: SupportTier) => {
          const copy = TIER_COPY[tier.id] ?? { name: tier.id, line: "" };
          const active = selected === tier.id;
          return (
            <motion.li
              key={tier.id}
              variants={staggerChild}
              custom={reducedMotion}
            >
              <button
                type="button"
                onClick={() => setSelected(tier.id)}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                  active
                    ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06]"
                    : "border-border/50 bg-foreground/[0.02] hover:bg-foreground/[0.04]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {copy.name}
                  </p>
                  <p className="truncate text-xs italic text-muted-foreground">
                    {copy.line}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-foreground">
                  {formatAmount(tier.amount_minor, tier.currency)}
                </span>
              </button>
            </motion.li>
          );
        })}

        <motion.li variants={staggerChild} custom={reducedMotion}>
          <button
            type="button"
            onClick={() => setSelected("custom")}
            aria-pressed={selected === "custom"}
            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
              selected === "custom"
                ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06]"
                : "border-border/50 bg-foreground/[0.02] hover:bg-foreground/[0.04]"
            }`}
          >
            <span className="flex-1 text-sm font-medium text-foreground">
              Something else
            </span>
            {selected === "custom" && options && (
              <input
                type="number"
                inputMode="decimal"
                min={options.min_custom_minor / 100}
                max={options.max_custom_minor / 100}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={String(options.min_custom_minor / 100)}
                aria-label="Amount"
                className="w-24 rounded-lg border border-border/50 bg-transparent px-2 py-1 text-right font-mono text-xs text-foreground outline-none focus:border-[color:var(--organism-accent-soft)]"
              />
            )}
          </button>
        </motion.li>
      </ul>

      <label className="mt-4 flex items-center gap-2.5 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border/60 accent-[color:var(--organism-accent-strong)]"
        />
        Hold this open every month
      </label>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email for a receipt (optional)"
        aria-label="Email for a receipt"
        className="mt-3 w-full rounded-xl border border-border/50 bg-transparent px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-[color:var(--organism-accent-soft)]"
      />

      <p className="mt-2 text-[11px] leading-5 text-muted-foreground/80">
        Your address goes to the payment provider for the receipt. DOT keeps
        only a one-way hash of it, so there is no list here to leak.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-xs text-destructive">
          {error}
        </p>
      )}

      {totals && totals.supporters > 0 && (
        <p className="mt-5 border-t border-border/40 pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {totals.supporters}{" "}
          {totals.supporters === 1 ? "person holds" : "people hold"} this open ·{" "}
          {formatAmount(totals.total_minor, currency)} given
        </p>
      )}
    </BloomSurface>
  );
};

export default SupportSurface;
