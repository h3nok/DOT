import { chapterRoute } from "../../content/ammModel";

export const POWER_ROUTE = "/amm/power";
export const REFLECT_ROUTE = "/amm/reflect";
export const FIGURES_ROUTE = "/amm/figures";
/** The diagnosis, where the book develops it. */
export const DIAGNOSIS_ADDRESS = `${chapterRoute(3)}#3-the-inversion-in-practice`;

/** Sections of earlier pages (the money guide, Capital and power, How power works, Organized Power), by the anchors they used. */
const SECTION: Record<string, string> = {
  culture: "organized-power", structure: "organized-power", power: "organized-power", "part-one": "organized-power", function: "organized-power",
  capital: "wealth", holders: "equity", "ownership-loop": "equity", administration: "savings", "part-three": "savings",
  "money-flow": "income", chain: "income", detachment: "income", drain: "income",
  housing: "housing", "everyday-payments": "necessity", interfaces: "necessity", "part-two": "necessity", public: "necessity",
  borrowing: "choices", leech: "powers", platforms: "powers", knowledge: "powers",
  assault: "enters", host: "enters", tests: "next", alternatives: "next", sources: "sources",
};
const PAGE: Record<string, string> = { "/amm/money/ownership": "equity", "/amm/money/alternatives": "next" };
/** Organized Power's screens that live on as figures; every other screen is Chapter Two. */
const FIGURES = new Set(["wealth", "equity", "savings", "housing", "sources"]);

/**
 * Where an earlier address now opens (the author, 2026-11-18): a chart opens its
 * figure; everything else about organized power opens Chapter Two.
 */
export function powerAddress(pathname: string, hash: string): string {
  const path = pathname.replace(/\/+$/, "");
  const key = hash.slice(1);
  const anchor = path === POWER_ROUTE ? key : SECTION[key] ?? PAGE[path];
  return anchor && FIGURES.has(anchor) ? `${FIGURES_ROUTE}#${anchor}` : chapterRoute(2);
}
