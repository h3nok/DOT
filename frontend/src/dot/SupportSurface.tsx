import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Coffee,
  Loader2,
  Server,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { staggerChild } from "../organism";
import { BloomSurface } from "./BloomSurface";
import { SUPPORT_PAYMENT_LINK } from "./supportLink";
import { formatAmount, useSupport, type SupportTier } from "./useSupport";

/**
 * SupportSurface — a plain invitation to help build the public work.
 *
 * Checkout is hosted by Stripe. DOT records only the provider-confirmed amount,
 * its purpose, status, and a one-way receipt-email hash. There is no donor rank,
 * urgency, or access advantage attached to a contribution.
 */

interface SupportSurfaceProps {
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  onClose: () => void;
}

const TIER_COPY: Record<string, { name: string; line: string }> = {
  seed: { name: "Coffee", line: "A small, direct vote for the work." },
  steward: { name: "Build with me", line: "Helps pay for a real build cycle." },
  patron: { name: "Patron", line: "Carries a substantial part of the next release." },
};

const PURPOSE_ICONS: Record<string, LucideIcon> = {
  lumen: Sparkles,
  reader: BookOpen,
  infrastructure: Server,
};

type ReturnState = "idle" | "checking" | "paid" | "processing" | "expired" | "cancelled";

function readCheckoutReturn(): { state: ReturnState; sessionId: string | null } {
  if (typeof window === "undefined") return { state: "idle", sessionId: null };
  const query = new URLSearchParams(window.location.search);
  const support = query.get("support");
  if (support === "cancelled") return { state: "cancelled", sessionId: null };
  if (support === "thanks" && query.get("session_id")) {
    return { state: "checking", sessionId: query.get("session_id") };
  }
  return { state: "idle", sessionId: null };
}

export const SupportSurface: React.FC<SupportSurfaceProps> = ({
  origin,
  reducedMotion = false,
  onClose,
}) => {
  const { options, loading, available, createCheckout, getCheckoutStatus } = useSupport();
  const checkoutReturn = useMemo(readCheckoutReturn, []);
  const [returnState, setReturnState] = useState<ReturnState>(checkoutReturn.state);
  const [selectedTier, setSelectedTier] = useState("seed");
  const [selectedPurpose, setSelectedPurpose] = useState("lumen");
  const [customAmount, setCustomAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (checkoutReturn.state !== "checking" || !checkoutReturn.sessionId) return;
    let active = true;
    void getCheckoutStatus(checkoutReturn.sessionId).then((status) => {
      if (!active) return;
      setReturnState(status ?? "processing");
    });
    return () => {
      active = false;
    };
  }, [checkoutReturn, getCheckoutStatus]);

  const submit = async () => {
    setError(null);
    const customAmountMinor =
      selectedTier === "custom" ? Math.round(Number(customAmount) * 100) : undefined;
    if (selectedTier === "custom" && !Number.isFinite(customAmountMinor)) {
      setError("Enter an amount before continuing.");
      return;
    }

    setBusy(true);
    const { checkout, error: failure } = await createCheckout({
      tier: selectedTier,
      purpose: selectedPurpose,
      customAmountMinor,
    });
    if (failure || !checkout) {
      setBusy(false);
      setError(failure ?? "Support is unavailable right now.");
      return;
    }
    window.location.assign(checkout.checkout_url);
  };

  if (loading || returnState === "checking") {
    return (
      <BloomSurface
        kicker="support"
        title="Checking with Stripe"
        description="Confirming the checkout without treating a redirect as proof of payment."
        origin={origin}
        reducedMotion={reducedMotion}
        zIndex={58}
        size="sm"
        onClose={onClose}
      >
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      </BloomSurface>
    );
  }

  if (returnState === "paid" || returnState === "processing" || returnState === "expired") {
    const content = {
      paid: {
        kicker: "thank you",
        title: "You helped build it",
        description: "Stripe confirmed your contribution. DOT will record only the verified facts.",
      },
      processing: {
        kicker: "support",
        title: "Still settling",
        description: "Stripe has the checkout. Confirmation may take a moment, so DOT is not counting it yet.",
      },
      expired: {
        kicker: "support",
        title: "Checkout expired",
        description: "Nothing was charged. You can begin again whenever it feels right.",
      },
    }[returnState];
    return (
      <BloomSurface
        kicker={content.kicker}
        title={content.title}
        description={content.description}
        origin={origin}
        reducedMotion={reducedMotion}
        zIndex={58}
        size="sm"
        onClose={onClose}
      >
        <div className="flex flex-col items-center gap-4 py-7 text-center">
          <Check className="h-7 w-7 text-[color:var(--organism-accent-strong)]" />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Support never changes access, visibility, or standing inside DOT. It simply gives the
            work more time to become real.
          </p>
        </div>
      </BloomSurface>
    );
  }

  // The server plane is not answering. If a provider-hosted link is configured
  // the work can still be funded; Stripe owns the amount and the receipt, so
  // nothing here asks the client to be an authority on money.
  if (!available && SUPPORT_PAYMENT_LINK) {
    return (
      <BloomSurface
        kicker="independent work"
        title="Support the work"
        description="DOT sells no advertising and no attention, so it is funded by the people who find it worth funding."
        origin={origin}
        reducedMotion={reducedMotion}
        zIndex={58}
        size="sm"
        onClose={onClose}
        footer={
          <a
            href={SUPPORT_PAYMENT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            Continue to Stripe
          </a>
        }
      >
        <div className="flex flex-col gap-4 py-1 text-sm leading-relaxed text-muted-foreground">
          <p>
            Contributions pay for the time this takes: making Minty reliable, deepening the Book
            One reader, and keeping the whole thing running as a careful public release.
          </p>
          <p>
            Support never changes what reaches you. It buys no access, no standing, and no
            position in anything you are shown — reading stays free and complete either way.
          </p>
          <p className="dot-meta leading-5 text-muted-foreground/80">
            Stripe hosts the checkout, sets the amount, and issues the receipt. There is no
            recurring charge and no public list of who gave.
          </p>
        </div>
      </BloomSurface>
    );
  }

  if (!available) {
    return (
      <BloomSurface
        kicker="support"
        title="Not open yet"
        description="Contributions are not being accepted until checkout and receipts are configured."
        origin={origin}
        reducedMotion={reducedMotion}
        zIndex={58}
        size="sm"
        onClose={onClose}
      >
        <p className="py-4 text-sm italic leading-relaxed text-muted-foreground">
          DOT takes no advertising. When support opens, it will open here plainly, without urgency
          or a public donor list.
        </p>
      </BloomSurface>
    );
  }

  return (
    <BloomSurface
      kicker="independent work"
      title="Support the work"
      description="I am fundraising to make Minty reliable, deepen the Book One reader, and prepare DOT for a careful public release."
      origin={origin}
      reducedMotion={reducedMotion}
      zIndex={58}
      size="md"
      onClose={onClose}
      footer={
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1] disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          )}
          Continue to Stripe
        </button>
      }
    >
      {returnState === "cancelled" && (
        <p className="mb-4 border-y border-border/40 py-3 text-xs text-muted-foreground">
          Checkout was closed. Nothing was charged.
        </p>
      )}

      <div>
        <p className="dot-label">
          What should this help build?
        </p>
        <div className="mt-3 grid gap-2">
          {(options?.purposes ?? []).map((purpose) => {
            const Icon = PURPOSE_ICONS[purpose.id] ?? Sparkles;
            const active = selectedPurpose === purpose.id;
            return (
              <button
                key={purpose.id}
                type="button"
                onClick={() => setSelectedPurpose(purpose.id)}
                aria-pressed={active}
                className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] text-foreground"
                    : "border-border/50 text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="text-xs leading-relaxed">{purpose.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <p className="dot-label">
          One-time contribution
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {(options?.tiers ?? []).map((tier: SupportTier) => {
            const copy = TIER_COPY[tier.id] ?? { name: tier.id, line: "" };
            const active = selectedTier === tier.id;
            return (
              <motion.li key={tier.id} variants={staggerChild} custom={reducedMotion}>
                <button
                  type="button"
                  onClick={() => setSelectedTier(tier.id)}
                  aria-pressed={active}
                  className={`flex h-full min-h-28 w-full flex-col border p-3 text-left transition-colors ${
                    active
                      ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06]"
                      : "border-border/50 bg-foreground/[0.02] hover:bg-foreground/[0.04]"
                  }`}
                >
                  {tier.id === "seed" && <Coffee className="mb-3 h-4 w-4" aria-hidden="true" />}
                  <span className="text-xs font-semibold text-foreground">{copy.name}</span>
                  <span className="mt-1 flex-1 dot-micro leading-relaxed text-muted-foreground">
                    {copy.line}
                  </span>
                  <span className="mt-2 font-mono text-xs text-foreground">
                    {formatAmount(tier.amount_minor, tier.currency)}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => setSelectedTier("custom")}
          aria-pressed={selectedTier === "custom"}
          className={`mt-2 flex min-h-11 w-full items-center gap-3 border px-3 py-2.5 text-left transition-colors ${
            selectedTier === "custom"
              ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06]"
              : "border-border/50 hover:bg-foreground/[0.03]"
          }`}
        >
          <span className="flex-1 text-xs font-medium text-foreground">Choose an amount</span>
          {selectedTier === "custom" && options && (
            <input
              type="number"
              inputMode="decimal"
              min={options.min_custom_minor / 100}
              max={options.max_custom_minor / 100}
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              placeholder={String(options.min_custom_minor / 100)}
              aria-label="Contribution amount"
              className="w-24 border-b border-border/60 bg-transparent px-1 py-1 text-right font-mono text-xs text-foreground outline-none focus:border-[color:var(--organism-accent-soft)]"
            />
          )}
        </button>
      </div>

      <p className="dot-meta mt-4 leading-5 text-muted-foreground/80">
        Stripe hosts checkout and issues the receipt. DOT keeps the verified amount, purpose,
        status, and only a one-way hash of the receipt email.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-xs text-destructive">
          {error}
        </p>
      )}
    </BloomSurface>
  );
};

export default SupportSurface;
