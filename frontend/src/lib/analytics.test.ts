import { afterEach, describe, expect, it, vi } from "vitest";

async function load(env: Record<string, string> = {}) {
  vi.resetModules();
  vi.stubEnv("VITE_PLAUSIBLE_DOMAIN", "");
  vi.stubEnv("VITE_PLAUSIBLE_SRC", "");
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import("./analytics");
}

function browser(address = "https://dotheory.org/book/digital-organism-theory?private=value#contents") {
  let location = new URL(address);
  const events = new EventTarget();
  const fetch = vi.fn().mockResolvedValue(new Response("", { status: 202 }));
  const storage = { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn(), removeItem: vi.fn() };
  const navigator = { doNotTrack: "", globalPrivacyControl: false, webdriver: false };
  const history = {
    pushState: vi.fn((_state: unknown, _title: string, value?: string | URL | null) => { if (value) location = new URL(value, location); }),
    replaceState: vi.fn((_state: unknown, _title: string, value?: string | URL | null) => { if (value) location = new URL(value, location); }),
  };
  const win = { get location() { return location; }, navigator, localStorage: storage, history, fetch, addEventListener: vi.fn(events.addEventListener.bind(events)) };
  const doc = { defaultView: win, referrer: "https://example.org/article?email=private@example.org#note" } as unknown as Document;
  return { win, doc, fetch, storage, navigator, history, events };
}

afterEach(() => vi.unstubAllEnvs());

describe("pageview-only readership", () => {
  it("stays absent without configuration and on local or unrelated hosts", async () => {
    const b = browser();
    expect((await load()).initAnalytics(b.doc)).toBe(false);
    const { initAnalytics } = await load({ VITE_PLAUSIBLE_DOMAIN: "dotheory.org" });
    for (const address of ["http://localhost:5222/", "https://preview.example.org/", "https://notdotheory.org/"]) {
      const local = browser(address);
      expect(initAnalytics(local.doc)).toBe(false);
      expect(local.fetch).not.toHaveBeenCalled();
    }
    expect(b.fetch).not.toHaveBeenCalled();
  });

  it("sends only the four pageview fields, without credentials or URL secrets", async () => {
    const b = browser();
    const { initAnalytics } = await load({ VITE_PLAUSIBLE_DOMAIN: "dotheory.org" });
    expect(initAnalytics(b.doc)).toBe(true);
    expect(initAnalytics(b.doc)).toBe(false);
    expect(b.fetch).toHaveBeenCalledTimes(1);
    const [url, request] = b.fetch.mock.calls[0];
    expect(url).toBe("https://plausible.io/api/event");
    expect(JSON.parse(request.body)).toEqual({ name: "pageview", url: "https://dotheory.org/book/digital-organism-theory", domain: "dotheory.org", referrer: "https://example.org" });
    expect(request).toMatchObject({ credentials: "omit", referrerPolicy: "no-referrer", headers: { "Content-Type": "text/plain" } });
    expect(b.storage.setItem).not.toHaveBeenCalled();
    expect(b.storage.removeItem).not.toHaveBeenCalled();
    expect(b.win.addEventListener.mock.calls.map(([event]) => event)).toEqual(["popstate"]);
  });

  it("counts public navigation while ignoring fragment/query changes and private paths", async () => {
    const b = browser();
    (await load({ VITE_PLAUSIBLE_DOMAIN: "dotheory.org" })).initAnalytics(b.doc);
    b.history.pushState({}, "", "/book/digital-organism-theory#other");
    b.history.replaceState({}, "", "/book/digital-organism-theory?path=example");
    expect(b.fetch).toHaveBeenCalledTimes(1);
    for (const path of ["/_preview/book-v5", "/studio/writing", "/invite/private-token", "/readers/leave?token=secret"]) b.history.pushState({}, "", path);
    expect(b.fetch).toHaveBeenCalledTimes(1);
    b.history.pushState({}, "", "/book/digital-organism-theory/the-canvas");
    expect(b.fetch).toHaveBeenCalledTimes(2);
    b.history.replaceState({}, "", "/about/");
    expect(b.fetch).toHaveBeenCalledTimes(3);
    b.events.dispatchEvent(new Event("popstate"));
    expect(b.fetch).toHaveBeenCalledTimes(3);
    b.events.dispatchEvent(new Event("scroll"));
    b.events.dispatchEvent(new Event("visibilitychange"));
    expect(b.fetch).toHaveBeenCalledTimes(3);
  });

  it("honors privacy preferences and the existing opt-out without writing storage", async () => {
    const { initAnalytics } = await load({ VITE_PLAUSIBLE_DOMAIN: "dotheory.org" });
    for (const preference of ["doNotTrack", "globalPrivacyControl", "webdriver", "optOut"]) {
      const b = browser();
      if (preference === "doNotTrack") b.navigator.doNotTrack = "1";
      else if (preference === "optOut") b.storage.getItem.mockReturnValue("true");
      else b.navigator[preference as "globalPrivacyControl" | "webdriver"] = true;
      expect(initAnalytics(b.doc)).toBe(false);
      expect(b.fetch).not.toHaveBeenCalled();
      expect(b.storage.setItem).not.toHaveBeenCalled();
    }
  });

  it("accepts HTTPS self-hosting and refuses invalid configuration", async () => {
    const b = browser();
    (await load({ VITE_PLAUSIBLE_DOMAIN: "dotheory.org", VITE_PLAUSIBLE_SRC: "https://analytics.example.org/js/pa-site.js" })).initAnalytics(b.doc);
    expect(b.fetch.mock.calls[0][0]).toBe("https://analytics.example.org/api/event");
    for (const source of ["http://analytics.example.org/script.js", "https://user:secret@example.org/script.js", "not-a-url"]) {
      const bad = browser();
      expect((await load({ VITE_PLAUSIBLE_DOMAIN: "dotheory.org", VITE_PLAUSIBLE_SRC: source })).initAnalytics(bad.doc)).toBe(false);
    }
    expect((await load({ VITE_PLAUSIBLE_DOMAIN: "https://dotheory.org" })).initAnalytics(browser().doc)).toBe(false);
  });

  it("never interrupts navigation when measurement fails", async () => {
    const b = browser();
    b.fetch.mockRejectedValue(new Error("Blocked"));
    (await load({ VITE_PLAUSIBLE_DOMAIN: "dotheory.org" })).initAnalytics(b.doc);
    expect(() => b.history.pushState({}, "", "/about")).not.toThrow();
    expect(b.win.location.pathname).toBe("/about");
    await Promise.resolve();
  });
});
