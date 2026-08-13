import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../shared/contexts/SimpleThemeContext";
import { AppearanceControl } from "./AppearanceControl";
import { OrganismProvider } from "./OrganismContext";
import { ORGANISM_STORAGE_KEY } from "./types";

function renderAppearance() {
  return render(
    <ThemeProvider>
      <OrganismProvider>
        <AppearanceControl />
      </OrganismProvider>
    </ThemeProvider>,
  );
}

describe("AppearanceControl", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    delete document.documentElement.dataset.contrast;
    delete document.documentElement.dataset.motion;
    delete document.documentElement.dataset.reading;
  });

  it("applies and persists display and reading preferences", async () => {
    renderAppearance();

    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("button", { name: /dark/i }));
    fireEvent.click(screen.getByRole("button", { name: /sans/i }));
    fireEvent.click(screen.getByRole("button", { name: /text size xl/i }));

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(document.documentElement.dataset.reading).toBe("sans");
    });

    expect(window.localStorage.getItem("dot_theme")).toBe("dark");
    expect(JSON.parse(window.localStorage.getItem(ORGANISM_STORAGE_KEY) ?? "{}"))
      .toMatchObject({ readingFont: "sans", readingScale: 1.26 });
  });

  it("restores safe defaults for saved configurations without contrast", async () => {
    window.localStorage.setItem(
      ORGANISM_STORAGE_KEY,
      JSON.stringify({ preset: "lattice", readingScale: 1.12 }),
    );

    renderAppearance();

    await waitFor(() => {
      expect(document.documentElement.dataset.contrast).toBe("standard");
    });

    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    expect(screen.getByRole("button", { name: /lattice/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("opens the appearance panel on trigger click", () => {
    renderAppearance();

    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    expect(screen.getByRole("dialog", { name: /appearance/i })).toBeTruthy();
  });
});
