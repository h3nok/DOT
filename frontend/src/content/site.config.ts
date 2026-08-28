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
  tagline: "Writing Digital Organism Theory",
  description:
    "Consciousness: A Digital Organism — Book One of Digital Organism Theory. Free to read, with its sources, its hypotheses, and its open questions kept visible.",
  url: "https://dotheory.org",
  email: "",
  bio: "I write about consciousness and conditioning, and build the software this site runs on. Book One is where that work currently stands — finished, but not settled.",
  social: {
    github: "https://github.com/h3nok",
    linkedin:
      "https://www.linkedin.com/in/henok-ghebrechristos-phd-793a1135",
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
      tagline: "A foundational architecture of reality and experience.",
      description:
        "Book One begins with fundamental consciousness and develops one derivation through Reality Frames, physical invariants, biological interfaces, conditioning, and conscious authorship while keeping its hypotheses and unfinished bridges visible.",
      stack: [
        "Book One",
        "Systems Theory",
        "Consciousness Studies",
        "Source-backed Publishing",
      ],
      links: {
        repo: "https://github.com/h3nok/DOT",
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
        "A marketplace for contract work: schema-checked project scoping, semantic matching between briefs and candidates, and escrow that releases on agreed milestones.",
      stack: ["React", "Zod", "Web3", "Node.js", "TypeScript"],
      links: {
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
      links: {},
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      glowColor: "rgba(16, 185, 129, 0.4)",
    },
    {
      slug: "hki",
      name: "Hermetic Knowledge Isolation",
      role: "Lead Security Engineer",
      period: "2024–2025",
      status: "Production (Enterprise)",
      tagline: "Isolation for agent tool calls.",
      description:
        "Runs LLM agent tools in short-lived, signed-domain containers with a constrained Model Context Protocol surface, so a prompt that escapes its task still cannot reach the host.",
      stack: ["TypeScript", "Python", "Docker", "Model Context Protocol"],
      links: {
        repo: "https://github.com/h3nok/HKI",
        npm: "@hki/runtime",
      },
      gradient: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
      glowColor: "rgba(245, 158, 11, 0.4)",
    },
  ] as Project[],
};

export type SiteConfig = typeof siteConfig;
export default siteConfig;
