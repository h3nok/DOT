import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { DOT_BOOK_ONE_PDF_URL } from "../../content/publications/dotBookOne";
import BookAccessPage from "./BookAccessPage";

describe("BookAccessPage", () => {
  it("offers a free PDF without auth or API providers while keeping the DOCX private", () => {
    const { container } = render(
      <MemoryRouter>
        <BookAccessPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /Read the complete living edition/ }),
    ).toHaveAttribute("href", "/book/digital-organism-theory");
    const download = screen.getByRole("link", { name: /Download the free PDF/ });
    expect(download).toHaveAttribute("href", DOT_BOOK_ONE_PDF_URL);
    expect(download).toHaveAttribute("download");
    expect(screen.getByText(/No account, email address, or payment required/)).toBeInTheDocument();
    expect(container.querySelector('a[href$=".docx"]')).not.toBeInTheDocument();
    expect(screen.queryByText(/Word edition/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps voluntary author support separate from download", () => {
    render(<MemoryRouter><BookAccessPage /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /Support the author · optional/ }))
      .toHaveAttribute("href", "/support?purpose=author");
    expect(screen.getByText(/or simply read/)).toBeInTheDocument();
    expect(screen.queryByText(/purchase|ownership|\$20/i)).not.toBeInTheDocument();
  });
});
