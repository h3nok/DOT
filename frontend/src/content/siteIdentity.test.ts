import { describe, expect, it } from "vitest";
import { siteConfig } from "./site.config";

/**
 * Author identity as an executable gate.
 *
 * Four public surfaces (HomePage, BookLanding, BookAccessPage, BookOnePage)
 * attribute the work by linking `siteConfig.social.linkedin`. Placeholder
 * handles once shipped to all four, so a broken profile link is a silent
 * public-facing failure that no other test catches.
 *
 * These assert properties rather than mirroring the config values, so they
 * catch drift without failing on a legitimate profile change.
 */

const GITHUB_OWNER = "h3nok";

// Handles that were invented rather than verified. They must never come back.
const PLACEHOLDER_HANDLES = ["hghebrechristos"];

const collectUrls = (value: unknown): string[] => {
  if (typeof value === "string") {
    return value.startsWith("http") ? [value] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectUrls);
  }
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectUrls);
  }
  return [];
};

describe("site identity", () => {
  it("exposes only well-formed https profile links", () => {
    const social = Object.entries(siteConfig.social);
    expect(social.length).toBeGreaterThan(0);

    for (const [network, href] of social) {
      expect(href, `${network} must be an absolute URL`).toMatch(/^https:\/\//);
      expect(() => new URL(href), `${network} must parse`).not.toThrow();
    }
  });

  it("attributes the book to a LinkedIn profile, not a bare domain", () => {
    const profile = new URL(siteConfig.social.linkedin);

    expect(profile.hostname).toMatch(/(^|\.)linkedin\.com$/);
    expect(profile.pathname).toMatch(/^\/in\/[^/]+/);
  });

  it("points every GitHub link at the canonical owner", () => {
    const githubUrls = collectUrls(siteConfig).filter((href) =>
      new URL(href).hostname.endsWith("github.com"),
    );

    expect(githubUrls.length).toBeGreaterThan(0);

    for (const href of githubUrls) {
      const [owner] = new URL(href).pathname.replace(/^\//, "").split("/");
      expect(owner, `${href} must belong to ${GITHUB_OWNER}`).toBe(GITHUB_OWNER);
    }
  });

  it("keeps unverified placeholder handles out of the config", () => {
    const serialized = JSON.stringify(siteConfig).toLowerCase();

    for (const handle of PLACEHOLDER_HANDLES) {
      expect(serialized).not.toContain(handle);
    }
  });
});
