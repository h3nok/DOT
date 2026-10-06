import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import BlogPage from "./BlogPage";
import { fetchEssayIndex } from "../../content/essays/essays";
import { fetchReleasedWriting } from "../../services/OrchestratorWritingService";

vi.mock("../../content/essays/essays", async (original) => ({
  ...await original<typeof import("../../content/essays/essays")>(),
  fetchEssayIndex: vi.fn(),
}));
vi.mock("../../services/OrchestratorWritingService", async (original) => ({
  ...await original<typeof import("../../services/OrchestratorWritingService")>(),
  fetchReleasedWriting: vi.fn(),
}));
afterEach(() => vi.resetAllMocks());

const essay = (slug: string, published: string) => ({
  slug, title: `Essay ${slug}`, summary: "", published, updated: null,
  levels: [], concepts: [], words: 100, readingMinutes: 1,
});
const writing = (id: string, released: string) => ({
  work_id: id, work_slug: id, title: `Letter ${id}`, summary: "A letter.", kind: "essay",
  release_number: 1, released_at: `${released}T12:00:00Z`, withdrawn_at: null,
});
const open = (path = "/blog") => render(<MemoryRouter initialEntries={[path]}><BlogPage /></MemoryRouter>);
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
    expect(screen.getByText(/That is everything posted so far/)).toBeInTheDocument();
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

  it("keeps what loaded when one source is down", async () => {
    vi.mocked(fetchEssayIndex).mockResolvedValue([essay("kept", "2026-09-01")]);
    vi.mocked(fetchReleasedWriting).mockRejectedValue(new Error("down"));
    open();
    expect(await screen.findByRole("alert")).toHaveTextContent("writing released from the Studio");
    expect(titles()).toEqual(["Essay kept"]);
  });
});
