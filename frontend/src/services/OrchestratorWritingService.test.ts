import { afterEach, describe, expect, it, vi } from "vitest";
import { authedFetch } from "./orchestratorHttp";
import { releaseWriting, type WritingClaim } from "./OrchestratorWritingService";

vi.mock("./orchestratorHttp", () => ({ authedFetch: vi.fn() }));
afterEach(() => vi.resetAllMocks());

const draft = { title: "Author-supplied text", summary: "", body: "The manuscript." };
const claim: WritingClaim = { statement: "A sourced claim", level: "Observation", origin: "sourced", source: "https://example.org/source" };

describe("releaseWriting", () => {
  it("freezes text, annotates the author-declared claim and source, then explicitly releases", async () => {
    vi.mocked(authedFetch)
      .mockResolvedValueOnce(Response.json({ id: "revision-1" }))
      .mockResolvedValueOnce(Response.json({ id: "claim-1" }))
      .mockResolvedValueOnce(Response.json({ id: "source-1" }))
      .mockResolvedValueOnce(Response.json({ release_number: 1, release_status: "released" }));
    expect(await releaseWriting("work-1", draft, [claim])).toEqual({ release_number: 1, release_status: "released" });
    const calls = vi.mocked(authedFetch).mock.calls;
    expect(calls.map(([url]) => String(url).split("/v1/academy")[1])).toEqual([
      "/works/work-1/revisions", "/revisions/revision-1/claims", "/revisions/revision-1/sources", "/works/work-1/releases",
    ]);
    expect(calls[3][1]?.json).toEqual({ revision_id: "revision-1", visibility: "public" });
  });

  it("does not publish when source attachment fails", async () => {
    vi.mocked(authedFetch).mockResolvedValueOnce(Response.json({ id: "revision-1" })).mockResolvedValueOnce(Response.json({ id: "claim-1" })).mockResolvedValueOnce(new Response("Source rejected", { status: 422 }));
    await expect(releaseWriting("work-1", draft, [claim])).rejects.toThrow("Source rejected");
    expect(authedFetch).toHaveBeenCalledTimes(3);
  });

  it("refuses unclassified or unsourced input before making requests", async () => {
    await expect(releaseWriting("work-1", draft, [])).rejects.toThrow("Every material claim");
    await expect(releaseWriting("work-1", draft, [{ ...claim, source: "" }])).rejects.toThrow("Every material claim");
    expect(authedFetch).not.toHaveBeenCalled();
  });
});