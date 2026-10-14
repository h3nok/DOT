import type { Project } from "../../content/site.config";
import { TextLink } from "../../shared/design-system/Editorial";

/** A movement's purpose and founder credit precede the product built within it. */
export function MovementShowcase({ movement }: { movement: NonNullable<Project["movement"]> }) {
  return (
    <section
      id={`project-${movement.slug}`}
      aria-labelledby={`movement-${movement.slug}-title`}
      className="about-movement"
    >
      <div className="about-movement-artwork">
        <span className="about-movement-orbit" aria-hidden="true" />
        <img src={movement.artwork} alt={movement.artworkAlt} width={1024} height={1536} loading="lazy" decoding="async" />
        <p>{movement.subtitle}</p>
      </div>
      <div className="about-movement-copy">
        <p className="dot-label">{movement.category}</p>
        <div className="about-movement-identity">
          <h3 id={`movement-${movement.slug}-title`}>{movement.name}</h3>
          <p className="about-movement-role">{movement.role}</p>
        </div>
        <p className="about-movement-tagline">{movement.tagline}</p>
        <p className="about-movement-description">{movement.description}</p>
        <div className="about-movement-actions">
          <TextLink href={movement.href}>Explore {movement.name}</TextLink>
          <span className="about-movement-status">{movement.status}</span>
        </div>
      </div>
      <p className="about-movement-connection"><span aria-hidden="true" />{movement.relationship}</p>
    </section>
  );
}
