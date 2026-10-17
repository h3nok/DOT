import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, expect, it, vi } from "vitest";
import AmmPublicationPage from "./AmmPublicationPage";
import AMM from "../../content/amm.json";
import { fetchEssayIndex } from "../../content/essays/essays";
import { fetchReleasedWriting } from "../../services/OrchestratorWritingService";

vi.mock("../../shared/PageShell", () => ({ PageHeader: () => null, PageShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("../../shared/SiteColophon", () => ({ SiteColophon: () => null }));
vi.mock("../../organism/AppearanceControl", () => ({ AppearanceControl: () => null }));
vi.mock("../../dot/ReaderListForm", () => ({ ReaderListForm: () => <p>Signup</p> }));
vi.mock("../../content/essays/essays", async original => ({ ...await original<typeof import("../../content/essays/essays")>(), fetchEssayIndex: vi.fn() }));
vi.mock("../../services/OrchestratorWritingService", async original => ({ ...await original<typeof import("../../services/OrchestratorWritingService")>(), fetchReleasedWriting: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const open = (path = "/amm/editions") => render(<HelmetProvider><MemoryRouter initialEntries={[path]}><AmmPublicationPage /></MemoryRouter></HelmetProvider>);

it("shows the manuscript in reading order, then only other AMM releases in a finite archive", async () => {
  vi.mocked(fetchEssayIndex).mockResolvedValue([{ slug: "amm-letter", title: "AMM fixture", summary: "", series: AMM.series, published: "2026-10-01", updated: null, levels: [], concepts: [], words: 10, readingMinutes: 1 }, { slug: "elsewhere", title: "Other essay", summary: "", published: "2026-10-02", updated: null, levels: [], concepts: [], words: 10, readingMinutes: 1 }]);
  vi.mocked(fetchReleasedWriting).mockResolvedValue([]);
  open();
  const list = await screen.findByRole("list", { name: "AMM letters, newest first" });
  expect(within(list).getByRole("heading", { name: "AMM fixture" })).toBeVisible();
  const path = screen.getByRole("list", { name: "The manifesto, in reading order" });
  expect(within(path).getAllByRole("heading", { level: 3 }).map(heading => within(heading).getByRole("link").getAttribute("href"))).toEqual(["/essays/amm-chapter-one-the-leech", "/essays/amm-chapter-two-the-leechs-anatomy", "/essays/amm-chapter-three-the-host-and-the-infection"]);
  expect(screen.queryByText("Other essay")).toBeNull();
  expect(screen.getByText("You’ve reached the end of the archive.")).toBeVisible();
  expect(screen.getByRole("link", { name: "AMM RSS" })).toHaveAttribute("href", "/amm/feed.xml");
});

it("does not invent an edition or claim an empty archive when the API fails", async () => {
  vi.mocked(fetchEssayIndex).mockResolvedValue([]);
  vi.mocked(fetchReleasedWriting).mockRejectedValue(new Error("offline"));
  open();
  expect(await screen.findByRole("alert")).toHaveTextContent("Some editions could not be loaded.");
  expect(screen.queryByText(AMM.emptyTitle)).toBeNull();
  expect(screen.queryByText(/Earlier writing · Published on LinkedIn/)).not.toBeInTheDocument();
});
