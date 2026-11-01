import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error -- plain ESM shared with Vite's configuration.
import { bookV5PreviewPlugin } from "./book-v5-preview.mjs";

type Response = { statusCode: number; setHeader: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> };
type Middleware = (request: { url: string; method: string }, response: Response, next: () => void) => Promise<void>;
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });

async function setup() {
  const root = await mkdtemp(path.join(tmpdir(), "dot-book-v5-preview-"));
  directories.push(root);
  const proof = path.join(root, "proof");
  await mkdir(path.join(proof, "sections"), { recursive: true });
  await mkdir(path.join(proof, "cover"));
  await writeFile(path.join(proof, "cover", "cover-v5-web.webp"), "web-cover");
  await writeFile(path.join(proof, "manifest.json"), '{"edition":5}');
  await writeFile(path.join(root, "private.md"), "Outside the proof");
  await symlink(path.join(root, "private.md"), path.join(proof, "sections", "escaped.md"));
  const plugin = bookV5PreviewPlugin(proof);
  let handler!: Middleware;
  plugin.configureServer({ middlewares: { use: (middleware: Middleware) => { handler = middleware; } } });
  async function request(url: string, method = "GET") {
    const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn() };
    const next = vi.fn();
    await handler({ url, method }, response, next);
    return { response, next };
  }
  return { plugin, request };
}

describe("unpublished book proof middleware", () => {
  it("runs only in development and leaves other routes alone", async () => {
    const { plugin, request } = await setup();
    expect(plugin.apply).toBe("serve");
    const { response, next } = await request("/publications/henok/digital-organism-theory/v4/manifest.json");
    expect(next).toHaveBeenCalledOnce();
    expect(response.end).not.toHaveBeenCalled();
  });

  it("serves explicit proof files without indexing or caching", async () => {
    const { request } = await setup();
    const { response } = await request("/_book-v5/manifest.json");
    expect(response.statusCode).toBe(200);
    expect(response.end.mock.calls[0][0].toString()).toBe('{"edition":5}');
    expect(response.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(response.setHeader).toHaveBeenCalledWith("X-Robots-Tag", "noindex, nofollow, noarchive");
    const head = await request("/_book-v5/manifest.json", "HEAD");
    expect(head.response.end).toHaveBeenCalledWith(undefined);
    const cover = await request("/_book-v5/cover/cover-v5-web.webp");
    expect(cover.response.statusCode).toBe(200);
    expect(cover.response.setHeader).toHaveBeenCalledWith("Content-Type", "image/webp");
  });

  it("rejects traversal, non-proof files, malformed escapes, and symlink escapes", async () => {
    const { request } = await setup();
    for (const url of ["../private.md", "%2e%2e/private.md", "sections/%2e%2e/%2e%2e/private.md", "sections/escaped.md", ".env", "manuscript.docx"]) {
      const { response } = await request(`/_book-v5/${url}`);
      expect(response.statusCode).toBe(404);
      expect(response.end.mock.calls.flat().join()).not.toContain("Outside the proof");
    }
    expect((await request("/_book-v5/%zz")).response.statusCode).toBe(400);
  });

  it("rejects mutations", async () => {
    const { request } = await setup();
    for (const method of ["POST", "PUT", "DELETE"]) {
      const { response } = await request("/_book-v5/manifest.json", method);
      expect(response.statusCode).toBe(405);
      expect(response.setHeader).toHaveBeenCalledWith("Allow", "GET, HEAD");
    }
  });
});
