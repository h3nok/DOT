import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WritingStudioPage from "./WritingStudioPage";
import { PublicPageTestProvider } from "../../test/PublicPageTestProvider";
import * as writing from "../../services/OrchestratorWritingService";
import * as distribution from "../../services/OrchestratorDistributionService";
import * as adoption from "./writing/importPublishedEssay";
vi.mock("./writing/importPublishedEssay", async original => ({ ...await original<typeof adoption>(), importPublishedEssay: vi.fn() }));
vi.mock("./components/MarkdownManuscriptEditor", () => ({ MarkdownManuscriptEditor: ({ value, onChange, ariaLabel }: { value: string; onChange: (value: string) => void; ariaLabel: string }) => <textarea aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)} /> }));
vi.mock("../../services/OrchestratorDistributionService", () => ({ fetchLinkedInConnection: vi.fn(), fetchDistributionCopies: vi.fn(), shareReleasedWritingOnLinkedIn: vi.fn() }));
vi.mock("../../services/OrchestratorWritingService", async original => ({ ...await original<typeof writing>(), fetchWritingWorkspace: vi.fn(), fetchWritingWorks: vi.fn(), createWritingWork: vi.fn(), fetchWritingDraft: vi.fn(), saveWritingSnapshot: vi.fn(), releaseSavedWriting: vi.fn(), fetchWritingDelivery: vi.fn() }));
beforeEach(() => {
  vi.mocked(writing.fetchWritingWorkspace).mockResolvedValue({ id: "space-1", slug: "dot-academy", title: "DOT Academy" });
  vi.mocked(writing.fetchWritingWorks).mockResolvedValue([]);
  vi.mocked(writing.createWritingWork).mockResolvedValue({ id: "work-1", kind: "essay", canonical_slug: "my-analysis", lifecycle_state: "draft" });
  vi.mocked(writing.saveWritingSnapshot).mockResolvedValue({ id: "revision-1", title: "My analysis", summary: null, revision_number: 1 });
  vi.mocked(writing.releaseSavedWriting).mockResolvedValue({ release_number: 1, release_status: "released" });
  vi.mocked(writing.fetchWritingDelivery).mockResolvedValue({ delivery: { manifest: { title: "My analysis", summary: null, release: { number: 1 }, revision: { content_hash: "hash" }, claims: [] } }, body: "Supplied manuscript." });
  vi.mocked(distribution.fetchLinkedInConnection).mockResolvedValue({ configured: true, connected: true, display_name: "Test author", expires_at: null });
  vi.mocked(distribution.fetchDistributionCopies).mockResolvedValue([]);
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });
async function write() {
  render(<MemoryRouter><WritingStudioPage /></MemoryRouter>, { wrapper: PublicPageTestProvider });
  fireEvent.click(await screen.findByRole("button", { name: "Write a blank draft" }));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "My analysis" } });
  fireEvent.change(screen.getByLabelText("Manuscript"), { target: { value: "Supplied manuscript." } });
}
function declare() {
  fireEvent.change(screen.getByLabelText("Statement"), { target: { value: "Supplied claim." } });
  fireEvent.change(screen.getByLabelText("Claim level"), { target: { value: "Hypothesis" } });
}
async function save() { fireEvent.click(screen.getByRole("button", { name: "Save private revision" })); await screen.findByText("Revision 1 saved privately. Text, settings, images and claim notes are together."); }
function review() { fireEvent.click(screen.getByRole("button", { name: "3. Preview" })); fireEvent.click(screen.getByRole("button", { name: "4. Publish" })); }
describe("the publishing desk", () => {
  it("opens an existing AMM manuscript privately and preserves its identifier on save", async () => {
    vi.mocked(adoption.importPublishedEssay).mockResolvedValue({ title: "Source manuscript", summary: "Original summary", body: "Exact author text.", presentation: { ...writing.emptyPresentation(), series: "The American Millennial Manifesto" }, assets: [] });
    render(<MemoryRouter initialEntries={["/studio/writing?series=amm&source=the-anatomy-of-the-host"]}><WritingStudioPage /></MemoryRouter>, { wrapper: PublicPageTestProvider });
    await screen.findByDisplayValue("Exact author text.");
    expect(writing.createWritingWork).not.toHaveBeenCalled();
    expect(writing.releaseSavedWriting).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save private revision" }));
    await screen.findByText("Revision 1 saved privately. Text, settings, images and claim notes are together.");
    expect(writing.createWritingWork).toHaveBeenCalledWith("space-1", "the-anatomy-of-the-host");
    expect(writing.releaseSavedWriting).not.toHaveBeenCalled();
  });
  it("reopens saved edits instead of importing a second copy of the source", async () => {
    vi.mocked(writing.fetchWritingWorks).mockResolvedValue([{ id: "managed", kind: "essay", canonical_slug: "the-anatomy-of-the-host", lifecycle_state: "released" }]);
    vi.mocked(writing.fetchWritingDraft).mockResolvedValue({ title: "Saved revision", summary: "", body: "My saved changes.", revisionId: "r2", revisionNumber: 2 });
    render(<MemoryRouter initialEntries={["/studio/writing?series=amm&source=the-anatomy-of-the-host"]}><WritingStudioPage /></MemoryRouter>, { wrapper: PublicPageTestProvider });
    await screen.findByDisplayValue("My saved changes.");
    expect(adoption.importPublishedEssay).not.toHaveBeenCalled();
    expect(writing.createWritingWork).not.toHaveBeenCalled();
  });
  it("saves unfinished claims privately without publication or external sharing", async () => {
    await write(); await save();
    expect(writing.saveWritingSnapshot).toHaveBeenCalledTimes(1);
    expect(writing.releaseSavedWriting).not.toHaveBeenCalled();
    expect(distribution.shareReleasedWritingOnLinkedIn).not.toHaveBeenCalled();
    review(); expect(screen.getByRole("button", { name: "Publish on this website" })).toBeDisabled();
  });
  it("requires a saved revision, preview and explicit approval before release", async () => {
    await write(); declare(); review();
    expect(screen.getByRole("checkbox", { name: /approve public release/ })).toBeDisabled();
    await save();
    expect(screen.getByRole("checkbox", { name: /approve public release/ })).toBeDisabled();
    review(); fireEvent.click(screen.getByRole("checkbox", { name: /approve public release/ }));
    fireEvent.click(screen.getByRole("button", { name: "Publish on this website" }));
    expect(await screen.findByText("Version 1 is published on this website.")).toBeInTheDocument();
    expect(writing.releaseSavedWriting).toHaveBeenCalledWith("work-1", "revision-1");
    expect(writing.saveWritingSnapshot).toHaveBeenCalledTimes(1);
    expect(distribution.shareReleasedWritingOnLinkedIn).not.toHaveBeenCalled();
  });
  it("keeps a failed save intact and reuses its identity on retry", async () => {
    vi.mocked(writing.saveWritingSnapshot).mockRejectedValueOnce(new Error("Connection lost"));
    await write(); fireEvent.click(screen.getByRole("button", { name: "Save private revision" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Connection lost");
    expect(screen.getByLabelText("Manuscript")).toHaveValue("Supplied manuscript.");
    await save();
    const calls = vi.mocked(writing.saveWritingSnapshot).mock.calls;
    expect(calls[0][3]).toBe(calls[1][3]);
    expect(writing.createWritingWork).toHaveBeenCalledTimes(1);
  });
  it("requires confirmation before replacing an unsaved draft", async () => {
    await write(); fireEvent.click(screen.getByRole("button", { name: "New writing" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Manuscript")).toHaveValue("Supplied manuscript.");
  });
  it("reopens the saved revision and its incomplete claim notes", async () => {
    vi.mocked(writing.fetchWritingWorks).mockResolvedValue([{ id: "work-2", kind: "essay", canonical_slug: "existing-letter", lifecycle_state: "draft" }]);
    vi.mocked(writing.fetchWritingDraft).mockResolvedValue({ title: "Existing letter", summary: "", body: "Saved text", revisionId: "r2", revisionNumber: 2, claims: [{ statement: "Unfinished claim", level: "", origin: "sourced", source: "" }] });
    render(<MemoryRouter><WritingStudioPage /></MemoryRouter>, { wrapper: PublicPageTestProvider });
    fireEvent.click(await screen.findByRole("button", { name: /existing letter/ }));
    expect(await screen.findByDisplayValue("Saved text")).toBeInTheDocument();
    expect(screen.getByLabelText("Statement")).toHaveValue("Unfinished claim");
    expect(screen.getByText("Saved · revision 2")).toBeInTheDocument();
  });
});
