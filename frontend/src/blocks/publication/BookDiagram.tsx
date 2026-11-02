import { useId, type ReactNode } from "react";
import { Pause, RotateCcw, Play } from "lucide-react";
import type { BookFigureData } from "../../attention-os/reader/BookFigure";
import { useIllustrationPlayback } from "../../attention-os/reader/useIllustrationPlayback";
import "./book-illustrations.css";

const progress = (t: number, start: number, end = start + 1.5) => {
  const u = Math.min(1, Math.max(0, (t - start) / (end - start)));
  return u * u * (3 - 2 * u);
};

function Label({ x, y, children, small = false, anchor = "middle" }: { x: number; y: number; children: ReactNode; small?: boolean; anchor?: "middle" | "start" }) {
  return <text x={x} y={y} textAnchor={anchor} className={small ? "book-diagram-label book-diagram-label--small" : "book-diagram-label"}>{children}</text>;
}

function Body({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-model-role="living-body" className="book-diagram-body">
    <circle cy="-49" r="14" />
    <path d="M-10-31Q-27-27-29-7L-31 23Q-31 30-24 30L-18 0L-16 26L-18 68H-5L0 31L5 68H18L16 26L18 0L24 30Q31 30 31 23L29-7Q27-27 10-31Z" />
    <circle className="book-diagram-point" cy="-15" r="4" />
  </g>;
}

function Flow({ d, t, at, arrow, both = false, role }: { d: string; t: number; at: number; arrow: string; both?: boolean; role?: string }) {
  const p = progress(t, at);
  return <path data-model-role={role} className="book-diagram-flow" d={d} pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - p} visibility={p === 0 ? "hidden" : undefined} markerEnd={`url(#${arrow})`} markerStart={both ? `url(#${arrow})` : undefined} />;
}

function Painting({ x, y, t, at = 3, scale = 1 }: { x: number; y: number; t: number; at?: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-model-role="painting">
    {["M0 20C24-8 50 48 76 20S119 0 150 20", "M0 36C25 60 53 0 79 30S124 53 150 34", "M0 52C38 18 60 69 90 44S129 19 150 49"].map((d, i) => <path key={d} d={d} className={`book-diagram-paint book-diagram-paint--${i}`} pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - progress(t, at + i * .7)} visibility={t <= at + i * .7 ? "hidden" : undefined} />)}
  </g>;
}

function Canvas({ x, y, width = 210, t, at = 3 }: { x: number; y: number; width?: number; t: number; at?: number }) {
  return <g data-model-role="canvas">
    <rect className="book-diagram-canvas" x={x} y={y} width={width} height="140" rx="16" />
    <Label x={x + width / 2} y={y + 43}>Canvas</Label>
    <Painting x={x + 25} y={y + 60} scale={(width - 50) / 150} t={t} at={at} />
  </g>;
}

function Local({ x, y, t, scope = false, radius = 40 }: { x: number; y: number; t: number; scope?: boolean; radius?: number }) {
  return <g data-model-role="little-c">
    {scope && <circle className="book-diagram-scope" cx={x} cy={y} r="72" />}
    <circle className="book-diagram-local" cx={x} cy={y} r={radius} />
    <circle className="book-diagram-point" cx={x} cy={y} r={5 + 2 * progress(t, 5, 9)} />
  </g>;
}

function EmbodiedExchange({ t, arrow }: ArtProps) {
  return <>
    <rect className="book-diagram-world" data-model-role="reality-frame" x="35" y="185" width="230" height="330" rx="24" />
    <Label x={150} y={235}>RF₀</Label><Body x={150} y={355} scale={1.3} /><Label x={150} y={475}>Living body</Label>
    <Label x={440} y={75}>Little c</Label><Local x={440} y={140} t={t} />
    <Canvas x={335} y={340} t={t} />
    <Flow d="M265 288C335 288 340 140 389 140" t={t} at={1} arrow={arrow} role="reality-stream" />
    <Label x={320} y={195} small>RS</Label>
    <Flow d="M440 190V325" t={t} at={4} arrow={arrow} both role="access-update" />
    <Label x={453} y={262} small anchor="start">Access</Label><Label x={453} y={293} small anchor="start">/ update</Label>
    <Flow d="M276 377H322" t={t} at={7} arrow={arrow} both role="body-canvas-coupling" />
    <Label x={300} y={545} small>Experience ↔ response</Label>
    <Label x={300} y={595} small>Embodied life and carried state</Label>
  </>;
}

const STEPS = [["Receive", "A moment arrives"], ["Interpret", "Through the Painting"], ["Notice", "Available responses"], ["Form Intent", "Commit to a response"], ["Act", "Through the living body"], ["Meet consequence", "Encounter what follows"], ["Carry change", "The next moment meets new state"]];
function ExperienceLoop({ t, arrow }: ArtProps) {
  return <>
    <Flow d="M548 630H572V29H88V48" t={t} at={11} arrow={arrow} role="retained-change" />
    {STEPS.map(([name, detail], i) => <g key={name} data-model-role={`experience-step-${i + 1}`}>
      <rect className="book-diagram-step" x="43" y={55 + i * 88} width="500" height="74" rx="14" />
      <circle className="book-diagram-step-point" cx="75" cy={92 + i * 88} r="7" opacity={.2 + .8 * progress(t, i * 1.7)} />
      <Label x={102} y={84 + i * 88} anchor="start">{name}</Label>
      <Label x={102} y={114 + i * 88} anchor="start" small>{detail}</Label>
      {i < 6 && <Flow d={`M75 ${130 + i * 88}V${141 + i * 88}`} t={t} at={i * 1.7 + .7} arrow={arrow} />}
    </g>)}
  </>;
}

function Architecture({ t, arrow }: ArtProps) {
  return <>
    <Label x={300} y={33}>T × E · Speculation</Label><Label x={300} y={70} small>Preexisting conditions for Big C</Label>
    <rect className="book-diagram-organism" data-model-role="big-c" x="25" y="105" width="550" height="540" rx="100" opacity={.3 + .7 * progress(t, 1)} />
    <Label x={300} y={157}>Big C</Label>
    <g opacity={progress(t, 3)} data-model-role="reality-frame"><rect className="book-diagram-world" x="55" y="225" width="235" height="335" rx="24" /><Body x={172} y={403} scale={1.3} /></g>
    <Label x={172} y={275}>RF₀</Label><Label x={172} y={522} small>Living body</Label>
    <Label x={435} y={235}>Little c</Label><g opacity={progress(t, 5)}><Local x={435} y={320} t={t} scope /></g>
    <Flow d="M300 320H383" t={t} at={6.5} arrow={arrow} role="reality-stream" /><Label x={337} y={294} small>RS</Label>
    <Flow d="M435 395V438" t={t} at={8} arrow={arrow} both role="access-update" /><Canvas x={335} y={450} width={200} t={t} at={9} />
    <Label x={300} y={690} small>RF₀ and Little c are within Big C.</Label>
  </>;
}

function RealityStream({ t, arrow }: ArtProps) {
  return <>
    <rect className="book-diagram-organism" data-model-role="big-c" x="25" y="30" width="550" height="640" rx="55" /><Label x={300} y={78}>Big C</Label>
    <g data-model-role="reality-frame"><rect className="book-diagram-world" x="65" y="105" width="470" height="245" rx="24" /><Label x={300} y={150}>RF₀</Label><Label x={300} y={188} small>A shared, lawful world</Label><Body x={300} y={264} /></g>
    <Flow d="M185 360V420" t={t} at={1} arrow={arrow} role="reality-stream" /><Label x={220} y={402} small anchor="start">Reality Stream</Label>
    <Local x={185} y={475} t={t} /><Label x={185} y={552}>Little c</Label>
    <Flow d="M235 475H318" t={t} at={5} arrow={arrow} both role="access-update" /><Canvas x={330} y={435} width={205} t={t} at={7} />
    <Label x={300} y={625} small>Situated input. Accumulated interpretation.</Label>
  </>;
}

function Scope({ t, arrow }: ArtProps) {
  return <>
    <rect className="book-diagram-organism" data-model-role="big-c" x="20" y="20" width="560" height="620" rx="45" /><Label x={300} y={70}>Big C</Label>
    <rect className="book-diagram-scope" data-model-role="scope" x="290" y="185" width="270" height="420" rx="70" /><Label x={425} y={155}>Scope</Label>
    <rect className="book-diagram-world" data-model-role="reality-frame" x="42" y="245" width="216" height="285" rx="20" /><Label x={150} y={293}>RF₀</Label><Body x={150} y={406} /><Label x={150} y={496} small>Living body</Label>
    <Label x={425} y={259}>Little c</Label><Local x={425} y={337} t={t} />
    <Flow d="M270 337H373" t={t} at={1} arrow={arrow} role="reality-stream" /><Label x={315} y={313} small>RS</Label>
    <Flow d="M425 389V430" t={t} at={4} arrow={arrow} both role="access-update" /><Canvas x={325} y={440} width={200} t={t} at={6} />
    <Label x={300} y={687} small>Notice distinctions. Consider responses.</Label><Label x={300} y={725} small>Choose within available access and action.</Label>
  </>;
}

function ThreeRoles({ t, arrow }: ArtProps) {
  return <>{[
    ["Canvas", "Capacity to carry", "and update state"],
    ["Painting", "The organization", "carried within it"],
    ["Character", "Patterns expressed", "through repeated action"],
  ].map(([title, first, second], i) => <g key={title} transform={`translate(0 ${i * 225})`} className={`book-diagram-role--${i}`} data-model-role={title.toLowerCase()}>
    <rect className="book-diagram-step" x="25" y="20" width="550" height="200" rx="20" />
    <Label x={50} y={75} anchor="start">{title}</Label><Label x={50} y={122} small anchor="start">{first}</Label><Label x={50} y={156} small anchor="start">{second}</Label>
    <rect className="book-diagram-canvas" x="350" y="58" width="185" height="112" rx="12" />
    <Painting x={365} y={83} t={t} at={i * 3} />
    {i === 2 && <Flow d="M442 176V203H548V130" t={t} at={10} arrow={arrow} role="repeated-action" />}
  </g>)}</>;
}

function Identification({ t, arrow }: ArtProps) {
  return <>{["I am this reaction.", "I notice this reaction."].map((quote, i) => <g key={quote} transform={`translate(0 ${i * 320})`} data-model-role={i === 0 ? "identified" : "noticing"}>
    <rect className="book-diagram-step" x="25" y="15" width="550" height="292" rx="20" /><Label x={300} y={62}>{quote}</Label>
    <circle className="book-diagram-reaction" cx="140" cy="163" r={i === 0 ? 48 : 48 + 18 * progress(t, 5, 11)} opacity={i === 0 ? .22 : .22 * (1 - progress(t, 5, 11))} />
    <Body x={140} y={167} /><Label x={140} y={278} small>Living body</Label>
    <Local x={430} y={148} radius={32} t={t} /><Label x={430} y={105} small>Little c</Label>
    <rect className="book-diagram-canvas" data-model-role="canvas" x="340" y="204" width="180" height="70" rx="12" /><Painting x={355} y={211} scale={1} t={14} />
    <Label x={430} y={299} small>Canvas</Label>
    <Flow d="M430 184V196" t={14} at={0} arrow={arrow} both role="access-update" />
    <Flow d="M185 193C240 220 260 244 329 244" t={14} at={0} arrow={arrow} both role="body-canvas-coupling" />
  </g>)}<Label x={300} y={684} small>The functional connection remains.</Label></>;
}

function Choice({ t, arrow }: ArtProps) {
  return <>
    <Label x={300} y={39}>One encounter</Label>
    <Label x={300} y={116}>Narrower field</Label>
    <rect className="book-diagram-choice" x="195" y="145" width="210" height="60" rx="30" /><Label x={300} y={185}>Defend</Label>
    {["Ask", "Wait", "Boundary"].map((name, i) => <g key={name} className="book-diagram-narrow-option"><rect className="book-diagram-step" x={25 + 190 * i} y="250" width="170" height="62" rx="15" /><Label x={110 + 190 * i} y={290} small>{name}</Label></g>)}
    <Flow d="M300 55V86" t={t} at={0} arrow={arrow} />
    <Label x={300} y={407}>Wider field</Label>
    {["Ask", "Boundary", "Wait", "Protection"].map((name, i) => {
      const x = i % 2 === 0 ? 30 : 330; const y = i < 2 ? 465 : 590;
      const path = i < 2 ? `M300 428H${x + 120}V${y - 12}` : `M300 428V563H${x + 120}V${y - 12}`;
      return <g key={name}><Flow d={path} t={t} at={4 + i * 1.4} arrow={arrow} /><rect className="book-diagram-choice" x={x} y={y} width="240" height="65" rx="18" /><Label x={x + 120} y={y + 43}>{name}</Label></g>;
    })}
    <Label x={300} y={710} small>More responses can become available.</Label>
  </>;
}

type ArtProps = { t: number; arrow: string };
const ART: Record<string, { height: number; Draw: (props: ArtProps) => ReactNode }> = {
  "avatar-canvas": { height: 630, Draw: EmbodiedExchange },
  "experience-loop": { height: 700, Draw: ExperienceLoop },
  architecture: { height: 725, Draw: Architecture },
  "reality-stream": { height: 700, Draw: RealityStream },
  "little-c-scope": { height: 760, Draw: Scope },
  "canvas-painting-character": { height: 700, Draw: ThreeRoles },
  "connection-and-identification": { height: 720, Draw: Identification },
  "fear-and-choice": { height: 745, Draw: Choice },
};

export function IllustrationControl({ playback, title }: { playback: ReturnType<typeof useIllustrationPlayback>; title: string }) {
  if (playback.still) return null;
  const Icon = playback.state === "complete" ? RotateCcw : playback.state === "paused" ? Play : Pause;
  return <div className="book-illustration-controls"><button type="button" onClick={playback.toggle} aria-label={`${playback.action}: ${title}`}><Icon aria-hidden="true" size={14} /><span>{playback.action}</span></button></div>;
}

export default function BookDiagram({ figure }: { figure: BookFigureData }) {
  const playback = useIllustrationPlayback();
  const id = useId().replaceAll(":", "");
  const arrow = `${id}-book-arrow`;
  const { height, Draw } = ART[figure.id];
  return <div ref={playback.ref} className="book-illustration" data-playback={playback.state} data-diagram={figure.id}>
    <svg className="book-diagram" viewBox={`0 0 600 ${height}`} role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-desc`}>
      <title id={`${id}-title`}>{figure.title}</title><desc id={`${id}-desc`}>{figure.alt}</desc>
      <defs><marker id={arrow} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path className="book-diagram-arrow" d="M2 1L8 5L2 9" /></marker></defs>
      <Draw t={playback.time} arrow={arrow} />
    </svg>
    <IllustrationControl playback={playback} title={figure.title} />
  </div>;
}

