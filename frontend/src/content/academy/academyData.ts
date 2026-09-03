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
    purpose: "Keep pressure, reply, method, and failure in the same public record.",
  },
  {
    id: "writing",
    index: "03",
    title: "Writing",
    purpose: "Develop implications without disguising new work as established canon.",
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
      "The first architecture diagram is published on the front door. A versioned diagram library comes next.",
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
      "The Big C and Little c hypotheses are marked inside the current concept map; their unpaid debts remain attached.",
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
      "The open-seams register begins with the derivations and measurements Book One says it still owes.",
    phase: "available",
    href: "/applied",
    action: "Read the open seams",
  },
  {
    id: "responses",
    programId: "critical",
    title: "Responses",
    role: "Answer a named objection without erasing it or claiming closure by assertion.",
    currentState:
      "The editorial contract is set. No Academy response has been released yet.",
    phase: "opening",
  },
  {
    id: "experiments",
    programId: "critical",
    title: "Experiments",
    role: "Publish methods, predictions, failure conditions, and results in their declared order.",
    currentState:
      "The open-seams register names what could settle each claim. No experiment is recorded yet.",
    phase: "available",
    href: "/applied",
    action: "Inspect the research burdens",
  },
  {
    id: "excerpts",
    programId: "writing",
    title: "Excerpts",
    role: "Present bounded passages with exact publication and edition provenance.",
    currentState:
      "Excerpts will be Academy objects. The complete Book One reader remains a separate publication surface.",
    phase: "opening",
  },
  {
    id: "essays",
    programId: "writing",
    title: "Essays",
    role: "Develop consequences, interpretations, and new directions outside the book's canon.",
    currentState:
      "The collection architecture is ready. No Academy essay has been released yet.",
    phase: "opening",
  },
] as const;

export const academyAreasFor = (programId: AcademyProgramId) =>
  academyAreas.filter((area) => area.programId === programId);

export const getAcademyArea = (id: AcademyAreaId) =>
  academyAreas.find((area) => area.id === id) ?? academyAreas[0];
