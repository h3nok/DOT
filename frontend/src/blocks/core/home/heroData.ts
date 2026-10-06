import type { AgentLens } from "../../../dot/agent";

export type HeroAskRequest = {
  query: string;
  lens: AgentLens;
};

type ClaimLevel = "observation" | "model" | "hypothesis";

/** A part of the hero architecture a concept explains; the diagram brings it forward. */
export type ArchitecturePartId = "te" | "big-c" | "rf0" | "rfn" | "little-c";

export interface Concept {
  id: string;
  term: string;
  text: string;
  level: ClaimLevel;
  part?: ArchitecturePartId;
}

export const HERO_CONCEPTS: ReadonlyArray<Concept> = [
  {
    id: "home.concept.organism",
    term: "The Digital Organism",
    text: "DOT proposes that you are not physical: a conscious process that receives this world through a body. Digital means informational, not electronic.",
    level: "hypothesis",
  },
  {
    id: "home.concept.feeling",
    term: "The Subjective Data Principle",
    text: "Feeling must be treated as data, but feeling is not automatically truth.",
    level: "observation",
  },
  {
    id: "home.concept.layers",
    term: "Canvas · Painting · Character",
    text: "Consequential experience is etched onto your Canvas. What accumulates there, your Painting, interprets what comes next. Character is that Painting made visible in how you act.",
    level: "model",
  },
  {
    id: "home.concept.rest",
    term: "The First Painting",
    text: "Family, culture, and early experience shape how you see before you can examine it. What you inherit is a starting point, not a final verdict.",
    level: "observation",
  },
  {
    id: "home.concept.fear",
    term: "Fear",
    text: "When protecting your identity matters more than seeing clearly, Fear governs. Perception narrows around defence and control.",
    level: "model",
  },
  {
    id: "home.concept.love",
    term: "Love",
    text: "Love is the condition in which Fear no longer governs you. It takes form in truthful, caring relationships that respect agency and boundaries.",
    level: "model",
  },
  {
    id: "home.concept.intent",
    term: "Intent",
    text: "The direction you form before you act. It shapes your next choice within what the world allows; it is not a magical override of physical law.",
    level: "model",
  },
  {
    id: "home.concept.source",
    term: "T × E: The Source",
    text: "Continuity (T) and possibility (E). DOT takes them as the source: the conditions within which consciousness first arose.",
    level: "hypothesis",
    part: "te",
  },
  {
    id: "home.concept.primordial",
    term: "Big C: Primordial Consciousness",
    text: "Consciousness that emerged within T × E and began maintaining itself. It develops Reality Frames, and each Little c carries its process.",
    level: "hypothesis",
    part: "big-c",
  },
  {
    id: "home.concept.rf0",
    term: "RF₀: Where Physics Governs",
    text: "Our physical universe, one Reality Frame among many. DOT proposes it as the place to stabilize your own consciousness before exploring other realities.",
    level: "model",
    part: "rf0",
  },
  {
    id: "home.concept.rfn",
    term: "RFₙ: Every Reality Frame",
    text: "The generalization: each Reality Frame Big C develops has its own rules. A stabilized consciousness can explore them, expanding its decision space.",
    level: "hypothesis",
    part: "rfn",
  },
  {
    id: "home.concept.littlec",
    term: "Little c: You",
    text: "A downstream, local implementation of Big C’s own process: you receive a world through a body, form Intent, act, and live with what follows.",
    level: "hypothesis",
    part: "little-c",
  },
  {
    id: "home.concept.lok",
    term: "The Limit of Knowledge",
    text: "A restraint on certainty — not permission to fill the unknown with whatever story we prefer.",
    level: "model",
  },
];
