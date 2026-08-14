import { findPath, positionOf } from "./readingPaths";

export const READING_PATH_PROGRESS_STORAGE_KEY =
  "dot.book-one.reading-path.v1";

export interface ReadingPathProgress {
  pathId: string;
  sectionSlug: string;
}

function isValidProgress(value: unknown): value is ReadingPathProgress {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<ReadingPathProgress>;
  if (
    typeof candidate.pathId !== "string" ||
    typeof candidate.sectionSlug !== "string"
  ) {
    return false;
  }

  const path = findPath(candidate.pathId);
  return path !== null && positionOf(path, candidate.sectionSlug) >= 0;
}

/** A reader's declared route stays on their device and contains no activity log. */
export function readReadingPathProgress(): ReadingPathProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(READING_PATH_PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidProgress(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveReadingPathProgress(
  pathId: string,
  sectionSlug: string,
): ReadingPathProgress | null {
  if (typeof window === "undefined") return null;

  const progress = { pathId, sectionSlug };
  if (!isValidProgress(progress)) return null;

  try {
    window.localStorage.setItem(
      READING_PATH_PROGRESS_STORAGE_KEY,
      JSON.stringify(progress),
    );
    return progress;
  } catch {
    return null;
  }
}

export function clearReadingPathProgress(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(READING_PATH_PROGRESS_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in hardened browsing contexts.
  }
}
