import { useId, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import AMM from "../../content/amm.json";

const STATES = [
  { label: "Dependence", title: "Who controls the way in?", detail: "AMM begins with an essential interface: a home, a payment, a platform, a route to work. The question is who can set its terms—and whether people can refuse them.", top: "THE GATE", bottom: "PUBLIC LIFE" },
  { label: "Extraction", title: "What is left for the public?", detail: "The manifesto’s argument: recurring claims on labor, attention, and savings can accumulate into private power while the people sustaining it lose room to act.", top: "CONCENTRATED POWER", bottom: "THE HOST" },
  { label: "Parallel systems", title: "Can the terms be changed?", detail: "The proposed response is to build alternatives people can govern, inspect, and correct. Cooperation has to become an institution people can use.", top: "ACCOUNTABLE INSTITUTIONS", bottom: "SHARED CAPACITY" },
];

/** Reader-operated visual metaphor; positions do not encode quantities. */
export function AmmField() {
  const [selected, setSelected] = useState(0);
  const title = useId();
  const state = STATES[selected];
  return <section className="amm-field" aria-labelledby={title}>
    <div className="amm-field-art">
      <p className="amm-eyebrow">The slow erosion of the public</p>
      <svg viewBox="0 0 640 420" role="img" aria-label={`${state.label}: a visual metaphor for ${selected === 2 ? "resources circulating among communities and accountable institutions" : selected === 1 ? "public resources gathering around concentrated power" : "public life depending on a central gate"}. The positions are illustrative, not measured.`}>
        <defs><pattern id={`${title}-grid`} width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth=".4" opacity=".12" /></pattern></defs>
        <rect x="0" y="0" width="640" height="420" fill={`url(#${title}-grid)`} />
        <text x="320" y="38" textAnchor="middle" className="amm-field-label">{state.top}</text>
        <path className="amm-field-path" d={selected === 2 ? "M120 280 L320 110 L520 280 Z" : "M100 315 Q320 280 320 110 Q320 280 540 315"} />
        <rect className="amm-field-gate" x="280" y="70" width="80" height="80" rx={selected === 2 ? 40 : 0} />
        <path d="M306 110h28m-14-14v28" stroke="currentColor" opacity=".5" />
        {Array.from({ length: 54 }, (_, index) => {
          const col = index % 9, row = Math.floor(index / 9);
          const angle = index * 2.39996;
          const spread = 32 + Math.sqrt(index) * 11;
          const x = selected === 1 && index < 38 ? 320 + Math.cos(angle) * spread : selected === 2 ? 110 + (index % 3) * 210 + Math.cos(angle) * (28 + index % 6 * 4) : 96 + col * 56;
          const y = selected === 1 && index < 38 ? 112 + Math.sin(angle) * spread * .6 : selected === 2 ? 260 + Math.sin(angle) * (28 + index % 6 * 4) : 230 + row * 23;
          return <circle key={index} className="amm-field-particle" r={index % 5 === 0 ? 5 : 3} style={{ transform: `translate(${x}px, ${y}px)` }} />;
        })}
        <text x="320" y="390" textAnchor="middle" className="amm-field-label">{state.bottom}</text>
      </svg>
      <span className="amm-field-caption">A visual argument · no quantities or forecast implied</span>
    </div>
    <div className="amm-field-copy">
      <p className="amm-eyebrow">Follow the mechanism</p>
      <div className="amm-field-controls" role="group" aria-label="Explore erosion and alternatives">{STATES.map((item, index) => <button type="button" aria-pressed={selected === index} key={item.label} onClick={() => setSelected(index)}><span>0{index + 1}</span>{item.label}</button>)}</div>
      <div aria-live="polite"><h2 id={title}>{state.title}</h2><p>{state.detail}</p></div>
      {selected === 2 ? <a className="amm-text-link" href={AMM.artwork.movementUrl} rel="noreferrer">Explore 4Us <ArrowUpRight aria-hidden="true" /></a> : <Link className="amm-text-link" to="/essays/amm-chapter-two-the-leechs-anatomy">Read the anatomy →</Link>}
    </div>
  </section>;
}
