export const POWER_ROUTE = "/amm/power";
/** The framework's six sections, in order; their headings come from the page copy's "glance" list. */
export const POWER_SECTIONS = ["power", "assault", "chain", "interfaces", "holders", "detachment"] as const;

/** Sections of earlier pages (the money guide, then Capital and power), by the anchors they used. */
const SECTION: Record<string, string> = {
  "money-flow": "chain", "everyday-payments": "interfaces", "ownership-loop": "chain", culture: "power", capital: "chain",
  chain: "chain", interfaces: "interfaces", holders: "holders", structure: "power", tests: "tests",
  "part-one": "power", "part-two": "interfaces", "part-three": "holders", administration: "holders", detachment: "detachment",
  housing: "housing", borrowing: "borrowing", platforms: "platforms", knowledge: "knowledge", public: "public", alternatives: "alternatives", sources: "sources",
};
const PAGE: Record<string, string> = { "/amm/money/ownership": "chain", "/amm/money/alternatives": "alternatives" };

export function powerAddress(pathname: string, hash: string): string {
  const anchor = SECTION[hash.slice(1)] ?? PAGE[pathname.replace(/\/+$/, "")];
  return `${POWER_ROUTE}${anchor ? `#${anchor}` : ""}`;
}
