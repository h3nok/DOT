import { describe, expect, it } from "vitest";

import author from "../src/content/author.json";
import { BANNER_SAFE_AREA, buildChannelAssets } from "./render-channel-kit.mjs";

describe("YouTube channel artwork", () => {
  it("produces upload-sized banner, avatar, thumbnails, and a still title card", () => {
    const assets = buildChannelAssets(author);
    expect(assets.map(({ name, width, height }) => [name, width, height])).toEqual([
      ["banner", 2560, 1440],
      ["avatar", 800, 800],
      ["thumbnail-introduction", 1280, 720],
      ["thumbnail-concepts", 1280, 720],
      ["thumbnail-open-questions", 1280, 720],
      ["splash", 1920, 1080],
      ["book-background", 1400, 2000],
    ]);
    expect(assets[0].maxBytes).toBe(6_000_000);
    expect(assets.slice(1).every((asset) => asset.maxBytes <= 2_000_000)).toBe(true);
  });

  it("uses a conservative centre safe area based on YouTube's minimum-size specification", () => {
    const ratio = 2560 / 2048;
    expect(BANNER_SAFE_AREA.width).toBeLessThan(1235 * ratio);
    expect(BANNER_SAFE_AREA.height).toBeLessThan(338 * ratio);
    expect(BANNER_SAFE_AREA.x + BANNER_SAFE_AREA.width / 2).toBe(1280);
    expect(BANNER_SAFE_AREA.y + BANNER_SAFE_AREA.height / 2).toBe(720);
  });

  it("exports valid, accessible SVG without outside requests or motion", () => {
    for (const asset of buildChannelAssets(author)) {
      const document = new DOMParser().parseFromString(asset.svg, "image/svg+xml");
      expect(document.querySelector("parsererror"), asset.name).toBeNull();
      expect(document.documentElement.getAttribute("viewBox")).toBe(`0 0 ${asset.width} ${asset.height}`);
      expect(document.querySelector("title")?.textContent).toBe(asset.name);
      expect(document.querySelector("desc")?.textContent).toBeTruthy();
      expect(document.querySelector("[data-essential]")).not.toBeNull();
      expect(document.querySelector("script, foreignObject, animate, animateTransform, image")).toBeNull();
      for (const reference of document.querySelectorAll("[href]")) {
        expect(reference.getAttribute("href")).toBe("#nucleus");
      }
    }
  });

  it("takes the author credit from the same record as the About page", () => {
    const assets = buildChannelAssets(author);
    const credit = `${author.name}, ${author.suffix}`;
    expect(assets.find((asset) => asset.name === "banner")?.svg).toContain(credit);
    expect(assets.find((asset) => asset.name === "splash")?.svg).toContain(credit);
    const replacement = buildChannelAssets({ name: "Example Author", suffix: "" });
    expect(replacement[0].svg).toContain("Example Author");
    expect(replacement[0].svg).not.toContain(author.name);
    expect(replacement[0].svg).not.toContain("PhD");
  });

  it("escapes author text rather than interpreting it as SVG markup", () => {
    const svg = buildChannelAssets({ name: "<Example & Author>", suffix: "PhD" })[0].svg;
    expect(svg).toContain("&lt;Example &amp; Author&gt;, PhD");
    expect(new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("parsererror")).toBeNull();
  });

  it("fails explicitly on missing or empty author data", () => {
    expect(() => buildChannelAssets({ name: "", suffix: "PhD" })).toThrow("must not be empty");
    expect(() => buildChannelAssets({ name: "Example Author" })).toThrow("suffix must be a string");
  });

  it("keeps hypothetical imagery and unanswered questions honest", () => {
    const assets = buildChannelAssets(author);
    expect(assets.find((asset) => asset.name === "thumbnail-introduction")?.svg).toContain("not a measured physical structure");
    expect(assets.find((asset) => asset.name === "thumbnail-open-questions")?.svg).toContain("inquiry, not certainty");
    expect(assets.some((asset) => /youtube\.com|youtu\.be|subscribe now|scientifically proven/i.test(asset.svg))).toBe(false);
  });
});
