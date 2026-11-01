import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import BookV5Preview from "./BookV5Preview";

vi.mock("../../organism", () => ({ AppearanceControl: () => null }));

const manifest = {
  project: { title: "Consciousness: A Digital Organism", subtitle: "An illustrated proof", visibility: "private" },
  release: { version: 5, status: "draft" },
  sections: [
    { id: "preface", slug: "preface", title: "Begin with experience", kind: "preface", content_path: "sections/preface.md", reading_time_minutes: 4 },
    { id: "references", slug: "references", title: "References", kind: "references", content_path: "sections/references.md", reading_time_minutes: 2 },
  ],
  figures: [],
};

function renderProof(path = "/_preview/book-v5/preface") {
  return render(<MemoryRouter initialEntries={[path]}>
    <Routes><Route path="/_preview/book-v5/:sectionSlug?" element={<BookV5Preview />} /></Routes>
  </MemoryRouter>);
}

afterEach(() => vi.unstubAllGlobals());

describe("the unpublished v5 reading proof", () => {
  it("shows the edition cover and leads directly to its inline illustrations", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      ...manifest,
      cover: { src: "cover/cover-v5-web.webp", width: 600, height: 900, alt: "The illustrated Version 5 cover" },
      figures: [{ id: "avatar-canvas", number: 1, title: "An embodied exchange", section: "preface", src: "figures/avatar-canvas.svg" }],
    }), { status: 200 })));
    renderProof("/_preview/book-v5");
    const cover = await screen.findByRole("img", { name: "The illustrated Version 5 cover" });
    expect(cover).toHaveAttribute("src", "/_book-v5/cover/cover-v5-web.webp");
    expect(cover).toHaveAttribute("width", "600");
    expect(screen.getByRole("link", { name: "Begin reading" })).toHaveAttribute("href", "/_preview/book-v5/preface");
    expect(screen.getByRole("link", { name: /Figure 1 · An embodied exchange/ })).toHaveAttribute("href", "/_preview/book-v5/preface#figure-avatar-canvas");
  });

  it("reads only preview assets and keeps chapter navigation inside the proof", async () => {
    const fetch = vi.fn(async (url: string) => new Response(
      url.endsWith("manifest.json") ? JSON.stringify(manifest)
        : url.endsWith("references.md") ? "### Reference 1\n\nA research source."
          : "A moment worth examining.[¹](/_preview/book-v5/references#reference-1)\n\n[Read the sources](/_preview/book-v5/references)",
      { status: 200 },
    ));
    vi.stubGlobal("fetch", fetch);
    renderProof();
    expect(await screen.findByRole("heading", { name: "Begin with experience" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Read the sources" })).toHaveAttribute("href", "/_preview/book-v5/references");
    expect(screen.getByRole("link", { name: "References" })).toHaveAttribute("href", "/_preview/book-v5/references");
    expect(fetch.mock.calls.every(([url]) => url.startsWith("/_book-v5/"))).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Open reference 1" }));
    expect(screen.getByRole("link", { name: "Open in Notes and Sources" })).toHaveAttribute("href", "/_preview/book-v5/references#reference-1");
  });

  it("refuses a published or mismatched manifest instead of silently showing the public edition", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      ...manifest, release: { version: 4, status: "published" },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    renderProof();
    expect(await screen.findByRole("alert")).toHaveTextContent("requires the unpublished v5 proof manifest");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("A moment worth examining.")).not.toBeInTheDocument();
  });
});
