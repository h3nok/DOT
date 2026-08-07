// Book One concept map. This is a reading layer over the released text, not a
// second manuscript: every node resolves to the passage from which it derives.

import { DOT_BOOK_ONE_ROUTE } from "../publications/dotBookOne";

export type DoctrineNodeKind =
  | "foundation"
  | "claim"
  | "definition"
  | "practice"
  | "question";

export type DoctrineRelationType =
  | "depends-on"
  | "leads-to"
  | "contrasts"
  | "defines"
  | "applies";

export type DoctrineClaimLevel =
  | "Observation"
  | "Model"
  | "Hypothesis"
  | "Speculation";

export interface DoctrineRelation {
  to: string;
  type: DoctrineRelationType;
  strength: number; // 0..1, visual weight only; never a popularity score
}

export interface DoctrineSource {
  sectionSlug: string;
  sectionTitle: string;
  heading: string;
  href: string;
  claimLevel: DoctrineClaimLevel;
}

export interface DoctrineNode {
  id: string;
  kind: DoctrineNodeKind;
  title: string;
  oneLine: string;
  body: string;
  weight: number; // 0..1, conceptual centrality; never derived from traffic
  status: "released";
  version: 2;
  source: DoctrineSource;
  related: DoctrineRelation[];
}

const source = (
  sectionSlug: string,
  sectionTitle: string,
  heading: string,
  claimLevel: DoctrineClaimLevel,
): DoctrineSource => ({
  sectionSlug,
  sectionTitle,
  heading,
  href: DOT_BOOK_ONE_ROUTE + "/" + sectionSlug + "#" + heading,
  claimLevel,
});

export const doctrineNodes: DoctrineNode[] = [
  {
    id: "subjective-data",
    kind: "foundation",
    title: "The Subjective Data Principle",
    oneLine:
      "Feeling must be treated as data, but feeling is not automatically truth.",
    body: [
      "Book One begins with first-person experience because every instrument, result, and conclusion must still be perceived and interpreted. Excluding the observer leaves part of the inquiring system unexamined.",
      "Feeling can disclose danger, contradiction, attachment, and meaning. It can also carry inherited expectation, old injury, or a prediction that no longer fits. DOT treats feeling as evidence about the interpreter's relationship to reality, not as an infallible description of reality.",
      "The method has to work in both directions: resistance may be defensive, and it may be accurate detection of an unsupported claim. The model cannot decide that criticism is pathology in advance.",
    ].join("\n\n"),
    weight: 1,
    status: "released",
    version: 2,
    source: source(
      "preface",
      "The Observer Belongs in the Inquiry",
      "the-subjective-data-principle",
      "Observation",
    ),
    related: [
      { to: "love", type: "leads-to", strength: 0.82 },
      { to: "limits-and-debts", type: "applies", strength: 0.9 },
      { to: "digital-organism", type: "leads-to", strength: 0.72 },
    ],
  },
  {
    id: "digital-organism",
    kind: "definition",
    title: "Digital Organism",
    oneLine:
      "A state-bearing, information-sensitive process that works to preserve or develop its coherence across change.",
    body: [
      "Digital does not mean electronic, binary, or made of silicon. The book uses computational language as handles for state, consequential difference, response, persistence, feedback, and adaptation.",
      "Digital Organism names a functional class. A process carries state, detects differences that matter to it, responds, preserves some continuity, and can change future behavior through what it encounters.",
      "That definition does not establish sentience. Adaptive response and subjective awareness remain separate questions, and the book names a discriminating criterion for sentience as an unpaid theoretical debt.",
    ].join("\n\n"),
    weight: 0.98,
    status: "released",
    version: 2,
    source: source(
      "the-digital-organism",
      "The Digital Organism",
      "why-call-it-digital",
      "Model",
    ),
    related: [
      { to: "big-c", type: "leads-to", strength: 0.9 },
      { to: "experience-loop", type: "applies", strength: 0.72 },
      { to: "limits-and-debts", type: "depends-on", strength: 0.76 },
    ],
  },
  {
    id: "big-c",
    kind: "claim",
    title: "The Big C Hypothesis",
    oneLine:
      "Consciousness may be fundamental: a persistent conscious process rather than a late product of an otherwise unconscious reality.",
    body: [
      "Big C is the book's organizing hypothesis. It proposes a larger conscious process within which individuated centers of experience and Reality Frames arise.",
      "Persistence does not prove consciousness, and the model does not identify a physical implementation. Big C is marked as hypothesis, not smuggled in as an observation.",
      "The hypothesis earns value only through the distinctions it makes possible and the questions it exposes. It remains answerable to physicalist explanations and to future methods capable of distinguishing the competing accounts.",
    ].join("\n\n"),
    weight: 0.94,
    status: "released",
    version: 2,
    source: source(
      "the-digital-organism",
      "The Digital Organism",
      "the-big-c-hypothesis",
      "Hypothesis",
    ),
    related: [
      { to: "digital-organism", type: "depends-on", strength: 0.9 },
      { to: "little-c", type: "defines", strength: 0.84 },
      { to: "reality-frame", type: "leads-to", strength: 0.7 },
      { to: "limits-and-debts", type: "depends-on", strength: 0.9 },
    ],
  },
  {
    id: "little-c",
    kind: "claim",
    title: "Little c",
    oneLine:
      "The hypothesized local experiencer that receives experience, forms Intent, participates through a body, and changes through consequence.",
    body: [
      "Little c names the first-person center in DOT's architecture. The body is modeled as the local interface through which this center encounters and acts within a Reality Frame.",
      "The distinction is not a denial of biology. Injury, chemistry, development, and neural activity shape experience. DOT's additional claim is that dependence on an interface does not by itself settle whether the interface produces the experiencer.",
      "A nonphysical Little c has not been independently measured. Its existence and causal role remain hypotheses, and the neural account remains a live alternative.",
    ].join("\n\n"),
    weight: 0.9,
    status: "released",
    version: 2,
    source: source(
      "the-digital-organism",
      "The Digital Organism",
      "the-body-as-interface",
      "Hypothesis",
    ),
    related: [
      { to: "big-c", type: "depends-on", strength: 0.82 },
      { to: "decoupling-principle", type: "leads-to", strength: 0.88 },
      { to: "reality-stream", type: "depends-on", strength: 0.78 },
      { to: "intent", type: "defines", strength: 0.78 },
    ],
  },
  {
    id: "decoupling-principle",
    kind: "claim",
    title: "The Decoupling Principle",
    oneLine:
      "Awareness and its bodily rendering may be tightly coupled without being identical.",
    body: [
      "Readiness-potential experiments establish a measured temporal order, but they do not directly observe the origin of authorship. The book separates the measurement from interpretations placed on it.",
      "DOT proposes Rendering Latency: a minimal interval between Intent in Little c and the first measurable bodily change recruited for execution. That interval is not currently measured independently.",
      "This is one of DOT's strongest ontological claims and one of its least established. The decoupling account must remain open to the alternative that the full sequence is produced within the nervous system.",
    ].join("\n\n"),
    weight: 0.82,
    status: "released",
    version: 2,
    source: source(
      "the-decoupling-principle",
      "The Decoupling Principle",
      "rendering-latency",
      "Hypothesis",
    ),
    related: [
      { to: "little-c", type: "depends-on", strength: 0.88 },
      { to: "intent", type: "depends-on", strength: 0.84 },
      { to: "experience-loop", type: "leads-to", strength: 0.76 },
      { to: "limits-and-debts", type: "depends-on", strength: 0.92 },
    ],
  },
  {
    id: "reality-frame",
    kind: "definition",
    title: "Reality Frame",
    oneLine:
      "A rule-bound experiential environment in which action meets consequence.",
    body: [
      "A Reality Frame names the structured environment of participation: a ruleset, stable world invariants, agency mechanics, and lawful consequence.",
      "The model distinguishes a shared changing world from one participant's situated experience of it. A Frame constrains what can happen; it does not imply that one person's action determines the whole world-state.",
      "Calling our physical universe RF0 is a DOT hypothesis. The computational analogy clarifies architecture, but it is not evidence of a literal external computer or designer.",
    ].join("\n\n"),
    weight: 0.86,
    status: "released",
    version: 2,
    source: source(
      "reality-frames",
      "Reality Frames",
      "why-model-a-reality-frame",
      "Model",
    ),
    related: [
      { to: "reality-stream", type: "defines", strength: 0.92 },
      { to: "experience-loop", type: "leads-to", strength: 0.84 },
      { to: "intent", type: "applies", strength: 0.72 },
    ],
  },
  {
    id: "reality-stream",
    kind: "definition",
    title: "Reality Stream",
    oneLine:
      "The situated sequence of experience delivered to a particular participant within a Reality Frame.",
    body: [
      "The Reality Frame is the lawful environment; the Reality Stream is how that environment becomes available from one embodied position.",
      "The stream is not the whole world and not a passive copy. Body-state, location, attention, and the current Painting all shape what can be encountered and how it is interpreted.",
      "This distinction keeps shared reality and first-person experience in the same model without collapsing one into the other.",
    ].join("\n\n"),
    weight: 0.78,
    status: "released",
    version: 2,
    source: source(
      "reality-frames",
      "Reality Frames",
      "reality-frame-and-reality-stream",
      "Model",
    ),
    related: [
      { to: "reality-frame", type: "depends-on", strength: 0.92 },
      { to: "painting", type: "depends-on", strength: 0.72 },
      { to: "experience-loop", type: "leads-to", strength: 0.9 },
    ],
  },
  {
    id: "intent",
    kind: "definition",
    title: "Intent",
    oneLine:
      "The threshold at which a pre-Intent possibility becomes committed direction for action.",
    body: [
      "Thoughts, impulses, images, and rehearsals can remain drafts. Intent names the commitment that recruits the body toward action.",
      "Within the model, freedom does not require unlimited options. It appears as the capacity to notice available drafts, interrupt inherited defaults, and commit differently within real constraints.",
      "The distinction between draft and commitment is operational. DOT's further claim that Intent originates in a nonphysical Little c is a hypothesis and must not be confused with the observable distinction itself.",
    ].join("\n\n"),
    weight: 0.86,
    status: "released",
    version: 2,
    source: source(
      "reality-frames",
      "Reality Frames",
      "the-interface-is-intent",
      "Model",
    ),
    related: [
      { to: "little-c", type: "depends-on", strength: 0.78 },
      { to: "experience-loop", type: "applies", strength: 0.94 },
      { to: "fear-gating", type: "contrasts", strength: 0.8 },
      { to: "conscious-authorship", type: "leads-to", strength: 0.86 },
    ],
  },
  {
    id: "experience-loop",
    kind: "foundation",
    title: "The Experience Loop",
    oneLine:
      "Reality Stream is interpreted through the Painting; Intent becomes action; consequence updates the Canvas.",
    body: [
      "The loop joins the architecture to lived change. A present Reality Stream is interpreted through the Painting, possible responses form, Intent commits direction, the body acts, and consequence returns.",
      "Consequential difference updates the Canvas. What the process carries forward then changes the Painting through which the next moment will be read.",
      "Every loop begins from the state left by earlier loops. This is why conditioning matters, and also why repeated truthful action can make a different response increasingly available.",
    ].join("\n\n"),
    weight: 0.96,
    status: "released",
    version: 2,
    source: source(
      "the-canvas",
      "The Canvas",
      "the-experience-loop",
      "Model",
    ),
    related: [
      { to: "reality-stream", type: "depends-on", strength: 0.84 },
      { to: "intent", type: "depends-on", strength: 0.9 },
      { to: "canvas", type: "leads-to", strength: 0.94 },
      { to: "painting", type: "depends-on", strength: 0.9 },
    ],
  },
  {
    id: "canvas",
    kind: "definition",
    title: "Canvas",
    oneLine:
      "The persistent capacity to carry forward and update through the consequences of experience.",
    body: [
      "The Canvas is not a blank inner screen and not the same thing as its content. It is the continuing capacity that carries the effects of experience across moments.",
      "Consequential change updates the Canvas. Associations, expectations, fears, habits, and meanings can become easier to activate because earlier loops have made them available.",
      "The Canvas carries; the Painting interprets; Character acts. Keeping those terms separate prevents persistence, interpretation, and behavior from being treated as one undifferentiated self.",
    ].join("\n\n"),
    weight: 0.92,
    status: "released",
    version: 2,
    source: source(
      "the-canvas",
      "The Canvas",
      "canvas-painting-and-character",
      "Model",
    ),
    related: [
      { to: "experience-loop", type: "depends-on", strength: 0.9 },
      { to: "painting", type: "defines", strength: 0.94 },
      { to: "character", type: "leads-to", strength: 0.76 },
      { to: "fear-gating", type: "applies", strength: 0.74 },
    ],
  },
  {
    id: "painting",
    kind: "definition",
    title: "Painting",
    oneLine:
      "The organized content carried by the Canvas through which a present moment is interpreted.",
    body: [
      "The Painting is what has accumulated: expectations, associations, fears, habits, meanings, and learned predictions. It influences what stands out and which responses feel possible.",
      "A Painting is inherited and revised through experience; it is not an essence. Seeing it clearly allows a person to distinguish the present from the interpretation brought into the present.",
      "The practical movement in Book One is not to erase every inherited mark. It is to see the Painting well enough that it no longer authors every response invisibly.",
    ].join("\n\n"),
    weight: 0.94,
    status: "released",
    version: 2,
    source: source(
      "the-painting",
      "The Painting",
      "see-the-painting-first",
      "Model",
    ),
    related: [
      { to: "canvas", type: "depends-on", strength: 0.94 },
      { to: "character", type: "leads-to", strength: 0.9 },
      { to: "fear-gating", type: "applies", strength: 0.82 },
      { to: "conscious-authorship", type: "leads-to", strength: 0.94 },
    ],
  },
  {
    id: "character",
    kind: "definition",
    title: "Character",
    oneLine:
      "The action policy made visible through repeated interpretation, commitment, and behavior.",
    body: [
      "Character is the Painting in motion. Repeated interpretations and actions become a person's familiar way of meeting the world.",
      "The term describes an enacted pattern, not a permanent moral substance. A familiar response may be deeply conditioned and still remain open to revision through awareness, practice, consequence, and care.",
      "This framing keeps responsibility and compassion together: actions matter, while the architecture that made them likely can also be examined and changed.",
    ].join("\n\n"),
    weight: 0.76,
    status: "released",
    version: 2,
    source: source(
      "the-canvas",
      "The Canvas",
      "forming-character",
      "Model",
    ),
    related: [
      { to: "painting", type: "depends-on", strength: 0.9 },
      { to: "intent", type: "applies", strength: 0.76 },
      { to: "conscious-authorship", type: "leads-to", strength: 0.8 },
    ],
  },
  {
    id: "fear-gating",
    kind: "claim",
    title: "The Fear-Gating Principle",
    oneLine:
      "When Fear governs, the set of responses that feels available becomes narrower.",
    body: [
      "Fear can organize perception around defense, control, avoidance, domination, or preservation of identity. In that condition, physically possible options may become psychologically unavailable.",
      "The book models this as narrowing, not as proof that every excluded option was good or safe. Protective sensation remains part of an organism's intelligence; the concern is governance by inherited contraction.",
      "Naming the gate creates a practical question: is this response fitted to the present, or is the Painting restricting the decision-space before the present can be seen?",
    ].join("\n\n"),
    weight: 0.82,
    status: "released",
    version: 2,
    source: source(
      "the-canvas",
      "The Canvas",
      "the-fear-gating-principle",
      "Model",
    ),
    related: [
      { to: "painting", type: "depends-on", strength: 0.82 },
      { to: "intent", type: "contrasts", strength: 0.82 },
      { to: "love", type: "contrasts", strength: 0.92 },
      { to: "conscious-authorship", type: "leads-to", strength: 0.72 },
    ],
  },
  {
    id: "love",
    kind: "practice",
    title: "Love as an Epistemic Condition",
    oneLine: "Love is the condition in which Fear no longer governs you.",
    body: [
      "Love does not mean sentimentality, agreement, passivity, or the absence of protective sensation. A person can act with Love while frightened.",
      "In Book One, Love names enough inner freedom for reality to contradict identity. It permits inherited patterns to be inspected, another person to remain more than a threat, and a cherished model to be revised when consequence no longer supports it.",
      "Love therefore has an epistemic role: it enlarges the capacity to see what is there rather than only what identity needs to be there.",
    ].join("\n\n"),
    weight: 0.9,
    status: "released",
    version: 2,
    source: source(
      "preface",
      "The Observer Belongs in the Inquiry",
      "love-as-an-epistemic-condition",
      "Model",
    ),
    related: [
      { to: "subjective-data", type: "depends-on", strength: 0.78 },
      { to: "fear-gating", type: "contrasts", strength: 0.92 },
      { to: "conscious-authorship", type: "applies", strength: 0.84 },
    ],
  },
  {
    id: "conscious-authorship",
    kind: "practice",
    title: "Conscious Authorship",
    oneLine:
      "See the Painting, widen the pause before Intent, and choose what the next consequence will reinforce.",
    body: [
      "Authorship begins with recognition. A person learns to notice the inherited interpretation before it becomes the only available action.",
      "The pause is not escape from embodiment or consequence. It is a larger decision-space inside them: the capacity to compare a familiar draft with the present and commit direction more deliberately.",
      "Book One calls the repeated process bootstrapping. Each truthful action creates a consequence that can update the Canvas, making future truthful action more available. The painter is formed through the acts of painting.",
    ].join("\n\n"),
    weight: 0.96,
    status: "released",
    version: 2,
    source: source(
      "the-painting",
      "The Painting",
      "from-painting-to-painter",
      "Model",
    ),
    related: [
      { to: "painting", type: "depends-on", strength: 0.94 },
      { to: "intent", type: "depends-on", strength: 0.86 },
      { to: "experience-loop", type: "applies", strength: 0.9 },
      { to: "love", type: "depends-on", strength: 0.76 },
    ],
  },
  {
    id: "limits-and-debts",
    kind: "question",
    title: "Limits and Unpaid Debts",
    oneLine:
      "The book separates what is observed, modeled, hypothesized, and still speculative so the framework can be criticized without becoming self-sealing.",
    body: [
      "Book One does not prove that consciousness is fundamental, that Little c is nonphysical, that RF0 is one of many Reality Frames, or that Rendering Latency exists as proposed.",
      "Its equations formalize dependencies and measured orderings. They are not discovered laws, and most DOT variables do not yet have accepted operational measures.",
      "The framework still owes discriminating tests, clearer sentience criteria, and methods capable of separating its preferred explanations from neural and physicalist alternatives. A theory becomes pseudoscientific when its claims exceed the domain its methods can honestly examine.",
    ].join("\n\n"),
    weight: 0.88,
    status: "released",
    version: 2,
    source: source(
      "the-digital-organism",
      "The Digital Organism",
      "what-chapter-1-has-and-has-not-established",
      "Hypothesis",
    ),
    related: [
      { to: "subjective-data", type: "depends-on", strength: 0.9 },
      { to: "big-c", type: "applies", strength: 0.86 },
      { to: "decoupling-principle", type: "applies", strength: 0.86 },
      { to: "digital-organism", type: "applies", strength: 0.74 },
    ],
  },
];

export const getDoctrineNode = (id: string): DoctrineNode | undefined =>
  doctrineNodes.find((node) => node.id === id);

export const doctrineFoundations = doctrineNodes.filter(
  (node) => node.kind === "foundation",
);
