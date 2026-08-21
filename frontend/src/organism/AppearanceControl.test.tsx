import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../shared/contexts/SimpleThemeContext";
import { AppearanceControl } from "./AppearanceControl";
import { OrganismProvider } from "./OrganismContext";
import { SAVED_ENVIRONMENTS_KEY } from "./savedEnvironments";
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
    delete document.documentElement.dataset.uiStyle;
    delete document.documentElement.dataset.motion;
    delete document.documentElement.dataset.reading;
    delete document.documentElement.dataset.leading;
    delete document.documentElement.dataset.align;
    delete document.documentElement.dataset.measure;
    delete document.documentElement.dataset.paragraph;
    delete document.documentElement.dataset.paper;
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

  it("publishes a surface choice to the application UI and persistence", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Minimal" }));

    await waitFor(() => {
      expect(document.documentElement.dataset.uiStyle).toBe("minimal");
    });
    expect(JSON.parse(window.localStorage.getItem(ORGANISM_STORAGE_KEY) ?? "{}"))
      .toMatchObject({ uiStyle: "minimal" });
  });

  it("renders appearance previews from configuration hooks rather than inline styles", () => {
    const { container } = renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    expect(container.querySelector("[data-appearance-control] [style]")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Reading" }));
    expect(container.querySelector("[data-appearance-control] [style]")).toBeNull();
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

  it("carries measure, paragraph style, and paper tone onto the document", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));

    fireEvent.click(screen.getByRole("button", { name: /warm paper/i }));
    fireEvent.click(screen.getByRole("tab", { name: "Reading" }));
    fireEvent.click(screen.getByRole("button", { name: /line length narrow/i }));
    fireEvent.click(screen.getByRole("button", { name: /indented paragraphs/i }));

    await waitFor(() => {
      expect(document.documentElement.dataset.measure).toBe("narrow");
      expect(document.documentElement.dataset.paragraph).toBe("indented");
      expect(document.documentElement.dataset.paper).toBe("warm");
    });
  });

  it("offers complete reading arrangements before the individual controls", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("tab", { name: "Reading" }));

    fireEvent.click(screen.getByRole("button", { name: "Focus reading style" }));

    await waitFor(() => {
      expect(document.documentElement.dataset.reading).toBe("sans");
      expect(document.documentElement.dataset.measure).toBe("narrow");
      expect(document.documentElement.dataset.leading).toBe("loose");
    });
    expect(screen.getByRole("button", { name: "Focus reading style" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("does not reset reading choices when the visual environment changes", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("tab", { name: "Reading" }));
    fireEvent.click(screen.getByRole("button", { name: "Open reading style" }));
    fireEvent.click(screen.getByRole("tab", { name: "Environment" }));
    fireEvent.click(screen.getByRole("button", { name: /midnight/i }));

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(document.documentElement.dataset.reading).toBe("humanist");
      expect(document.documentElement.dataset.contrast).toBe("high");
    });
  });

  it("offers reading faces beyond the original two", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("tab", { name: "Reading" }));

    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() =>
      expect(document.documentElement.dataset.reading).toBe("humanist"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Mono" }));
    await waitFor(() => expect(document.documentElement.dataset.reading).toBe("mono"));
  });

  it("pins an arbitrary accent hue from the wheel", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));

    const wheel = screen.getByLabelText("Accent hue");
    fireEvent.change(wheel, { target: { value: "317" } });

    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(ORGANISM_STORAGE_KEY) ?? "{}"))
        .toMatchObject({ tint: 317 }),
    );
    // Leaving "auto" is what pinning means, so the panel should say the degree.
    expect(screen.getByText("317°")).toBeTruthy();
  });

  it("saves the current appearance under a name and restores it later", async () => {
    const { unmount } = renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));

    fireEvent.click(screen.getByRole("button", { name: /sepia paper/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save this environment" }));
    fireEvent.change(screen.getByLabelText("Name this environment"), {
      target: { value: "  Long evening  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Long evening" })).toBeTruthy(),
    );
    expect(JSON.parse(window.localStorage.getItem(SAVED_ENVIRONMENTS_KEY) ?? "[]"))
      .toMatchObject([{ name: "Long evening", config: { paperTone: "sepia" } }]);

    // It is still there for the next visit, and applying it restores the page.
    unmount();
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("button", { name: /^clarity$/i }));
    await waitFor(() => expect(document.documentElement.dataset.paper).toBe("neutral"));

    fireEvent.click(screen.getByRole("button", { name: "Long evening" }));
    await waitFor(() => expect(document.documentElement.dataset.paper).toBe("sepia"));
  });

  it("forgets a saved environment as easily as it made one", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Save this environment" }));
    fireEvent.change(screen.getByLabelText("Name this environment"), {
      target: { value: "Scratch" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Scratch" })).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Forget Scratch" }));

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Scratch" })).toBeNull(),
    );
    expect(JSON.parse(window.localStorage.getItem(SAVED_ENVIRONMENTS_KEY) ?? "[]")).toEqual([]);
  });

  it("lets the reader tune the background pattern itself", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));

    // Clarity default has no pattern; switch to one that does.
    fireEvent.click(screen.getByRole("button", { name: ORGANISM_PRESETS.flow.label }));

    fireEvent.change(screen.getByLabelText(/^Presence —/), { target: { value: "1.6" } });
    fireEvent.change(screen.getByLabelText(/^Scale —/), { target: { value: "1.4" } });
    fireEvent.change(screen.getByLabelText(/^Tempo —/), { target: { value: "0.3" } });

    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem(ORGANISM_STORAGE_KEY) ?? "{}"))
        .toMatchObject({ fieldContrast: 1.6, fieldScale: 1.4, fieldSpeed: 0.3 }),
    );
  });

  it("hides the pattern dials when there is no pattern to tune", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));

    fireEvent.click(screen.getByRole("button", { name: ORGANISM_PRESETS.off.label }));

    await waitFor(() => expect(screen.queryByLabelText(/^Scale —/)).toBeNull());
  });

  it("offers the new patterns as backgrounds", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));

    for (const field of ["interference", "flow", "strata"] as const) {
      fireEvent.click(
        screen.getByRole("button", { name: ORGANISM_PRESETS[field].label }),
      );
      await waitFor(() =>
        expect(JSON.parse(window.localStorage.getItem(ORGANISM_STORAGE_KEY) ?? "{}"))
          .toMatchObject({ preset: field }),
      );
    }
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
