import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_SAVED_ENVIRONMENTS,
  SAVED_ENVIRONMENTS_KEY,
  loadEnvironments,
  matchSavedEnvironment,
  normaliseName,
  persistEnvironments,
  removeEnvironment,
  upsertEnvironment,
  type SavedEnvironment,
} from "./savedEnvironments";
import { DEFAULT_CONFIG, type OrganismConfig } from "./types";

function environment(
  name: string,
  config: Partial<OrganismConfig> = {},
): Omit<SavedEnvironment, "id" | "savedAt"> {
  return { name, base: "dark", config: { ...DEFAULT_CONFIG, ...config } };
}

describe("saved environments", () => {
  beforeEach(() => window.localStorage.clear());

  it("keeps one entry per name so refining is not collecting", () => {
    const once = upsertEnvironment([], environment("Night", { readingScale: 1.12 }));
    const twice = upsertEnvironment(once, environment("night", { readingScale: 1.26 }));

    expect(twice).toHaveLength(1);
    expect(twice[0].config.readingScale).toBe(1.26);
    // The rewritten entry keeps its identity and position.
    expect(twice[0].id).toBe(once[0].id);
    expect(twice[0].name).toBe("night");
  });

  it("refuses to store a name that is only whitespace", () => {
    expect(upsertEnvironment([], environment("   "))).toHaveLength(0);
    expect(normaliseName("  deep    focus  ")).toBe("deep focus");
  });

  it("stops at the cap rather than growing without bound", () => {
    let entries: SavedEnvironment[] = [];
    for (let i = 0; i < MAX_SAVED_ENVIRONMENTS + 4; i += 1) {
      entries = upsertEnvironment(entries, environment(`Environment ${i}`));
    }
    expect(entries).toHaveLength(MAX_SAVED_ENVIRONMENTS);
  });

  it("round-trips through storage", () => {
    const entries = upsertEnvironment([], environment("Vellum at night", { tint: 44 }));
    persistEnvironments(entries);

    const loaded = loadEnvironments();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe("Vellum at night");
    expect(loaded[0].config.tint).toBe(44);
    expect(loaded[0].base).toBe("dark");
  });

  it("survives an environment saved before a control existed", () => {
    // A reader's named environment must outlive the shape that wrote it: fill
    // the fields it never knew about rather than discarding the entry.
    window.localStorage.setItem(
      SAVED_ENVIRONMENTS_KEY,
      JSON.stringify([
        { id: "old", name: "Legacy", base: "light", config: { preset: "plexus", tint: 999 } },
      ]),
    );

    const [loaded] = loadEnvironments();
    expect(loaded.name).toBe("Legacy");
    expect(loaded.config.preset).toBe("aurora"); // renamed field, still resolves
    expect(loaded.config.tint).toBe(279); // 999 normalised onto the wheel
    expect(loaded.config.readingMeasure).toBe(DEFAULT_CONFIG.readingMeasure);
    expect(loaded.config.paperTone).toBe(DEFAULT_CONFIG.paperTone);
  });

  it("drops unusable entries without losing the usable ones", () => {
    window.localStorage.setItem(
      SAVED_ENVIRONMENTS_KEY,
      JSON.stringify([null, { name: "" }, "nonsense", { name: "Keep me", base: "dark" }]),
    );

    const loaded = loadEnvironments();
    expect(loaded.map((entry) => entry.name)).toEqual(["Keep me"]);
  });

  it("returns nothing rather than throwing on unparseable storage", () => {
    window.localStorage.setItem(SAVED_ENVIRONMENTS_KEY, "{ not json");
    expect(loadEnvironments()).toEqual([]);
  });

  it("recognises the environment the reader is currently looking at", () => {
    const entries = upsertEnvironment([], environment("Mine", { tint: 300 }));
    const config = { ...DEFAULT_CONFIG, tint: 300 };

    expect(matchSavedEnvironment(entries, config, "dark")).toBe(entries[0].id);
    // Same values under the other base is a different environment.
    expect(matchSavedEnvironment(entries, config, "light")).toBeNull();
    // Any drift and the panel stops claiming it.
    expect(matchSavedEnvironment(entries, { ...config, tint: 301 }, "dark")).toBeNull();
  });

  it("forgets an environment by id", () => {
    const entries = upsertEnvironment(
      upsertEnvironment([], environment("One")),
      environment("Two"),
    );
    const left = removeEnvironment(entries, entries[0].id);

    expect(left.map((entry) => entry.name)).toEqual(["Two"]);
  });
});
