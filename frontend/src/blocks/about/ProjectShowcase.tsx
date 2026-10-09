import type { Project } from "../../content/site.config";

export function ProjectShowcase({ showcase }: { showcase: NonNullable<Project["showcase"]> }) {
  return (
    <figure className="about-project-showcase">
      <div className="about-showcase-brand">
        <img src={showcase.mark} alt="" width={160} height={160} className="about-showcase-mark" />
        <div>
          <p className="about-showcase-name">{showcase.agentName}</p>
          <p className="about-showcase-role">{showcase.agentRole}</p>
        </div>
      </div>
      <div className="about-showcase-screen">
        <img
          src={showcase.source}
          alt={showcase.alt}
          width={showcase.width}
          height={showcase.height}
          loading="lazy"
          decoding="async"
        />
      </div>
      <figcaption>{showcase.caption}</figcaption>
    </figure>
  );
}
