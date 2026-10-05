import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import EssayPage from "./EssayPage";
import EssaysPage from "./EssaysPage";
import type { EssaySummary } from "../../content/essays/essays";

const FEAR: EssaySummary = {
  slug: "fear-narrows",
  title: "Fear narrows",
  summary: "Why fear shrinks what feels possible.",
  published: "2026-10-01",
  updated: null,
  levels: ["model", "observation"],
  concepts: ["fear-gating"],
  words: 880,
  readingMinutes: 4,
};
const MACHINES: EssaySummary = {
  ...FEAR,
  slug: "language-models",
  title: "Is a language model a Digital Organism?",
  summary: "What DOT's definition says about machines.",
  published: "2026-10-14",
  levels: ["hypothesis"],
  concepts: [],
};

function serve(essays: EssaySummary[]) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith("/essays/index.json")) {
      return new Response(JSON.stringify({ schema: "dot.essays.v1", essays }));
    }
    if (url.endsWith("/essays/fear-narrows.md")) {
      return new Response("When fear governs, fewer responses feel available.\n\n## Why");
    }
    return new Response("Not found", { status: 404 });
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

const openAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/essays" element={<EssaysPage />} />
        <Route path="/essays/:slug" element={<EssayPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("EssaysPage", () => {
  it("shows the author's newsletter and identifies its edition as external writing", async () => {
    serve([]);
    openAt("/essays");

    expect(screen.getByRole("heading", { name: "The Millennial Manifesto" })).toBeInTheDocument();
    expect(screen.getByText("Applied DOT · Book in development")).toBeInTheDocument();
    const editions = screen.getByRole("list", { name: "Selected newsletter editions" });
    expect(within(editions).getByRole("link", {
      name: "AI will not kill you. The one saying that it will, will",
    })).toHaveAttribute("href", "https://www.linkedin.com/pulse/another-letter-american-adult-ai-kill-you-one-saying-henok-n8b0c/");
    expect(within(editions).getByText("Read on LinkedIn")).toBeInTheDocument();
    expect(await screen.findByText(/No additional essays are archived here yet/)).toBeInTheDocument();
  });

  it("lists every essay as the index gives it, and ends", async () => {
    serve([MACHINES, FEAR]);
    openAt("/essays");

    const list = await screen.findByRole("list", { name: "Essays, newest first" });
    const titles = within(list)
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual([MACHINES.title, FEAR.title]);
    expect(screen.getByText("October 14, 2026")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "That is every essay." })).toBeInTheDocument();
  });

  it("shows each essay's claim levels, weakest burden first", async () => {
    serve([FEAR]);
    openAt("/essays");

    const levels = await screen.findByRole("list", { name: "Claim levels used" });
    expect(within(levels).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Observation",
      "Model",
    ]);
  });

  it("says so plainly when nothing is published yet", async () => {
    serve([]);
    openAt("/essays");

    expect(await screen.findByText(/No additional essays are archived here yet/)).toBeInTheDocument();
  });
});

describe("EssayPage", () => {
  it("reads the essay, then stops at what it builds on and a way to answer it", async () => {
    serve([MACHINES, FEAR]);
    openAt("/essays/fear-narrows");

    expect(await screen.findByRole("heading", { level: 1, name: "Fear narrows" })).toBeInTheDocument();
    expect(screen.getByText(/fewer responses feel available/)).toBeInTheDocument();

    const buildsOn = within(screen.getByRole("region", { name: "Builds on" }));
    expect(buildsOn.getByRole("link", { name: "The Fear-Gating Principle" })).toHaveAttribute(
      "href",
      "/doctrine/fear-gating",
    );
    expect(screen.getByRole("region", { name: "Respond" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All essays" })).toHaveAttribute("href", "/essays");
    // No "read next": the essay ends where its text ends (L2).
    expect(screen.queryByText(/read next|you might also/i)).toBeNull();
    expect(document.title).toBe("Fear narrows — Henok Ghebrechristos");
  });

  it("answers an unknown address without guessing", async () => {
    serve([FEAR]);
    openAt("/essays/not-written");

    expect(
      await screen.findByRole("heading", { name: "No essay has this address." }),
    ).toBeInTheDocument();
  });
});
