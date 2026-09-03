import type { AgentLens } from "../../../dot/agent";

export type HeroAskRequest = {
  query: string;
  lens: AgentLens;
};

export interface HeroArgument {
  id: string;
  stance: string;
  text: string;
}

export const HERO_TYPE_INTERVAL_MS = 22;

export const HERO_ARGUMENT: HeroArgument = {
  id: "home.argument.subjective-data",
  stance: "The first discipline",
  text: "Feeling must be treated as data — but feeling is not automatically truth.",
};

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
    text: "A generated, rule-bound environment whose invariants the physical sciences formalize. Consequence gives experience weight.",
    level: "model",
  },
  {
    id: "home.concept.bigc",
    term: "Big C and Little c",
    text: "Fundamental consciousness differentiates local centres of experience and develops Reality Frames. A public hypothesis; DOT's governing postulate.",
    level: "hypothesis",
  },
  {
    id: "home.concept.lok",
    term: "The Limit of Knowledge",
    text: "A restraint on certainty — not permission to fill the unknown with whatever story we prefer.",
    level: "model",
  },
];
