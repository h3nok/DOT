import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SupportSurface } from "./SupportSurface";
import { parseSupportAmount, useSupport } from "./useSupport";

vi.mock("./useSupport", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./useSupport")>();
  return { ...actual, useSupport: vi.fn() };
});

// The payment link is a build-time constant, so the tests drive it through a
// hoisted cell rather than re-importing the module per case.
const paymentLink = vi.hoisted(() => ({ current: null as string | null }));
vi.mock("./supportLink", () => ({
  get SUPPORT_PAYMENT_LINK() {
    return paymentLink.current;
  },
}));

const mockedUseSupport = vi.mocked(useSupport);

const closedPlane = {
  options: null,
  error: null,
  loading: false,
  available: false,
  refresh: vi.fn(),
  createCheckout: vi.fn(),
  getCheckoutStatus: vi.fn(),
};

describe("SupportSurface", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
    paymentLink.current = null;
    vi.clearAllMocks();
  });

  it("fails closed while neither the server plane nor a payment link is configured", () => {
    mockedUseSupport.mockReturnValue(closedPlane);

    render(<SupportSurface onClose={vi.fn()} reducedMotion />);

    expect(screen.getByRole("heading", { name: "Not open yet" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /continue/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /continue/i })).not.toBeInTheDocument();
    // A payment processor's reviewer reads this state: it must say what a
    // payment will be, and where the refund policy lives.
    expect(screen.getByText(/not a charitable donation/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms and refunds" })).toHaveAttribute("href", "/terms");
    expect(screen.queryByText(/fundrais/i)).not.toBeInTheDocument();
  });

  it("falls back to the hosted payment link when the server plane is unavailable", () => {
    paymentLink.current = "https://buy.stripe.com/test_link";
    mockedUseSupport.mockReturnValue(closedPlane);

    render(<SupportSurface onClose={vi.fn()} reducedMotion />);

    expect(screen.getByRole("heading", { name: "Support the work" })).toBeInTheDocument();

    const stripe = screen.getByRole("link", { name: "Continue to Stripe" });
    expect(stripe).toHaveAttribute("href", "https://buy.stripe.com/test_link");
    expect(stripe).toHaveAttribute("rel", expect.stringContaining("noopener"));

    // Stripe owns the amount on this path: the client must not be able to name
    // a price, and support must still buy no advantage (ADR-0012, ADR-0015).
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.getByText(/buys no access/i)).toBeInTheDocument();
    // No social proof, no urgency, no subscription trap (L5, L6).
    expect(
      screen.queryByText(/\d+ supporters|people have given|join \d|monthly/i),
    ).not.toBeInTheDocument();
  });

  it("prefers the server plane over the payment link once support is open", () => {
    paymentLink.current = "https://buy.stripe.com/test_link";
    mockedUseSupport.mockReturnValue({
      options: {
        tiers: [{ id: "seed", amount_minor: 500, currency: "usd" }],
        purposes: [{ id: "lumen", label: "Reliable Minty and semantic book search" }],
        min_custom_minor: 200,
        max_custom_minor: 500_000,
        currency: "usd",
        available: true,
      },
      loading: false,
      error: null,
      available: true,
      refresh: vi.fn(),
      createCheckout: vi.fn(),
      getCheckoutStatus: vi.fn(),
    });

    render(<SupportSurface onClose={vi.fn()} reducedMotion />);

    expect(screen.getByRole("button", { name: "Continue to Stripe" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue to Stripe" })).not.toBeInTheDocument();
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
          { id: "lumen", label: "Reliable Minty and semantic book search" },
          { id: "reader", label: "Book One reader and concept map" },
          { id: "infrastructure", label: "A secure and reliable public release" },
        ],
        min_custom_minor: 200,
        max_custom_minor: 500_000,
        currency: "usd",
        available: true,
      },
      loading: false,
      error: null,
      available: true,
      refresh: vi.fn(),
      createCheckout: vi.fn(),
      getCheckoutStatus: vi.fn(),
    });

    render(<SupportSurface onClose={vi.fn()} reducedMotion />);

    expect(screen.getByRole("heading", { name: "Support the work" })).toBeInTheDocument();
    expect(screen.getByText("Reliable Minty and semantic book search")).toBeInTheDocument();
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByText("One-time contribution")).toBeInTheDocument();
    expect(screen.queryByText(/supporters|people hold|monthly/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue to Stripe" })).toBeInTheDocument();
  });

  it("makes author support a changeable, optional contribution without membership", async () => {
    const createCheckout = vi.fn().mockResolvedValue({ error: "Provider unavailable." });
    mockedUseSupport.mockReturnValue({
      ...closedPlane,
      available: true,
      options: {
        tiers: [],
        purposes: [{ id: "author", label: "Independent writing and research" }],
        min_custom_minor: 200,
        max_custom_minor: 500_000,
        currency: "usd",
        available: true,
      },
      createCheckout,
    });
    render(<SupportSurface initialPurpose="author" onClose={vi.fn()} reducedMotion />);
    expect(screen.getByRole("heading", { name: "Support the author" })).toBeInTheDocument();
    const input = screen.getByRole("spinbutton", { name: "Contribution amount" });
    expect(input).toHaveValue(20);
    fireEvent.change(input, { target: { value: "7.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue to Stripe" }));
    expect(createCheckout).toHaveBeenCalledWith({
      tier: "custom", purpose: "author", customAmountMinor: 750,
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Provider unavailable.");
    expect(screen.queryByText(/sign in|membership|purchase/i)).not.toBeInTheDocument();
  });

  it("rejects zero contributions without putting a payment gate on the book", async () => {
    mockedUseSupport.mockReturnValue({
      ...closedPlane,
      available: true,
      options: {
        tiers: [], purposes: [{ id: "author", label: "Independent writing and research" }],
        min_custom_minor: 200, max_custom_minor: 500_000, currency: "usd", available: true,
      },
    });
    render(<SupportSurface initialPurpose="author" onClose={vi.fn()} reducedMotion />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue to Stripe" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Reading and the PDF remain free.");
    expect(closedPlane.createCheckout).not.toHaveBeenCalled();
  });

  it("does not claim success when Stripe confirmation fails", async () => {
    window.history.replaceState({}, "", "/support?purpose=author&support=thanks&session_id=cs_test");
    mockedUseSupport.mockReturnValue({
      ...closedPlane,
      getCheckoutStatus: vi.fn().mockRejectedValue(new Error("Verification unavailable.")),
    });
    render(<SupportSurface initialPurpose="author" onClose={vi.fn()} reducedMotion />);
    expect(await screen.findByRole("heading", { name: "Could not confirm the contribution" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Verification unavailable.");
    expect(screen.queryByText("You helped build it")).not.toBeInTheDocument();
  });

  it("does not misdirect author support to a generic hosted-link fallback", () => {
    paymentLink.current = "https://buy.stripe.com/test_link";
    mockedUseSupport.mockReturnValue(closedPlane);
    render(<SupportSurface initialPurpose="author" onClose={vi.fn()} reducedMotion />);
    expect(screen.getByRole("heading", { name: "Not open yet" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue to Stripe" })).not.toBeInTheDocument();
  });
});

describe("support amount parsing", () => {
  it.each([["2", 200], ["7.5", 750], ["20.00", 2000], [" 2.01 ", 201]])(
    "preserves the exact amount %s", (input, amount) => {
      expect(parseSupportAmount(input)).toBe(amount);
    },
  );
  it.each(["", "1.999", "-20", "1e2", "Infinity", "9007199254740991"])(
    "rejects %s instead of rounding or coercing it", (input) => {
      expect(parseSupportAmount(input)).toBeNull();
    },
  );
});
