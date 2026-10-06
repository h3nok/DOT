/**
 * What each part of the architecture is, and how firmly it is held. The hero
 * diagram's explorer reads this; statuses match the theory sections below it.
 */
export type ArchitecturePartId = "te" | "big-c" | "rf0" | "rf1" | "rf2" | "rfn" | "little-c";

export interface ArchitecturePart {
  id: ArchitecturePartId;
  label: string;
  status: string;
  /** What governs this part, where the model says anything about it. */
  rules?: string;
  summary: string;
  href: string;
  more: string;
}

const OTHER_FRAME = {
  status: "Hypothesis",
  rules: "Its own rules, distinct from the physics that governs RF₀.",
  href: "#reality-frame",
  more: "What DOT says about Reality Frames",
} as const;

export const ARCHITECTURE_PARTS: readonly ArchitecturePart[] = [
  {
    id: "te",
    label: "T · E",
    status: "Starting assumption",
    summary: "Continuity (T) and possibility (E): the conditions within which Big C is proposed to have emerged.",
    href: "#possibility-field",
    more: "Read about T · E",
  },
  {
    id: "big-c",
    label: "Big C",
    status: "Proposed explanation",
    summary: "The proposed first conscious organism. It emerged within T × E and began maintaining itself. It develops Reality Frames, each with its own rules, RF₀ among them, and carries its process into each Little c.",
    href: "#big-c",
    more: "Read about Big C",
  },
  {
    id: "rf0",
    label: "RF₀",
    status: "Observed universe; proposed origin and purpose",
    rules: "Physics: the measurable laws of nature. Every body, yours included, is bound by them.",
    summary: "The physical universe, and the Reality Frame you live in now. It hosts many Little c, who meet only through it. DOT proposes its purpose: a stable, high-fidelity place to stabilize your own consciousness, so that you can go on to explore other realities and expand your decision space.",
    href: "#reality-frame",
    more: "Read about RF₀",
  },
  {
    id: "rf1",
    label: "RF₁",
    ...OTHER_FRAME,
    summary: "Another reality Big C develops, under rules of its own. DOT proposes that a Little c who has stabilized its consciousness can explore it, widening the space of choices open to it.",
  },
  {
    id: "rf2",
    label: "RF₂",
    ...OTHER_FRAME,
    summary: "A further Reality Frame. Each frame’s rules are its own, so each opens a different space of possible decisions; the patterns drawn inside only mark that they differ.",
  },
  {
    id: "rfn",
    label: "RFₙ",
    ...OTHER_FRAME,
    summary: "And onward: Big C’s Reality Frames are not limited to these. The more stable your consciousness, the further it can go.",
  },
  {
    id: "little-c",
    label: "Little c",
    status: "Proposed local experiencer",
    summary: "You, c₁, one among many. Each Little c is proposed as a downstream, local implementation of Big C’s own process: it receives RF₀ through a body, forms Intent, acts, and lives with what follows. As it stabilizes its consciousness, its decision space expands.",
    href: "#little-c",
    more: "Read about Little c",
  },
];
