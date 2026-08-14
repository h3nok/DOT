import type { AgentLens } from "../../../dot/agent";

export type HeroAskRequest = {
  query: string;
  lens: AgentLens;
};

/** Four openings: the claim, the reader, the weak point, the epistemic status. */
export const SAMPLE_QUESTIONS: ReadonlyArray<{
  text: string;
  category: string;
  lens: AgentLens;
}> = [
  { text: "What does DOT actually claim?", category: "Core Claim", lens: "ground" },
  { text: "What does 'digital' mean here?", category: "Definition", lens: "ground" },
  { text: "Where is the argument weakest?", category: "Critique", lens: "test" },
  { text: "Is this science, philosophy, or faith?", category: "Foundations", lens: "test" },
];

type ClaimLevel = "observation" | "model" | "hypothesis";

export interface Concept {
  id: string;
  term: string;
  text: string;
  level: ClaimLevel;
}

export const HERO_CONCEPTS: ReadonlyArray<Concept> = [
  {
    id: "home.concept.organism",
    term: "The Digital Organism",
    text: "A state-bearing, information-sensitive process that works to preserve or develop its coherence across change.",
    level: "model",
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
    text: "The Canvas carries. The Painting interprets. Character acts.",
    level: "model",
  },
  {
    id: "home.concept.rest",
    term: "The First Painting",
    text: "You were shaped by your environment, yet you must choose within your available decision space.",
    level: "observation",
  },
  {
    id: "home.concept.fear",
    term: "Fear",
    text: "The governing contraction that organizes perception around defense, control, and the preservation of identity at the expense of truth.",
    level: "model",
  },
  {
    id: "home.concept.love",
    term: "Love",
    text: "The condition in which Fear no longer governs you. Not a mood added to the loop — the operating condition that makes inquiry harder to corrupt.",
    level: "model",
  },
  {
    id: "home.concept.intent",
    term: "Intent",
    text: "The directional organization of Little c before action. Clarity matters without requiring magic.",
    level: "model",
  },
  {
    id: "home.concept.frame",
    term: "Reality Frame",
    text: "A rule-bound environment in which action meets consequence. Consequence is what gives experience weight.",
    level: "model",
  },
  {
    id: "home.concept.bigc",
    term: "Big C and Little c",
    text: "Life as a fundamental, self-preserving process, differentiated into local centres of experience. Held as hypothesis, not finding.",
    level: "hypothesis",
  },
  {
    id: "home.concept.lok",
    term: "The Limit of Knowledge",
    text: "A restraint on certainty — not permission to fill the unknown with whatever story we prefer.",
    level: "model",
  },
];

export const DWELL_MS = 6000;
