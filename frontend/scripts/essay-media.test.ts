import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error -- shared plain ESM build pipeline.
import { essaysPlugin, readEssays } from "./essays.mjs";

const folders: string[] = [];
const png = readFileSync("public/og/henok-writing.png");
function workspace() {
  const dir = mkdtempSync(join(tmpdir(), "dot-post-media-"));
  folders.push(dir);
  return dir;
}
function post(dir: string, slug: string, { draft = false, cover = true, body = "The actual text." } = {}) {
  mkdirSync(join(dir, slug));
  copyFileSync("public/og/henok-writing.png", join(dir, slug, "cover.png"));
  writeFileSync(join(dir, slug, "unused.png"), png);
  writeFileSync(join(dir, `${slug}.md`), `---\ntitle: Publication check\nsummary: A layout fixture.\npublished: 2026-10-14\nlevels: [observation]\ndraft: ${draft}\n${cover ? `cover: ${slug}/cover.png\ncover_alt: The writing title card.\ncover_caption: A test image.` : ""}\n---\n\n${body}`);
}
afterEach(() => { for (const dir of folders.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe("post media release boundary", () => {
  it("resolves banners and inline reference images to one hashed asset with dimensions", () => {
    const dir = workspace();
    post(dir, "layout", { body: '![Writing artwork][art]\n\n[art]: layout/cover.png "Figure caption"\n\n```md\n![](missing.png)\n```' });
    const [essay] = readEssays({ dir });
    expect(essay.cover).toMatchObject({ alt: "The writing title card.", width: 1200, height: 630 });
    expect(essay.cover.src).toMatch(/^\/essay-media\/layout\/[a-f0-9]{12}-cover.png$/);
    expect(essay.images[essay.cover.src]).toEqual({ width: 1200, height: 630 });
    expect(essay.body).toContain(`![Writing artwork](${essay.cover.src} "Figure caption")`);
    expect(essay.body).toContain("![](missing.png)"); // A code example is not an image.
    expect(essay._assets).toHaveLength(1);
  });

  it("emits released text and referenced media, excluding drafts, unused media, and local paths", () => {
    const dir = workspace();
    post(dir, "released");
    post(dir, "unfinished", { draft: true });
    const plugin = essaysPlugin({ dir });
    plugin.config();
    const emitted: Array<{ fileName: string; source: string | Uint8Array }> = [];
    plugin.generateBundle.call({ emitFile: (asset: typeof emitted[number]) => emitted.push(asset) });
    expect(emitted.map((asset) => asset.fileName)).toEqual([
      "essays/released.md", expect.stringMatching(/^essay-media\/released\/.+-cover.png$/), "essays/index.json",
    ]);
    const index = JSON.parse(String(emitted.at(-1)!.source));
    expect(index.essays).toHaveLength(1);
    expect(index.essays[0]).not.toHaveProperty("_assets");
    expect(index.essays[0]).not.toHaveProperty("draft");
    expect(JSON.stringify(index)).not.toContain(dir);
  });

  it("serves a draft only through the development preview endpoints, including its images", () => {
    const dir = workspace();
    post(dir, "unfinished", { draft: true });
    const plugin = essaysPlugin({ dir });
    let middleware: (request: { url: string }, response: any, next: () => void) => void;
    plugin.configureServer({ middlewares: { use: (handler: typeof middleware) => { middleware = handler; } } });
    function request(url: string) {
      const result = { statusCode: 200, headers: {} as Record<string, string>, body: "", next: false,
        setHeader(key: string, value: string) { this.headers[key] = value; },
        end(body: string) { this.body = body; } };
      middleware({ url }, result, () => { result.next = true; });
      return result;
    }
    expect(request("/essays/unfinished.md").statusCode).toBe(404);
    expect(JSON.parse(request("/essays/index.json").body).essays).toEqual([]);
    const preview = request("/__essay-preview/index.json");
    const [essay] = JSON.parse(preview.body).essays;
    expect(preview.headers["X-Robots-Tag"]).toBe("noindex, nofollow");
    expect(request("/__essay-preview/unfinished.md").body).toBe("The actual text.");
    expect(request(essay.cover.src).statusCode).toBe(200);
    expect(request(essay.cover.src.replace("/__essay-preview/media", "/essay-media")).statusCode).toBe(404);
  });

  it.each([
    ["![](layout/cover.png)", /alt text/],
    ["![x](https://tracker.example/pixel.png)", /local PNG/],
    ["![x](layout/../secret.png)", /local PNG/],
    ["![x](other/cover.png)", /local PNG/],
    ["![x](layout/missing.png)", /cannot read image/],
  ])("rejects invalid image source or description: %s", (body, error) => {
    const dir = workspace();
    post(dir, "layout", { cover: false, body });
    expect(() => readEssays({ dir })).toThrow(error);
  });

  it("rejects escaped symlinks, oversized assets, and disguised files", () => {
    const dir = workspace();
    const outside = workspace();
    post(dir, "layout");
    writeFileSync(join(outside, "private.png"), png);
    rmSync(join(dir, "layout", "cover.png"));
    symlinkSync(join(outside, "private.png"), join(dir, "layout", "cover.png"));
    expect(() => readEssays({ dir })).toThrow(/outside the essays folder/);
    rmSync(join(dir, "layout", "cover.png"));
    writeFileSync(join(dir, "layout", "cover.png"), Buffer.alloc(751 * 1024));
    expect(() => readEssays({ dir })).toThrow(/exceeds 750 KB/);
    writeFileSync(join(dir, "layout", "cover.png"), "<svg><script>alert(1)</script></svg>");
    expect(() => readEssays({ dir })).toThrow(/readable image|file extension/);
  });
});
