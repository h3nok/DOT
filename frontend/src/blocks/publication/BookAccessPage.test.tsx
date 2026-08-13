import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import BookAccessPage from "./BookAccessPage";

describe("BookAccessPage", () => {
  it("offers one public PDF and never exposes the editorial DOCX", () => {
    const { container } = render(
      <MemoryRouter>
        <BookAccessPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /Download the digital edition/ }),
    ).toHaveAttribute(
      "href",
      "/books/digital-organism-theory-book-one-digital-edition.pdf",
    );
    expect(container.querySelector('a[href$=".docx"]')).not.toBeInTheDocument();
    expect(screen.queryByText(/Word edition/i)).not.toBeInTheDocument();
  });
});
