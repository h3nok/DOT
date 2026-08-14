/**
 * Reading paths — more than one honest way into a fixed text.
 *
 * The canon is sealed, so the entry is what changes. The book builds its
 * architecture before it reaches the reader's own life, which is faithful to the
 * argument but hard on someone who arrived because they recognised themselves.
 * A path reorders the encounter without altering a word.
 *
 * Paths are finite, they end, and they never loop. Position is shown so the
 * reader knows where they are, never to reward them for continuing.
 */

export interface ReadingStep {
  /** Section slug in the released manifest. */
  slug: string;
  /** Why this comes here, in this path. */
  why: string;
}

export interface ReadingPath {
  id: string;
  label: string;
  /** Who this is for, said plainly. */
  purpose: string;
  minutes: number;
  steps: ReadingStep[];
}

export const READING_PATHS: ReadingPath[] = [
  {
    id: "start-where-you-live",
    label: "Begin with lived experience",
    purpose:
      "Meet your conditioning first, then trace the architecture beneath it.",
    minutes: 78,
    steps: [
      {
        slug: "preface",
        why: "Why the observer belongs in the inquiry, and what the book will and will not claim.",
      },
      {
        slug: "the-canvas",
        why: "What in you is recording, and why knowing an argument is not yet living it.",
      },
      {
        slug: "the-painting",
        why: "What was painted onto you by family, culture, and civilization — and how to see it.",
      },
      {
        slug: "the-digital-organism",
        why: "Now the architecture underneath: what a digital organism is, and what is only hypothesis.",
      },
      {
        slug: "the-decoupling-principle",
        why: "How the observer separates from what it carries.",
      },
      {
        slug: "architecture-of-continuity",
        why: "What has to persist for any of this to hold together.",
      },
      {
        slug: "reality-frames",
        why: "The frame you are reading inside, and its rules.",
      },
      {
        slug: "references",
        why: "The scholarly trail. A theory that cannot be checked is a story.",
      },
    ],
  },
  {
    id: "start-with-the-architecture",
    label: "Read in written order",
    purpose:
      "Build the theory from its foundations before returning to lived experience.",
    minutes: 101,
    steps: [
      { slug: "preface", why: "The method, and the claim levels that govern the book." },
      { slug: "the-digital-organism", why: "The model, and the limits of its metaphors." },
      { slug: "the-decoupling-principle", why: "Interface, not origin." },
      { slug: "architecture-of-continuity", why: "What persistence requires." },
      { slug: "reality-frames", why: "Rule-bound experiential environments." },
      { slug: "the-canvas", why: "The persistent inner substrate." },
      { slug: "the-painting", why: "What accumulated on it, and how to repaint." },
      { slug: "references", why: "Sources, intact." },
    ],
  },
];

export function findPath(id: string): ReadingPath | null {
  return READING_PATHS.find((path) => path.id === id) ?? null;
}

/** Where a section sits in a path, or -1 when the path does not include it. */
export function positionOf(path: ReadingPath, slug: string): number {
  return path.steps.findIndex((step) => step.slug === slug);
}

/** The next step, or null at the end. A path ends; it does not continue. */
export function nextStep(path: ReadingPath, slug: string): ReadingStep | null {
  const index = positionOf(path, slug);
  if (index === -1) return null;
  return path.steps[index + 1] ?? null;
}

export function previousStep(path: ReadingPath, slug: string): ReadingStep | null {
  const index = positionOf(path, slug);
  if (index <= 0) return null;
  return path.steps[index - 1] ?? null;
}

/** True when this step is the end of the path. */
export function isFinalStep(path: ReadingPath, slug: string): boolean {
  return positionOf(path, slug) === path.steps.length - 1;
}
