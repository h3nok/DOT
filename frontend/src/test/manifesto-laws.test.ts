import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * ADR-0004 as an executable gate.
 *
 * The manifesto laws are binding, but prose cannot fail a build. This scans the
 * frontend source for the mechanisms L2-L6 and L9 forbid.
 *
 * `QUARANTINE` lists violations that predate the gate. It is a ratchet: a new
 * violation fails, and a quarantined file that no longer violates *also* fails,
 * so the list can only shrink. Never add to it to make a build pass -- removing
 * the mechanism is the only sanctioned fix.
 */

const SRC = join(process.cwd(), "src");

interface Law {
  id: string;
  law: string;
  adr: string;
  why: string;
  pattern: RegExp;
}

// Patterns match code identifiers, not prose, so documentation and UI copy that
// *names* a forbidden mechanism in order to reject it does not trip the gate.
const LAWS: Law[] = [
  {
    id: "streaks",
    law: "L6",
    adr: "ADR-0004",
    why: "Streaks manufacture loss aversion.",
    pattern:
      /\b(currentStreak|longestStreak|incrementStreak|resetStreak|INCREMENT_STREAK|RESET_STREAK)\b/,
  },
  {
    id: "push-notifications",
    law: "L4",
    adr: "ADR-0004",
    why: "Interruption is architecturally forbidden; signals are pulled.",
    pattern:
      /new Notification\(|Notification\.requestPermission|\bPushManager\b|\.showNotification\(|pushManager\.subscribe/,
  },
  {
    id: "vanity-metrics",
    law: "L5",
    adr: "ADR-0004",
    why: "Public counters invite comparison.",
    pattern:
      /\b(followerCount|followers_count|likeCount|likes_count|viewCount|views_count|subscriberCount)\b/,
  },
  {
    id: "infinite-scroll",
    law: "L2",
    adr: "ADR-0004",
    why: "Everything must have a natural end.",
    pattern: /\b(InfiniteScroll|infiniteScroll|loadMoreOnScroll|autoPlayNext|autoplayNext)\b/,
  },
  {
    id: "behavioural-trackers",
    law: "L9",
    adr: "ADR-0004",
    why: "No third-party tracking or behavioural profiling.",
    pattern:
      /\bgtag\(|\bfbq\(|\bmixpanel\.|\bposthog\.|@segment\/|googletagmanager|amplitude\.(init|getInstance)/,
  },
];

/** Pre-existing violations, each awaiting a product change. Only ever shrinks. */
const QUARANTINE: { file: string; lawId: string; note: string }[] = [
  {
    file: "shared/contexts/ReadingContext.tsx",
    lawId: "streaks",
    note: "Reading streaks predate the gate. Removing them is a product change; see ADR-0004 L6.",
  },
];

const IGNORED_DIRS = new Set(["node_modules", "dist", "coverage", "assets"]);

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!IGNORED_DIRS.has(entry)) sourceFiles(full, found);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.tsx?$/.test(entry)) {
      found.push(full);
    }
  }
  return found;
}

function findViolations(): { file: string; lawId: string; law: Law }[] {
  const hits: { file: string; lawId: string; law: Law }[] = [];
  for (const file of sourceFiles(SRC)) {
    const contents = readFileSync(file, "utf8");
    const rel = relative(SRC, file).split(sep).join("/");
    for (const law of LAWS) {
      if (law.pattern.test(contents)) hits.push({ file: rel, lawId: law.id, law });
    }
  }
  return hits;
}

describe("manifesto laws (ADR-0004)", () => {
  const violations = findViolations();
  const quarantined = new Set(QUARANTINE.map((q) => `${q.file}::${q.lawId}`));

  it("introduces no new forbidden mechanism", () => {
    const unexpected = violations
      .filter((v) => !quarantined.has(`${v.file}::${v.lawId}`))
      .map(
        (v) =>
          `${v.file} violates ${v.law.law} (${v.law.adr}) via "${v.lawId}": ${v.law.why}`,
      );

    expect(
      unexpected,
      `Forbidden mechanism introduced. Remove it -- do not add it to QUARANTINE:\n${unexpected.join("\n")}`,
    ).toEqual([]);
  });

  it("keeps the quarantine list honest", () => {
    const live = new Set(violations.map((v) => `${v.file}::${v.lawId}`));
    const stale = QUARANTINE.filter((q) => !live.has(`${q.file}::${q.lawId}`)).map(
      (q) => `${q.file} (${q.lawId}) no longer violates -- delete it from QUARANTINE.`,
    );

    expect(stale, stale.join("\n")).toEqual([]);
  });
});
