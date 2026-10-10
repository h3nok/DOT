import type { Project } from "../../content/site.config";

export function ProjectShowcase({ showcase }: { showcase: NonNullable<Project["showcase"]> }) {
  return (
    <div className="about-project-showcase">
      <div className="about-showcase-platform">
        <img src={showcase.brandMark} alt="Sullix mark" width={200} height={200} />
        <span>Sullix</span>
      </div>
      <div className="about-showcase-brand">
        <img src={showcase.mark} alt="Faro mark" width={160} height={160} className="about-showcase-mark" />
        <div>
          <p className="about-showcase-name">{showcase.agentName}</p>
          <p className="about-showcase-role">{showcase.agentRole}</p>
        </div>
      </div>
    </div>
  );
}
