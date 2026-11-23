import type { ReactNode } from "react";

/**
 * One concept on one screen (the binding layout rule). "paper" holds the
 * surface; "night" sits on a deeper band of the reader's own theme and reaches
 * the window's edges without widening the page. With `media`, the words and the
 * picture share the screen; on narrow screens the words come first.
 *
 * With `reveal`, a page that runs useReveal has the words arrive one after another
 * and the picture just after them, once, as the reader reaches the screen.
 */
export function Scene({ id, labelledBy, tone = "paper", media, reverse = false, align = "start", wide = false, reveal = false, children }: {
  id: string;
  /** The id of the heading that names this screen. */
  labelledBy: string;
  tone?: "paper" | "night";
  media?: ReactNode;
  reverse?: boolean;
  align?: "start" | "center";
  /** Let the words use the full reading frame, for figures and reference lists. */
  wide?: boolean;
  reveal?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className="inq-scene" data-tone={tone} data-align={align} data-wide={wide ? "true" : undefined}
      data-media={media ? "true" : undefined} data-reverse={reverse ? "true" : undefined} aria-labelledby={labelledBy}>
      <div className="inq-scene-frame">
        <div className="inq-scene-body" data-reveal={reveal ? "" : undefined} data-reveal-cascade={reveal ? "" : undefined}>{children}</div>
        {media && <div className="inq-scene-media" data-reveal={reveal ? "2" : undefined}>{media}</div>}
      </div>
    </section>
  );
}

/** The small line above a heading that says which part of the model a screen is about. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="inq-eyebrow">{children}</p>;
}
