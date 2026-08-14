import { doctrineNodes } from "../doctrine/doctrineData";
import type {
  BookConceptDefinition,
  BookReleaseSection,
} from "./dotBookOne";

const aliasesByConcept: Readonly<Record<string, readonly string[]>> = {
  "subjective-data": [
    "The Subjective Data Principle",
    "Subjective Data Principle",
  ],
  "digital-organism": ["Digital Organism Theory", "Digital Organism"],
  "big-c": ["The Big C Hypothesis", "Big C"],
  "little-c": ["Little c"],
  "decoupling-principle": [
    "The Decoupling Principle",
    "Decoupling Principle",
  ],
  "reality-frame": ["Reality Frames", "Reality Frame"],
  "reality-stream": ["Reality Streams", "Reality Stream"],
  intent: ["Intent"],
  "experience-loop": ["The Experience Loop", "Experience Loop"],
  canvas: ["Canvas"],
  painting: ["Painting"],
  character: ["Character"],
  "fear-gating": ["Fear-Gating Principle", "Fear"],
  love: ["Love"],
  "conscious-authorship": ["Conscious Authorship"],
};

const conceptIdsBySection: Readonly<Record<string, readonly string[]>> = {
  preface: ["subjective-data", "fear-gating", "love"],
  "the-digital-organism": [
    "digital-organism",
    "big-c",
    "little-c",
    "reality-frame",
    "canvas",
    "intent",
    "limit-of-knowledge",
  ],
  "the-decoupling-principle": [
    "decoupling-principle",
    "rendering-latency",
    "little-c",
    "intent",
    "experience-loop",
    "canvas",
    "painting",
  ],
  "architecture-of-continuity": [
    "big-c",
    "little-c",
    "reality-frame",
    "reality-stream",
  ],
  "reality-frames": [
    "reality-frame",
    "reality-stream",
    "little-c",
    "painting",
    "intent",
  ],
  "the-canvas": [
    "canvas",
    "painting",
    "character",
    "experience-loop",
    "subjective-data",
    "fear-gating",
    "intent",
  ],
  "the-painting": [
    "painting",
    "canvas",
    "character",
    "conscious-authorship",
    "fear-gating",
    "love",
    "intent",
  ],
};

const definitionsById = new Map<string, BookConceptDefinition>(
  doctrineNodes.map((node) => {
    const paragraphs = node.body.split("\n\n");
    return [
      node.id,
      {
        id: node.id,
        title: node.title,
        aliases: aliasesByConcept[node.id] ?? [node.title],
        definition: node.oneLine,
        context: paragraphs[0] ?? node.oneLine,
        boundary: paragraphs.at(-1) ?? node.oneLine,
        claimLevel: node.source.claimLevel,
        sourceHref: node.source.href,
        mapHref: `/doctrine/${node.id}`,
      },
    ];
  }),
);

definitionsById.set("rendering-latency", {
  id: "rendering-latency",
  title: "Rendering Latency",
  aliases: ["Rendering Latency"],
  definition:
    "The hypothesized minimal interval between Intent in Little c and the first measurable bodily change recruited for execution.",
  context:
    "DOT uses Rendering Latency to name its proposed handoff between authorship and physiology. The term defines a claim; it does not report an observed interval.",
  boundary:
    "Current experiments do not independently measure the time at which Intent forms, so Rendering Latency remains a hypothesis.",
  claimLevel: "Hypothesis",
  sourceHref:
    "/book/digital-organism-theory/the-decoupling-principle#rendering-latency",
  mapHref: "/doctrine/decoupling-principle",
});

definitionsById.set("limit-of-knowledge", {
  id: "limit-of-knowledge",
  title: "The Limit of Knowledge",
  aliases: ["The Limit of Knowledge", "Limit of Knowledge"],
  definition:
    "A restraint on certainty when a model is built from inside the existence it is trying to explain.",
  context:
    "A process embedded within a system may infer regularities and constraints, but it cannot assume that it has acquired a view from nowhere.",
  boundary:
    "The unknown is not permission to prefer any story. The Limit of Knowledge requires DOT to mark inference and speculation rather than promote them into fact.",
  claimLevel: "Model",
  sourceHref:
    "/book/digital-organism-theory/the-digital-organism#the-limit-of-knowledge",
  mapHref: "/doctrine/limits-and-debts",
});

/**
 * Keep each chapter's annotations finite. A concept is defined only on its
 * first use in that section, and every definition resolves to Book One.
 */
export function bookConceptsForSection(
  section: BookReleaseSection,
): BookConceptDefinition[] {
  return (conceptIdsBySection[section.slug] ?? []).flatMap((id) => {
    const definition = definitionsById.get(id);
    return definition ? [definition] : [];
  });
}
