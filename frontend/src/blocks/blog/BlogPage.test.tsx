import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import BlogPage from "./BlogPage";
import { fetchEssayIndex } from "../../content/essays/essays";
import { fetchReleasedWriting } from "../../services/OrchestratorWritingService";
import { OrganismProvider } from "../../organism/OrganismContext";
import { ThemeProvider } from "../../shared/contexts/SimpleThemeContext";

vi.mock("../../content/essays/essays", async (original) => ({
  ...await original<typeof import("../../content/essays/essays")>(),
  fetchEssayIndex: vi.fn(),
}));
vi.mock("../../services/OrchestratorWritingService", async (original) => ({
  ...await original<typeof import("../../services/OrchestratorWritingService")>(),
  fetchReleasedWriting: vi.fn(),
}));
afterEach(() => {
  vi.mocked(fetchEssayIndex).mockReset();
  vi.mocked(fetchReleasedWriting).mockReset();
});

const essay = (slug: string, published: string) => ({
  slug, title: `Essay ${slug}`, summary: "", published, updated: null,
  levels: [], concepts: [], words: 100, readingMinutes: 1,
});
const writing = (id: string, released: string) => ({
  work_id: id, work_slug: id, title: `Letter ${id}`, summary: "A letter.", kind: "essay",
  release_number: 1, released_at: `${released}T12:00:00Z`, withdrawn_at: null,
});
const open = (path = "/blog") => render(
  <ThemeProvider>
    <OrganismProvider>
      <MemoryRouter initialEntries={[path]}><BlogPage /></MemoryRouter>
    </OrganismProvider>
  </ThemeProvider>,
);
const titles = () => within(screen.getByRole("list", { name: "Posts, newest first" }))
  .getAllByRole("heading").map((heading) => heading.textContent);

describe("BlogPage", () => {
  it("merges essays and released writing, newest first, with a stated end", async () => {
    vi.mocked(fetchEssayIndex).mockResolvedValue([essay("old", "2026-09-01")]);
    vi.mocked(fetchReleasedWriting).mockResolvedValue([writing("awork_new", "2026-10-05")]);
    open();
    expect(await screen.findByRole("list", { name: "Posts, newest first" })).toBeInTheDocument();
    expect(titles()).toEqual(["Letter awork_new", "Essay old"]);
    expect(screen.getByRole("link", { name: "Letter awork_new" })).toHaveAttribute("href", "/writing/awork_new");
    expect(screen.getByText(/That is everything posted here so far/)).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Blog pages" })).toBeNull();
  });

  it("pages explicitly instead of loading more on scroll", async () => {
    vi.mocked(fetchEssayIndex).mockResolvedValue(
      Array.from({ length: 12 }, (_, index) => essay(`e${index}`, `2026-09-${String(index + 1).padStart(2, "0")}`)),
    );
    vi.mocked(fetchReleasedWriting).mockResolvedValue([]);
    open("/blog?page=2");
    expect(await screen.findByText("Page 2 of 2")).toBeInTheDocument();
    expect(titles()).toEqual(["Essay e1", "Essay e0"]);
    expect(screen.getByRole("link", { name: "Newer posts" })).toHaveAttribute("href", "/blog?page=1");
  });

  it("keeps what loaded when one source is down and can recover without claiming the archive is complete", async () => {
    vi.mocked(fetchEssayIndex).mockResolvedValue([essay("kept", "2026-09-01")]);
    vi.mocked(fetchReleasedWriting).mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce([writing("recovered", "2026-10-05")]);
    open();
    expect(await screen.findByRole("alert")).toHaveTextContent("Some writing could not be loaded.");
    expect(titles()).toEqual(["Essay kept"]);
    expect(screen.queryByText(/That is everything posted here so far/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("link", { name: "Letter recovered" })).toBeInTheDocument();
    expect(titles()).toEqual(["Letter recovered", "Essay kept"]);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText(/That is everything posted here so far/)).toBeInTheDocument();
  });

  it("offers a way to read when neither archive can load", async () => {
    vi.mocked(fetchEssayIndex).mockRejectedValue(new Error("down"));
    vi.mocked(fetchReleasedWriting).mockRejectedValue(new Error("down"));
    open();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read Book One" })).toHaveAttribute("href", "/book/digital-organism-theory");
    expect(screen.queryByText(/Nothing has been posted here yet/)).toBeNull();
  });
});
