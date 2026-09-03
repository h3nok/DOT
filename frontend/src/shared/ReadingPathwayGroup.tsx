import type { ReactNode } from "react";

interface ReadingPathwayGroupProps {
  title: string;
  description: string;
  tone?: "dot" | "external";
  className?: string;
  children: ReactNode;
}

export function ReadingPathwayGroup({
  title,
  description,
  tone = "external",
  className = "",
  children,
}: ReadingPathwayGroupProps) {
  return (
    <section className={`dot-pathway-group ${className}`} data-tone={tone}>
      <header className="dot-pathway-group__header home-theory-layer-reading-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}