import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import AcademyPage from "./AcademyPage";
import { READING_PATHS } from "../../attention-os/reader/readingPaths";
import { PublicPageTestProvider } from "../../test/PublicPageTestProvider";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/academy"]}>
      <AcademyPage />
    </MemoryRouter>,
    { wrapper: PublicPageTestProvider },
  );
}

describe("AcademyPage", () => {
  it("opens with reading rather than a film", () => {
    renderPage();

    expect(screen.getByRole("heading", {
      level: 1,
      name: "Become a student of your own experience.",
    })).toBeVisible();
    const main = screen.getByRole("main");
    expect(main.querySelector('a[href^="/academy/films"]')).toBeNull();
    expect(main.querySelector("video, audio, iframe, canvas")).toBeNull();
  });

  it("uses the real reader paths into the same fixed publication", () => {
    renderPage();

    const paths = screen.getByRole("list", { name: "Reading paths" });
    expect(within(paths).getAllByRole("listitem")).toHaveLength(READING_PATHS.length);
    for (const path of READING_PATHS) {
      expect(within(paths).getByRole("link", { name: new RegExp(path.label) }))
        .toHaveAttribute("href", `/book/digital-organism-theory/${path.steps[0].slug}?path=${path.id}`);
      expect(within(paths).getByText(path.purpose)).toBeVisible();
    }
    expect(screen.getByRole("link", { name: "View Book One and its contents" }))
      .toHaveAttribute("href", "/book/digital-organism-theory");
  });

  it("offers current inquiry destinations without promising unfinished programs", () => {
    renderPage();

    const inquiry = screen.getByRole("navigation", { name: "Continue the inquiry" });
    expect(within(inquiry).getByRole("link", { name: /Explore the concept map/ }))
      .toHaveAttribute("href", "/doctrine");
    expect(within(inquiry).getByRole("link", { name: /Review open questions/ }))
      .toHaveAttribute("href", "/applied");
    expect(within(inquiry).getByRole("link", { name: /Bring a question to the conversation/ }))
      .toHaveAttribute("href", "/contact?purpose=writing");
    expect(screen.queryByText(/In development|No experiment is recorded|Under assembly/i))
      .not.toBeInTheDocument();
  });
});
