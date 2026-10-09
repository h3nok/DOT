import { author, authorContact, type Author } from "./author";
import builderData from "./builder.json";
import careerData from "./career.json";
import { siteConfig, type Project } from "./site.config";

/** Shared public positioning; no invented biography or client history. */
export const builder = builderData;
export const career = careerData;

export const builderProjects = builder.projectOrder.map((slug) => {
  const project = siteConfig.projects.find((item) => item.slug === slug);
  if (!project) throw new Error(`Unknown portfolio project: ${slug}`);
  return project;
});

export const otherBuilderProjects = builder.otherProjects.map((slug) => {
  const project = siteConfig.projects.find((item) => item.slug === slug);
  if (!project) throw new Error(`Unknown portfolio project: ${slug}`);
  return project;
});

/** The native intake opens with project context; direct email remains on Contact. */
export function projectInquiryHref(): string {
  return "/contact?purpose=project";
}

export function resumeHref(source: Author = author): string {
  const url = source.resumeUrl?.trim();
  if (url && (/^https:\/\//.test(url) || /^\/(?!\/)/.test(url))) return url;
  const contact = authorContact(source);
  return contact.href.startsWith("mailto:")
    ? `${contact.href}?subject=${encodeURIComponent("Résumé request")}`
    : contact.href;
}

/** Only real destinations; private work stays descriptive. */
export function projectDestination(project: Project): { href: string; label: string } | null {
  if (project.links.live) return { href: project.links.live, label: "Explore project" };
  if (project.links.website) return { href: project.links.website, label: "Visit website" };
  if (project.links.repo) return { href: project.links.repo, label: "View source" };
  return null;
}
