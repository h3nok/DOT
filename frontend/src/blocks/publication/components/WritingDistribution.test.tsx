import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as writing from "../../../services/OrchestratorWritingService";
import * as distribution from "../../../services/OrchestratorDistributionService";
import { WritingDistribution } from "./WritingDistribution";
import { writingExport } from "./writingExport";

vi.mock("../../../services/OrchestratorWritingService", async (original) => ({ ...await original<typeof writing>(), fetchWritingDelivery: vi.fn() }));
vi.mock("../../../services/OrchestratorDistributionService", () => ({ fetchDistributionCopies: vi.fn(), shareReleasedWritingOnLinkedIn: vi.fn(), recordDistributionCopy: vi.fn() }));

const source = { delivery: { manifest: { title: "Released title <unsafe>", summary: "Released summary", release: { number: 1 }, revision: { content_hash: "hash" }, claims: [{ statement: "Declared claim", epistemic_level: "Hypothesis", origin: "author_originated" }], sources: [{ external_uri: "https://example.org/source", locator: null, relation: "supports" }] } }, body: "Complete **released** body.\n\n[Local page](/blog)\n\n<script>alert('unsafe')</script>\n\n[Unsafe](javascript:alert)" };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(writing.fetchWritingDelivery).mockResolvedValue(source);
  vi.mocked(distribution.fetchDistributionCopies).mockResolvedValue([]);
});

describe("published writing distribution", () => {
  it("exports the full immutable text with safe formatting, claims, sources, and canonical link", () => {
    const exported = writingExport("work-1", 1, source);
    expect(exported.html).toContain("<strong>released</strong>");
    expect(exported.html).toContain("Released title &lt;unsafe&gt;");
    expect(exported.html).not.toContain("<script>");
    expect(exported.html).not.toContain("javascript:");
    expect(exported.html).toContain('href="https://dotheory.org/blog"');
    expect(exported.markdown).toContain(source.body);
    expect(exported.markdown).toContain("Declared claim");
    expect(exported.markdown).toContain("https://example.org/source");
    expect(exported.document).toContain('rel="canonical" href="https://dotheory.org/writing/work-1/releases/1"');
    expect(() => writingExport("work-1", 2, source)).toThrow();
    expect(() => writingExport("work-1", 1, { ...source, delivery: { ...source.delivery, withdrawn: true } })).toThrow();
  });

  it("offers complete text and three publishing destinations even if private copy records fail", async () => {
    vi.mocked(distribution.fetchDistributionCopies).mockRejectedValue(new Error("Unavailable"));
    render(<WritingDistribution workId="work-1" number={1} />);
    expect(await screen.findByRole("button", { name: "Copy complete piece" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Substack" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Export and inspect the complete piece"));
    expect((screen.getByLabelText("Complete published text") as HTMLTextAreaElement).value).toContain("Complete **released** body.");
    fireEvent.click(screen.getByRole("button", { name: "Medium" }));
    expect(screen.getByRole("link", { name: "Open Medium editor" })).toHaveAttribute("href", "https://medium.com/p/import");
    expect(writing.fetchWritingDelivery).toHaveBeenCalledWith("work-1", 1, expect.any(AbortSignal));
  });

  it("requires checking an uncertain share and does not expose an automatic retry", async () => {
    render(<WritingDistribution workId="work-1" number={1} automaticResult={{ platform: "linkedin", status: "needs_review", external_url: null, error_code: "outcome_unknown" }} />);
    await screen.findByRole("button", { name: "Copy complete piece" });
    fireEvent.click(screen.getByRole("button", { name: "LinkedIn" }));
    expect(screen.getByText(/Check LinkedIn before sharing again/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Share released link on LinkedIn" })).not.toBeInTheDocument();
    expect(distribution.shareReleasedWritingOnLinkedIn).not.toHaveBeenCalled();
  });
});
