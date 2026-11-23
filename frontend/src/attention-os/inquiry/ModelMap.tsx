import { useState } from "react";
import type { ModelPart, ModelPlace } from "./types";

/**
 * A small mark of the whole model with one place lit: the dome above the line,
 * the line, a dot on the line, the band below it, or a dot that has left the
 * figure. Decorative: the words beside it carry the meaning.
 */
export function Locator({ lit }: { lit?: ModelPlace }) {
  const on = (place: ModelPlace) => (lit === place ? "true" : undefined);
  return (
    <svg className="inq-locator" viewBox="0 0 52 34" width="52" height="34" aria-hidden="true" focusable="false">
      <path className="inq-locator-dome" data-lit={on("above")} d="M4 16 A17 13 0 0 1 38 16" />
      <rect className="inq-locator-line" data-lit={on("line")} x="1" y="15.5" width="40" height="2" />
      <rect className="inq-locator-band" data-lit={on("below")} x="4" y="20" width="34" height="11" rx="1" />
      <circle className="inq-locator-dot" data-lit={on("on")} cx="15" cy="16.5" r="3.4" />
      {lit === "outside" && <circle className="inq-locator-dot" data-lit="true" cx="47" cy="16.5" r="3.4" />}
    </svg>
  );
}

function Region({ parts, place, active }: { parts: ReadonlyArray<ModelPart>; place: ModelPlace; active?: string }) {
  if (!parts.length) return null;
  return <>
    {parts.map((part) => (
      <div key={part.id} className={`inq-map-region inq-map-region--${place}`} data-active={active === part.id ? "true" : undefined}>
        <span className="inq-map-region-name">{part.name}</span>
        {part.members?.length ? <>{" "}<span className="inq-map-members">{part.members.map((member, index) => <span key={member}>{index ? " · " : ""}{member}</span>)}</span></> : null}
      </div>
    ))}
  </>;
}

/**
 * The whole model on one screen: the drawing (for the eye) beside the list of
 * its parts (for everyone). Pointing at or focusing a part lights its place in
 * the drawing; each part links to where it is developed. The drawing is hidden
 * from assistive technology because the list says everything it shows.
 */
export function ModelMap({ parts, label, caption, current }: {
  parts: ReadonlyArray<ModelPart>;
  label: string;
  caption?: string;
  /** The part this page is about, marked as the current location. */
  current?: string;
}) {
  const [pointed, setPointed] = useState<string | undefined>();
  const active = pointed ?? current;
  const at = (place: ModelPlace) => parts.filter((part) => part.place === place);
  const line = at("line")[0];
  const onLine = at("on");
  return (
    <figure className="inq-map" aria-label={label}>
      <div className="inq-map-figure" aria-hidden="true">
        <Region parts={at("above")} place="above" active={active} />
        <div className="inq-map-region inq-map-region--line" data-active={line && active === line.id ? "true" : undefined}>
          {onLine.map((part) => <span key={part.id} className="inq-map-dot" data-active={active === part.id ? "true" : undefined}><span>{part.name}</span></span>)}
          {line && <span className="inq-map-region-name">{line.name}</span>}
        </div>
        <Region parts={at("below")} place="below" active={active} />
        {at("outside").map((part) => (
          <div key={part.id} className="inq-map-region inq-map-region--outside" data-active={active === part.id ? "true" : undefined}>
            <span className="inq-map-dot" data-active={active === part.id ? "true" : undefined} />
            <span className="inq-map-region-name">{part.name}</span>
          </div>
        ))}
      </div>
      {caption && <figcaption className="inq-map-caption">{caption}</figcaption>}
      <ol className="inq-map-parts">
        {parts.map((part) => (
          <li key={part.id} data-active={active === part.id ? "true" : undefined}
            onMouseEnter={() => setPointed(part.id)} onMouseLeave={() => setPointed(undefined)}
            onFocus={() => setPointed(part.id)} onBlur={() => setPointed(undefined)}>
            <Locator lit={part.place} />
            <div>
              <a href={part.href} aria-current={current === part.id ? "location" : undefined}>{part.name}</a>
              <p>{part.summary}</p>
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
