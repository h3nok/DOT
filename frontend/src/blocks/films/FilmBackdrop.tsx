import { useId } from "react";

import { tourPartAt } from "./conceptTour";
import { FilmAtmosphere, type FilmTone } from "./DarkFilmTrailer";
import { originalDarkFilmTime } from "./darkFilmRevision";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (t: number, start: number, end: number) => {
  const u = clamp01((t - start) / (end - start));
  return u * u * (3 - 2 * u);
};
/** Where each concept's light settles: somewhere new every time, never in the same corner twice. */
const lightAt = (n: number) => [800 + 430 * Math.sin(n * 2.1), 430 + 170 * Math.cos(n * 1.7)] as const;

/**
 * Behind the seventeen concepts: slow light that moves to a new place for each one, dust in
 * the air, and a clear passage between concepts — a band of light crossing the frame, with the
 * incoming concept's number large and faint behind it. Reduced motion keeps the light still.
 */
export function FilmBackdrop({ seconds, still, tone }: { seconds: number; still: boolean; tone: FilmTone }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const frame = originalDarkFilmTime(seconds);
  const part = tourPartAt(frame);
  const n = part.kind === "concept" ? part.position : part.kind === "interlude" ? 14.5 : 18;
  const t = still ? 0 : seconds;
  const into = still ? 1 : smooth(frame, part.start - 0.4, part.start + 2.4);
  const [fromX, fromY] = lightAt(n - 1);
  const [toX, toY] = lightAt(n);
  const x = fromX + (toX - fromX) * into + 40 * Math.sin(t * 0.07);
  const y = fromY + (toY - fromY) * into + 24 * Math.cos(t * 0.05);
  const warm = Math.round(n) % 2 === 0;
  // The passage between concepts: a band of light, crossing as one gives way to the next.
  const sweep = clamp01((frame - (part.start - 0.5)) / 1.3);
  const eased = sweep * sweep * (3 - 2 * sweep);
  const sweeping = !still && sweep > 0 && sweep < 1;
  const numeral = part.kind === "concept" ? String(part.position).padStart(2, "0") : null;
  const numeralShown = still ? 1 : smooth(frame, part.start, part.start + 1) * (1 - smooth(frame, part.end - 0.7, part.end));
  return (
    <div className="film-backdrop" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`${uid}-near`}>
            <stop offset="0" style={{ stopColor: warm ? "var(--film-gold)" : "var(--film-jade)", stopOpacity: 0.15 }} />
            <stop offset=".55" style={{ stopColor: "var(--film-jade)", stopOpacity: 0.05 }} />
            <stop offset="1" style={{ stopColor: "var(--film-jade)", stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={`${uid}-far`}>
            <stop offset="0" style={{ stopColor: "var(--film-jade)", stopOpacity: 0.08 }} />
            <stop offset="1" style={{ stopColor: "var(--film-jade)", stopOpacity: 0 }} />
          </radialGradient>
          <linearGradient id={`${uid}-band`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" style={{ stopColor: "var(--film-jade)", stopOpacity: 0 }} />
            <stop offset=".5" style={{ stopColor: "var(--film-jade)", stopOpacity: 0.2 }} />
            <stop offset="1" style={{ stopColor: "var(--film-jade)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <ellipse cx={x} cy={y} rx={640} ry={430} fill={`url(#${uid}-near)`} />
        <ellipse cx={1600 - x * 0.8} cy={900 - y * 0.85} rx={520} ry={360} fill={`url(#${uid}-far)`} />
        {numeral && (
          <text className="film-backdrop-numeral" x={1540 - 30 * into} y={800} textAnchor="end" opacity={(0.06 * numeralShown).toFixed(3)}>
            {numeral}
          </text>
        )}
        {sweeping && (
          <g opacity={Math.sin(Math.PI * sweep).toFixed(3)}>
            <rect x={-420 + 2440 * eased} y={0} width={420} height={900} fill={`url(#${uid}-band)`} />
            <rect x={-211 + 2440 * eased} y={0} width={2} height={900} style={{ fill: "var(--film-jade)" }} opacity={0.35} />
          </g>
        )}
      </svg>
      <FilmAtmosphere seconds={t} tone={tone} />
    </div>
  );
}
