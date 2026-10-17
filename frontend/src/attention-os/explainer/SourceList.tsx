import { ArrowUpRight } from "lucide-react";
import "./explainer.css";

export interface ExplainerSource {
  id: string;
  title: string;
  url: string;
  note?: string;
}

/** Where the explanation comes from, each source with what it is used for. */
export function SourceList({ sources }: { sources: readonly ExplainerSource[] }) {
  return (
    <ul className="explainer-sources">
      {sources.map(source => (
        <li key={source.id}>
          <a href={source.url} rel="noreferrer">{source.title}<ArrowUpRight aria-hidden="true" /></a>
          {source.note && <p>{source.note}</p>}
        </li>
      ))}
    </ul>
  );
}
