import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WritingStudioPage from "./WritingStudioPage";
import * as writing from "../../services/OrchestratorWritingService";

vi.mock("../../services/OrchestratorWritingService", async (original) => ({
  ...await original<typeof writing>(),
  fetchWritingWorkspace: vi.fn(), fetchWritingWorks: vi.fn(), createWritingWork: vi.fn(), fetchWritingDraft: vi.fn(), saveWritingDraft: vi.fn(), releaseWriting: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(writing.fetchWritingWorkspace).mockResolvedValue({ id: "space-1", slug: "dot-academy", title: "DOT Academy" });
  vi.mocked(writing.fetchWritingWorks).mockResolvedValue([]);
  vi.mocked(writing.createWritingWork).mockResolvedValue({ id: "work-1", kind: "essay", canonical_slug: "my-analysis", lifecycle_state: "draft" });
  vi.mocked(writing.saveWritingDraft).mockResolvedValue({ id: "revision-1", title: "My analysis", summary: null, revision_number: 1 });
  vi.mocked(writing.releaseWriting).mockResolvedValue({ release_number: 1, release_status: "released" });
});
afterEach(() => vi.resetAllMocks());

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
    expect(screen.getByRole("button", { name: "Publish on this website" })).toBeDisabled();
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
  });
});