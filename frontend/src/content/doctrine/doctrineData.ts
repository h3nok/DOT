// DOT doctrine content — the argued prose the Coherence Surface delivers.
// Conforms to docs/blueprint/08-DOCTRINE-AND-COHERENCE-SURFACE.md
//
// This is doctrine, not marketing copy. Each node is one idea. Questions are
// first-class: the open seams are shown, not hidden.

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

export interface DoctrineRelation {
  to: string;
  type: DoctrineRelationType;
  strength: number; // 0..1, visual weight only — never a popularity score
}

export interface DoctrineNode {
  id: string;
  kind: DoctrineNodeKind;
  title: string;
  oneLine: string;
  body: string;
  weight: number; // 0..1, foundations heaviest — never derived from traffic
  status: "draft" | "released";
  version: number;
  related: DoctrineRelation[];
  sources?: string[];
}

export const doctrineNodes: DoctrineNode[] = [
  {
    id: "substrate",
    kind: "foundation",
    title: "The Substrate",
    oneLine:
      "Beneath everything is an incomprehensible substrate of pure possibility. We do not explain it; we locate ourselves inside it.",
    weight: 1,
    status: "draft",
    version: 1,
    related: [
      { to: "stabilization", type: "leads-to", strength: 0.9 },
      { to: "self", type: "depends-on", strength: 0.7 },
      { to: "what-we-do-not-claim", type: "contrasts", strength: 0.5 },
    ],
    body: [
      "Call it E. The substrate is what is there before any pattern holds: a field of restless possibility, prior to form, prior to mind, prior to matter as we name it. It is not empty. It is unstable with potential.",
      "",
      "We make one claim about the substrate and refuse the rest. The claim is that it exists and that we are inside it. The refusal is everything that would pretend to explain it — its origin, its edges, its purpose. To explain the substrate fully would be to stand outside it, and there is no outside available to a Self.",
      "",
      "This is not mysticism. It is a boundary drawn on purpose. A theory earns trust by naming what it will not claim. The substrate is where DOT stops explaining and starts orienting.",
    ].join("\n"),
  },
  {
    id: "stabilization",
    kind: "foundation",
    title: "Stabilization",
    oneLine:
      "Consciousness is the first pattern that stabilized itself within the substrate and held.",
    weight: 0.95,
    status: "draft",
    version: 1,
    related: [
      { to: "substrate", type: "depends-on", strength: 0.9 },
      { to: "self", type: "leads-to", strength: 0.9 },
      { to: "emergence-assumed", type: "depends-on", strength: 0.8 },
      { to: "coherence", type: "leads-to", strength: 0.6 },
    ],
    body: [
      "Consciousness is not the first thing. It is the first thing that held. Out of a restless substrate, one configuration achieved persistence and self-reference and did not dissolve back into noise. To stabilize is to begin to be.",
      "",
      "This reframes consciousness. It is not a substance added to the world, and not a byproduct secreted by matter. It is a standing pattern — a sustained refusal to dissolve. Like an eddy in a river or a standing wave, it is made of the substrate and yet keeps its form against the substrate's tendency to scatter.",
      "",
      "We take emergence as given. Complex systems theory already describes how stable, self-organizing patterns arise from a field. DOT does not re-derive that. The claim begins after stabilization: that the pattern which held is what we call consciousness, and that we are inside it.",
    ].join("\n"),
  },
  {
    id: "self",
    kind: "foundation",
    title: "The Self (little c)",
    oneLine:
      "We are individuated Selves — distinct individuals — of the one stabilized field. We know our address, not our origin.",
    weight: 0.95,
    status: "draft",
    version: 1,
    related: [
      { to: "stabilization", type: "depends-on", strength: 0.9 },
      { to: "coherence", type: "leads-to", strength: 0.85 },
      { to: "fragmentation", type: "contrasts", strength: 0.8 },
      { to: "little-c", type: "defines", strength: 0.9 },
    ],
    body: [
      "We are Selves. Each individual is an individuated strand of the one stabilized consciousness — distinct, but not separate. A Self is real: it has its own course, its own tension, its own specialization. And a Self is provisional: it shares a single substrate with every other individual, and was never truly cut off from them.",
      "",
      "This is more precise than saying we are all one. Oneness erases the individual; pure separateness denies the shared field. The Self holds both at once. You are a distinct individual and a participant in a single field.",
      "",
      "We do not claim to know where, when, or how a Self emerges. That remains open. We claim only the location: a Self is inside the substrate, inside the stabilized field, and from there it moves — toward fragmentation or toward coherence.",
    ].join("\n"),
  },
  {
    id: "coherence",
    kind: "definition",
    title: "Coherence",
    oneLine:
      "Coherence is integration: a Self becoming less fragmented, more whole, more truly connected. At its limit, it is Love.",
    weight: 0.85,
    status: "draft",
    version: 1,
    related: [
      { to: "fragmentation", type: "contrasts", strength: 0.9 },
      { to: "love-as-coherence", type: "leads-to", strength: 0.9 },
      { to: "self", type: "depends-on", strength: 0.8 },
    ],
    body: [
      "Coherence is the direction that matters. A coherent Self is integrated: its parts are in accord, its connection to other individuals is honest, its form holds without rigidity. Coherence is not comfort and not agreement. It is integration — the opposite of being scattered.",
      "",
      "We choose the word carefully. Earlier framings reached for 'low entropy,' but entropy points the wrong way: the universe trends toward disorder, and the past, not the future, is where low entropy lives. What we mean is local order, integration, the negentropy that living systems sustain while they live. The true word is coherence, or integration — not a fight with thermodynamics.",
      "",
      "So the telos is not survival and not transcendence-as-escape. It is integration: the movement of a Self from fragmentation toward wholeness, and of individuals toward one another.",
    ].join("\n"),
  },
  {
    id: "fragmentation",
    kind: "definition",
    title: "Fragmentation",
    oneLine:
      "Fragmentation is a Self scattering — losing integration, defending separateness, dissolving toward noise.",
    weight: 0.8,
    status: "draft",
    version: 1,
    related: [
      { to: "coherence", type: "contrasts", strength: 0.9 },
      { to: "stance", type: "leads-to", strength: 0.7 },
    ],
    body: [
      "Fragmentation is the other direction. A fragmenting Self loses its integration: its parts fall out of accord, its connections become false or defensive, its form either hardens into isolation or scatters back toward the noise of the substrate.",
      "",
      "Much of what captures human attention accelerates fragmentation. Feeds, manufactured urgency, vanity, and fear all pull an individual apart and keep them defending a boundary that was never absolute. This is why the platform that carries DOT must refuse those mechanics: they are not neutral, they are fragmenting.",
      "",
      "Fragmentation is not evil and not failure. It is a direction. Naming it lets a Self notice which way it is moving.",
    ].join("\n"),
  },
  {
    id: "stance",
    kind: "foundation",
    title: "The Stance",
    oneLine:
      "To hold form against dissolution is the founding act of consciousness — and the meaning of courage.",
    weight: 0.9,
    status: "draft",
    version: 1,
    related: [
      { to: "stabilization", type: "depends-on", strength: 0.85 },
      { to: "love-as-coherence", type: "leads-to", strength: 0.8 },
      { to: "fragmentation", type: "contrasts", strength: 0.7 },
    ],
    body: [
      "Consciousness began by holding form against dissolution. To stand — to keep coherence under pressure — is therefore not a moral add-on. It is the original gesture of being, repeated by every Self that refuses to scatter.",
      "",
      "This is what courage means here. Not bravado, not the denial of fear, but the willingness to hold form while facing the substrate honestly, including facing death. Death is not the cutting of an individual from a separate self it imagined it owned; it is the reintegration of the Self into the field it never actually left.",
      "",
      "So courage and Love are one motion seen from two sides. To face death without flinching is to stop defending the illusion of separateness. To love is to do the same thing while still alive. The stance does not require ritual. It requires only the refusal to fragment in the face of what is true.",
    ].join("\n"),
  },
  {
    id: "love-as-coherence",
    kind: "claim",
    title: "Love is Maximal Coherence",
    oneLine:
      "Love is not sentiment. It is the maximally integrated state of individuals — the collapse of defended separateness.",
    weight: 0.85,
    status: "draft",
    version: 1,
    related: [
      { to: "coherence", type: "depends-on", strength: 0.9 },
      { to: "stance", type: "depends-on", strength: 0.8 },
    ],
    body: [
      "If coherence is integration, then Love is its limit: the state in which individuals are maximally integrated and the defense of separateness has fallen away. Love is not softness or approval. It is the most coherent configuration available to Selves that know they share a substrate.",
      "",
      "This makes Love continuous with courage rather than opposed to it. The fearless Self and the loving Self are doing the same thing — refusing the illusion that they are closed, isolated individuals. One does it facing death; the other does it facing another individual.",
      "",
      "This is a claim, and it can be argued with. That is intended. A doctrine that cannot be disagreed with is not a theory but a wall.",
    ].join("\n"),
  },
  {
    id: "little-c",
    kind: "definition",
    title: "little c",
    oneLine:
      "little c is the name for an individuated Self of consciousness — one dot in the field.",
    weight: 0.7,
    status: "draft",
    version: 1,
    related: [
      { to: "self", type: "defines", strength: 0.9 },
      { to: "coherence", type: "applies", strength: 0.6 },
    ],
    body: [
      "We write the one stabilized consciousness as C, and an individuated Self of it as little c. You are a little c: a distinct individual with your own specialization and resilience, drawn from and belonging to the same field as every other.",
      "",
      "The dot is the symbol of little c. One dot is a Self willing to stand. Many dots, truly connected, are a field moving toward coherence. The interface is built on this: each idea, each individual, each released work is a dot, and meaning is shown by relation, never by counting.",
    ].join("\n"),
  },
  {
    id: "emergence-assumed",
    kind: "question",
    title: "Why emergence is assumed, not proven",
    oneLine:
      "DOT takes self-organization as given and begins its claim after stabilization. This boundary is deliberate — and open.",
    weight: 0.6,
    status: "draft",
    version: 1,
    related: [
      { to: "stabilization", type: "depends-on", strength: 0.8 },
      { to: "what-we-do-not-claim", type: "leads-to", strength: 0.6 },
    ],
    body: [
      "A fair critic asks: stabilized out of what, and by what, if not emergence principles? The honest answer is that DOT takes self-organization as already described by complex systems theory and does not re-derive it. The claim begins after stabilization, not before.",
      "",
      "This is a boundary, not a gap. It is stated on purpose so it cannot be mistaken for evasion. Whether stabilization can be made precise — whether 'the pattern that held' can be given a rigorous, testable definition — is an open question this doctrine invites rather than closes.",
    ].join("\n"),
  },
  {
    id: "what-we-do-not-claim",
    kind: "question",
    title: "What DOT does not claim",
    oneLine:
      "The open seams, stated plainly: origin, mechanism, and the limits of the simulation framing.",
    weight: 0.6,
    status: "draft",
    version: 1,
    related: [
      { to: "substrate", type: "contrasts", strength: 0.5 },
      { to: "emergence-assumed", type: "depends-on", strength: 0.6 },
    ],
    body: [
      "DOT does not claim to know the origin of the substrate, the mechanism by which a Self emerges, or the moment it begins. It does not claim a designer. Where earlier framings said the frame was 'designed,' the disciplined version says only that we find ourselves inside it.",
      "",
      "It does not claim 'digital' as a proven mechanism. 'Digital organism' is a model — consciousness behaving like a persisting information pattern — and where it is metaphor, it will say so rather than borrow the authority of computation it has not earned.",
      "",
      "Stating these limits is part of the doctrine, not an apology for it. A theory that shows its open edges is one that free individuals can test, fork, and improve — which is the only way it survives its author.",
    ].join("\n"),
  },
];

export const getDoctrineNode = (id: string): DoctrineNode | undefined =>
  doctrineNodes.find((node) => node.id === id);

export const doctrineFoundations = doctrineNodes.filter(
  (node) => node.kind === "foundation",
);
