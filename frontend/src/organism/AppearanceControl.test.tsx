import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../shared/contexts/SimpleThemeContext";
import { AppearanceControl } from "./AppearanceControl";
import { OrganismProvider } from "./OrganismContext";
import { THEME_PRESETS } from "./themePresets";
import { ORGANISM_PRESETS, ORGANISM_STORAGE_KEY } from "./types";

function renderAppearance(placement: "floating" | "inline" = "floating") {
  return render(
    <ThemeProvider>
      <OrganismProvider>
        <AppearanceControl placement={placement} />
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
    delete document.documentElement.dataset.leading;
    delete document.documentElement.dataset.align;
  });

  it("applies and persists display and reading preferences", async () => {
    renderAppearance();

    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("button", { name: /dark/i }));
    // Type lives in the Reading room; the environment controls stay behind.
    fireEvent.click(screen.getByRole("tab", { name: "Reading" }));
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
    expect(
      screen.getByRole("button", { name: ORGANISM_PRESETS.lattice.label }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("applies a whole environment from one choice, then lets it be adjusted", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));

    const midnight = THEME_PRESETS.find((preset) => preset.id === "midnight")!;
    fireEvent.click(screen.getByRole("button", { name: /midnight/i }));

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(JSON.parse(window.localStorage.getItem(ORGANISM_STORAGE_KEY) ?? "{}"))
      .toMatchObject(midnight.config);
    expect(screen.getByRole("button", { name: /midnight/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Changing part of it is refinement, not a new mode — but the panel stops
    // claiming the preset describes what the reader is looking at.
    fireEvent.click(
      screen.getByRole("button", { name: ORGANISM_PRESETS.lattice.label }),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /midnight/i })).toHaveAttribute(
        "aria-pressed",
        "false",
      ),
    );
  });

  it("carries leading and alignment onto the reading surfaces", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("tab", { name: "Reading" }));

    fireEvent.click(screen.getByRole("button", { name: /line spacing loose/i }));
    fireEvent.click(screen.getByRole("button", { name: /justified/i }));

    await waitFor(() => {
      expect(document.documentElement.dataset.leading).toBe("loose");
      expect(document.documentElement.dataset.align).toBe("justify");
    });
  });

  it("opens the appearance panel on trigger click", () => {
    renderAppearance();

    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    expect(screen.getByRole("dialog", { name: /appearance/i })).toBeTruthy();
  });

  it("can live in reading chrome without fixed positioning", () => {
    renderAppearance("inline");

    const trigger = screen.getByRole("button", { name: "Appearance settings" });
    expect(trigger.parentElement).toHaveClass("relative");
    expect(trigger.parentElement).not.toHaveClass("fixed");

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: /appearance/i })).toHaveClass("fixed");
  });
});
