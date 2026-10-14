import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("orchestrator URLs behind the local proxy", () => {
  it.each(["/__dot-api", "https://api.example.test"])("preserves paths and query parameters for %s", async base => {
    vi.stubEnv("VITE_ORCHESTRATOR_URL", base);
    const fetchMock = vi.fn().mockImplementation(async () => Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
    const { fetchPublicDeliveryManifest } = await import("./OrchestratorPublicationService");
    const { fetchFootprintGraphSnapshot, fetchFootprintImports } = await import("./OrchestratorGraphService");
    await fetchPublicDeliveryManifest("fixture-owner", "fixture-book", { version: 2 });
    await fetchFootprintGraphSnapshot({ platform: "fixture", kind: "source" });
    await fetchFootprintImports({ connector: "fixture", limit: 5 });
    const root = new URL(base, window.location.origin).href.replace(/\/$/, "");
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${root}/v1/publications/delivery/fixture-owner/fixture-book/manifest?version=2`,
      `${root}/v1/graph/snapshot?platform=fixture&kind=source`,
      `${root}/v1/graph/imports?connector=fixture&limit=5`,
    ]);
  });
});
