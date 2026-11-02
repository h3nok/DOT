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
  type ArchitectureLayer,
  type MotifProps,
} from "./ConceptFilmMotifs";
import { typeInSequence } from "./filmTime";

/** Every concept film runs this long: one picture, one sentence from the concept map, one analogy. */
export const CONCEPT_FILM_SECONDS = 16;

/** When a frame's words are typed, in seconds of copy time. */
export interface ConceptTextBeats {
  /** When the eyebrow and the name begin. */
  name: number;
  /** The definition never begins before this, even when the name is typed sooner. */
  definition: number;
  charsPerSecond: number;
}

/** A single concept film: the picture moves first, then the words are typed. */
export const CONCEPT_FILM_BEATS: ConceptTextBeats = {
  name: 0.3,
  definition: 4.5,
  charsPerSecond: 32,
};

export interface ConceptFilm {
  id: string;
  /** Two-digit position in the concept map, e.g. "03". */
  number: string;
  node: DoctrineNode;
}

/** One film per concept, in the concept map's own order. */
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
  /**
   * The familiar picture the drawing makes of the concept. Where the book gives one, these
   * are its words; the rest restate the book's own relationships and claim nothing more.
   */
  analogy: string;
  /** Where the concept sits in the architecture, lit on the locator beside its place. */
  layer: ArchitectureLayer;
}

export const CONCEPT_MOTIFS: Record<string, ConceptMotif> = {
  "subjective-data": {
    Motif: SubjectiveData,
    description: "A knot is drawn at the centre and pulses. Around it, possible readings appear: danger, memory, anticipation, conflict, hunger, illness. A magnifying lens passes over them without settling on one.",
    analogy: "A knot in the stomach is real. Its reality does not settle which interpretation is correct.",
    layer: "little-c",
  },
  "digital-organism": {
    Motif: DigitalOrganism,
    description: "A living cell takes in nourishment, turns a threat away at its boundary, opens a breach and repairs it, while its inner state keeps what it took in.",
    analogy: "Like a living cell: it tells nourishment from threat, repairs damage, and keeps its boundary.",
    layer: "all",
  },
  "big-c": {
    Motif: BigC,
    description: "T × E is labelled Speculation outside Big C. Within Big C, RF₀ contains the living Avatar; Little c is outside RF₀, receives its Reality Stream, and connects with a distinct Canvas.",
    analogy: "DOT proposes Big C emerged within T × E (Speculation): primordial continuity and a raw information source.",
    layer: "big-c",
  },
  "little-c": {
    Motif: LittleC,
    description: "A larger organism fills with cells. One cell, Little c, receives signals from only a few neighbours, then sends a pulse that reaches the whole organism.",
    analogy: "Like a cell within a larger organism: it receives a narrow range of signals and still contributes to the whole.",
    layer: "little-c",
  },
  "decoupling-principle": {
    Motif: Decoupling,
    description: "A musician plays a harp and notes drift away. Two strings snap and the music thins, while the musician stays whole.",
    analogy: "A musician and an instrument suggest distinct roles. The analogy does not establish that awareness exists independently of the body.",
    layer: "little-c",
  },
  "reality-frame": {
    Motif: RealityFrame,
    description: "Inside RF₀, an Avatar throws a ball. Each throw follows the Frame’s constraints and leaves a consequence. The body is Little c’s embodied means of participation.",
    analogy: "Like throwing a ball: the throw is yours, and where it lands follows the rules of the world.",
    layer: "reality-frame",
  },
  "world-invariants": {
    Motif: WorldInvariants,
    description: "A pendulum swings inside RF₀. Its positions are measured point by point and fitted with a curve. A dashed arrow from the frame marks the rhythm as one of the Frame’s own rules.",
    analogy: "Like timing a pendulum: physics describes its rhythm exactly; DOT reads that rhythm as one of the Frame’s rules.",
    layer: "reality-frame",
  },
  "reality-stream": {
    Motif: RealityStream,
    description: "Big C contains RF₀ and two Little cs outside the Frame. Each Little c receives a Reality Stream through an Avatar inside RF₀. Action proceeds through those bodies: one builds from each bank, and together they make a crossing possible.",
    analogy: "Like two people building one bridge from opposite banks: each sees it from their own side, and together they make a crossing neither could make alone.",
    layer: "reality-stream",
  },
  intent: {
    Motif: Intent,
    description: "Drafts appear around an experiencer: Leave. Stay and be polite. Tell the truth. Do not disturb the group. Check the phone. Focus. One, Tell the truth, crosses a threshold and becomes Intent; the others fade.",
    analogy: "Many are never chosen. Intent is the movement from proposal to commitment.",
    layer: "little-c",
  },
  "experience-loop": {
    Motif: ExperienceLoop,
    description: "Around a hot stove, a pulse traces the model: bodily input, interpretation through the Painting, Intent to use protection, and an update to Canvas state.",
    analogy: "Feeling heat, you recognize a risk and choose to use a mitt. The outcome can change how you approach the stove next time.",
    layer: "little-c",
  },
  canvas: {
    Motif: Canvas,
    description: "Drops fall onto a canvas on an easel. Each leaves a stroke that stays: tendencies, expectations, skills, learned responses. The layers are carried forward.",
    analogy: "Its current state retains the effects of experience: tendencies, associations, expectations, skills, and learned responses.",
    layer: "little-c",
  },
  painting: {
    Motif: Painting,
    description: "One reply, Okay, travels to two people and passes through each one's Painting, a lens of layered strokes. One hears irritation; the other hears a busy day.",
    analogy: "Someone replies ‘Okay.’ One person hears irritation; another hears a busy day.",
    layer: "little-c",
  },
  character: {
    Motif: Character,
    description: "Repeated walks cross a lawn from the same starting point. They converge, the grass wears away, and one path becomes visible, labeled Character.",
    analogy: "Like a path worn across a lawn: repeated steps make the route visible.",
    layer: "little-c",
  },
  "fear-gating": {
    Motif: FearGating,
    description: "A fan of responses opens from an experiencer. As Fear closes in from both sides, fewer responses remain available.",
    analogy: "Fear contracts the decision-space around anticipated harm.",
    layer: "little-c",
  },
  love: {
    Motif: Love,
    description: "A narrowed fan of responses widens again as the closing walls of Fear withdraw, while a trace of fear is still felt at its centre.",
    analogy: "A person can love while frightened; courage often acts in fear’s presence.",
    layer: "little-c",
  },
  "conscious-authorship": {
    Motif: ConsciousAuthorship,
    description: "In three steps, the Painting is seen, the pause before Intent widens, and one direction is chosen and reinforced.",
    analogy: "There is a narrow interval in which the inherited Painting feels identical to reality. Can you see it?",
    layer: "little-c",
  },
  "limits-and-debts": {
    Motif: LimitsAndDebts,
    description: "Claims fall into a ledger of four rows: observed, modeled, hypothesized, and speculative. The ledger's edge stays open, leaving the framework open to criticism.",
    analogy: "Like a living ledger: every major claim is entered with its level, so it can be checked and corrected.",
    layer: "all",
  },
};

/** When each line of a concept frame is typed, measured on the frame's copy clock. */
export function conceptTyping(film: ConceptFilm, beats: ConceptTextBeats, place: string) {
  const speed = beats.charsPerSecond;
  const [eyebrow, name, definition, analogy] = typeInSequence(
    [
      { text: `${place} · ${film.node.source.claimLevel}`, charsPerSecond: speed * 2 },
      { text: film.node.title, charsPerSecond: speed, delay: 0.2 },
      { text: film.node.oneLine, charsPerSecond: speed, delay: 0.3, earliest: beats.definition },
      { text: CONCEPT_MOTIFS[film.id].analogy, charsPerSecond: speed, delay: 0.5 },
    ],
    beats.name,
  );
  return { eyebrow, name, definition, analogy, source: analogy.end + 0.3 };
}
