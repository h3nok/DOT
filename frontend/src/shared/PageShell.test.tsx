import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { PageHeader, PageShell } from "./PageShell";

const renderShell = (props: { skipLink?: boolean; header?: boolean } = {}) =>
  render(
    <MemoryRouter>
      <PageShell header={props.header === false ? undefined : <PageHeader />} skipLink={props.skipLink}>
        <h1>Page</h1>
      </PageShell>
    </MemoryRouter>,
  );

describe("PageShell", () => {
  it("lets keyboard readers skip the header to the page's main content", () => {
    renderShell();

    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    // First in tab order: before the header's own links.
    expect(screen.getAllByRole("link")[0]).toBe(skip);
  });

  it("omits the skip link when there is no header to skip", () => {
    renderShell({ header: false });
    expect(screen.queryByRole("link", { name: "Skip to content" })).toBeNull();
  });

  it("defers to a page's own, more specific skip link", () => {
    renderShell({ skipLink: false });
    expect(screen.queryByRole("link", { name: "Skip to content" })).toBeNull();
  });
});
