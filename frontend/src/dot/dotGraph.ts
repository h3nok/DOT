import type { DotNode } from "./types";

export const DOT_DEVELOPMENT_STATEMENT =
  "The Development and Application of a Big Theory of Everything (TOE)";

/**
 * The steward this deployment publishes for (ADR-0017).
 *
 * DOT is the centre of the field and the author is a steward within it, but a
 * stranger still has to be able to find the person: the ADR names that cost and
 * promises a byline and a dedicated route as the remedy. Must match the
 * `author` recorded in the released Book One manifest.
 */
export const DOT_STEWARD_NAME = "Henok Ghebrechristos";

export const dotGraph: DotNode = {
  id: "dot",
  label: "Digital Organism Theory",
  kind: "self",
  introduction: DOT_DEVELOPMENT_STATEMENT,
  description: "A construction of consciousness, held to its own evidence.",
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
