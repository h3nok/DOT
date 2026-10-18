import library from "../../content/amm-library.json";
import { essayRoute } from "../../content/essays/essays";

/** One part of the manuscript, in the author's reading order. */
export interface AmmPart {
  slug: string;
  part: number;
  label: string;
  title: string;
  note: string;
  action: string;
  route: string;
}

/**
 * The manifesto is read in the author's fixed order: a contents list, not a
 * recommendation. Nothing here is ranked or personalised (L2, L3).
 */
export const AMM_PARTS: readonly AmmPart[] = library
  .flatMap(item => "part" in item && typeof item.part === "number"
    ? [{ slug: item.slug, part: item.part, label: item.partLabel, title: item.partTitle, note: item.partNote, action: item.partAction, route: essayRoute(item.slug) }]
    : [])
  .sort((a, b) => a.part - b.part);

export const ammPart = (slug?: string) => AMM_PARTS.find(part => part.slug === slug);

/** The part after `slug`, or the first part when `slug` is not in the order (a letter). */
export function nextAmmPart(slug?: string): AmmPart | undefined {
  const current = ammPart(slug);
  return current ? AMM_PARTS.find(part => part.part > current.part) : AMM_PARTS[0];
}

export function previousAmmPart(slug?: string): AmmPart | undefined {
  const current = ammPart(slug);
  return current ? [...AMM_PARTS].reverse().find(part => part.part < current.part) : undefined;
}
