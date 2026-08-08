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
  purposes: Array<{ id: string; label: string }>;
  min_custom_minor: number;
  max_custom_minor: number;
  currency: string;
  available: boolean;
}

export interface SupportCheckout {
  checkout_url: string;
  amount_minor: number;
  currency: string;
  tier: string;
  purpose: string;
}

export type SupportCheckoutStatus = "paid" | "processing" | "expired";

export function formatAmount(minor: number, currency = "usd"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100);
}

export function useSupport() {
  const [options, setOptions] = useState<SupportOptions | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const optionsResult = await api<SupportOptions>("/v1/support/options");
    if (optionsResult.ok && optionsResult.data) setOptions(optionsResult.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Open a server-priced, provider-hosted checkout. */
  const createCheckout = useCallback(
    async (input: {
      tier: string;
      purpose: string;
      customAmountMinor?: number;
    }): Promise<{ checkout?: SupportCheckout; error?: string }> => {
      const result = await api<SupportCheckout>("/v1/support/checkout-sessions", {
        method: "POST",
        body: {
          tier: input.tier,
          purpose: input.purpose,
          custom_amount_minor:
            input.tier === "custom" ? input.customAmountMinor : undefined,
        },
      });
      if (!result.ok || !result.data) {
        return { error: result.error ?? "Support is unavailable right now." };
      }
      return { checkout: result.data };
    },
    [],
  );

  const getCheckoutStatus = useCallback(
    async (sessionId: string): Promise<SupportCheckoutStatus | null> => {
      const result = await api<{ status: SupportCheckoutStatus }>(
        `/v1/support/checkout-sessions/${encodeURIComponent(sessionId)}`,
      );
      return result.ok && result.data ? result.data.status : null;
    },
    [],
  );

  return {
    options,
    loading,
    available: Boolean(options?.available),
    refresh,
    createCheckout,
    getCheckoutStatus,
  };
}
