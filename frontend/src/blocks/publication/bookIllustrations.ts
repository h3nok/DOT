import { createElement } from "react";
import type { BookFigureData } from "../../attention-os/reader/BookFigure";
import BookDiagram from "./BookDiagram";
import BookConceptIllustration from "./BookConceptIllustrations";

const DIAGRAM_IDS = ["avatar-canvas", "experience-loop", "architecture", "reality-stream", "little-c-scope", "canvas-painting-character", "connection-and-identification", "fear-and-choice"];

/** Only v5's reviewed figures receive this web rendering. Earlier releases keep their artwork. */
export function bookFigureArtwork(figure: BookFigureData) {
  return /\/digital-organism-theory\/v5\/figures\//.test(figure.src) && DIAGRAM_IDS.includes(figure.id) ? createElement(BookDiagram, { figure }) : null;
}

/** One encounter with each of the Concept Map's seventeen book-derived concepts. */
export const BOOK_CONCEPT_PLACEMENTS = [
  ["preface", "the-subjective-data-principle", "subjective-data"],
  ["preface", "love-as-an-epistemic-condition", "love"],
  ["the-digital-organism", "why-call-it-digital", "digital-organism"],
  ["the-digital-organism", "the-big-c-hypothesis", "big-c"],
  ["the-digital-organism", "why-fragment", "little-c"],
  ["the-decoupling-principle", "the-painter-and-the-brush", "decoupling-principle"],
  ["the-decoupling-principle", "where-freedom-lives", "intent"],
  ["the-decoupling-principle", "the-experience-loop", "experience-loop"],
  ["reality-frames", "why-model-a-reality-frame", "reality-frame"],
  ["reality-frames", "reality-frame-and-reality-stream", "reality-stream"],
  ["reality-frames", "the-ruleset", "world-invariants"],
  ["the-canvas", "canvas-painting-and-character", "canvas"],
  ["the-canvas", "forming-character", "character"],
  ["the-canvas", "the-fear-gating-principle", "fear-gating"],
  ["the-painting", "what-is-on-your-painting", "painting"],
  ["the-painting", "from-painting-to-painter", "conscious-authorship"],
  ["the-research-program", "what-failure-would-mean", "limits-and-debts"],
] as const;

export function bookConceptIllustrations(section: string) {
  return Object.fromEntries(BOOK_CONCEPT_PLACEMENTS.filter(([slug]) => slug === section).map(([, heading, concept]) => [heading, createElement(BookConceptIllustration, { key: concept, concept })]));
}
