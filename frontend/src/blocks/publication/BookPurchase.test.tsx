import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BookPurchase from "./BookPurchase";
import * as purchase from "./bookPurchase";

vi.mock("./bookPurchase", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./bookPurchase")>();
  return {
    ...actual,
    fetchBookProduct: vi.fn(),
    fetchBookCheckoutStatus: vi.fn(),
  };
});

const mockedProduct = vi.mocked(purchase.fetchBookProduct);
const mockedStatus = vi.mocked(purchase.fetchBookCheckoutStatus);

const product = {
  id: "digital-organism-theory-v2-pdf",
  title: "Consciousness: A Digital Organism",
  edition: "Line-edited edition · v2",
  format: "PDF",
  amount_minor: 1_200,
  currency: "usd",
  available: true,
};

describe("BookPurchase", () => {
  beforeEach(() => {
    mockedProduct.mockResolvedValue({ ok: true, status: 200, data: product });
    mockedStatus.mockResolvedValue({
      ok: true,
      status: 200,
      data: { status: "paid", product_id: product.id },
    });
  });

  it("states that the reader remains free and shows the server price", async () => {
    render(<MemoryRouter><BookPurchase /></MemoryRouter>);

    expect(await screen.findByRole("button", { name: "Buy the PDF · $12" })).toBeEnabled();
    expect(screen.getByText(/complete web edition here for free/i)).toBeInTheDocument();
  });

  it("reveals the download only after the provider confirms payment", async () => {
    render(
      <MemoryRouter initialEntries={["/?purchase=thanks&session_id=cs_paid"]}>
        <BookPurchase />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: "Download your copy" })).toHaveAttribute(
      "href",
      expect.stringContaining("cs_paid/download"),
    );
    expect(mockedStatus).toHaveBeenCalledWith("cs_paid");
  });

  it("keeps the reader available when checkout is closed", async () => {
    mockedProduct.mockResolvedValue({
      ok: true,
      status: 200,
      data: { ...product, available: false },
    });
    render(<MemoryRouter><BookPurchase /></MemoryRouter>);

    expect(await screen.findByRole("button", { name: "Buy the PDF · $12" })).toBeDisabled();
    expect(screen.getByText(/read the complete edition now/i)).toBeInTheDocument();
  });

  it("fails closed when the product service is unreachable", async () => {
    mockedProduct.mockResolvedValue({
      ok: false,
      status: 0,
      error: "The service is unreachable.",
    });
    render(<MemoryRouter><BookPurchase /></MemoryRouter>);

    expect(await screen.findByRole("button", { name: "Checkout unavailable" })).toBeDisabled();
    expect(screen.getByText(/complete edition remains open/i)).toBeInTheDocument();
  });
});
