import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { BloomSurface } from "./BloomSurface";
import { SupportChoices } from "./SupportChoices";
import { SUPPORT_PAYMENT_LINK } from "./supportLink";
import { formatAmount, parseSupportAmount, useSupport } from "./useSupport";

interface SupportSurfaceProps {
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  titleAs?: "h1" | "h2";
  initialPurpose?: "author" | "lumen";
  onClose: () => void;
}

type ReturnState = "idle" | "checking" | "paid" | "processing" | "expired" | "cancelled" | "failed";

function readCheckoutReturn(): { state: ReturnState; sessionId: string | null } {
  if (typeof window === "undefined") return { state: "idle", sessionId: null };
  const query = new URLSearchParams(window.location.search);
  if (query.get("support") === "cancelled") return { state: "cancelled", sessionId: null };
  if (query.get("support") === "thanks" && query.get("session_id")) {
    return { state: "checking", sessionId: query.get("session_id") };
  }
  return { state: "idle", sessionId: null };
}

export const SupportSurface: React.FC<SupportSurfaceProps> = ({
  origin,
  reducedMotion = false,
  titleAs,
  initialPurpose = "lumen",
  onClose,
}) => {
  const {
    options, loading, available: configured, error: optionsError,
    createCheckout, getCheckoutStatus,
  } = useSupport();
  const authorSupport = initialPurpose === "author";
  const available = configured && (!authorSupport || options?.purposes.some((purpose) => purpose.id === "author"));
  const checkoutReturn = useMemo(readCheckoutReturn, []);
  const [returnState, setReturnState] = useState<ReturnState>(checkoutReturn.state);
  const [selectedTier, setSelectedTier] = useState(authorSupport ? "custom" : "seed");
  const [selectedPurpose, setSelectedPurpose] = useState<string>(initialPurpose);
  const [customAmount, setCustomAmount] = useState(authorSupport ? "20" : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const common = { titleAs, origin, reducedMotion, zIndex: 58, onClose };

  useEffect(() => {
    if (checkoutReturn.state !== "checking" || !checkoutReturn.sessionId) return;
    let active = true;
    void getCheckoutStatus(checkoutReturn.sessionId).then((status) => {
      if (active) setReturnState(status);
    }).catch((cause: unknown) => {
      if (!active) return;
      setReturnState("failed");
      setError(cause instanceof Error ? cause.message : "Could not verify the contribution.");
    });
    return () => { active = false; };
  }, [checkoutReturn, getCheckoutStatus]);

  const submit = async () => {
    setError(null);
    const customAmountMinor = selectedTier === "custom" ? parseSupportAmount(customAmount) : undefined;
    if (selectedTier === "custom") {
      if (customAmountMinor === null || customAmountMinor === undefined) {
        setError("Enter an amount with up to two decimal places.");
        return;
      }
      if (!options || customAmountMinor < options.min_custom_minor || customAmountMinor > options.max_custom_minor) {
        setError(options
          ? `Choose between ${formatAmount(options.min_custom_minor, options.currency)} and ${formatAmount(options.max_custom_minor, options.currency)}. Reading and the PDF remain free.`
          : "Support details are unavailable.");
        return;
      }
    }
    setBusy(true);
    const { checkout, error: failure } = await createCheckout({
      tier: selectedTier,
      purpose: selectedPurpose,
      customAmountMinor: customAmountMinor ?? undefined,
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
      <BloomSurface {...common} kicker="support" title="Checking with Stripe"
        description="Confirming the checkout without treating a redirect as proof of payment." size="sm">
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      </BloomSurface>
    );
  }

  if (returnState === "paid" || returnState === "processing" || returnState === "expired" || returnState === "failed") {
    const content = {
      paid: {
        kicker: "thank you", title: "You helped build it",
        description: "Stripe confirmed your contribution. DOT will record only the verified facts.",
      },
      processing: {
        kicker: "support", title: "Still settling",
        description: "Stripe has the checkout. Confirmation may take a moment, so DOT is not counting it yet.",
      },
      expired: {
        kicker: "support", title: "Checkout expired",
        description: "You can begin again whenever it feels right.",
      },
      failed: {
        kicker: "support", title: "Could not confirm the contribution",
        description: "Do not pay again just to check. Use the Stripe receipt or contact the author if a payment needs clarification.",
      },
    }[returnState];
    return (
      <BloomSurface {...common} kicker={content.kicker} title={content.title} description={content.description} size="sm">
        <div className="flex flex-col items-center gap-4 py-7 text-center">
          {returnState === "paid" && <Check className="h-7 w-7 text-[color:var(--organism-accent-strong)]" aria-hidden="true" />}
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Support never changes access, visibility, or standing inside DOT.
            The complete book and PDF remain free.
          </p>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>
      </BloomSurface>
    );
  }

  if (!available && SUPPORT_PAYMENT_LINK && !authorSupport) {
    return (
      <BloomSurface {...common} kicker="independent work" title="Support the work"
        description="DOT sells no advertising and no attention, so it is funded by the people who find it worth funding." size="sm"
        footer={
          <a href={SUPPORT_PAYMENT_LINK} target="_blank" rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            Continue to Stripe
          </a>
        }>
        <div className="flex flex-col gap-4 py-1 text-sm leading-relaxed text-muted-foreground">
          <p>Contributions pay for the time this takes: making Minty reliable, deepening the Book One reader, and keeping the whole thing running as a careful public release.</p>
          <p>Support never changes what reaches you. It buys no access, no standing, and no position in anything you are shown — reading stays free and complete either way.</p>
          <p className="dot-meta leading-5 text-muted-foreground/80">Stripe hosts the checkout, sets the amount, and issues the receipt. There is no recurring charge and no public list of who gave.</p>
        </div>
      </BloomSurface>
    );
  }

  if (!available) {
    return (
      <BloomSurface {...common} kicker="support" title="Not open yet"
        description="Contributions are not being accepted until checkout and receipts are configured." size="sm">
        <p className="py-4 text-sm italic leading-relaxed text-muted-foreground">
          DOT takes no advertising. The book and PDF are free now; optional support
          will open here without urgency or a public donor list.
        </p>
        {optionsError && <p role="alert" className="text-xs text-destructive">{optionsError}</p>}
      </BloomSurface>
    );
  }

  return (
    <BloomSurface {...common} kicker="independent work"
      title={authorSupport ? "Support the author" : "Support the work"}
      description={authorSupport
        ? "A voluntary contribution supports independent writing and research. The complete book and PDF remain free, with no account required."
        : "I am fundraising to make Minty reliable, deepen the Book One reader, and prepare DOT for a careful public release."}
      size="md"
      footer={
        <button type="button" disabled={busy} onClick={() => void submit()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1] disabled:opacity-50">
          {busy
            ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            : <ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
          Continue to Stripe
        </button>
      }>
      {returnState === "cancelled" && <p className="mb-4 border-y border-border/40 py-3 text-xs text-muted-foreground">Checkout was closed. You can still read and download freely.</p>}
      {options && <SupportChoices options={options} reducedMotion={reducedMotion}
        authorSupport={authorSupport} selectedPurpose={selectedPurpose} onPurposeChange={setSelectedPurpose}
        selectedTier={selectedTier} onTierChange={setSelectedTier} customAmount={customAmount} onAmountChange={setCustomAmount} />}
      <p className="dot-meta mt-4 leading-5 text-muted-foreground/80">
        Stripe hosts checkout and issues the receipt. DOT keeps the verified amount,
        purpose, status, and only a one-way hash of the receipt email. No recurring charge.
      </p>
      {error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}
    </BloomSurface>
  );
};

export default SupportSurface;
