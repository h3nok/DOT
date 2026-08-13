import { useId } from "react";

type DotEmergenceFieldProps = {
  variant?: "hero" | "cover";
  className?: string;
};

const organismState = [
  "0001000",
  "0011100",
  "0110110",
  "1101011",
  "1011101",
  "0111110",
  "0010100",
] as const;

const memoryState = "101101001011";

function Grid({ id, size }: { id: string; size: number }) {
  return (
    <defs>
      <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
        <path d={`M${size} 0H0V${size}`} className="dot-emergence-grid-line" />
        <circle cx="0" cy="0" r="1.25" className="dot-emergence-grid-dot" />
      </pattern>
    </defs>
  );
}

function StateMatrix({
  x,
  y,
  cell = 7,
  gap = 4,
}: {
  x: number;
  y: number;
  cell?: number;
  gap?: number;
}) {
  const width = organismState[0].length * (cell + gap) - gap;

  return (
    <g transform={`translate(${x - width / 2} ${y})`} className="dot-emergence-matrix">
      {organismState.flatMap((row, rowIndex) =>
        [...row].map((state, columnIndex) => (
          <rect
            key={`${rowIndex}-${columnIndex}`}
            x={columnIndex * (cell + gap)}
            y={rowIndex * (cell + gap)}
            width={cell}
            height={cell}
            rx="1.25"
            className={state === "1" ? "dot-emergence-fill" : undefined}
          />
        )),
      )}
    </g>
  );
}

function Memory({ x, y, gap = 20 }: { x: number; y: number; gap?: number }) {
  return (
    <g className="dot-emergence-memory">
      {[...memoryState].map((state, index) => (
        <rect
          key={`${state}-${index}`}
          x={x + index * gap}
          y={y}
          width="9"
          height="9"
          rx="1.5"
          className={state === "1" ? "dot-emergence-fill" : undefined}
        />
      ))}
    </g>
  );
}

function Stage({
  x,
  y,
  size,
  generation,
}: {
  x: number;
  y: number;
  size: number;
  generation: 1 | 2 | 3;
}) {
  const half = size / 2;
  const cut = Math.max(4, size * 0.14);
  const boundary = `M${x - half + cut} ${y - half} H${x + half - cut} L${x + half} ${
    y - half + cut
  } V${y + half - cut} L${x + half - cut} ${y + half} H${x - half + cut} L${
    x - half
  } ${y + half - cut} V${y - half + cut} Z`;

  return (
    <g className={`dot-emergence-stage dot-emergence-stage-${generation}`}>
      <path d={boundary} />
      {generation === 1 ? (
        <rect x={x - 3} y={y - 3} width="6" height="6" rx="1" className="dot-emergence-fill" />
      ) : null}
      {generation === 2 ? (
        <>
          <rect x={x - 14} y={y - 14} width="9" height="9" rx="1" />
          <rect x={x + 5} y={y - 14} width="9" height="9" rx="1" className="dot-emergence-fill" />
          <rect x={x - 14} y={y + 5} width="9" height="9" rx="1" className="dot-emergence-fill" />
          <rect x={x + 5} y={y + 5} width="9" height="9" rx="1" />
        </>
      ) : null}
      {generation === 3 ? <StateMatrix x={x} y={y - 35} /> : null}
    </g>
  );
}

function LocalProcess({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <g className="dot-emergence-local">
      <rect x={x - 18} y={y - 18} width="36" height="36" rx="8" />
      <circle cx={x} cy={y} r="4.5" className={active ? "dot-emergence-fill" : undefined} />
      <path d={`M${x - 26} ${y} H${x - 18} M${x + 18} ${y} H${x + 26}`} />
    </g>
  );
}

function FieldLabels({ compact = false }: { compact?: boolean }) {
  if (compact) return null;

  return (
    <g className="dot-emergence-labels">
      <text x="74" y="374">INFORMATION · xₜ</text>
      <text x="390" y="278">CURRENT STATE · Sₜ</text>
      <text x="875" y="374">RESPONSE · aₜ</text>
      <text x="956" y="208">CONSEQUENCE · Δₜ</text>
      <text x="766" y="136">NEXT STATE · Sₜ₊₁</text>
      <text x="496" y="614">RETAINED TRACE</text>
    </g>
  );
}

function HeroField({ id }: { id: string }) {
  const locals = [190, 330, 470, 730, 870, 1010];

  return (
    <svg
      viewBox="0 0 1200 720"
      preserveAspectRatio="xMidYMid slice"
      className="dot-emergence-desktop h-full w-full"
      aria-hidden="true"
    >
      <Grid id={id} size={40} />
      <rect width="1200" height="720" fill={`url(#${id})`} />
      <FieldLabels />

      <g className="dot-emergence-cascade">
        <path d="M600 52 V282" className="dot-emergence-spine" />
        <circle cx="600" cy="52" r="6" className="dot-emergence-seed" />
        <Stage x={600} y={98} size={30} generation={1} />
        <Stage x={600} y={160} size={54} generation={2} />
        <Stage x={600} y={246} size={100} generation={3} />
      </g>

      <g className="dot-emergence-frame">
        <path d="M382 292 H818 L850 324 V570 L818 602 H382 L350 570 V324 Z" />
        <path d="M406 314 H794 L828 348 V546 L794 580 H406 L372 546 V348 Z" />
        <path d="M350 348 H326 V392 M850 348 H874 V392 M350 546 H326 V502 M850 546 H874 V502" />
      </g>

      <g className="dot-emergence-inputs">
        <path d="M62 414 H214 V382 H350" />
        <circle cx="62" cy="414" r="5" />
        <rect x="116" y="409" width="10" height="10" rx="1.5" className="dot-emergence-fill" />
        <rect x="146" y="409" width="10" height="10" rx="1.5" />
        <rect x="176" y="409" width="10" height="10" rx="1.5" className="dot-emergence-fill" />
        <path d="M850 414 H990 V446 H1138" />
        <rect x="1008" y="441" width="10" height="10" rx="1.5" />
        <rect x="1038" y="441" width="10" height="10" rx="1.5" className="dot-emergence-fill" />
        <circle cx="1138" cy="446" r="5" className="dot-emergence-fill" />
      </g>

      <g className="dot-emergence-return">
        <path d="M1138 446 H1170 V176 H706 V246 H650" />
        <path d="M662 236 L650 246 L662 256" />
      </g>

      <Memory x={486} y={580} />

      <g className="dot-emergence-distribution">
        <path d="M600 602 V636 H190 M600 636 H1010" />
        {locals.map((x) => (
          <path key={x} d={`M${x} 636 V666`} />
        ))}
      </g>
      {locals.map((x, index) => (
        <LocalProcess key={x} x={x} y={684} active={index % 2 === 0} />
      ))}

      <circle r="4" className="dot-emergence-signal">
        <animateMotion
          dur="6s"
          repeatCount="indefinite"
          path="M62 414 H214 V382 H350 H850 H990 V446 H1138"
        />
      </circle>
      <circle r="3.5" className="dot-emergence-signal dot-emergence-signal-secondary">
        <animateMotion
          dur="8s"
          begin="-3s"
          repeatCount="indefinite"
          path="M1138 446 H1170 V176 H706 V246 H650"
        />
      </circle>
    </svg>
  );
}

function CompactField({ id, cover }: { id: string; cover: boolean }) {
  const width = cover ? 560 : 390;
  const height = cover ? 760 : 720;
  const center = width / 2;
  const frameLeft = cover ? 44 : 18;
  const frameRight = width - frameLeft;
  const frameTop = cover ? 250 : 228;
  const frameBottom = cover ? 696 : 684;
  const locals = cover ? [110, 220, 340, 450] : [58, 150, 240, 332];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      className={cover ? "h-full w-full" : "dot-emergence-mobile h-full w-full"}
      aria-hidden="true"
    >
      <Grid id={id} size={cover ? 28 : 30} />
      <rect width={width} height={height} fill={`url(#${id})`} />

      <path d={`M${center} 34 V${frameTop}`} className="dot-emergence-spine" />
      <circle cx={center} cy="42" r={cover ? 5 : 6} className="dot-emergence-seed" />
      <Stage x={center} y={86} size={cover ? 26 : 28} generation={1} />
      <Stage x={center} y={138} size={cover ? 46 : 50} generation={2} />
      <Stage x={center} y={204} size={cover ? 78 : 86} generation={3} />

      <g className="dot-emergence-frame">
        <path
          d={`M${frameLeft + 24} ${frameTop} H${frameRight - 24} L${frameRight} ${
            frameTop + 24
          } V${frameBottom - 24} L${frameRight - 24} ${frameBottom} H${
            frameLeft + 24
          } L${frameLeft} ${frameBottom - 24} V${frameTop + 24} Z`}
        />
        <path
          d={`M${frameLeft + 34} ${frameTop + 18} H${frameRight - 34} L${
            frameRight - 18
          } ${frameTop + 34} V${frameBottom - 34} L${frameRight - 34} ${
            frameBottom - 18
          } H${frameLeft + 34} L${frameLeft + 18} ${frameBottom - 34} V${
            frameTop + 34
          } Z`}
        />
      </g>

      <g className="dot-emergence-inputs">
        <path d={`M0 412 H${frameLeft}`} />
        <rect x="10" y="407" width="10" height="10" rx="1.5" className="dot-emergence-fill" />
        <rect x="30" y="407" width="10" height="10" rx="1.5" />
        <path d={`M${frameRight} 448 H${width}`} />
        <rect x={width - 40} y="443" width="10" height="10" rx="1.5" className="dot-emergence-fill" />
        <rect x={width - 20} y="443" width="10" height="10" rx="1.5" />
      </g>

      <Memory x={center - 110} y={frameBottom - 36} />
      <g className="dot-emergence-distribution">
        <path d={`M${center} ${frameBottom} V${frameBottom + 18} H${locals[0]} M${center} ${
          frameBottom + 18
        } H${locals[locals.length - 1]}`} />
        {locals.map((x) => (
          <path key={x} d={`M${x} ${frameBottom + 18} V${frameBottom + 34}`} />
        ))}
      </g>
      {locals.map((x, index) => (
        <LocalProcess key={x} x={x} y={frameBottom + 48} active={index % 2 === 0} />
      ))}
    </svg>
  );
}

export default function DotEmergenceField({
  variant = "hero",
  className,
}: DotEmergenceFieldProps) {
  const instance = useId().replace(/:/g, "");

  return (
    <div
      className={["dot-emergence-field", `dot-emergence-field--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      {variant === "hero" ? (
        <>
          <HeroField id={`dot-grid-desktop-${instance}`} />
          <CompactField id={`dot-grid-mobile-${instance}`} cover={false} />
        </>
      ) : (
        <CompactField id={`dot-grid-cover-${instance}`} cover />
      )}
    </div>
  );
}
