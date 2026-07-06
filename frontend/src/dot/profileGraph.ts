import type { DotNode } from "./types";

/**
 * The seed graph for the home surface: Henok's profile, rendered as a Dot.
 *
 * The centre is the Self; the attributes are the worlds connected to it. Every
 * node carries its own substance (a `body`, optional `meta`, links, children),
 * so activating it blooms a content page from the centre of the graph. The tree
 * is fully editable at runtime and persisted; this file is the seed it grows
 * from. The model is recursive — any node with children is a surface of its own.
 */
const OWNER_NAME = "Henok";
const OWNER_ESSENCE = "Digital Organism";
const OWNER_CONTACT = "mailto:nkenok@gmail.com";

export const profileGraph: DotNode = {
  id: "self",
  label: OWNER_NAME,
  kind: "self",
  description: OWNER_ESSENCE,
  body: [
    "I'm Henok — a writer and systems architect building living software. My work sits where complex systems, consciousness, and trustworthy infrastructure meet.",
    "",
    "This profile is itself a digital organism: a graph you can explore, where every node opens into its own world. Ask it anything, or wander the dots.",
  ].join("\n"),
  meta: [
    { label: "Role", value: "Writer · Architect" },
    { label: "Field", value: "Digital Organisms" },
    { label: "Status", value: "Building" },
  ],
  children: [
    {
      id: "now",
      label: "Now",
      kind: "attribute",
      description: "What has my attention this season.",
      body: [
        "Right now I'm building Stay — the foundational technology of the DOT movement — toward its first public launch: a calm, source-backed presence and publishing surface.",
        "",
        "Alongside it, I'm writing the doctrine in public and refining Digital Organisms Theory. The throughline is the same: software that increases coherence instead of harvesting attention.",
      ].join("\n"),
      meta: [
        { label: "Focus", value: "Launching Stay" },
        { label: "Writing", value: "The doctrine" },
        { label: "Season", value: "2026" },
      ],
    },
    {
      id: "doctrine",
      label: "Doctrine",
      kind: "page",
      href: "/doctrine",
      description: "The laws that bind this place.",
      body: [
        "Digital Organisms Theory: consciousness as a pattern that stabilized itself within an incomprehensible substrate, and held.",
        "",
        "The doctrine is the first durable public object here — read as a graph, one idea at a time. Open it to enter the coherence surface.",
      ].join("\n"),
      meta: [
        { label: "Kind", value: "Released theory" },
        { label: "Surface", value: "Reading graph" },
      ],
    },
    {
      id: "library",
      label: "Library",
      kind: "attribute",
      surface: "publications",
      description: "Durable work, released to last.",
      body: "The publication library — long-form work released as stable, versioned objects rather than feed posts. Open it to read what's published.",
    },
    {
      id: "circle",
      label: "Circle",
      kind: "attribute",
      surface: "circle",
      description: "People connected by invitation.",
      body: "The circle grows one accepted invitation at a time — a held space, not a follower count. Open it to see who's connected.",
    },
    {
      id: "vault",
      label: "Vault",
      kind: "attribute",
      surface: "vault",
      description: "The knowledge ingestion chamber.",
      body: "Drop files and data here to feed the organism's memory.",
    },
    {
      id: "writing",
      label: "Writing",
      kind: "attribute",
      description: "Essays, notes, and longer work.",
      body: "Long-form work and shorter thoughts. The writing is where the theory is argued slowly, in public, without feed pressure.",
      children: [
        {
          id: "book",
          label: "The Book",
          kind: "attribute",
          description: "A long-form work, in progress.",
          body: [
            "A book on digital organisms — consciousness as a stabilized pattern, the Self as an individuated strand of it, and coherence as the direction that matters.",
            "",
            "Written to outlast its author: source-backed, versioned, and meant to be forked and argued with rather than merely consumed.",
          ].join("\n"),
          meta: [
            { label: "Form", value: "Long-form" },
            { label: "Status", value: "In progress" },
          ],
        },
        {
          id: "notes",
          label: "Notes",
          kind: "attribute",
          description: "Shorter thoughts, loosely held.",
          body: "Shorter thoughts, kept loosely. Fragments that may or may not become essays — the compost of the longer work.",
          meta: [{ label: "Form", value: "Fragments" }],
        },
      ],
    },
    {
      id: "work",
      label: "Work",
      kind: "attribute",
      description: "What I build, and why.",
      body: "Systems built around one belief: software should increase coherence, not harvest attention. Each project is a node — open it.",
      children: [
        {
          id: "stay",
          label: "Stay",
          kind: "attribute",
          description: "A presence + publishing platform.",
          body: [
            "Stay is the foundational technology of the DOT movement and its first use case: a calm presence and publishing platform built to increase coherence — not to harvest attention.",
            "",
            "It begins as a source-backed founder profile and doctrine surface, then grows into durable profiles, immutable publication releases, private knowledge, and trusted circles — without feeds, ads, or vanity counters.",
          ].join("\n"),
          meta: [
            { label: "Role", value: "Architect & Lead" },
            { label: "Status", value: "In development" },
            { label: "Stack", value: "React · FastAPI" },
          ],
        },
        {
          id: "dot",
          label: "DOT",
          kind: "attribute",
          description: "Continuous-space biological automata.",
          body: [
            "Digital Organisms Theory as a living simulation: a continuous-space biological cellular automaton modeling emergent life and collective consciousness.",
            "",
            "High-performance concurrent web workers and hardware-accelerated WebGL render thousands of adaptive agents in real time.",
          ].join("\n"),
          meta: [
            { label: "Role", value: "Creator" },
            { label: "Status", value: "Active research" },
            { label: "Stack", value: "TypeScript · WebGL" },
          ],
        },
        {
          id: "sullix",
          label: "Sullix",
          kind: "attribute",
          description: "Trustless escrow markets.",
          body: "A crypto escrow marketplace for trustless labor and exchange — value held in escrow until terms are met, without a custodial middleman.",
          meta: [
            { label: "Domain", value: "Crypto escrow" },
            { label: "Status", value: "Concept" },
          ],
        },
        {
          id: "medroute",
          label: "MedRoute",
          kind: "attribute",
          description: "HIPAA dispatch platform.",
          body: "A HIPAA-compliant medical dispatch platform (Avia/MedRoute) — routing care and transport with privacy guarantees baked into the architecture.",
          meta: [
            { label: "Domain", value: "Healthcare" },
            { label: "Status", value: "Built" },
          ],
        },
        {
          id: "hki",
          label: "HKI",
          kind: "attribute",
          description: "AI agent sandboxing.",
          body: "A sandbox for running AI agents safely — isolation, observability, and guardrails so autonomous agents can act without escaping their bounds.",
          meta: [
            { label: "Domain", value: "AI safety" },
            { label: "Status", value: "Research" },
          ],
        },
      ],
    },
    {
      id: "connect",
      label: "Connect",
      kind: "attribute",
      description: "Reach me directly.",
      body: "A narrow, deliberate signal path. Reach me where it makes sense — no funnel, no nurture loop.",
      children: [
        {
          id: "email",
          label: "Email",
          kind: "external",
          href: OWNER_CONTACT,
          description: "The most direct line.",
        },
        {
          id: "github",
          label: "GitHub",
          kind: "external",
          href: "https://github.com/hghebrechristos",
          description: "Code and projects.",
        },
        {
          id: "linkedin",
          label: "LinkedIn",
          kind: "external",
          href: "https://linkedin.com/in/hghebrechristos",
          description: "Professional history.",
        },
        {
          id: "twitter",
          label: "Twitter",
          kind: "external",
          href: "https://twitter.com/hghebrechristos",
          description: "Thinking out loud.",
        },
      ],
    },
  ],
};
