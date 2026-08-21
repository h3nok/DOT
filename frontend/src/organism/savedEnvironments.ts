import {
  DEFAULT_CONFIG,
  resolveOrganismConfig,
  type OrganismConfig,
} from "./types";

/**
 * Environments the reader made.
 *
 * The built-in presets are six answers we thought were good. This is the
 * reader's own: once they have tuned ground, accent, face, measure, and tone
 * into something they want to come back to, they can name it and keep it. That
 * is the difference between a settings panel and a place someone stays.
 *
 * Saving is deliberately whole-config rather than partial. A named environment
 * should restore what the reader was actually looking at when they saved it,
 * including the reading settings the built-in presets leave alone.
 *
 * Per manifesto L7 these are as easy to remove as to make, and they are local
 * to the browser — an appearance is a preference, not a profile to be collected.
 */

export const SAVED_ENVIRONMENTS_KEY = "dot_environments";

/** Enough for anyone with an intent; low enough that storage stays small. */
export const MAX_SAVED_ENVIRONMENTS = 12;

export const MAX_ENVIRONMENT_NAME = 32;

export interface SavedEnvironment {
  id: string;
  name: string;
  /** The light/dark base, which lives in the theme rather than the config. */
  base: "light" | "dark";
  config: OrganismConfig;
  savedAt: string;
}

/** Trim, collapse whitespace, and cap. Returns "" for a name we won't store. */
export function normaliseName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_ENVIRONMENT_NAME);
}

/**
 * Rebuild a config from storage, field by field.
 *
 * Saved environments outlive the shape that wrote them: a reader who names one
 * today should still be able to load it after a preset is renamed or a control
 * is added. Anything unrecognised falls back to the default for that field
 * rather than invalidating the whole environment.
 */
function reviveConfig(raw: unknown): OrganismConfig {
  return resolveOrganismConfig(raw);
}

function reviveEnvironment(raw: unknown): SavedEnvironment | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Partial<SavedEnvironment>;
  const name = typeof entry.name === "string" ? normaliseName(entry.name) : "";
  if (!name) return null;
  return {
    id: typeof entry.id === "string" && entry.id ? entry.id : createId(),
    name,
    base: entry.base === "dark" ? "dark" : "light",
    config: reviveConfig(entry.config),
    savedAt: typeof entry.savedAt === "string" ? entry.savedAt : "",
  };
}

export function loadEnvironments(): SavedEnvironment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_ENVIRONMENTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(reviveEnvironment)
      .filter((entry): entry is SavedEnvironment => entry !== null)
      .slice(0, MAX_SAVED_ENVIRONMENTS);
  } catch {
    return [];
  }
}

export function persistEnvironments(entries: SavedEnvironment[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SAVED_ENVIRONMENTS_KEY,
      JSON.stringify(entries.slice(0, MAX_SAVED_ENVIRONMENTS)),
    );
  } catch {
    /* storage unavailable — the environment lives for this session only */
  }
}

/**
 * Add or replace by name.
 *
 * Saving over a name the reader already used is an edit, not a duplicate: they
 * are refining "Night", not collecting three of them. The rewritten entry keeps
 * its position so the list does not reshuffle under the pointer.
 */
export function upsertEnvironment(
  entries: readonly SavedEnvironment[],
  next: Omit<SavedEnvironment, "id" | "savedAt">,
): SavedEnvironment[] {
  const name = normaliseName(next.name);
  if (!name) return [...entries];

  const savedAt = new Date().toISOString();
  const existing = entries.findIndex(
    (entry) => entry.name.toLowerCase() === name.toLowerCase(),
  );

  if (existing >= 0) {
    const replaced = [...entries];
    replaced[existing] = { ...replaced[existing], ...next, name, savedAt };
    return replaced;
  }

  return [...entries, { ...next, name, id: createId(), savedAt }].slice(
    0,
    MAX_SAVED_ENVIRONMENTS,
  );
}

export function removeEnvironment(
  entries: readonly SavedEnvironment[],
  id: string,
): SavedEnvironment[] {
  return entries.filter((entry) => entry.id !== id);
}

/** Which saved environment the reader is currently looking at, if any. */
export function matchSavedEnvironment(
  entries: readonly SavedEnvironment[],
  config: OrganismConfig,
  base: "light" | "dark",
): string | null {
  const keys = Object.keys(DEFAULT_CONFIG) as Array<keyof OrganismConfig>;
  const match = entries.find(
    (entry) =>
      entry.base === base && keys.every((key) => entry.config[key] === config[key]),
  );
  return match?.id ?? null;
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `env-${Math.random().toString(36).slice(2, 10)}`;
}
