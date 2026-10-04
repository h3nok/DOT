import type { AgentLens } from "../../../dot/agent";

export type HeroAskRequest = {
  query: string;
  lens: AgentLens;
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
    text: "A process that responds to information while maintaining or developing its coherence: how well its parts work together through change.",
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
    text: "Your body carries experience. Your learned interpretations give it meaning. Character is how you act within what you can see and choose.",
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
    id: "home.concept.frame",
    term: "Reality Frame",
    text: "A world with stable rules and real consequences. DOT proposes RF₀, our physical universe, as an environment for Little c to live and develop.",
    level: "model",
  },
  {
    id: "home.concept.bigc",
    term: "Big C and Little c",
    text: "DOT proposes Big C as the conscious source of worlds, and Little c as a local experiencer. A hypothesis, not an established finding.",
    level: "hypothesis",
  },
  {
    id: "home.concept.lok",
    term: "The Limit of Knowledge",
    text: "A restraint on certainty — not permission to fill the unknown with whatever story we prefer.",
    level: "model",
  },
];
