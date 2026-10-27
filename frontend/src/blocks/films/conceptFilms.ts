import type { ReactNode } from "react";

import { doctrineNodes, type DoctrineNode } from "../../content/doctrine/doctrineData";
import {
  BigC,
  Canvas,
  Character,
  ConsciousAuthorship,
  Decoupling,
  DigitalOrganism,
  ExperienceLoop,
  FearGating,
  Intent,
  LimitsAndDebts,
  LittleC,
  Love,
  Painting,
  RealityFrame,
  RealityStream,
  SubjectiveData,
  WorldInvariants,
  type MotifProps,
} from "./ConceptFilmMotifs";

/** Every concept film runs this long: one name, one motion, one sentence from the concept map. */
export const CONCEPT_FILM_SECONDS = 16;

/** When each part of the film's text arrives, in film seconds. */
export const CONCEPT_FILM_BEATS = {
  name: 0.3,
  definition: 5,
  /** Delay between successive words of the definition. */
  wordStep: 0.14,
  source: 10.5,
} as const;

export interface ConceptFilm {
  id: string;
  /** Two-digit position in the concept map, e.g. "03". */
  number: string;
  node: DoctrineNode;
}

/** One silent film per concept, in the concept map's own order. */
export const CONCEPT_FILMS: ConceptFilm[] = doctrineNodes.map((node, index) => ({
  id: node.id,
  number: String(index + 1).padStart(2, "0"),
  node,
}));

export const findConceptFilm = (id: string | null | undefined) =>
  CONCEPT_FILMS.find((film) => film.id === id);

export interface ConceptMotif {
  Motif: (props: MotifProps) => ReactNode;
  /** What the drawing shows, for readers who cannot see it. */
  description: string;
}

export const CONCEPT_MOTIFS: Record<string, ConceptMotif> = {
  "subjective-data": {
    Motif: SubjectiveData,
    description: "Feeling ripples out from an observer and settles as points of data. An examining line passes over them, and not every point is confirmed.",
  },
  "digital-organism": {
    Motif: DigitalOrganism,
    description: "A membrane absorbs differences arriving from outside, deforms, and recovers its shape, while its inner state carries a trace of each change.",
  },
  "big-c": {
    Motif: BigC,
    description: "Flowing lines of continuity, T, and scattered raw information, E, fill the field. Within it a membrane, Big C, forms, and inside Big C a Reality Frame, RF₀, and points of local experience appear.",
  },
  "little-c": {
    Motif: LittleC,
    description: "Inside RF₀, a small experiencer coupled to a body receives experience, sends Intent out as action, and is changed by the consequence that returns.",
  },
  "decoupling-principle": {
    Motif: Decoupling,
    description: "A ring of awareness and a bodily rendering sit together, draw slightly apart while staying joined by threads, and settle close again: coupled, not identical.",
  },
  "reality-frame": {
    Motif: RealityFrame,
    description: "A participant inside a ruled frame acts. The action meets a rule at the frame's edge, and a consequence returns to the participant.",
  },
  "world-invariants": {
    Motif: WorldInvariants,
    description: "A regular orbit inside RF₀ is measured point by point and fitted with a curve. A dashed arrow from the frame marks that the regularity is still to be derived from it.",
  },
  "reality-stream": {
    Motif: RealityStream,
    description: "A sequence of moments flows along a path to one participant, while other participants receive their own separate streams.",
  },
  intent: {
    Motif: Intent,
    description: "Many faint possible paths fan out from an experiencer. One crosses a threshold and becomes a single committed direction.",
  },
  "experience-loop": {
    Motif: ExperienceLoop,
    description: "Reality Stream, Painting, Intent, and Canvas sit on one loop, and a pulse travels around it.",
  },
  canvas: {
    Motif: Canvas,
    description: "Experiences fall onto a surface, and each leaves a stroke that stays, layering into what is carried forward.",
  },
  painting: {
    Motif: Painting,
    description: "Moments pass through a lens made of layered strokes and leave it colored by that pattern.",
  },
  character: {
    Motif: Character,
    description: "Repeated paths from the same starting point converge into one worn path labeled Character.",
  },
  "fear-gating": {
    Motif: FearGating,
    description: "A fan of responses opens from an experiencer. As Fear closes in from both sides, fewer responses remain available.",
  },
  love: {
    Motif: Love,
    description: "A narrowed fan of responses widens again as the closing walls of Fear withdraw.",
  },
  "conscious-authorship": {
    Motif: ConsciousAuthorship,
    description: "In three steps, the Painting is seen, the pause before Intent widens, and one direction is chosen, adding a new stroke to the Canvas.",
  },
  "limits-and-debts": {
    Motif: LimitsAndDebts,
    description: "Claims sort into four bands: observed, modeled, hypothesized, and speculative. The bands stay open at one end, leaving the framework open to criticism.",
  },
};
