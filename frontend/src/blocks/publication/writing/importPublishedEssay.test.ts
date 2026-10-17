import { afterEach, describe, expect, it, vi } from "vitest";
import { importPublishedEssay, proposeChapterOneRevision } from "./importPublishedEssay";

afterEach(() => vi.unstubAllGlobals());
describe("AMM source adoption", () => {
  it("imports exact published text and banner bytes using portable paths", async () => {
    const slug = "amm-chapter-three-the-host-and-the-infection";
    const src = `/essay-media/${slug}/hash-cover.webp`;
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith("index.json")) return Response.json({ essays: [{ slug, title: "Original", summary: "Summary", published: "2026-10-15", updated: null, series: "The American Millennial Manifesto", levels: ["model"], concepts: [], cover: { src, alt: "Supplied artwork" }, images: { [src]: { width: 1600, height: 900 } } }] });
      if (url.endsWith(".md")) return new Response(`Exact words.\n\n![Supplied artwork](${src})`);
      return new Response(new Uint8Array([1, 2, 3]));
    });
    vi.stubGlobal("fetch", fetcher);
    const draft = await importPublishedEssay(slug);
    expect(draft.body).toBe(`Exact words.\n\n![Supplied artwork](${slug}/hash-cover.webp)`);
    expect(draft.assets?.[0].data_base64).toBe("AQID");
    expect(draft.presentation?.cover?.path).toBe(`${slug}/hash-cover.webp`);
    expect(fetcher.mock.calls.every(call => !String(call[0]).startsWith("https://"))).toBe(true);
  });
  it("proposes two specific passages without overwriting an already edited opening", () => {
    const original = "The Leech is not a race. Original framing.\n\nAn unchanged paragraph.\n\nI do not locate the Leech in any race, ethnicity, or faith. More original framing.";
    const revised = proposeChapterOneRevision(original);
    expect(revised).toContain("Western empire");
    expect(revised).toContain("An unchanged paragraph.");
    expect(() => proposeChapterOneRevision(revised)).toThrow(/already changed/);
  });
});
