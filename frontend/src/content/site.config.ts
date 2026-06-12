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
  name: "Habte Ghebrechristos",
  tagline: "Venture Builder & Systems Architect",
  description: "Personal brand landing page, portfolio, and technical blog of Habte Ghebrechristos.",
  url: "https://habte.dev",
  email: "hello@habte.dev",
  bio: "A specialized Venture Builder & Systems Architect focused on AI Agent Sandboxing (HKI), Complex Evolution Simulators (DOT), HIPAA Dispatch Platforms (Avia/MedRoute), and Crypto Escrow Markets (Sullix). Developing continuous biological engines and trustless labor platforms.",
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
      tagline: "Ad-hoc peer-to-peer networking mesh.",
      description: "Stay reimagines physical connection zones through ad-hoc WebRTC mesh protocols, Zero-Knowledge proximity handshakes, and localized interest graphs to build highly secure, serendipitous communities without centralized tracing.",
      stack: ["React", "WebGL", "WebRTC", "Framer Motion", "Tailwind CSS"],
      links: {
        live: "/invite"
      },
      gradient: "linear-gradient(135deg, #0f766e 0%, #2563eb 100%)",
      glowColor: "rgba(20, 184, 166, 0.4)"
    },
    {
      slug: "dot",
      name: "Digital Organisms Theory",
      role: "Creator & Systems Architect",
      period: "2024–Present",
      status: "Active Research",
      tagline: "Continuous-space biological cellular automata.",
      description: "A continuous biological simulation platform modeling emergent life and collective consciousness. Utilizing high-performance concurrent Web Workers and hardware-accelerated WebGL visuals to simulate thousands of adaptive agents in real time.",
      stack: ["React", "TypeScript", "Three.js", "WebGL", "Web Workers"],
      links: {
        repo: "https://github.com/hghebrechristos/DOT",
        live: "/"
      },
      gradient: "linear-gradient(135deg, #0f766e 0%, #2563eb 100%)",
      glowColor: "rgba(20, 184, 166, 0.4)"
    },
    {
      slug: "sullix",
      name: "Sullix",
      role: "Full Stack Developer",
      period: "2024",
      status: "Production",
      tagline: "Decentralized labor and secure escrow platform.",
      description: "A secure digital workforce marketplace. By automating project scoping via Zod schemas and matching candidates via high-dimensional semantic routing, Sullix secures transaction flows with cryptographic escrow protocols.",
      stack: ["React", "Zod", "Web3", "Node.js", "TypeScript"],
      links: {
        repo: "https://github.com/hghebrechristos/sullix",
        live: "/"
      },
      gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
      glowColor: "rgba(6, 182, 212, 0.4)"
    },
    {
      slug: "medroute",
      name: "Avia / MedRoute",
      role: "Platform Lead",
      period: "2023–2024",
      status: "Production / Audited",
      tagline: "HIPAA-compliant dynamic medical transport dispatcher.",
      description: "A secure enterprise routing suite for non-emergency medical transportation. Integrating encrypted healthcare portals, PostgreSQL row-level security policy isolation, and Google Maps API telemetry to optimize vehicle dispatching.",
      stack: ["React Native", "Spring Boot", "PostgreSQL", "Google Maps"],
      links: {
        repo: "https://github.com/hghebrechristos/medroute"
      },
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      glowColor: "rgba(16, 185, 129, 0.4)"
    },
    {
      slug: "hki",
      name: "Hermetic Knowledge Isolation",
      role: "Lead Security Engineer",
      period: "2024–2025",
      status: "Production (Enterprise)",
      tagline: "The security standard for agentic tool isolation.",
      description: "The control framework for the agentic era. Enforces signed-domain runtimes, rigid Model Context Protocol data streams, and short-lived isolated container environments to prevent prompt breakout attacks on enterprise LLM agents.",
      stack: ["TypeScript", "Python", "Docker", "Model Context Protocol"],
      links: {
        repo: "https://github.com/hghebrechristos/hki",
        npm: "@hki/runtime"
      },
      gradient: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
      glowColor: "rgba(245, 158, 11, 0.4)"
    }
  ] as Project[]
};

export type SiteConfig = typeof siteConfig;
export default siteConfig;
