import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../shared/contexts/SimpleThemeContext";
import { AppearanceControl } from "./AppearanceControl";
import { OrganismProvider } from "./OrganismContext";
import { ORGANISM_STORAGE_KEY } from "./types";

function renderAppearance(placement: "floating" | "inline" = "floating") {
  return render(
    <ThemeProvider>
      <OrganismProvider>
        <AppearanceControl placement={placement} />
      </OrganismProvider>
    </ThemeProvider>,
  );
}

const saved = () => JSON.parse(window.localStorage.getItem(ORGANISM_STORAGE_KEY) ?? "{}");

describe("AppearanceControl", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    for (const key of ["contrast", "uiStyle", "motion", "reading", "leading", "align", "measure", "paragraph", "paper", "palette"]) {
      delete document.documentElement.dataset[key];
    }
  });

  it("offers one theme in two lights, and nothing to compose a look from", () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));

    expect(screen.getByRole("button", { name: "Light" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Dark" })).toBeVisible();
    for (const retired of [/midnight/i, /quiet night/i, /^minimal$/i, /sepia paper/i, /save this environment/i]) {
      expect(screen.queryByRole("button", { name: retired })).toBeNull();
    }
    expect(screen.queryByLabelText("Accent hue")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("switches between light and dark and remembers the choice", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(window.localStorage.getItem("dot_theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement.dataset.palette).toBe("amm");
  });

  it("applies and persists reading preferences", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("button", { name: /sans/i }));
    fireEvent.click(screen.getByRole("button", { name: /text size xl/i }));

    await waitFor(() => expect(document.documentElement.dataset.reading).toBe("sans"));
    expect(saved()).toMatchObject({ readingFont: "sans", readingScale: 1.26 });
  });

  it("lands an old saved environment in the signature theme without losing its reading choices", async () => {
    window.localStorage.setItem(
      ORGANISM_STORAGE_KEY,
      JSON.stringify({ preset: "lattice", uiStyle: "minimal", paperTone: "sepia", readingScale: 1.12 }),
    );
    renderAppearance();

    await waitFor(() => {
      expect(document.documentElement.dataset.contrast).toBe("standard");
      expect(document.documentElement.dataset.uiStyle).toBe("neural");
      expect(document.documentElement.dataset.paper).toBe("neutral");
    });
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    expect(screen.getByRole("button", { name: "Text size L" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps contrast and stillness one switch away", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("switch", { name: "High contrast" }));
    fireEvent.click(screen.getByRole("switch", { name: "Hold the page still" }));

    await waitFor(() => {
      expect(document.documentElement.dataset.contrast).toBe("high");
      expect(document.documentElement.dataset.motion).toBe("still");
    });
    expect(saved()).toMatchObject({ contrast: "high", stillness: true });
  });

  it("renders appearance previews from configuration hooks rather than inline styles", () => {
    const { container } = renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    expect(container.querySelector("[data-appearance-control] [style]")).toBeNull();
  });

  it("ships curated reading choices first and keeps the finer controls collapsed", () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));

    const readingFineTune = screen.getByText("Fine tune reading").closest("details");
    expect(readingFineTune).not.toHaveAttribute("open");
    expect(screen.getByRole("button", { name: "Editorial reading style" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Text size M" })).toBeVisible();
    expect(screen.getByRole("switch", { name: "High contrast" })).toBeVisible();
  });

  it("carries leading, alignment, measure, and paragraph style onto the reading surfaces", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));

    fireEvent.click(screen.getByRole("button", { name: /line spacing loose/i }));
    fireEvent.click(screen.getByRole("button", { name: /ragged right/i }));
    fireEvent.click(screen.getByRole("button", { name: /line length narrow/i }));
    fireEvent.click(screen.getByRole("button", { name: /indented paragraphs/i }));

    await waitFor(() => {
      expect(document.documentElement.dataset.leading).toBe("loose");
      expect(document.documentElement.dataset.align).toBe("left");
      expect(document.documentElement.dataset.measure).toBe("narrow");
      expect(document.documentElement.dataset.paragraph).toBe("indented");
    });
  });

  it("offers complete reading arrangements before the individual controls", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Focus reading style" }));

    await waitFor(() => {
      expect(document.documentElement.dataset.reading).toBe("sans");
      expect(document.documentElement.dataset.measure).toBe("narrow");
      expect(document.documentElement.dataset.leading).toBe("loose");
    });
    expect(screen.getByRole("button", { name: "Focus reading style" })).toHaveAttribute("aria-pressed", "true");
  });

  it("does not reset reading choices when the light changes", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Open reading style" }));
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(document.documentElement.dataset.reading).toBe("humanist");
      expect(document.documentElement.dataset.contrast).toBe("high");
    });
  });

  it("offers reading faces beyond the original two", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));

    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(document.documentElement.dataset.reading).toBe("humanist"));

    fireEvent.click(screen.getByRole("button", { name: "Mono" }));
    await waitFor(() => expect(document.documentElement.dataset.reading).toBe("mono"));
  });

  it("resets reading choices without touching the light", async () => {
    renderAppearance();
    fireEvent.click(screen.getByRole("button", { name: "Appearance settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    fireEvent.click(screen.getByRole("button", { name: /text size xl/i }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => expect(saved()).toMatchObject({ readingScale: 1 }));
    expect(document.documentElement).toHaveClass("dark");
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
