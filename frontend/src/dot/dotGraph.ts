import type { DotNode } from "./types";

/**
 * The epistemic stance above the public field.
 *
 * Book One names Love as the condition that lets reality contradict identity.
 * The short line keeps that commitment visible without making the hero carry
 * the full argument before a reader has entered it.
 */
export const DOT_DEVELOPMENT_STATEMENT =
  "Love is an epistemic necessity.";

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
  // The public proposition, set large under the title. It names the movement's
  // developmental purpose and the civilizational problem described in Book
  // One: present systems often train adaptation more reliably than awareness.
  description:
    "A spiritual and intellectual movement for human development in a world that trains us merely to adapt.",
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
      // Each limb's line teaches one idea rather than naming a filing cabinet.
      // "Concept Map" tells a stranger nothing; the five terms do.
      id: "theory",
      label: "Five Terms",
      kind: "page",
      // Sized to the narrowest card this renders in: a phone holds roughly two
      // lines of ~18 characters. A complete short line teaches; a clipped long
      // one just looks broken. Each of these says what is behind the label.
      description: "The vocabulary, defined and sourced.",
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
      // ADR-0017 names this limb "Applied", but the applied layer it describes
      // does not exist yet and this route serves the register of open seams.
      // "Applied" is an adjective with no noun to a first-time reader; the
      // register is the single most persuasive thing here, so it says what it
      // is. Worth an ADR note if the applied layer is ever built alongside it.
      id: "applied",
      // Short enough to hold one line on a phone — a wrapped label grew the
      // card until the crown collided. The description does the teaching.
      label: "Open Questions",
      kind: "page",
      description: "What the book admits it hasn't proved.",
      href: "/applied",
      relation: "applies",
    },
    {
      // ADR-0017's fifth limb, now a door rather than a promise. It stays a
      // limb rather than two front-door buttons: asking a stranger to fund or
      // join before they have read anything inverts the order the manifesto
      // cares about. One move in from the field, both asks sit together.
      id: "movement",
      label: "The Movement",
      kind: "page",
      description: "No ads — readers fund the work.",
      relation: "leads-to",
      children: [
        {
          id: "support",
          label: "Support",
          kind: "page",
          description: "Fund the work directly — it takes no advertising",
          surface: "support",
          relation: "applies",
        },
        {
          id: "join",
          label: "Join",
          kind: "page",
          description: "DOT grows one invitation at a time — ask for one",
          surface: "join",
          relation: "leads-to",
        },
        {
          id: "henok",
          label: "Henok",
          kind: "self",
          description: "Who is building this, and why",
          relation: "contrasts",
          body: "Digital Organism Theory is written and maintained by Henok Ghebrechristos. The work is currently subsidised by unrelated employment; making it sustainable enough to be someone's full-time occupation is a stated goal, not a hidden one.\n\nDOT sells no advertising and no attention, so it is funded by readers. Support never changes what reaches you, and reading stays free and complete either way.",
        },
      ],
    },
  ],
};
