import type { ReactNode } from "react";
import { LevelMark } from "./Level";
import type { ClaimLevel, InquiryQuote } from "./types";

type HeadingLevel = 1 | 2 | 3;

/**
 * A sentence quoted from the work, with the passage it comes from one click
 * away. As a heading it stays a real heading (for navigation by headings); as a
 * passage it is a blockquote whose `cite` names the same address.
 */
export function Cited({ quote, levels, heading, size = "line", id, children }: {
  quote: InquiryQuote;
  /** The work's levels, used to draw `quote.level`. */
  levels?: ReadonlyArray<ClaimLevel>;
  /** Render the sentence as an h1, h2 or h3. */
  heading?: HeadingLevel;
  size?: "display" | "statement" | "line";
  id?: string;
  /** Anything that belongs between the sentence and its source. */
  children?: ReactNode;
}) {
  const level = quote.level ? levels?.find((item) => item.id === quote.level) : undefined;
  const source = (
    <p className="inq-source">
      {level && <LevelMark level={level} />}
      <a href={quote.source.href}>{quote.source.label}</a>
    </p>
  );
  if (heading) {
    const Tag = `h${heading}` as const;
    return (
      <div className="inq-cited" data-size={size}>
        <Tag id={id} className="inq-cited-text">{quote.text}</Tag>
        {children}
        {source}
      </div>
    );
  }
  return (
    <figure className="inq-cited" data-size={size} id={id}>
      <blockquote cite={quote.source.href}><p className="inq-cited-text">{quote.text}</p></blockquote>
      {children}
      <figcaption>{source}</figcaption>
    </figure>
  );
}
