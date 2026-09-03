import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HERO_CONCEPTS } from "./heroData";
import { HeroConcepts } from "./HeroConcepts";

describe("HeroConcepts", () => {
  it("shows every term, definition, and claim level at once", () => {
    render(<HeroConcepts />);

    const ledger = screen.getByRole("list", { name: "Book One concept index" });
    const entries = within(ledger).getAllByRole("listitem");
    expect(entries).toHaveLength(HERO_CONCEPTS.length);

    for (const [index, concept] of HERO_CONCEPTS.entries()) {
      expect(within(entries[index]).getByRole("heading", { name: concept.term })).toBeVisible();
      expect(within(entries[index]).getByText(concept.text)).toBeVisible();
      expect(within(entries[index]).getByText(new RegExp(`^${concept.level}$`, "i"))).toBeVisible();
    }
  });

  it("does not autoplay, rotate, or hide definitions behind controls", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<HeroConcepts />);

      expect(screen.queryByRole("button")).toBeNull();
      expect(container.querySelector("[aria-hidden='true'] p")).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps Big C and Little c explicitly marked as hypothesis", () => {
    render(<HeroConcepts />);

    const entry = screen
      .getByRole("heading", { name: "Big C and Little c" })
      .closest(".home-concept-ledger-item");
    expect(entry).not.toBeNull();
    expect(within(entry as HTMLElement).getByText("Hypothesis")).toBeVisible();
  });
});
