export interface Project {
  slug: string;
  name: string;
  role: string;
  period: string;
  status: string;
  tagline: string;
  description: string;
  stack: string[];
  links: {
    repo?: string;
    live?: string;
    npm?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  gradient: string;
  glowColor: string;
}

export const siteConfig = {
  name: "Henok Ghebrechristos",
  tagline: "PhD in Computer Science · Digital Organism Theory",
  description:
    "Public profile and publication workspace for Henok Ghebrechristos, writer of Consciousness: A Digital Organism — source-backed writing, trust, and member-owned knowledge.",
  url: "",
  email: "",
  bio: "A writer and systems architect developing Digital Organism Theory alongside work in AI agent isolation, health transportation systems, and secure labor platforms.",
  social: {
    github: "https://github.com/hghebrechristos",
    linkedin: "https://linkedin.com/in/hghebrechristos",
    twitter: "https://twitter.com/hghebrechristos",
  },
  socials: {
    github: "https://github.com/hghebrechristos",
    linkedin: "https://linkedin.com/in/hghebrechristos",
    twitter: "https://twitter.com/hghebrechristos",
  },
  accentColor: "#2563eb",
  projects: [
    {
      slug: "stay",
      name: "Stay",
      role: "Architect & Lead Engineer",
      period: "2025–Present",
      status: "In Development",
      tagline: "Social profile and source-backed publication engine.",
      description:
        "Stay starts as a public founder profile, Book One reader, and source-derived concept map, then grows into an invite-only system for durable profiles, publication releases, private knowledge, and trusted circles without feeds, ads, or vanity counters.",
      stack: [
        "React",
        "Vite",
        "Flask prototype",
        "FastAPI orchestrator",
        "Tailwind CSS",
      ],
      links: {
        live: "/invite",
      },
      gradient: "linear-gradient(135deg, #0f766e 0%, #2563eb 100%)",
      glowColor: "rgba(20, 184, 166, 0.4)",
    },
    {
      slug: "dot",
      name: "Digital Organism Theory",
      role: "Creator & Systems Architect",
      period: "2024–Present",
      status: "Active Research",
      tagline: "A framework for consciousness and conscious authorship.",
      description:
        "Book One develops a bounded model of consciousness, conditioning, Reality Frames, the Canvas, the Painting, and Intent while keeping observations, hypotheses, and open debts distinct.",
      stack: [
        "Book One",
        "Systems Theory",
        "Consciousness Studies",
        "Source-backed Publishing",
      ],
      links: {
        repo: "https://github.com/hghebrechristos/DOT",
        live: "/",
      },
      gradient: "linear-gradient(135deg, #0f766e 0%, #2563eb 100%)",
      glowColor: "rgba(20, 184, 166, 0.4)",
    },
    {
      slug: "sullix",
      name: "Sullix",
      role: "Full Stack Developer",
      period: "2024",
      status: "Production",
      tagline: "Decentralized labor and secure escrow platform.",
      description:
        "A secure digital workforce marketplace. By automating project scoping via Zod schemas and matching candidates via high-dimensional semantic routing, Sullix secures transaction flows with cryptographic escrow protocols.",
      stack: ["React", "Zod", "Web3", "Node.js", "TypeScript"],
      links: {
        repo: "https://github.com/hghebrechristos/sullix",
        live: "/",
      },
      gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
      glowColor: "rgba(6, 182, 212, 0.4)",
    },
    {
      slug: "medroute",
      name: "Avia / MedRoute",
      role: "Platform Lead",
      period: "2023–2024",
      status: "Production / Audited",
      tagline: "HIPAA-compliant dynamic medical transport dispatcher.",
      description:
        "A secure enterprise routing suite for non-emergency medical transportation. Integrating encrypted healthcare portals, PostgreSQL row-level security policy isolation, and Google Maps API telemetry to optimize vehicle dispatching.",
      stack: ["React Native", "Spring Boot", "PostgreSQL", "Google Maps"],
      links: {
        repo: "https://github.com/hghebrechristos/medroute",
      },
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      glowColor: "rgba(16, 185, 129, 0.4)",
    },
    {
      slug: "hki",
      name: "Hermetic Knowledge Isolation",
      role: "Lead Security Engineer",
      period: "2024–2025",
      status: "Production (Enterprise)",
      tagline: "The security standard for agentic tool isolation.",
      description:
        "The control framework for the agentic era. Enforces signed-domain runtimes, rigid Model Context Protocol data streams, and short-lived isolated container environments to prevent prompt breakout attacks on enterprise LLM agents.",
      stack: ["TypeScript", "Python", "Docker", "Model Context Protocol"],
      links: {
        repo: "https://github.com/hghebrechristos/hki",
        npm: "@hki/runtime",
      },
      gradient: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
      glowColor: "rgba(245, 158, 11, 0.4)",
    },
  ] as Project[],
};

export type SiteConfig = typeof siteConfig;
export default siteConfig;
