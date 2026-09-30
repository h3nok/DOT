/**
 * Essays — the reading side (ADR-0033).
 *
 * Sources are Markdown files in this folder (see `_template.md`). The build
 * publishes each released essay as `/essays/<slug>.md` beside an index
 * (`scripts/essays.mjs`), the same shape Book One's manifest and sections take.
 * This module only ever sees what was released: drafts never leave the build.
 */

export type EssayClaimLevel = "observation" | "model" | "hypothesis" | "speculation";

export interface EssaySummary {
  slug: string;
  title: string;
  summary: string;
  /** YYYY-MM-DD */
  published: string;
  /** YYYY-MM-DD of the last substantive revision, if any. */
  updated: string | null;
  levels: EssayClaimLevel[];
  /** Concept-map ids the essay builds on. */
  concepts: string[];
  words: number;
  readingMinutes: number;
}

interface EssayIndex {
  schema: "dot.essays.v1";
  essays: EssaySummary[];
}

export const ESSAYS_ROUTE = "/essays";
export const FEED_URL = "/feed.xml";

/**
 * Whether any essay is released, fixed at build time from the essays folder,
 * so no page has to ask the network before deciding to show an Essays link.
 */
export const ESSAYS_PUBLISHED: boolean =
  typeof __DOT_ESSAYS_PUBLISHED__ === "boolean" ? __DOT_ESSAYS_PUBLISHED__ : false;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const essayRoute = (slug: string) => `${ESSAYS_ROUTE}/${slug}`;

function essayAsset(name: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}essays/${name}`.replace(/\/{2,}/g, "/");
}

/** Every released essay, newest first. An absent index means none yet. */
export async function fetchEssayIndex(signal?: AbortSignal): Promise<EssaySummary[]> {
  const response = await fetch(essayAsset("index.json"), { cache: "no-cache", signal });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`Essay index request failed: ${response.status}`);
  const index = (await response.json()) as EssayIndex;
  return index.essays;
}

/** An essay's text, or null when no released essay has that address. */
export async function fetchEssayText(
  slug: string,
  signal?: AbortSignal,
): Promise<string | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  const response = await fetch(essayAsset(`${slug}.md`), { cache: "no-cache", signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Essay request failed: ${response.status}`);
  return response.text();
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/** "2026-10-14" -> "October 14, 2026", the same everywhere in the world. */
export const formatEssayDate = (isoDate: string) =>
  DATE_FORMAT.format(new Date(`${isoDate}T00:00:00Z`));
