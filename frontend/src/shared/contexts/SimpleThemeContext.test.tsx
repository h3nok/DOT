import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "./SimpleThemeContext";

/**
 * Pretend the reader's operating system asks for `dark`.
 *
 * The returned `flip` mutates the live MediaQueryList rather than installing a
 * new one, because that is what a real browser does: the same object's
 * `matches` changes and then it notifies. Swapping the mock out instead leaves
 * the listener holding the old object and the test passes or fails for reasons
 * that have nothing to do with the component.
 */
function systemPrefers(dark: boolean) {
  const listeners: Array<() => void> = [];
  const mql = {
    matches: dark,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  window.matchMedia = vi.fn().mockImplementation((query: string) =>
    query.includes("prefers-color-scheme: dark")
      ? mql
      : { ...mql, matches: false, media: query },
  ) as unknown as typeof window.matchMedia;

  return {
    flip(next: boolean) {
      mql.matches = next;
      listeners.forEach((fn) => fn());
    },
  };
}

const Probe = () => {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme("light")} data-testid="probe">
      {theme}
    </button>
  );
};

const renderTheme = () =>
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );

describe("theme base", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
  });

  afterEach(() => vi.restoreAllMocks());

  it("follows the operating system when the reader has not chosen", async () => {
    systemPrefers(true);
    renderTheme();

    await waitFor(() => expect(screen.getByTestId("probe")).toHaveTextContent("dark"));
    expect(document.documentElement).toHaveClass("dark");
  });

  it("does not persist a base the reader never chose", async () => {
    // Writing it on first paint would pin them out of their own system
    // setting permanently — the bug this replaced.
    systemPrefers(true);
    renderTheme();

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(window.localStorage.getItem("dot_theme")).toBeNull();
  });

  it("keeps following the system until a choice is made", async () => {
    const system = systemPrefers(false);
    renderTheme();
    await waitFor(() => expect(screen.getByTestId("probe")).toHaveTextContent("light"));

    // The machine turns dark at sunset.
    system.flip(true);

    await waitFor(() => expect(screen.getByTestId("probe")).toHaveTextContent("dark"));
    expect(document.documentElement).toHaveClass("dark");
  });

  it("an explicit choice wins over the system and is remembered", async () => {
    systemPrefers(true);
    window.localStorage.setItem("dot_theme", "light");
    renderTheme();

    await waitFor(() => expect(screen.getByTestId("probe")).toHaveTextContent("light"));
    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
