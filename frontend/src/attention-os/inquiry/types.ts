/**
 * The vocabulary every inquiry primitive shares. A publication supplies data in
 * these shapes; the primitives supply the markup, so the model is written once
 * and drawn the same way wherever it appears.
 */

/** Where a claim or passage comes from: a readable label and the exact address. */
export interface InquirySource {
  label: string;
  href: string;
}

/**
 * One level of claim. `rank` orders the burden (1 is the most directly
 * encountered, 4 the most speculative) and chooses the mark's shape, so the
 * level never depends on colour alone.
 */
export interface ClaimLevel {
  id: string;
  label: string;
  rank: 1 | 2 | 3 | 4;
  definition?: string;
  source?: InquirySource;
}

export interface InquiryQuote {
  text: string;
  source: InquirySource;
  /** A ClaimLevel id. */
  level?: string;
}

/** A defined term. `applies` names the foundational concepts the term builds on. */
export interface InquiryTerm {
  id: string;
  term: string;
  definition: string;
  source: InquirySource;
  applies?: ReadonlyArray<InquirySource>;
}

/** A dated document the argument rests on, with what it is used for and no more. */
export interface InquiryRecord {
  id: string;
  /** ISO date, or a year. */
  date: string;
  title: string;
  issuer: string;
  href: string;
  use?: string;
}

/**
 * Where a part sits in a stratified model: above the line, on it, the line
 * itself, or below it. "outside" is the part that has left the figure.
 */
export type ModelPlace = "above" | "line" | "on" | "below" | "outside";

export interface ModelPart {
  id: string;
  name: string;
  place: ModelPlace;
  summary: string;
  href: string;
  /** Short names shown inside the drawn region. */
  members?: ReadonlyArray<string>;
}

export interface NotebookPrompt {
  id: string;
  label: string;
  prompt: string;
}
