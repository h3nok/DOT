import { render, screen } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { BookAction, BookCard } from "./BookPrimitives";

describe("BookPrimitives", () => {
  it("composes a themed action onto a real link", () => {
    render(
      <MemoryRouter>
        <BookAction asChild variant="secondary">
          <Link to="/book">Read</Link>
        </BookAction>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Read" })).toHaveClass(
      "book-action",
      "book-action-secondary",
    );
  });

  it("composes card behavior without changing semantics", () => {
    render(
      <BookCard asChild variant="interactive">
        <article aria-label="Path">A reading path</article>
      </BookCard>,
    );

    expect(screen.getByRole("article", { name: "Path" })).toHaveClass(
      "book-card",
      "book-card-interactive",
    );
  });
});