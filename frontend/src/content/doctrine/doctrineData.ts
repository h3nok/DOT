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
  version: 5;
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
    version: 5,
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
      "A living, conscious system that carries its past forward, senses what matters, and adapts to stay whole across change.",
    body: [
      "Digital does not mean electronic, binary, or made of silicon. The book uses computational language as handles for state, consequential difference, response, persistence, feedback, and adaptation.",
      "Digital Organism names a functional class. A process carries state, detects differences that matter to it, responds, preserves some continuity, and can change future behavior through what it encounters.",
      "DOT locates sentience at consequential difference becoming present to the continuing process itself. The conceptual threshold is defined; an accepted method for detecting that inward presence from outside the process remains an open scientific problem.",
    ].join("\n\n"),
    weight: 0.98,
    status: "released",
    version: 5,
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
      "DOT proposes a living, conscious process from which Reality Frames and local experiencers develop.",
    body: [
      "Big C is DOT’s proposed living, conscious process: it retains state, recognizes patterns, responds to change, and develops Reality Frames and localized experiencers.",
      "DOT proposes that Big C emerged within T × E (Speculation): primordial continuity—Time—and the raw information source. These prerequisites are outside Big C. The account is extrapolated from experience through a computing analogy; it is not a directly observed origin.",
      "Within DOT, RF₀ and Little c belong within Big C. Little c is outside RF₀ and receives its Reality Stream through the Avatar. The model must account for measured physical and biological results; naming these relationships does not complete their derivation.",
    ].join("\n\n"),
    weight: 0.94,
    status: "released",
    version: 5,
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
      "The local experiencer in DOT’s model, embodied by an Avatar and participating through a situated Reality Stream.",
    body: [
      "Little c names local self-awareness in DOT’s architecture. It is within Big C and outside RF₀. The Avatar is its living body in RF₀, through which Little c receives experience and acts.",
      "The distinction preserves the consequences of embodiment. Injury, chemistry, development, and neural activity shape what is available to experience. DOT must account for these measured relationships.",
      "Little c is a proposed role in the architecture, not an independently detected nonphysical entity. A causal handoff to the biological interface has not been measured independently. Local scope means available access and action, not a different intrinsic kind of self-awareness.",
    ].join("\n\n"),
    weight: 0.9,
    status: "released",
    version: 5,
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
      "DOT proposes that Little c and the living body are distinct and functionally connected.",
    body: [
      "Readiness-potential experiments establish a measured temporal order, but they do not directly observe the origin of authorship. The book separates the measurement from interpretations placed on it.",
      "DOT proposes Rendering Latency: a minimal interval between Intent in Little c and the first measurable bodily change recruited for execution. That interval is not currently measured independently.",
      "The nervous system may account for the complete measurable execution sequence. DOT must identify a result that distinguishes its proposed handoff from a neural account. Practical decoupling means examining identification while preserving the functional connection to embodied life.",
    ].join("\n\n"),
    weight: 0.82,
    status: "released",
    version: 5,
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
      "A shared, rule-bound experience laboratory in which Little cs participate through their Avatars.",
    body: [
      "A Reality Frame names a structured environment with lawful constraints, available actions, and consequences. RF₀ names our physical universe and, within DOT, serves as an experience laboratory for Little cs.",
      "The Frame supplies a Reality Stream to each local experiencer through its Avatar. RF₀ and Little c are within Big C; Little c is outside RF₀, while the Avatar embodies its participation within the Frame.",
      "The laboratory metaphor does not mean that every event was assigned as a lesson or that suffering is deserved. Computational language describes proposed functional relationships; it does not establish a literal computer.",
    ].join("\n\n"),
    weight: 0.86,
    status: "released",
    version: 5,
    source: source(
      "reality-frames",
      "Reality Frames",
      "why-model-a-reality-frame",
      "Model",
    ),
    related: [
      { to: "reality-stream", type: "defines", strength: 0.92 },
      { to: "world-invariants", type: "defines", strength: 0.9 },
      { to: "experience-loop", type: "leads-to", strength: 0.84 },
      { to: "intent", type: "applies", strength: 0.72 },
    ],
  },
  {
    id: "world-invariants",
    kind: "claim",
    title: "Physical Sciences as Frame Derivations",
    oneLine:
      "Physics measures RF₀’s regularities; DOT must account for those results within its proposed Frame architecture.",
    body: [
      "Physics develops publicly testable accounts of causal structure, symmetry, conservation, coupling, decay, space, time, and statistical law. Within DOT, these measured regularities constrain the proposed generator of RF₀.",
      "A mature DOT must show how its proposed Frame architecture accounts for the regularities physical science measures, and how chemistry and biology become possible under those constraints.",
      "Book One states this research obligation; it does not complete a derivation of measured laws, constants, or biological mechanisms from Big C. Any new consequences attributed to the generator must remain open to measurement and correction.",
    ].join("\n\n"),
    weight: 0.93,
    status: "released",
    version: 5,
    source: source(
      "reality-frames",
      "Reality Frames",
      "world-invariants",
      "Hypothesis",
    ),
    related: [
      { to: "reality-frame", type: "depends-on", strength: 0.94 },
      { to: "limits-and-debts", type: "depends-on", strength: 0.9 },
    ],
  },
  {
    id: "reality-stream",
    kind: "definition",
    title: "Reality Stream",
    oneLine:
      "The situated input RF₀ supplies to Little c through the Avatar.",
    body: [
      "The Reality Frame is the lawful environment. Its Reality Stream is the time-ordered input supplied to Little c through a living body in that environment.",
      "World-state, body-state, location, and sampling constrain what arrives. The Painting is the accumulated organization through which that input is interpreted; it is not an unrestricted generator of the shared world.",
      "This distinction keeps shared reality and first-person experience in the same model without collapsing one into the other.",
    ].join("\n\n"),
    weight: 0.78,
    status: "released",
    version: 5,
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
      "Commitment toward an action, distinct from the thoughts and impulses that remain possible drafts.",
    body: [
      "Thoughts, impulses, images, and rehearsals can remain drafts. Intent names the commitment that recruits the body toward action.",
      "Within the model, freedom does not require unlimited options. It appears as the capacity to notice available drafts, interrupt inherited defaults, and commit differently within real constraints.",
      "The distinction between draft and commitment is operational. Within DOT, Intent originates in Little c and is rendered through the body; the unresolved hypothesis is how that handoff can be distinguished and measured from outside.",
    ].join("\n\n"),
    weight: 0.86,
    status: "released",
    version: 5,
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
      "Input is interpreted through the Painting; Intent leads toward action, and consequence updates carried state.",
    body: [
      "The loop joins the architecture to lived change. A present Reality Stream is interpreted through the Painting, possible responses form, Intent commits direction, the body acts, and consequence returns.",
      "Consequential difference updates Canvas state. Its accumulated organization—the Painting—then participates in how the next moment is interpreted.",
      "Every loop begins from the state left by earlier loops. This is why conditioning matters, and also why repeated truthful action can make a different response increasingly available.",
    ].join("\n\n"),
    weight: 0.96,
    status: "released",
    version: 5,
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
      "The capacity to carry and update state, allowing earlier experience to influence what comes next.",
    body: [
      "The Canvas is not a blank inner screen and not the same thing as its content. It is the continuing capacity that carries the effects of experience across moments.",
      "Consequential change updates Canvas state. This is not a complete recording of experience: selection, retention, and later retrieval shape what remains available.",
      "The Canvas carries; the Painting interprets; Character acts. Keeping those terms separate prevents persistence, interpretation, and behavior from being treated as one undifferentiated self.",
    ].join("\n\n"),
    weight: 0.92,
    status: "released",
    version: 5,
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
      "The accumulated organization of carried state: expectations, associations, skills, habits, and meanings.",
    body: [
      "The Painting is what has accumulated: expectations, associations, fears, habits, meanings, and learned predictions. It influences what stands out and which responses feel possible.",
      "A Painting is inherited and revised through experience; it is not an essence. Seeing it clearly allows a person to distinguish the present from the interpretation brought into the present.",
      "The practical movement in Book One is not to erase every inherited mark. It is to see the Painting well enough that it no longer authors every response invisibly.",
    ].join("\n\n"),
    weight: 0.94,
    status: "released",
    version: 5,
    source: source(
      "the-painting",
      "The Painting",
      "what-is-on-your-painting",
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
      "The relatively stable patterns expressed through repeated interpretation and action.",
    body: [
      "Character is the Painting in motion. Repeated interpretations and actions become a person's familiar way of meeting the world.",
      "The term describes an enacted pattern, not a permanent moral substance. A familiar response may be deeply conditioned and still remain open to revision through awareness, practice, consequence, and care.",
      "This framing keeps responsibility and compassion together: actions matter, while the architecture that made them likely can also be examined and changed.",
    ].join("\n\n"),
    weight: 0.76,
    status: "released",
    version: 5,
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
    version: 5,
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
    version: 5,
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
      "Notice inherited interpretation, examine available responses, and act with greater deliberation.",
    body: [
      "Authorship begins with recognition. A person learns to notice the inherited interpretation before it becomes the only available action.",
      "The pause is not escape from embodiment or consequence. It is a larger decision-space inside them: the capacity to compare a familiar draft with the present and commit direction more deliberately.",
      "Book One calls the repeated process bootstrapping. Deliberate action and attention to consequence can update carried state, making a different response more available. The painter is formed through the acts of painting.",
    ].join("\n\n"),
    weight: 0.96,
    status: "released",
    version: 5,
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
      "Distinguish observation, model, hypothesis, and speculation, then ask what would support or challenge each claim.",
    body: [
      "Big C and its development of RF₀ remain hypotheses. T × E (Speculation) is an extrapolation beyond direct experience. Multiple Reality Frames, Canvas persistence beyond embodiment, and Rendering Latency remain unestablished and incompletely operationalized.",
      "Its equations formalize dependencies and measured orderings. They are not discovered laws, and most DOT variables do not yet have accepted operational measures.",
      "The framework owes an account linking its proposed architecture to physical invariants, chemistry, biology, and embodied experience. It also needs operational measures for the proposed handoff and predictions that could fail. The inquiry begins in experience, moves toward Big C, and extrapolates to T × E (Speculation); that order of inquiry must remain distinct from the proposed order of emergence.",
    ].join("\n\n"),
    weight: 0.88,
    status: "released",
    version: 5,
    source: source(
      "the-digital-organism",
      "The Digital Organism",
      "the-derivation-contract",
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
