import { afterEach, describe, expect, it, vi } from "vitest";

async function load(base = "") {
  vi.resetModules();
  vi.stubEnv("DEV", false);
  vi.stubEnv("VITE_ORCHESTRATOR_URL", base);
  return import("./OrchestratorPeopleService");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("people service release boundary", () => {
  it("rejects through promises without sending invitation tokens or member data to a static host", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const service = await load();
    const invitation = service.checkInvitation("private-invitation-token");
    expect(invitation).toBeInstanceOf(Promise);
    await expect(invitation).rejects.toThrow("The invitation service is unavailable.");
    await expect(service.findMember("reader@example.org")).rejects.toThrow("The people service is unavailable.");
    await expect(service.fetchMembers()).rejects.toThrow("The people service is unavailable.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("checks an invitation only at the configured API without credentials or referrer", async () => {
    const result = { valid: true, invited_by: "A member", expires_at: null };
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(result)));
    vi.stubGlobal("fetch", fetch);
    const service = await load("https://api.example.org/");
    const signal = new AbortController().signal;
    await expect(service.checkInvitation("private/token+#", signal)).resolves.toEqual(result);
    expect(fetch).toHaveBeenCalledWith("https://api.example.org/v1/auth/invites/check?token=private%2Ftoken%2B%23", {
      signal, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer",
    });
  });

  it("keeps configured member lookup authenticated and out of URL parameters", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ members: [] })));
    vi.stubGlobal("fetch", fetch);
    const service = await load("https://api.example.org");
    await expect(service.findMember("reader@example.org")).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith("https://api.example.org/v1/auth/members/find", expect.objectContaining({
      method: "POST", credentials: "include", cache: "no-store",
      body: JSON.stringify({ email: "reader@example.org" }),
      headers: { "Content-Type": "application/json" },
    }));
  });
});
