// Stay — brand definition.
//
// Stay is the foundational technology of the DOT movement and its first use
// case: a calm presence + publishing platform built to increase coherence,
// not harvest attention. Its public theory surfaces stay subordinate to the
// released book and preserve the book's claim boundaries.

export interface BrandPaletteSwatch {
  id: string;
  name: string;
  value: string;
  role: string;
}

export const stayBrand = {
  name: "Stay",
  parent: "A DOT movement technology",
  essence: "Hold your form.",
  tagline: "Presence that doesn't fragment you.",
  positioning:
    "Stay is the foundational technology of the DOT movement: a calm presence and publishing platform built to increase coherence — not to harvest attention.",
  // The first concrete use case Stay ships as.
  firstUseCase:
    "A source-backed founder profile, Book One reader, and concept map that grow into durable profiles, immutable publication releases, private knowledge, and trusted circles — without feeds, ads, or vanity counters.",
  voice: [
    "Calm, not loud. Stay never manufactures urgency.",
    "Plain and exact. It names what it will not claim.",
    "Durable over disposable. Memory, not inventory.",
    "Coherence over capture. No feeds, ranks, or vanity counts.",
  ],
  // The mark keeps the observer visible inside a bounded Reality Frame.
  // Duotone always: ink/paper plus a single signal accent.
  markMeaning:
    "The observer held in view inside a bounded Reality Frame.",
  refusals: [
    "No ads or sponsored placement.",
    "No infinite feed or algorithmic ranking.",
    "No vanity metrics, follower counts, or streaks.",
    "No dark patterns or manufactured urgency.",
  ],
  accents: [
    {
      id: "verdigris",
      name: "Verdigris",
      value: "#00a896",
      role: "Default signal",
    },
    { id: "cobalt", name: "Cobalt", value: "#2563eb", role: "Calm focus" },
    { id: "gold", name: "Gold", value: "#d97706", role: "Warm signal" },
    { id: "carmine", name: "Carmine", value: "#dc2626", role: "Vital signal" },
    {
      id: "graphite",
      name: "Graphite",
      value: "#52525b",
      role: "Quiet / neutral",
    },
  ] satisfies BrandPaletteSwatch[],
  neutrals: [
    { id: "ink", name: "Ink", value: "#101415", role: "Primary text (light)" },
    {
      id: "obsidian",
      name: "Obsidian",
      value: "#040404",
      role: "Deep surface (dark)",
    },
    {
      id: "porcelain",
      name: "Porcelain",
      value: "#fbfdfc",
      role: "Reading paper (light)",
    },
    {
      id: "mist",
      name: "Mist",
      value: "#eaf2f1",
      role: "Quiet surface (light)",
    },
  ] satisfies BrandPaletteSwatch[],
} as const;

export type StayBrand = typeof stayBrand;
