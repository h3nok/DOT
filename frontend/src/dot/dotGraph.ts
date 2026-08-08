import type { DotNode } from "./types";

export const DOT_DEVELOPMENT_STATEMENT =
  "The Development and Application of a Big Theory of Everything (TOE)";

export const dotGraph: DotNode = {
  id: "dot",
  label: "Digital Organism Theory",
  kind: "self",
  introduction: DOT_DEVELOPMENT_STATEMENT,
  description: "See how Fear governs your choices, and how Love helps you choose consciously.",
  body: "Book One presents DOT as a construction, not a revelation: a framework for consciousness, conditioning, and conscious authorship whose observations, models, hypotheses, and speculation must remain distinguishable.",
  children: [
    {
      id: "canon",
      label: "Book One",
      kind: "page",
      description: "Read Consciousness: A Digital Organism",
      actionLabel: "Begin reading",
      surface: "publications",
      href: "/book/digital-organism-theory",
      relation: "defines",
      // The one action under the nucleus. Not a ring dot as well.
      primary: true,
    },
    {
      id: "theory",
      label: "Concept Map",
      kind: "page",
      description: "Trace the book's concepts, see where each claim stops, and examine what remains open",
      href: "/doctrine",
      relation: "defines",
    },
    {
      id: "practice",
      label: "Practice",
      kind: "page",
      description: "Use the book's ideas through teaching and exercises",
      relation: "applies",
      planned: true,
    },
    {
      id: "applied",
      label: "Applied",
      kind: "page",
      description: "See what the book still owes, and follow the work being done",
      href: "/applied",
      relation: "applies",
    },
    {
      id: "movement",
      label: "The Movement",
      kind: "page",
      description: "Enter through contribution, stewardship, and support",
      relation: "leads-to",
      planned: true,
      children: [
        {
          id: "henok",
          label: "Henok",
          kind: "self",
          description: "Steward",
          surface: "support",
          relation: "contrasts",
        },
      ],
    },
  ],
};
