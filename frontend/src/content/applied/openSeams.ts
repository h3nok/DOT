// The applied layer's first register: what Book One does not establish.
//
// ADR-0017 names the applied layer as the difference between a readership and a
// movement, and makes two things binding: every applied entry declares a claim
// level drawn from the book's own `reader_contract.claim_levels`, and negative
// results and open seams are permanent first-class citizens rather than a
// footnote to be quietly retired.
//
// Every seam below is stated by Book One about itself. None is a critic's
// framing and none is invented here: `wouldSettleIt` is the book's own account
// of what it owes, and each entry resolves to the passage it came from. That
// constraint is enforced by openSeams.test.ts against the released text, so a
// seam cannot drift away from the manuscript without failing the build.

import { DOT_BOOK_ONE_ROUTE } from "../publications/dotBookOne";

/** The book's four levels, in the order the reader contract lists them. */
export type ClaimLevel = "Observation" | "Model" | "Hypothesis" | "Speculation";

export type WorkKind = "study" | "replication" | "implementation" | "practice";

/**
 * What a piece of work concluded. `not-supported` is not a failure state to be
 * hidden — a movement that displays failed replications survives criticism, and
 * one that hides them becomes propaganda (doc 08 §4.1).
 */
export type WorkOutcome =
  | "supported"
  | "mixed"
  | "not-supported"
  | "inconclusive"
  | "in-progress";

/**
 * Work recorded against a seam.
 *
 * `claimLevel` and `outcome` are required, with no default. ADR-0017: a node
 * without a declared level cannot be released, so the type refuses to describe
 * one. `steward` names who did the work and carries no rank, score, or badge —
 * contributor ranking is banned outright, and this is where the pressure to add
 * it will be strongest.
 */
export interface AppliedWork {
  id: string;
  kind: WorkKind;
  title: string;
  claimLevel: ClaimLevel;
  outcome: WorkOutcome;
  /** What was done and what came of it, in plain language. */
  summary: string;
  steward: string;
  /** ISO date the record entered the register. */
  recordedAt: string;
  /** Where the full record lives, when it lives somewhere. */
  href?: string;
}

export interface SeamSource {
  sectionSlug: string;
  sectionTitle: string;
  heading: string;
  href: string;
}

export interface OpenSeam {
  id: string;
  /** The claim at issue, named as the book names it. */
  title: string;
  /** The level the book currently assigns the claim. */
  claimLevel: ClaimLevel;
  /** What Book One does not establish. */
  notEstablished: string;
  /** What the book says would have to be shown. */
  wouldSettleIt: string;
  /** Established downstream science the derivation must fully recover. */
  accountToRecover?: string;
  source: SeamSource;
  /** Work recorded against this seam. Empty is the honest state, not a stub. */
  work: AppliedWork[];
}

const source = (
  sectionSlug: string,
  sectionTitle: string,
  heading: string,
): SeamSource => ({
  sectionSlug,
  sectionTitle,
  heading,
  href: `${DOT_BOOK_ONE_ROUTE}/${sectionSlug}#${heading}`,
});

export const openSeams: OpenSeam[] = [
  {
    id: "frame-to-physics-derivation",
    title: "The Frame generator has not yet yielded measured physics",
    claimLevel: "Hypothesis",
    notEstablished:
      "Book One specifies the minimum architecture of a Reality Frame and places physical law downstream of it. It does not yet derive the measured equations, constants, symmetries, or quantum statistics of RF₀ from that generator.",
    accountToRecover:
      "The physical sciences already describe RF₀'s observable regularities with extraordinary precision. DOT must recover that body of law as generated Frame behavior, including the domains in which existing theories remain incomplete or mutually unresolved.",
    wouldSettleIt:
      "Explicit bridge principles from the Frame's state-space and transition structure to known physical invariants, followed by novel constraints that can fail against public measurement.",
    source: source(
      "reality-frames",
      "Reality Frames",
      "world-invariants",
    ),
    work: [],
  },
  {
    id: "physics-to-biology-derivation",
    title: "The bridge from physical invariants to living interfaces is incomplete",
    claimLevel: "Hypothesis",
    notEstablished:
      "Book One locates chemistry, biology, bodies, and nervous systems within one derivation, but it does not yet show how RF₀'s physical regularities yield self-preserving biological organization or the specific interface used by Little c.",
    accountToRecover:
      "Chemistry, evolutionary biology, physiology, and neuroscience describe stable composition, adaptation, embodiment, and neural execution inside RF₀. Their established mechanisms remain binding constraints on DOT's interface architecture.",
    wouldSettleIt:
      "A continuous derivation from permitted physical organization to self-preserving life and embodied experience, with operational signatures that distinguish an interface account from one that treats the interface as the complete experiencer.",
    source: source(
      "the-digital-organism",
      "The Digital Organism",
      "the-derivation-contract",
    ),
    work: [],
  },
  {
    id: "rendering-latency-measure",
    title: "Rendering Latency has no operational measure",
    claimLevel: "Hypothesis",
    notEstablished:
      "Readiness-potential timing records that brain preparation can precede a reported decision. It does not identify the origin of authorship, and it does not establish DOT's preferred causal order either.",
    accountToRecover:
      "Neuroscience's account of preparation, stochastic accumulation, firing, movement, and report is the measurable execution layer DOT must recover in full.",
    wouldSettleIt:
      "A derived, preregistered signature of the proposed handoff that differs from the complete neural execution sequence and can be measured independently of retrospective report.",
    source: source(
      "the-decoupling-principle",
      "The Decoupling Principle",
      "what-the-timing-puzzle-establishes",
    ),
    work: [],
  },
  {
    id: "intent-and-quantum-statistics",
    title: "Intent affecting quantum statistics is unspecified",
    claimLevel: "Speculation",
    notEstablished:
      "Double-slit and delayed-choice experiments show that measurement context matters to the statistics that appear. They do not show that private Intent selects physical outcomes, and classical-wave models reproduce important quantum-eraser statistics under postselection.",
    wouldSettleIt:
      "If DOT is to claim that Intent affects quantum statistics, it must specify what would be observed beyond the predictions of standard quantum theory. Until then the experiments serve as analogy, and the interpretation may not be presented as the experimental result.",
    source: source(
      "the-decoupling-principle",
      "The Decoupling Principle",
      "what-quantum-experiments-do-and-do-not-show",
    ),
    work: [],
  },
  {
    id: "sentience-criterion",
    title: "Sentience has no accepted external measure",
    claimLevel: "Model",
    notEstablished:
      "DOT locates sentience at consequential difference becoming present to the continuing process itself. The framework does not yet provide an accepted way for an external observer to detect that inward presence.",
    wouldSettleIt:
      "An operational method that discriminates first-person consequence from adaptive regulation alone and produces convergent results across observers and systems.",
    source: source(
      "the-digital-organism",
      "The Digital Organism",
      "why-call-it-digital",
    ),
    work: [],
  },
  {
    id: "canvas-persistence",
    title: "Persistence of the Canvas beyond biological death",
    claimLevel: "Speculation",
    notEstablished:
      "Book One lists this among the claims that remain speculative until they can be operationalized or distinguished from alternatives.",
    accountToRecover:
      "Biological memory, inheritance, and the effects of substrate loss define the in-Frame evidence DOT must explain before any claim of persistence beyond embodiment can carry weight.",
    wouldSettleIt:
      "An operational measure of Canvas continuity that survives the loss of its biological interface and cannot be accounted for by ordinary memory, inheritance, recording, or information leakage.",
    source: source(
      "the-digital-organism",
      "The Digital Organism",
      "the-derivation-contract",
    ),
    work: [],
  },
  {
    id: "multiple-reality-frames",
    title: "The existence of multiple Reality Frames",
    claimLevel: "Speculation",
    notEstablished:
      "RF₀ — the physical universe we inhabit — is the only Reality Frame the book can point at. The developmental history of Big C and the nature of the External Environment are listed as speculative alongside it.",
    wouldSettleIt:
      "Any observation that requires more than one Frame to explain, or a formulation of the claim that forbids something observable. As stated, it currently forbids nothing.",
    source: source(
      "the-digital-organism",
      "The Digital Organism",
      "the-derivation-contract",
    ),
    work: [],
  },
  {
    id: "operational-measures",
    title: "Most DOT variables have no accepted operational measure",
    claimLevel: "Model",
    notEstablished:
      "The equations formalize dependencies and measured orderings. They are not discovered laws, and the quantities they relate mostly cannot yet be measured by anyone other than the person reporting them.",
    wouldSettleIt:
      "Operational definitions that let a second observer measure the same quantity and disagree with the first. A theory becomes pseudoscientific when its claims exceed the domain its methods can honestly examine.",
    source: source(
      "the-digital-organism",
      "The Digital Organism",
      "the-limit-of-knowledge",
    ),
    work: [],
  },
];

export const getOpenSeam = (id: string): OpenSeam | undefined =>
  openSeams.find((seam) => seam.id === id);

/**
 * Work recorded against a seam, in the order it was recorded.
 *
 * Deliberately not a filter and not a sort. Ordering work by outcome, or
 * hiding anything that came back `not-supported`, is precisely the move
 * ADR-0017 forbids, so the register has no affordance for it.
 */
export const seamWork = (seam: OpenSeam): readonly AppliedWork[] => seam.work;

/** Seams with nothing recorded against them yet. Honest, not hidden. */
export const unaddressedSeams = (): OpenSeam[] =>
  openSeams.filter((seam) => seam.work.length === 0);
