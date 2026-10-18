import { afterEach, describe, expect, it, vi } from "vitest";

const { authedFetch } = vi.hoisted(() => ({ authedFetch: vi.fn() }));
vi.mock("./orchestratorHttp", () => ({ authedFetch }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
  vi.resetModules();
});

async function setup(preview: boolean, development: boolean) {
  vi.resetModules();
  vi.stubEnv("DEV", development);
  vi.stubEnv("VITE_CONTACT_PREVIEW", String(preview));
  vi.stubEnv("VITE_ORCHESTRATOR_URL", "https://normal-api.example");
  const fetch = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ available: true, status: "received", reference: "inq_test" }))));
  vi.stubGlobal("fetch", fetch);
  return { service: await import("./OrchestratorContactService"), fetch };
}

describe("contact intake destination", () => {
  it("uses opted-in preview intake without credentials and leaves the private inbox on its normal API", async () => {
    const { service, fetch } = await setup(true, true);
    await service.fetchContactStatus();
    await service.sendContactMessage({ purpose: "general", name: "Visitor", email: "visitor@example.org", message: "An example inquiry.", organization: "", timeline: "", budget: "", consent: true, website: "" }, "test-submission-reference");
    expect(fetch).toHaveBeenNthCalledWith(1, "/__dot-contact/v1/contact/status", expect.objectContaining({ credentials: "omit" }));
    expect(fetch).toHaveBeenNthCalledWith(2, "/__dot-contact/v1/contact/messages", expect.objectContaining({ credentials: "omit", method: "POST", headers: expect.objectContaining({ "Idempotency-Key": "test-submission-reference" }) }));
    authedFetch.mockResolvedValue(new Response(JSON.stringify({ messages: [], has_more: false, page: 1 })));
    await service.fetchContactInbox(1, "");
    expect(authedFetch).toHaveBeenCalledWith("https://normal-api.example/v1/contact/inbox?page=1", expect.objectContaining({ sessionOnly: true }));
  });

  it.each([[false, true], [true, false]])("uses the normal API with preview=%s and development=%s", async (preview, development) => {
    const { service, fetch } = await setup(preview, development);
    await service.fetchContactStatus();
    expect(fetch).toHaveBeenCalledWith("https://normal-api.example/v1/contact/status", expect.objectContaining({ credentials: "omit" }));
  });
});
