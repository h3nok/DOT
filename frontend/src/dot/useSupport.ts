import { useCallback, useEffect, useState } from "react";

import { api } from "./orchestrator";

/**
 * useSupport — the member-funding client (ADR-0012).
 *
 * The server owns the price list. This hook asks what the tiers are and hands
 * back a Stripe client secret; it never tells the server what an amount should
 * be, and it never learns who else has given — only the totals.
 */

export interface SupportTier {
  id: string;
  amount_minor: number;
  currency: string;
}

export interface SupportOptions {
  tiers: SupportTier[];
  min_custom_minor: number;
  max_custom_minor: number;
  currency: string;
  /** Empty when support is not configured; the surface stays hidden. */
  publishable_key: string;
}

export interface SupportTotals {
  supporters: number;
  total_minor: number;
  currency: string;
}

export interface SupportIntent {
  client_secret: string;
  amount_minor: number;
  currency: string;
  tier: string;
  cadence: string;
}

export function formatAmount(minor: number, currency = "usd"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100);
}

export function useSupport() {
  const [options, setOptions] = useState<SupportOptions | null>(null);
  const [totals, setTotals] = useState<SupportTotals | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [optionsResult, totalsResult] = await Promise.all([
      api<SupportOptions>("/v1/support/options"),
      api<SupportTotals>("/v1/support/totals"),
    ]);
    if (optionsResult.ok && optionsResult.data) setOptions(optionsResult.data);
    if (totalsResult.ok && totalsResult.data) setTotals(totalsResult.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Ask the server to open a contribution. Returns an error string on failure. */
  const createIntent = useCallback(
    async (input: {
      tier: string;
      customAmountMinor?: number;
      cadence?: "one_time" | "recurring";
      email?: string;
    }): Promise<{ intent?: SupportIntent; error?: string }> => {
      const result = await api<SupportIntent>("/v1/support/intents", {
        method: "POST",
        body: {
          tier: input.tier,
          custom_amount_minor:
            input.tier === "custom" ? input.customAmountMinor : undefined,
          cadence: input.cadence ?? "one_time",
          email: input.email || undefined,
        },
      });
      if (!result.ok || !result.data) {
        return { error: result.error ?? "Support is unavailable right now." };
      }
      return { intent: result.data };
    },
    [],
  );

  return {
    options,
    totals,
    loading,
    /** Support is only offered when the server has a payment provider wired. */
    available: Boolean(options?.publishable_key),
    refresh,
    createIntent,
  };
}
