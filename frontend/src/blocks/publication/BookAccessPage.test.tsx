import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BookAccessPage from "./BookAccessPage";

const commerce = vi.hoisted(() => ({
  getProduct: vi.fn(),
  getEntitlement: vi.fn(),
  checkout: vi.fn(),
  download: vi.fn(),
}));

vi.mock("../../dot/useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    refresh: vi.fn(),
  }),
}));

vi.mock("../../services/OrchestratorCommerceService", () => ({
  getBookOneProduct: commerce.getProduct,
  getBookOneEntitlement: commerce.getEntitlement,
  createBookOneCheckout: commerce.checkout,
  downloadBookOnePdf: commerce.download,
}));

describe("BookAccessPage", () => {
  beforeEach(() => {
    commerce.getProduct.mockResolvedValue({
      id: "book-one-pdf",
      title: "Digital Organism Theory — Book One PDF",
      amount_minor: 2_000,
      currency: "usd",
      available: true,
    });
  });

  it("keeps reading public while never exposing a public PDF or editorial DOCX", async () => {
    const { container } = render(
      <MemoryRouter>
        <BookAccessPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /Read the complete living edition/ }),
    ).toHaveAttribute("href", "/book/digital-organism-theory");
    expect(
      await screen.findByRole("button", { name: /Sign in to purchase/ }),
    ).toBeInTheDocument();
    expect(container.querySelector('a[href$=".pdf"]')).not.toBeInTheDocument();
    expect(container.querySelector('a[href$=".docx"]')).not.toBeInTheDocument();
    expect(screen.queryByText(/Word edition/i)).not.toBeInTheDocument();
  });
});
