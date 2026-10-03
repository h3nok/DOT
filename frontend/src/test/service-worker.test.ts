import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Script, createContext } from "node:vm";
import { describe, expect, it } from "vitest";

/**
 * `public/sw.js` is copied to the build verbatim. Nothing imports it, no
 * bundler parses it, and `tsc` and ESLint both skip it — so it is the one
 * shipped file where a syntax error reaches production silently.
 *
 * It did. A stray `});` closed the `fetch` listener early and orphaned the
 * static-asset branch, and the worker failed to install on every visit from
 * commit b3ed05a until this test existed. Registration is wrapped in `.catch`
 * (main.tsx), which is correct for a worker that genuinely cannot start and is
 * also what kept the breakage invisible: offline caching was simply absent.
 *
 * Compiling it is the cheapest possible check and would have caught it.
 */

const SW = join(process.cwd(), "public/sw.js");

describe("service worker", () => {
  const source = readFileSync(SW, "utf8");

  it("parses, so it can actually install", () => {
    // `Script` compiles without executing — no service worker globals needed.
    expect(() => new Script(source, { filename: "sw.js" })).not.toThrow();
  });

  it("registers each lifecycle listener exactly once", () => {
    // The orphaned block left two `});` for one `addEventListener`, which is
    // how the file came apart. A duplicate handler is the other direction of
    // the same mistake: two `fetch` listeners both calling `respondWith` throws
    // at runtime, where only the user sees it.
    for (const event of ["install", "activate", "fetch"]) {
      const occurrences = source.split(`self.addEventListener("${event}"`).length - 1;
      expect(occurrences, `${event} listener count`).toBe(1);
    }
  });

  it("keeps the caches it names in step with the caches it clears", () => {
    // `activate` deletes every cache not in the current set. A cache that is
    // written but never listed is evicted on the next activation, which reads
    // as "offline works, then randomly stops".
    const named = new Set(
      [...source.matchAll(/const (\w*CACHE\w*) = "([^"]+)"/g)].map((m) => m[2]),
    );
    expect(named.size).toBeGreaterThan(0);

    for (const used of source.matchAll(/caches\.open\((\w+)\)/g)) {
      const constName = used[1];
      const declared = new RegExp(`const ${constName} = "([^"]+)"`).exec(source);
      expect(declared, `caches.open(${constName}) has no matching constant`).not.toBeNull();
      expect(named.has(declared![1])).toBe(true);
    }
  });
});

/**
 * Run the real worker against a fake network and cache, and ask what a reader
 * would be served. Chapter and essay URLs do not change when their text does,
 * so a cached copy must never win over a reachable network: an earlier version
 * served cached chapters first, forever.
 */
function loadWorker() {
  const listeners: Record<string, (event: unknown) => void> = {};
  const cached = { status: 200, body: "cached text", clone: () => cached };
  const fresh = { status: 200, body: "fresh text", clone: () => fresh };
  let online = true;
  const context = createContext({
    self: {
      location: { origin: "https://dotheory.org" },
      addEventListener: (type: string, listener: (event: unknown) => void) => {
        listeners[type] = listener;
      },
      skipWaiting: () => Promise.resolve(),
      clients: { claim: () => Promise.resolve() },
    },
    caches: {
      match: () => Promise.resolve(cached),
      open: () => Promise.resolve({ put: () => Promise.resolve(), addAll: () => Promise.resolve() }),
      keys: () => Promise.resolve([]),
      delete: () => Promise.resolve(true),
    },
    fetch: () => (online ? Promise.resolve(fresh) : Promise.reject(new TypeError("offline"))),
    URL,
    console: { log: () => undefined },
  });
  new Script(readFileSync(SW, "utf8")).runInContext(context);

  const serve = (path: string) =>
    new Promise<{ body: string }>((resolve, reject) => {
      listeners.fetch({
        request: { url: `https://dotheory.org${path}`, method: "GET", mode: "cors", destination: "" },
        respondWith: (response: Promise<{ body: string }>) => response.then(resolve, reject),
      });
    });
  return { serve, goOffline: () => (online = false) };
}

describe("service worker: released text", () => {
  const released = [
    "/publications/henok/digital-organism-theory/v4/sections/preface.md",
    "/essays/index.json",
    "/essays/fear-narrows.md",
    "/feed.xml",
  ];

  it("serves the current text whenever the network answers", async () => {
    const { serve } = loadWorker();
    for (const path of released) {
      expect((await serve(path)).body, path).toBe("fresh text");
    }
  });

  it("still serves the last copy it kept when offline", async () => {
    const { serve, goOffline } = loadWorker();
    goOffline();
    for (const path of released) {
      expect((await serve(path)).body, path).toBe("cached text");
    }
  });
});
