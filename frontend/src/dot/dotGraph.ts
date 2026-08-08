import type { DotNode } from "./types";

export const dotGraph: DotNode = {
  id: "dot",
  label: "Digital Organism Theory",
  kind: "self",
  description: "Love is the condition in which Fear no longer governs you",
  body: "Book One presents DOT as a construction, not a revelation: a framework for consciousness, conditioning, and conscious authorship whose observations, models, hypotheses, and speculation must remain distinguishable.",
  children: [
    {
      id: "canon",
      label: "Book One",
      kind: "page",
      description: "Consciousness: A Digital Organism",
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
      description: "Book One concepts, claim boundaries, and open debts",
      href: "/doctrine",
      relation: "defines",
    },
    {
      id: "practice",
      label: "Practice",
      kind: "page",
      description: "Teaching and exercises drawn from the book",
      relation: "applies",
      planned: true,
    },
    {
      id: "applied",
      label: "Applied",
      kind: "page",
      description: "What the book still owes, and the work recorded against it",
      href: "/applied",
      relation: "applies",
    },
    {
      id: "movement",
      label: "The Movement",
      kind: "page",
      description: "Circle, contribution, stewardship, and support",
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
