import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Script } from "node:vm";
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
