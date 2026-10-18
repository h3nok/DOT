import { afterEach, describe, expect, it, vi } from "vitest";
import { authedFetch } from "./orchestratorHttp";
import { emptyPresentation, releaseSavedWriting, saveWritingSnapshot } from "./OrchestratorWritingService";
vi.mock("./orchestratorHttp", () => ({ authedFetch: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const draft = { title: "Supplied text", summary: "", body: "Manuscript.", presentation: emptyPresentation(), assets: [{ path: "figure.png", src: "blob:private-preview", width: 1600, height: 900, bytes: 120, data_base64: "uploaded-bytes" }] };
describe("atomic publication requests", () => {
  it("saves one private snapshot using the signed session and retry identity", async () => {
    vi.mocked(authedFetch).mockResolvedValueOnce(Response.json({ id: "revision-2", revision_number: 2 }));
    await saveWritingSnapshot("work-1", draft, [], "request-id", "revision-1");
    expect(authedFetch).toHaveBeenCalledTimes(1);
    expect(authedFetch).toHaveBeenCalledWith(expect.stringContaining("/works/work-1/drafts"), expect.objectContaining({ sessionOnly: true, json: expect.objectContaining({ request_id: "request-id", base_revision_id: "revision-1", assets: [{ path: "figure.png", data_base64: "uploaded-bytes" }] }) }));
  });
  it("publishes exactly the reviewed revision without saving a new one", async () => {
    vi.mocked(authedFetch).mockResolvedValueOnce(Response.json({ release_number: 2, release_status: "released" }));
    expect(await releaseSavedWriting("work-1", "revision-2")).toMatchObject({ release_number: 2 });
    expect(authedFetch).toHaveBeenCalledTimes(1);
    expect(authedFetch).toHaveBeenCalledWith(expect.stringContaining("/works/work-1/releases"), expect.objectContaining({ sessionOnly: true, json: { revision_id: "revision-2", visibility: "public" } }));
  });
  it("preserves actionable conflict messages", async () => {
    vi.mocked(authedFetch).mockResolvedValueOnce(Response.json({ detail: "A newer draft has been saved." }, { status: 409 }));
    await expect(saveWritingSnapshot("work-1", draft, [], "request", null)).rejects.toThrow("A newer draft");
  });
});
