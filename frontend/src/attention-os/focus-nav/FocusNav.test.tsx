import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FocusNav } from "./FocusNav";

describe("FocusNav", () => {
  it("exposes the reading destination with its description and quiet alternatives", () => {
    render(
      <MemoryRouter>
        <FocusNav
          label="Reading choices"
          primary={{ to: "/book/preface", label: "Read the book", description: "Free to read" }}
          secondary={[{ href: "#model", label: "Explore the model" }]}
        />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Reading choices" });
    const primary = within(nav).getByRole("link", { name: "Read the book" });
    expect(primary).toHaveAttribute("href", "/book/preface");
    expect(primary).toHaveAccessibleDescription("Free to read");
    expect(within(nav).getByRole("link", { name: "Explore the model" })).toHaveAttribute("href", "#model");
    expect(nav.querySelectorAll(".dot-focus-nav__primary")).toHaveLength(1);
  });

  it("keeps descriptions scoped when multiple navigation surfaces share a page", () => {
    render(
      <MemoryRouter>
        <FocusNav label="Start" primary={{ to: "/book", label: "Read", description: "The fixed edition" }} />
        <FocusNav label="Finish" primary={{ href: "#inquiry", label: "Continue", description: "The living inquiry" }} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Read" })).toHaveAccessibleDescription("The fixed edition");
    expect(screen.getByRole("link", { name: "Continue" })).toHaveAccessibleDescription("The living inquiry");
    expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute("href", "#inquiry");
  });
});
