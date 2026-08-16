import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * ADR-0024 permits counting readers and still forbids profiling them. These
 * tests hold both halves: the counter works when configured, stays completely
 * absent when it is not, and never grows a way to identify anyone.
 */

// The module reads import.meta.env at import time, so each case stubs the
// environment and then imports it fresh.
async function loadAnalytics(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import("./analytics");
}

afterEach(() => {
  vi.unstubAllEnvs();
  document.head.querySelectorAll("script[data-dot-analytics]").forEach((s) => s.remove());
  delete (window as typeof window & { plausible?: unknown }).plausible;
});

describe("analytics", () => {
  it("stays absent when no domain is configured", async () => {
    const { initAnalytics, ANALYTICS_DOMAIN } = await loadAnalytics();

    expect(ANALYTICS_DOMAIN).toBeNull();
    expect(initAnalytics(document)).toBe(false);
    expect(document.querySelector("script[data-dot-analytics]")).toBeNull();
  });

  it("injects one deferred counter bound to the configured domain", async () => {
    const { initAnalytics } = await loadAnalytics({
      VITE_PLAUSIBLE_DOMAIN: "dotheory.org",
    });

    expect(initAnalytics(document)).toBe(true);

    const script = document.querySelector<HTMLScriptElement>("script[data-dot-analytics]");
    expect(script).not.toBeNull();
    expect(script!.getAttribute("data-domain")).toBe("dotheory.org");
    expect(script!.defer).toBe(true);
    expect(script!.src).toBe("https://plausible.io/js/script.js");
  });

  it("does not count a pageview twice when init runs again", async () => {
    const { initAnalytics } = await loadAnalytics({
      VITE_PLAUSIBLE_DOMAIN: "dotheory.org",
    });

    expect(initAnalytics(document)).toBe(true);
    expect(initAnalytics(document)).toBe(false);
    expect(document.querySelectorAll("script[data-dot-analytics]")).toHaveLength(1);
  });

  it("refuses a URL where a bare hostname belongs", async () => {
    // A pasted "https://dotheory.org" would silently count nothing, so it must
    // read as unconfigured rather than as configured-and-broken.
    const { initAnalytics, ANALYTICS_DOMAIN } = await loadAnalytics({
      VITE_PLAUSIBLE_DOMAIN: "https://dotheory.org",
    });

    expect(ANALYTICS_DOMAIN).toBeNull();
    expect(initAnalytics(document)).toBe(false);
  });

  it("accepts a self-hosted instance only over HTTPS", async () => {
    const secure = await loadAnalytics({
      VITE_PLAUSIBLE_DOMAIN: "dotheory.org",
      VITE_PLAUSIBLE_SRC: "https://analytics.example.com/js/script.js",
    });
    expect(secure.initAnalytics(document)).toBe(true);
    expect(
      document.querySelector<HTMLScriptElement>("script[data-dot-analytics]")!.src,
    ).toBe("https://analytics.example.com/js/script.js");

    document.head.querySelectorAll("script[data-dot-analytics]").forEach((s) => s.remove());

    const insecure = await loadAnalytics({
      VITE_PLAUSIBLE_DOMAIN: "dotheory.org",
      VITE_PLAUSIBLE_SRC: "http://analytics.example.com/js/script.js",
    });
    expect(insecure.initAnalytics(document)).toBe(false);
  });

  it("initializes the current site-specific tracker snippet", async () => {
    const { initAnalytics } = await loadAnalytics({
      VITE_PLAUSIBLE_DOMAIN: "dotheory.org",
      VITE_PLAUSIBLE_SRC: "https://plausible.io/js/pa-EXAMPLE.js",
    });

    expect(initAnalytics(document)).toBe(true);
    const plausible = (
      window as typeof window & {
        plausible?: { o?: Record<string, unknown> };
      }
    ).plausible;
    expect(plausible?.o).toEqual({});
  });

  it("never reaches for an identifier (ADR-0024, ADR-0004 L9)", async () => {
    // A source scan, in the spirit of manifesto-laws.test.ts: the guarantee is
    // that no per-person record exists, so the one file allowed to measure must
    // never touch device storage or identity.
    const source = readFileSync(join(process.cwd(), "src/lib/analytics.ts"), "utf8");
    // Comments go first: the file explains at length which mechanisms it avoids,
    // and naming one in order to reject it is not using it.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    const forbidden =
      /\b(localStorage|sessionStorage|document\.cookie|indexedDB|fingerprint|userId|user_id|deviceId)\b/;

    expect(forbidden.test(code)).toBe(false);
  });
});
