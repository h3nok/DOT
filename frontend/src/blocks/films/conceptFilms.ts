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
}

export const CONCEPT_MOTIFS: Record<string, ConceptMotif> = {
  "subjective-data": {
    Motif: SubjectiveData,
    description: "A knot is drawn at the centre and pulses. Around it, possible readings appear: danger, memory, anticipation, conflict, hunger, illness. A magnifying lens passes over them without settling on one.",
    analogy: "A knot in the stomach is real. Its reality does not settle which interpretation is correct.",
  },
  "digital-organism": {
    Motif: DigitalOrganism,
    description: "A living cell takes in nourishment, turns a threat away at its boundary, opens a breach and repairs it, while its inner state keeps what it took in.",
    analogy: "Like a living cell: it tells nourishment from threat, repairs damage, and keeps its boundary.",
  },
  "big-c": {
    Motif: BigC,
    description: "Flowing lines of continuity, T, and scattered raw information, E, fill the field. Within it a membrane, Big C, forms, and inside Big C a Reality Frame, RF₀, and points of local experience appear.",
    analogy: "Big C emerged within T × E: T is primordial continuity—Time; E is the raw information source.",
  },
  "little-c": {
    Motif: LittleC,
    description: "A larger organism fills with cells. One cell, Little c, receives signals from only a few neighbours, then sends a pulse that reaches the whole organism.",
    analogy: "Like a cell within a larger organism: it receives a narrow range of signals and still contributes to the whole.",
  },
  "decoupling-principle": {
    Motif: Decoupling,
    description: "A musician plays a harp and notes drift away. Two strings snap and the music thins, while the musician stays whole.",
    analogy: "Damage a musician's instrument and the music changes. That alone does not show the instrument made the musician.",
  },
  "reality-frame": {
    Motif: RealityFrame,
    description: "Inside a ruled frame, a participant throws a ball. Each throw arcs and lands where the frame's rules take it, and the landing stays.",
    analogy: "Like throwing a ball: the throw is yours, and where it lands follows the rules of the world.",
  },
  "world-invariants": {
    Motif: WorldInvariants,
    description: "A pendulum swings inside RF₀. Its positions are measured point by point and fitted with a curve. A dashed arrow from the frame marks that the rhythm is still to be derived from it.",
    analogy: "Like timing a pendulum: physics describes its rhythm exactly; DOT must still derive where the rhythm comes from.",
  },
  "reality-stream": {
    Motif: RealityStream,
    description: "One shared reality: a river between two banks. Two people below it each receive their own stream from it. One builds half a bridge from the left bank, the other half from the right, and both streams carry each change. Together they set the keystone, and someone crosses where no one could before. Reality evolves with us.",
    analogy: "Like two people building one bridge from opposite banks: each sees it from their own side, and together they make a crossing neither could make alone.",
  },
  intent: {
    Motif: Intent,
    description: "Drafts appear around an experiencer: Leave. Stay and be polite. Tell the truth. Do not disturb the group. Check the phone. Focus. One, Tell the truth, crosses a threshold and becomes Intent; the others fade.",
    analogy: "Many are never chosen. Intent is the movement from proposal to commitment.",
  },
  "experience-loop": {
    Motif: ExperienceLoop,
    description: "Around a hot stove, a pulse travels one loop: Reality Stream, heat; Painting, danger; Intent, pull back; Canvas, remembered.",
    analogy: "Like a hand near a hot stove: the heat is read as danger, the hand pulls back, and the lesson is carried forward.",
  },
  canvas: {
    Motif: Canvas,
    description: "Drops fall onto a canvas on an easel. Each leaves a stroke that stays: tendencies, expectations, skills, learned responses. The layers are carried forward.",
    analogy: "Its current state retains the effects of experience: tendencies, associations, expectations, skills, and learned responses.",
  },
  painting: {
    Motif: Painting,
    description: "One reply, Okay, travels to two people and passes through each one's Painting, a lens of layered strokes. One hears irritation; the other hears a busy day.",
    analogy: "Someone replies ‘Okay.’ One person hears irritation; another hears a busy day.",
  },
  character: {
    Motif: Character,
    description: "Repeated walks cross a lawn from the same starting point. They converge, the grass wears away, and one path becomes visible, labeled Character.",
    analogy: "Like a path worn across a lawn: repeated steps make the route visible.",
  },
  "fear-gating": {
    Motif: FearGating,
    description: "A fan of responses opens from an experiencer. As Fear closes in from both sides, fewer responses remain available.",
    analogy: "Fear contracts the decision-space around anticipated harm.",
  },
  love: {
    Motif: Love,
    description: "A narrowed fan of responses widens again as the closing walls of Fear withdraw, while a trace of fear is still felt at its centre.",
    analogy: "A person can act with Love while frightened.",
  },
  "conscious-authorship": {
    Motif: ConsciousAuthorship,
    description: "In three steps, the Painting is seen, the pause before Intent widens, and one direction is chosen and reinforced.",
    analogy: "There is a narrow interval in which the inherited Painting feels identical to reality. Can you see it?",
  },
  "limits-and-debts": {
    Motif: LimitsAndDebts,
    description: "Claims fall into a ledger of four rows: observed, modeled, hypothesized, and speculative. The ledger's edge stays open, leaving the framework open to criticism.",
    analogy: "Like a living ledger: every major claim is entered with its level, so it can be checked and corrected.",
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
