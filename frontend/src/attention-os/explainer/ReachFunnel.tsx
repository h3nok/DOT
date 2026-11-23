import type { CSSProperties, ReactNode } from "react";
import "./explainer.css";

export interface ReachLayer {
  id: string;
  title: string;
  /** Where the layer is explained, so the figure doubles as contents. */
  href?: string;
  /** The layer's colour, a role of the space's own. The last layer, the person's, is drawn solid in it. */
  fill?: string;
  /** The same colour at a strength that holds as ink, for the layer's pictures. */
  ink?: string;
  /** Pictures of what the layer holds; each may name itself in a <title>. The title carries the meaning. */
  icons?: readonly ReactNode[];
}

export interface ReachReturn {
  title: string;
  href?: string;
  /** What the person sends back up, lowest first: short published lines, drawn as speech. */
  voices?: readonly string[];
  /** The last words to arrive at the top, where the return rejoins the arrangement. */
  crown?: string;
}

const W = 480, FX = 24, FW = 324, CX = FX + FW / 2, TOP = 48, LH = 74, GAP = 6, NARROW = 0.05, RX = 410;
const est = (text: string, size: number) => text.length * size * 0.48;

/**
 * How something reaches one person, and how the person sends it back. Layers narrow
 * from a whole arrangement at the top to a person who bears them from below; what
 * travels down is named above; a line climbs from the person back to the top,
 * carrying what they say on its behalf. The person's colour is the return's colour.
 *
 * Every layer is a link named by its title, read top to bottom; the drawing is the
 * group they sit in. Words are drawn large enough to stay legible when it narrows.
 */
export function ReachFunnel({ layers, flow, back, label }: {
  layers: readonly ReachLayer[];
  flow: string;
  back: ReachReturn;
  label: string;
}) {
  const n = layers.length;
  const step = NARROW * FW;
  const y = (index: number) => TOP + index * (LH + GAP);
  const base = y(n) - GAP; // the bottom of the last layer, where the person's hands are
  const H = base + 178;
  const middle = TOP + LH / 2;
  const tip = FX + FW - step / 2; // the top layer's right edge at its middle
  const climb = { low: base + 46, high: middle + 24 };
  const voices = back.voices ?? [];
  const at = (index: number) => climb.low - 40 - index * ((climb.low - 40 - (climb.high + 50)) / Math.max(1, voices.length - 1));
  const person = layers[n - 1];
  const caption = <text x={W - 4} y={H - 12} textAnchor="end"><tspan className="explainer-reach-number">{String(n + 1).padStart(2, "0")}</tspan><tspan dx="7">{back.title}</tspan></text>;
  const body = (layer: ReachLayer, index: number) => {
    const inTop = index * step, inBottom = (index + 1) * step, top = y(index);
    const icons = layer.icons ?? [];
    const row = icons.length * 18 + Math.max(0, icons.length - 1) * 10;
    return (
      <g className="explainer-reach-layer" data-core={index === n - 1 ? "" : undefined} style={{ ["--ex-order" as string]: index, ["--reach-fill" as string]: layer.fill, ["--reach-ink" as string]: layer.ink ?? layer.fill } as CSSProperties}>
        <polygon className="explainer-reach-shape" points={`${FX + inTop},${top} ${FX + FW - inTop},${top} ${FX + FW - inBottom},${top + LH} ${FX + inBottom},${top + LH}`} />
        <line className={`explainer-reach-edge${index === 0 ? " explainer-reach-hold" : ""}`} x1={FX + inTop} y1={top} x2={FX + FW - inTop} y2={top} />
        <text className="explainer-reach-title" x={CX} y={top + (icons.length ? 31 : 43)} textAnchor="middle">
          <tspan className="explainer-reach-number">{String(index + 1).padStart(2, "0")}</tspan>
          <tspan dx="7">{layer.title}</tspan>
        </text>
        {icons.map((icon, at) => (
          <g key={at} className="explainer-reach-icon" transform={`translate(${CX - row / 2 + at * 28} ${top + 42}) scale(.75)`}>{icon}</g>
        ))}
      </g>
    );
  };
  return (
    <figure className="explainer-reach">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label}>
        <text className="explainer-reach-flow" x={FX} y={26}><tspan aria-hidden="true">↓ </tspan>{flow}</text>
        {layers.map((layer, index) => layer.href
          ? <a key={layer.id} href={layer.href} aria-label={layer.title}>{body(layer, index)}</a>
          : <g key={layer.id} role="img" aria-label={layer.title}>{body(layer, index)}</g>)}

        {/* The person who bears it: arms raised under the narrowest layer, knees bent. */}
        <g className="explainer-reach-bearer" aria-hidden="true" style={{ ["--reach-fill" as string]: person?.fill, ["--reach-ink" as string]: person?.ink ?? person?.fill } as CSSProperties}>
          <path d={`M${CX - 26} ${base + 3}L${CX - 34} ${base + 28}L${CX - 12} ${base + 50}H${CX + 12}L${CX + 34} ${base + 28}L${CX + 26} ${base + 3}`} />
          <circle cx={CX} cy={base + 34} r="10" />
          <path d={`M${CX} ${base + 50}V${base + 94}M${CX} ${base + 94}L${CX - 15} ${base + 115}L${CX - 21} ${base + 138}M${CX} ${base + 94}L${CX + 15} ${base + 115}L${CX + 21} ${base + 138}`} />
          <path className="explainer-reach-ground" d={`M${CX - 56} ${base + 140}H${CX + 56}`} />
        </g>

        {/* What the person sends back up: from their chest to the top layer, carrying their words. */}
        <g className="explainer-reach-return" style={{ ["--reach-fill" as string]: person?.fill, ["--reach-ink" as string]: person?.ink ?? person?.fill } as CSSProperties}>
          <path className="explainer-reach-climb" pathLength={1} aria-hidden="true"
            d={`M${CX + 22} ${base + 70}H${RX - 24}Q${RX} ${base + 70} ${RX} ${climb.low}V${climb.high}Q${RX} ${middle} ${RX - 24} ${middle}H${tip + 12}`} />
          <polygon className="explainer-reach-arrowhead" aria-hidden="true" points={`${tip + 2},${middle} ${tip + 13},${middle - 6} ${tip + 13},${middle + 6}`} />
          {voices.map((voice, index) => {
            const width = est(voice, 15) + 22;
            return (
              <g key={voice} className="explainer-reach-voice" style={{ ["--ex-order" as string]: index } as CSSProperties}>
                <rect x={Math.min(RX - width / 2, W - 2 - width)} y={at(index) - 15} width={width} height={30} rx={15} />
                <text x={Math.min(RX, W - 2 - width / 2)} y={at(index) + 5} textAnchor="middle">{voice}</text>
              </g>
            );
          })}
          {back.crown && <text className="explainer-reach-crown" x={W - 4} y={26} textAnchor="end">“{back.crown}”</text>}
          {/* Its step, beneath: the person carries it, and reinforces it. */}
          {back.href
            ? <a className="explainer-reach-back" href={back.href} aria-label={back.title}>{caption}</a>
            : <g className="explainer-reach-back">{caption}</g>}
        </g>
      </svg>
    </figure>
  );
}
