import type { ReactNode } from "react";
import "./explainer.css";

/** Figures that are read together, laid side by side and stacked on narrow screens. */
export function FigureRow({ children, emphasis = "even" }: { children: ReactNode; emphasis?: "even" | "last" | "illustration" }) {
  return <div className={`explainer-figure-row explainer-figure-row--${emphasis}`}>{children}</div>;
}
