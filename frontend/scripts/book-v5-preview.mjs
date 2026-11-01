import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = { ".json": "application/json", ".md": "text/plain", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".pdf": "application/pdf" };

/** Local proof assets never enter public/ or the production build (ADR-0057). */
export function bookV5PreviewPlugin(root) {
  root ??= fileURLToPath(new URL("../.book-v5-preview/", import.meta.url));
  return {
    name: "dot-book-v5-local-proof",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const raw = (request.url || "").split("?")[0];
        if (!raw.startsWith("/_book-v5/")) return next();
        response.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        if (!["GET", "HEAD"].includes(request.method || "")) {
          response.statusCode = 405;
          response.setHeader("Allow", "GET, HEAD");
          return response.end();
        }
        let relative;
        try { relative = decodeURIComponent(raw.slice("/_book-v5/".length)); }
        catch { response.statusCode = 400; return response.end(); }
        if (!/^(?:manifest\.json|sections\/[a-z0-9-]+\.md|figures\/[a-z0-9-]+\.(?:svg|png)|cover\/[a-z0-9-]+\.(?:svg|png|webp)|[a-zA-Z0-9-]+\.pdf)$/.test(relative)) {
          response.statusCode = 404;
          return response.end();
        }
        try {
          const actualRoot = await realpath(root);
          const target = await realpath(path.join(actualRoot, relative));
          if (!target.startsWith(actualRoot + path.sep)) {
            response.statusCode = 404;
            return response.end();
          }
          const bytes = await readFile(target);
          response.setHeader("Content-Type", TYPES[path.extname(target)] || "application/octet-stream");
          response.setHeader("Content-Length", bytes.byteLength);
          return response.end(request.method === "HEAD" ? undefined : bytes);
        } catch {
          response.statusCode = 404;
          return response.end("Build the version 5 web proof with make book-v5-web.");
        }
      });
    },
  };
}
