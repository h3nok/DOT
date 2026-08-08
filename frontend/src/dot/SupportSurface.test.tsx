import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SupportSurface } from "./SupportSurface";
import { useSupport } from "./useSupport";

vi.mock("./useSupport", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./useSupport")>();
  return { ...actual, useSupport: vi.fn() };
});

const mockedUseSupport = vi.mocked(useSupport);

describe("SupportSurface", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
    vi.clearAllMocks();
  });

  it("fails closed while Stripe and its webhook are not configured", () => {
    mockedUseSupport.mockReturnValue({
      options: null,
      loading: false,
      available: false,
      refresh: vi.fn(),
      createCheckout: vi.fn(),
      getCheckoutStatus: vi.fn(),
    });

    render(<SupportSurface onClose={vi.fn()} reducedMotion />);

    expect(screen.getByRole("heading", { name: "Not open yet" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /continue/i })).not.toBeInTheDocument();
  });

  it("asks once, names the work, and offers one-time support without social proof", () => {
    mockedUseSupport.mockReturnValue({
      options: {
        tiers: [
          { id: "seed", amount_minor: 500, currency: "usd" },
          { id: "steward", amount_minor: 2_500, currency: "usd" },
          { id: "patron", amount_minor: 10_000, currency: "usd" },
        ],
        purposes: [
          { id: "lumen", label: "Reliable Lumen and semantic book search" },
          { id: "reader", label: "Book One reader and concept map" },
          { id: "infrastructure", label: "A secure and reliable public release" },
        ],
        min_custom_minor: 200,
        max_custom_minor: 500_000,
        currency: "usd",
        available: true,
      },
      loading: false,
      available: true,
      refresh: vi.fn(),
      createCheckout: vi.fn(),
      getCheckoutStatus: vi.fn(),
    });

    render(<SupportSurface onClose={vi.fn()} reducedMotion />);

    expect(screen.getByRole("heading", { name: "Support the work" })).toBeInTheDocument();
    expect(screen.getByText("Reliable Lumen and semantic book search")).toBeInTheDocument();
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByText("One-time contribution")).toBeInTheDocument();
    expect(screen.queryByText(/supporters|people hold|monthly/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue to Stripe" })).toBeInTheDocument();
  });
});
