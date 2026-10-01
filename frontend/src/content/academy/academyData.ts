export type AcademyProgramId = "theory" | "critical" | "writing";

export type AcademyAreaId =
  | "definitions"
  | "diagrams"
  | "hypotheses"
  | "objections"
  | "responses"
  | "experiments"
  | "excerpts"
  | "essays";

export type AcademyAreaPhase = "available" | "opening";

export interface AcademyProgram {
  id: AcademyProgramId;
  index: string;
  title: string;
  purpose: string;
}

export interface AcademyArea {
  id: AcademyAreaId;
  programId: AcademyProgramId;
  title: string;
  role: string;
  currentState: string;
  phase: AcademyAreaPhase;
  href?: string;
  action?: string;
}

/**
 * The Academy's public information architecture.
 *
 * This is deliberately a finite editorial map, not a content feed. An opening
 * area has no invented destination: it becomes linked only when there is a
 * real, provenance-bearing object to publish there (ADR-0030).
 */
export const academyPrograms: readonly AcademyProgram[] = [
  {
    id: "theory",
    index: "01",
    title: "Theory",
    purpose: "Make the architecture precise enough to inspect and criticize.",
  },
  {
    id: "critical",
    index: "02",
    title: "Critical inquiry",
    purpose: "Examine objections, the evidence still needed, and any responses.",
  },
  {
    id: "writing",
    index: "03",
    title: "Writing",
    purpose: "Keep interpretations and new work distinct from the fixed book.",
  },
] as const;

export const academyAreas: readonly AcademyArea[] = [
  {
    id: "definitions",
    programId: "theory",
    title: "Definitions",
    role: "Stabilize the terms DOT depends on and show the boundaries around each one.",
    currentState:
      "The Book One concept map is live. Every definition resolves to its source passage and claim level.",
    phase: "available",
    href: "/doctrine",
    action: "Open the concept map",
  },
  {
    id: "diagrams",
    programId: "theory",
    title: "Diagrams",
    role: "Expose conceptual layers, causal direction, and unresolved handoffs visually.",
    currentState:
      "The first architecture diagram is on the homepage. A library of versioned diagrams is in development.",
    phase: "available",
    href: "/#threshold",
    action: "Inspect the architecture",
  },
  {
    id: "hypotheses",
    programId: "theory",
    title: "Hypotheses",
    role: "State what DOT proposes beyond established evidence in terms that can be challenged.",
    currentState:
      "The concept map explains the Big C and Little c hypotheses, with links to Book One and the questions they leave open.",
    phase: "available",
    href: "/doctrine/big-c",
    action: "Examine a hypothesis",
  },
  {
    id: "objections",
    programId: "critical",
    title: "Objections",
    role: "Give the strongest unresolved criticism a permanent and citable place.",
    currentState:
      "Read the derivations and measurements Book One still needs. These open questions are the starting point for criticism.",
    phase: "available",
    href: "/applied",
    action: "Review open questions",
  },
  {
    id: "responses",
    programId: "critical",
    title: "Responses",
    role: "Answer a named objection without erasing it or claiming closure by assertion.",
    currentState:
      "No Academy response has been released yet.",
    phase: "opening",
  },
  {
    id: "experiments",
    programId: "critical",
    title: "Experiments",
    role: "Publish methods, predictions, failure conditions, and results in their declared order.",
    currentState:
      "The open questions identify evidence that could test each claim. No experiment is recorded yet.",
    phase: "available",
    href: "/applied",
    action: "Review what needs testing",
  },
  {
    id: "excerpts",
    programId: "writing",
    title: "Excerpts",
    role: "Present bounded passages with exact publication and edition provenance.",
    currentState:
      "No Academy excerpt has been released yet. The complete Book One reader is available as a separate publication.",
    phase: "opening",
  },
  {
    id: "essays",
    programId: "writing",
    title: "Essays",
    role: "Develop consequences, interpretations, and new directions outside the book's canon.",
    currentState:
      "No Academy essay has been released yet. Future essays will be separate from Book One’s fixed text.",
    phase: "opening",
  },
] as const;

export const academyAreasFor = (programId: AcademyProgramId) =>
  academyAreas.filter((area) => area.programId === programId);

export const getAcademyArea = (id: AcademyAreaId) =>
  academyAreas.find((area) => area.id === id) ?? academyAreas[0];
