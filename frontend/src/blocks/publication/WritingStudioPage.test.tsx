import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WritingStudioPage from "./WritingStudioPage";
import * as writing from "../../services/OrchestratorWritingService";
import * as distribution from "../../services/OrchestratorDistributionService";

vi.mock("../../services/OrchestratorDistributionService", () => ({ fetchLinkedInConnection: vi.fn(), fetchDistributionCopies: vi.fn(), shareReleasedWritingOnLinkedIn: vi.fn() }));

vi.mock("../../services/OrchestratorWritingService", async (original) => ({
  ...await original<typeof writing>(),
  fetchWritingWorkspace: vi.fn(), fetchWritingWorks: vi.fn(), createWritingWork: vi.fn(), fetchWritingDraft: vi.fn(), saveWritingDraft: vi.fn(), releaseWriting: vi.fn(), fetchWritingDelivery: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(writing.fetchWritingWorkspace).mockResolvedValue({ id: "space-1", slug: "dot-academy", title: "DOT Academy" });
  vi.mocked(writing.fetchWritingWorks).mockResolvedValue([]);
  vi.mocked(writing.createWritingWork).mockResolvedValue({ id: "work-1", kind: "essay", canonical_slug: "my-analysis", lifecycle_state: "draft" });
  vi.mocked(writing.saveWritingDraft).mockResolvedValue({ id: "revision-1", title: "My analysis", summary: null, revision_number: 1 });
  vi.mocked(writing.releaseWriting).mockResolvedValue({ release_number: 1, release_status: "released" });
  vi.mocked(writing.fetchWritingDelivery).mockResolvedValue({ delivery: { manifest: { title: "My analysis", summary: null, release: { number: 1 }, revision: { content_hash: "hash" }, claims: [] } }, body: "The author's supplied manuscript." });
  vi.mocked(distribution.fetchLinkedInConnection).mockResolvedValue({ configured: true, connected: true, display_name: "Test author", expires_at: null });
  vi.mocked(distribution.fetchDistributionCopies).mockResolvedValue([]);
});
afterEach(() => {
  // Unmount before resetting services so pending React effects cannot call
  // mocks whose promise implementations have already been cleared.
  cleanup();
  vi.resetAllMocks();
});

async function write() {
  render(<MemoryRouter><WritingStudioPage /></MemoryRouter>);
  fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "My analysis" } });
  fireEvent.change(screen.getByLabelText("Manuscript"), { target: { value: "The author's supplied manuscript." } });
}

describe("WritingStudioPage", () => {
  it("saves privately without publishing or sending anything", async () => {
    await write();
    fireEvent.click(screen.getByRole("button", { name: "Save private revision" }));
    expect(await screen.findByText("Text and entered claims saved as a private revision.")).toBeInTheDocument();
    expect(writing.saveWritingDraft).toHaveBeenCalled();
    expect(writing.releaseWriting).not.toHaveBeenCalled();
    expect(distribution.shareReleasedWritingOnLinkedIn).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Publish on this website" })).toBeDisabled();
  });

  it("keeps the native release and saved draft when a selected external share fails", async () => {
    vi.mocked(distribution.shareReleasedWritingOnLinkedIn).mockRejectedValue(new Error("Network lost"));
    await write();
    await screen.findByText(/Connected as Test author/);
    fireEvent.click(screen.getByRole("checkbox", { name: /Also share a link/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /approve public release/ }));
    fireEvent.click(screen.getByRole("button", { name: "Publish on this website" }));
    expect(await screen.findByText(/Your piece is published here. The LinkedIn result/)).toBeInTheDocument();
    expect(screen.getByText("Version 1 is published on this website.")).toBeInTheDocument();
    expect(screen.getByText("Text unchanged")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read released version 1" })).toHaveAttribute("href", "/writing/work-1/releases/1");
    expect(writing.releaseWriting).toHaveBeenCalledTimes(1);
    expect(distribution.shareReleasedWritingOnLinkedIn).toHaveBeenCalledWith("work-1", 1);
  });

  it("requires author approval and exposes an owned immutable release link", async () => {
    await write();
    fireEvent.change(screen.getByLabelText("Statement"), { target: { value: "The author's central claim." } });
    fireEvent.change(screen.getByLabelText("Claim level"), { target: { value: "Hypothesis" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /approve public release/ }));
    fireEvent.click(screen.getByRole("button", { name: "Publish on this website" }));
    expect(await screen.findByText("Version 1 is published on this website.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read released version 1" })).toHaveAttribute("href", "/writing/work-1/releases/1");
    expect(writing.releaseWriting).toHaveBeenCalledWith("work-1", { title: "My analysis", summary: "", body: "The author's supplied manuscript." }, [{ statement: "The author's central claim.", level: "Hypothesis", origin: "author_originated", source: "" }]);
  });

  it("preserves text and unsaved state when storage fails", async () => {
    vi.mocked(writing.saveWritingDraft).mockRejectedValue(new Error("Storage unavailable"));
    await write();
    fireEvent.click(screen.getByRole("button", { name: "Save private revision" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Storage unavailable");
    expect(screen.getByLabelText("Manuscript")).toHaveValue("The author's supplied manuscript.");
    expect(screen.getByText("Unsaved text")).toBeInTheDocument();
  });

  it("reopens saved text and claim declarations", async () => {
    vi.mocked(writing.fetchWritingWorks).mockResolvedValue([{ id: "work-2", kind: "essay", canonical_slug: "existing-letter", lifecycle_state: "draft" }]);
    vi.mocked(writing.fetchWritingDraft).mockResolvedValue({ title: "Existing letter", summary: "An existing summary", body: "Saved text", claims: [{ statement: "Saved claim", level: "Speculation", origin: "sourced", source: "https://example.org/source" }] });
    render(<MemoryRouter><WritingStudioPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "existing letter" }));
    expect(await screen.findByDisplayValue("Saved text")).toBeInTheDocument();
    expect(screen.getByLabelText("Statement")).toHaveValue("Saved claim");
    expect(screen.getByLabelText("Source URL")).toHaveValue("https://example.org/source");
    expect(await screen.findByRole("heading", { name: "Distribute published version 1" })).toBeInTheDocument();
    expect(writing.releaseWriting).not.toHaveBeenCalled();
  });
});
