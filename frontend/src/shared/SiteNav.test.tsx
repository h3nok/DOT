import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { SiteNav } from "./SiteNav";

const originalWidth = window.innerWidth;
const resizeViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  fireEvent.resize(window);
};
afterEach(() => resizeViewport(originalWidth));

function RouteChange({ to }: { to: string }) {
  const navigate = useNavigate();
  return <button onClick={() => navigate(to)}>Change route</button>;
}

const renderNav = (initialEntry = "/", nextRoute?: string) => render(
  <MemoryRouter initialEntries={[initialEntry]}>
    <SiteNav />
    {nextRoute && <RouteChange to={nextRoute} />}
  </MemoryRouter>,
);

const openNavigation = () => {
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  return within(screen.getByRole("dialog", { name: "Menu" }));
};

describe("SiteNav", () => {
  it("keeps the viewport control outside its header and retains its custom wrapper class", () => {
    render(
      <MemoryRouter>
        <header><SiteNav className="custom-navigation" /></header>
      </MemoryRouter>,
    );

    const header = screen.getByRole("banner");
    const wrapper = screen.getByRole("button", { name: "Open menu" }).closest(".site-nav");
    expect(header).toBeEmptyDOMElement();
    expect(wrapper).toHaveClass("custom-navigation");
    expect(wrapper?.parentElement).toBe(document.body);
  });

  it.each([320, 768, 1440])("offers one menu control at %spx", (width) => {
    resizeViewport(width);
    renderNav("/academy/films");

    expect(screen.getAllByRole("button", { name: "Open menu" })).toHaveLength(1);
    expect(screen.queryByText("Academy")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const panel = openNavigation();
    expect(panel.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription("");
    expect(panel.queryByText(/curiosity|your own way|you are here/i)).toBeNull();
    // The same sheet remains open when a phone becomes a desktop viewport.
    resizeViewport(width === 320 ? 1440 : 320);
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
  });

  it("offers ordered paths with descriptions and keeps conversation links apart from the primary work", () => {
    renderNav();
    const panel = openNavigation();
    const primary = within(panel.getByRole("navigation", { name: "Primary" }));

    expect(primary.getAllByRole("link").map(link => [link.getAttribute("aria-label"), link.getAttribute("href")])).toEqual([
      ["Home", "/"],
      ["Book One", "/book/digital-organism-theory"],
      ["Academy", "/academy"],
      ["Writing", "/blog"],
      ["About", "/about"],
      ["Contact", "/contact"],
    ]);
    expect(primary.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(primary.getByRole("link", { name: "Academy" })).toHaveAccessibleDescription("Concepts, films, and open questions");
    expect(primary.getByRole("link", { name: "Book One" })).toHaveAccessibleDescription("Complete edition, free to read");
    expect(primary.getByText("Concepts, films, and open questions")).toBeVisible();
    const extras = within(panel.getByRole("navigation", { name: "More" }));
    expect(extras.queryByRole("link", { name: "Community" })).toBeNull();
    expect(extras.getByRole("link", { name: "Reader list" })).toHaveAttribute("href", "/readers");
  });

  it.each(["/academy", "/academy/films", "/academy/definitions/continuity", "/films", "/films/inquiry", "/videos"])(
    "locates %s within Academy without marking Book One current",
    (route) => {
      renderNav(route);
      const panel = openNavigation();
      const primary = within(panel.getByRole("navigation", { name: "Primary" }));
      expect(primary.getByRole("link", { name: "Academy" })).toHaveAttribute("aria-current", "page");
      expect(primary.getByRole("link", { name: "Book One" })).not.toHaveAttribute("aria-current");
      expect(primary.getAllByRole("link").filter(link => link.hasAttribute("aria-current"))).toHaveLength(1);
    },
  );

  it.each(["/blog", "/writing/an-essay", "/essays/an-essay", "/_preview/essays/an-essay"])(
    "locates %s within the common Writing archive",
    (route) => {
      renderNav(route);
      expect(openNavigation().getByRole("link", { name: "Writing" })).toHaveAttribute("aria-current", "page");
    },
  );

  it("focuses the current destination on opening and returns to the menu control after Escape", async () => {
    renderNav("/academy/films");
    const panel = openNavigation();
    await waitFor(() => expect(panel.getByRole("link", { name: "Academy" })).toHaveFocus());

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus());
  });

  it("provides an explicit Close control that restores focus to the menu control", async () => {
    renderNav();
    fireEvent.click(openNavigation().getByRole("button", { name: "Close menu" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus());
  });

  it("closes after choosing a destination and keeps the menu available on the new route", async () => {
    renderNav("/academy/films");
    fireEvent.click(openNavigation().getByRole("link", { name: "Writing" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus());
    expect(openNavigation().getByRole("link", { name: "Writing" })).toHaveAttribute("aria-current", "page");
  });

  it.each(["/about", "/academy/films?view=transcript", "/academy/films#transcript"])(
    "dismisses the sheet when external navigation changes the location to %s",
    async (nextRoute) => {
      renderNav("/academy/films", nextRoute);
      const changeRoute = screen.getByRole("button", { name: "Change route" });
      openNavigation();

      // A router update can originate outside the modal, such as browser history.
      fireEvent.click(changeRoute);

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    },
  );
});
