import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import "./explainer.css";

/** The end of an explainer: what follows from it, and where to go next. One finite stop, never a feed. */
export function Handoff({ id, label, line, link, children }: {
  id: string;
  label: string;
  line: string;
  link?: { href: string; label: string };
  /** The next steps, as the publication's own controls. */
  children: ReactNode;
}) {
  return (
    <section className="explainer-handoff" id={id} aria-label={label}>
      <p>{line}{link && <> <a href={link.href} rel="noreferrer">{link.label}<ArrowUpRight aria-hidden="true" /></a></>}</p>
      <div className="explainer-handoff-actions">{children}</div>
    </section>
  );
}
