import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import "./explainer.css";

/**
 * A small line beside a figure: `source` says where numbers come from and what
 * they cannot show; `aside` gives an example, with a link to its record.
 */
export function Note({ children, kind = "aside", link }: { children: ReactNode; kind?: "source" | "aside"; link?: { href: string; label: string } }) {
  return (
    <p className={`explainer-note explainer-note--${kind}`}>
      {children}
      {link && <> <a href={link.href} rel="noreferrer">{link.label}<ArrowUpRight aria-hidden="true" /></a></>}
    </p>
  );
}
