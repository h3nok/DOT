import { motion } from "framer-motion";
import { BookOpen, Coffee, PenLine, Server, Sparkles, type LucideIcon } from "lucide-react";

import { staggerChild } from "../organism";
import { formatAmount, type SupportOptions } from "./useSupport";

const TIER_COPY: Record<string, { name: string; line: string }> = {
  seed: { name: "Coffee", line: "A small, direct vote for the work." },
  steward: { name: "Build with me", line: "Helps pay for a real build cycle." },
  patron: { name: "Patron", line: "Carries a substantial part of the next release." },
};

const PURPOSE_ICONS: Record<string, LucideIcon> = {
  author: PenLine,
  lumen: Sparkles,
  reader: BookOpen,
  infrastructure: Server,
};

interface SupportChoicesProps {
  options: SupportOptions;
  reducedMotion: boolean;
  authorSupport: boolean;
  selectedPurpose: string;
  onPurposeChange: (purpose: string) => void;
  selectedTier: string;
  onTierChange: (tier: string) => void;
  customAmount: string;
  onAmountChange: (amount: string) => void;
}

export function SupportChoices({
  options, reducedMotion, authorSupport, selectedPurpose, onPurposeChange,
  selectedTier, onTierChange, customAmount, onAmountChange,
}: SupportChoicesProps) {
  return (
    <>
      {!authorSupport && (
        <div>
          <p className="dot-label">What should this help build?</p>
          <div className="mt-3 grid gap-2">
            {options.purposes.map((purpose) => {
              const Icon = PURPOSE_ICONS[purpose.id] ?? Sparkles;
              const active = selectedPurpose === purpose.id;
              return (
                <button key={purpose.id} type="button" onClick={() => onPurposeChange(purpose.id)}
                  aria-pressed={active}
                  className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] text-foreground"
                      : "border-border/50 text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                  }`}>
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-xs leading-relaxed">{purpose.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className={authorSupport ? "" : "mt-6"}>
        <p className="dot-label">One-time contribution</p>
        {authorSupport && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Suggested: $20. Change the amount, or close this page and keep reading.</p>}
        {!authorSupport && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {options.tiers.map((tier) => {
              const copy = TIER_COPY[tier.id] ?? { name: tier.id, line: "" };
              const active = selectedTier === tier.id;
              return (
                <motion.li key={tier.id} variants={staggerChild} custom={reducedMotion}>
                  <button type="button" onClick={() => onTierChange(tier.id)} aria-pressed={active}
                    className={`flex h-full min-h-28 w-full flex-col border p-3 text-left transition-colors ${
                      active
                        ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06]"
                        : "border-border/50 bg-foreground/[0.02] hover:bg-foreground/[0.04]"
                    }`}>
                    {tier.id === "seed" && <Coffee className="mb-3 h-4 w-4" aria-hidden="true" />}
                    <span className="text-xs font-semibold text-foreground">{copy.name}</span>
                    <span className="mt-1 flex-1 dot-micro leading-relaxed text-muted-foreground">{copy.line}</span>
                    <span className="mt-2 font-mono text-xs text-foreground">{formatAmount(tier.amount_minor, tier.currency)}</span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
        <div className={`mt-3 border px-3 py-2.5 ${selectedTier === "custom" ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06]" : "border-border/50"}`}>
          {authorSupport
            ? <label htmlFor="support-amount" className="text-xs font-medium text-foreground">Contribution amount ({options.currency.toUpperCase()})</label>
            : <button type="button" onClick={() => onTierChange("custom")} aria-pressed={selectedTier === "custom"}
                className="min-h-11 w-full text-left text-xs font-medium text-foreground">Choose an amount</button>}
          {selectedTier === "custom" && (
            <>
              <input id="support-amount" type="number" inputMode="decimal"
                min={options.min_custom_minor / 100} max={options.max_custom_minor / 100} step="0.01"
                value={customAmount} onChange={(event) => onAmountChange(event.target.value)}
                placeholder={String(options.min_custom_minor / 100)} aria-label="Contribution amount"
                aria-describedby="support-amount-range"
                className="mt-2 block w-full border-b border-border/60 bg-transparent px-1 py-2 font-mono text-sm text-foreground outline-none focus:border-[color:var(--organism-accent-soft)]" />
              <p id="support-amount-range" className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {formatAmount(options.min_custom_minor, options.currency)}–{formatAmount(options.max_custom_minor, options.currency)} for card contributions. No payment is needed to read or download.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
