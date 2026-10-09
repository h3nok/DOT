import { author } from "./author";
import projectsData from "./projects.json";

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
  // The author's facts live in author.json, which the build script reads too.
  name: author.name,
  tagline: "Writing Digital Organism Theory",
  description:
    "The living intellectual home of Digital Organism Theory: definitions, diagrams, hypotheses, objections, experiments, essays, and fixed publications.",
  url: "https://dotheory.org",
  email: author.email,
  bio: author.summary,
  social: {
    github: author.links.github,
    linkedin: author.links.linkedin,
  },
  accentColor: "#2563eb",
  projects: projectsData as Project[],
};

export type SiteConfig = typeof siteConfig;
export default siteConfig;
