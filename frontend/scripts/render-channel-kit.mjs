import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { buildSetupPage, buildSetupText } from "./channel-setup-page.mjs";
import { loadBumperVideo, loadSplashVideo, renderBumperVideo, renderSplashVideo, SPLASH_CAPTIONS, SPLASH_TAGLINE } from "./channel-splash-video.mjs";
import { loadTrailerVideo, renderTrailerVideo } from "./channel-trailer-video.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUTPUT = path.join(ROOT, "design", "youtube");
const FFMPEG = process.env.DOT_FFMPEG || (existsSync("/tmp/dot-channel-video-tools/ffmpeg") ? "/tmp/dot-channel-video-tools/ffmpeg" : "ffmpeg");
// Load the same pure geometry on the repository's supported Node 20+, without
// duplicating it or requiring Node's newer native TypeScript loader.
const radialModule = ts.transpileModule(readFileSync(path.join(ROOT, "frontend", "src", "organism", "radialField.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { radialField } = await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(radialModule).toString("base64")}`);
const archModule = ts.transpileModule(readFileSync(path.join(ROOT, "frontend", "src", "blocks", "core", "home", "architectureGeometry.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const {
  ARCHITECTURE_RADII: R,
  FRAME_CENTRE,
  C1_OFFSET,
  C1_TRANSFORM,
  OTHER_FRAMES,
  OTHER_FRAME_ORBIT,
  OTHER_FRAME_RADIUS,
  membranePath,
} = await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(archModule).toString("base64")}`);
const IDENTITY = JSON.parse(readFileSync(path.join(ROOT, "frontend", "src", "content", "identity.json"), "utf8"));
const DEFAULT_AMM = JSON.parse(readFileSync(path.join(ROOT, "frontend", "src", "content", "amm.json"), "utf8"));
const INK = "#fbfaf4";
const PAPER = IDENTITY.light.ink;
const MINT = IDENTITY.light.accent;
const EMERALD = "#12966b";
const LUMEN = "#2ad89d";
const GOLD = "#d98218";
const MUTED = IDENTITY.light.muted;
const EDGE = "#cfe0d6";
const AMBER = "#c44516";

export const BANNER_SAFE_AREA = { x: 520, y: 520, width: 1520, height: 400 };

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

function text(x, y, value, size, family = "Space Grotesk", extra = "") {
  return `<text x="${x}" y="${y}" fill="${PAPER}" font-family="${family}" font-size="${size}" font-weight="${family === "Space Grotesk" ? 500 : 400}" ${extra}>${escapeXml(value)}</text>`;
}

function note(x, y, value, size = 18, extra = "") {
  return text(x, y, value, size, "JetBrains Mono", `letter-spacing="2" ${extra}`);
}

function mark(x, y, size) {
  return `<use href="#nucleus" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}"/>`;
}

function splashMark(x, y, size) {
  return `<use href="#splash-mark" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}"/>`;
}

function ammMark(x, y, size) {
  return `<use href="#amm-emblem" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}"/>`;
}

/**
 * Render DOT's canonical layered architecture (T × E → Big C → RF₀ & RF₁…RFₙ → Little c₁ & peers c₂…cₙ),
 * sharing the exact geometry of HeroArchitecture.tsx on a bright daylight surface.
 */
export function architectureDiagram(cx, cy, scale = 1.24, idPrefix = "arch") {
  const C1 = { x: FRAME_CENTRE.x + C1_OFFSET.x, y: FRAME_CENTRE.y + C1_OFFSET.y };
  const polarFrom = (centre, radius, angleDeg) => ({
    x: centre.x + Math.cos((angleDeg * Math.PI) / 180) * radius,
    y: centre.y + Math.sin((angleDeg * Math.PI) / 180) * radius,
  });
  const polar = (radius, angleDeg) => polarFrom(FRAME_CENTRE, radius, angleDeg);
  const arcFrom = (centre, radius, startDeg, endDeg) => {
    const start = polarFrom(centre, radius, startDeg);
    const end = polarFrom(centre, radius, endDeg);
    return `M${start.x.toFixed(1)} ${start.y.toFixed(1)}A${radius} ${radius} 0 0 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
  };
  const arcPath = (radius, startDeg, endDeg) => arcFrom(FRAME_CENTRE, radius, startDeg, endDeg);
  const loopPath = (radius, startDeg, endDeg) => {
    const start = polar(radius, startDeg);
    const end = polar(radius, endDeg);
    return `M${start.x.toFixed(1)} ${start.y.toFixed(1)}A${radius} ${radius} 0 1 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
  };
  const cell = (centre, radius, phase) => ({
    outer: membranePath(centre.x, centre.y, radius, { amplitude: radius * 0.075, lobes: 4, phase }),
    inner: membranePath(centre.x, centre.y, radius * 0.78, { amplitude: radius * 0.055, lobes: 4, phase: phase + 2 }),
  });

  const OUTER_LOOP = loopPath((R.membrane + R.origin) / 2, -70, 250);
  const INNER_LOOP = loopPath(52, 70, 350);
  const FIELD_CONTOURS = [R.origin + 8, R.origin + 20];
  const FIELD_ARCS = [[202, 256], [284, 338]];
  const FIELD_RAYS = [-142, -108, -74, -40, 34, 68, 102, 136];
  const INNER_MEMBRANE = R.bigC - 8;
  const MEMBRANE_BANDS = [R.bigC - 28, R.bigC - 16];

  const BIG_C_MEMBRANE_NODES = [-116, -72, -28, 18, 64, 112, 158, 204].map((angle, index) => {
    const p1 = polar(INNER_MEMBRANE, angle);
    const p2 = polar(R.bigC, angle);
    const r = index % 3 === 0 ? 3.5 : 2.6;
    return `<g data-big-c-node="${index}">
      <line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="#0d8a5e" stroke-width="1.35" stroke-linecap="round"/>
      <circle cx="${p2.x.toFixed(1)}" cy="${p2.y.toFixed(1)}" r="${r}" fill="#e6fbf3" stroke="#0b7a53" stroke-width="1.35"/>
      <circle cx="${p2.x.toFixed(1)}" cy="${p2.y.toFixed(1)}" r="${(r * 0.44).toFixed(2)}" fill="#0b7a53"/>
    </g>`;
  }).join("");

  const BIG_C_ORGANELLE_NODES = [-138, -94, -50, -6, 41, 88, 135, 181, 227].map((angle, index) => {
    const p = polar(R.membrane, angle);
    const r = index % 2 === 0 ? 2.3 : 1.7;
    return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r}" fill="#0b7a53" stroke="#ffffff" stroke-width="0.9"/>`;
  }).join("");

  const POLAR_TICKS = Array.from({ length: 24 }, (_, index) => {
    const angle = index * 15;
    const major = angle % 90 === 0;
    const intermediate = angle % 45 === 0;
    const p1 = polar(major ? 194 : intermediate ? 197.5 : 200.5, angle);
    const p2 = polar(207, angle);
    return `<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="${major ? "#142822" : "#52758c"}" stroke-width="${major ? "1.6" : "1.05"}" opacity="${major ? "0.9" : "0.58"}"/>`;
  }).join("");

  const RETICLES = [
    { x: 348, y: 155 },
    { x: 545, y: 352 },
    { x: 348, y: 549 },
    { x: 151, y: 352 },
  ].map(({ x, y }) => `<g stroke="#3b5e75" stroke-width="1.15" opacity="0.82">
    <line x1="${x - 4}" y1="${y}" x2="${x + 4}" y2="${y}"/>
    <line x1="${x}" y1="${y - 4}" x2="${x}" y2="${y + 4}"/>
  </g>`).join("");

  const latticeChords = (x, y, r) => {
    const chords = [];
    for (const direction of [0, 60, 120]) {
      const t = (direction * Math.PI) / 180;
      const [dx, dy, nx, ny] = [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t)];
      for (let offset = -r + 6; offset < r; offset += 9) {
        const half = Math.sqrt(r * r - offset * offset);
        const [ox, oy] = [x + nx * offset, y + ny * offset];
        chords.push(`M${(ox - dx * half).toFixed(1)} ${(oy - dy * half).toFixed(1)}L${(ox + dx * half).toFixed(1)} ${(oy + dy * half).toFixed(1)}`);
      }
    }
    return chords.join("");
  };

  const OTHER_FRAMES_SVG = OTHER_FRAMES.map(({ index, angle, rules }) => {
    const c = polar(OTHER_FRAME_ORBIT, angle);
    const inner = OTHER_FRAME_RADIUS - 4;
    let rulesSvg = "";
    if (rules === "lattice") {
      rulesSvg = `<g data-rfn-rules="lattice"><path d="${latticeChords(c.x, c.y, inner)}" fill="none" stroke="#365870" stroke-width="1.05" opacity="0.64"/></g>`;
    } else if (rules === "polar") {
      const spokes = Array.from({ length: 6 }, (_, idx) => {
        const p = polarFrom(c, inner, idx * 60);
        return `M${c.x.toFixed(1)} ${c.y.toFixed(1)}L${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      }).join("");
      rulesSvg = `<g data-rfn-rules="polar" fill="none" stroke="#365870" stroke-width="1.05" opacity="0.64">
        <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${(inner * 0.38).toFixed(1)}"/>
        <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${(inner * 0.72).toFixed(1)}"/>
        <path d="${spokes}"/>
      </g>`;
    }
    return `<g data-rfn-item="${index}">
      <g data-rfn-body="">
        <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${OTHER_FRAME_RADIUS}" fill="#f8fafb"/>
        ${rulesSvg}
        <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${OTHER_FRAME_RADIUS}" fill="none" stroke="#b86d0e" stroke-width="2" stroke-dasharray="3.5 3" stroke-linecap="round"/>
        <text x="${c.x.toFixed(1)}" y="${(c.y + 7).toFixed(1)}" text-anchor="middle" font-family="Space Grotesk" font-size="21" font-weight="700" fill="#183244" stroke="#ffffff" stroke-width="6.5" stroke-linejoin="round" paint-order="stroke fill">RF<tspan baseline-shift="sub" font-size="14">${index}</tspan></text>
      </g>
    </g>`;
  }).join("");

  const AWARENESS_RADIUS = 72;
  const C1_RADIUS = 28;
  const C1_CELL = cell(FRAME_CENTRE, C1_RADIUS, 0.4);
  const OPTION_ANGLES = [192, 256, 286];
  const CONSTRAINT_ANGLES = [146, 226, 322];
  const AWARENESS_TRACE_D = "M353 358C366 374 378 392 391 410";
  const POTENTIAL_TRACE_D = "M391 410C408 438 426 474 448 510";
  const THREAD_D = `${AWARENESS_TRACE_D}C408 438 426 474 448 510`;

  const SOCIAL_CENTRES = [
    { index: "2", x: 413, y: 230, awareness: 15, relation: "cooperation" },
    { index: "3", x: 505, y: 285, awareness: 20, relation: "pressure" },
    { index: "4", x: 236, y: 265, awareness: 12, relation: "pressure" },
    { index: "n", x: 478, y: 462, awareness: 10, relation: "none" },
  ];

  const PEERS = SOCIAL_CENTRES.map((peer, order) => {
    const angle = (Math.atan2(peer.y - C1.y, peer.x - C1.x) * 180) / Math.PI;
    return {
      ...peer,
      angle,
      phase: order * 1.9,
      cell: cell(peer, 7.5, order * 1.9),
      from: polarFrom(peer, peer.awareness + 4, angle + 180),
      to: polarFrom(C1, AWARENESS_RADIUS + 5, angle),
      brightening: [
        arcFrom(C1, AWARENESS_RADIUS, angle - 8, angle + 8),
        arcFrom(peer, peer.awareness, angle + 180 - 30, angle + 180 + 30),
      ],
      label: { x: peer.x, y: peer.y - peer.awareness - 6 },
    };
  });

  // 1. Frame-creation filaments from Big C's membrane into RF₁, RF₂, RFₙ (experimenting with Reality Frames)
  //    and into RF₀'s cardinal reticles (engineering & stabilizing RF₀ for human experience)
  const RF_EXPERIMENT_FILAMENTS = OTHER_FRAMES.map(({ angle }, idx) => {
    const start = polar(R.bigC - 4, angle + (idx % 2 === 0 ? -18 : 18));
    const end = polar(OTHER_FRAME_ORBIT, angle);
    const ctrl = polar((R.bigC + OTHER_FRAME_ORBIT) / 2, angle + (idx % 2 === 0 ? -9 : 9));
    const d = `M${start.x.toFixed(1)} ${start.y.toFixed(1)}Q${ctrl.x.toFixed(1)} ${ctrl.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
    return `<path data-rf-filament="${idx}" d="${d}" fill="none" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round" opacity="0"/>`;
  }).join("");

  const RF0_STABILIZE_BEAMS = [-90, 0, 90, 180].map((angle, idx) => {
    const start = polar(R.bigC - 6, angle);
    const end = polar(R.frame, angle);
    const d = `M${start.x.toFixed(1)} ${start.y.toFixed(1)}L${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
    return `<path data-rf0-beam="${idx}" d="${d}" fill="none" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round" opacity="0"/>`;
  }).join("");

  // 2. Conscious-creation filaments from Big C's membrane into Little c₁ and peers (creating Little c inside RF₀)
  const SEED_TARGETS = [
    { x: C1.x, y: C1.y, fromAngle: -148, primary: true },
    { x: C1.x, y: C1.y, fromAngle: -92, primary: true },
    { x: C1.x, y: C1.y, fromAngle: 158, primary: true },
    { x: 413, y: 230, fromAngle: -42, primary: false },
    { x: 505, y: 285, fromAngle: -10, primary: false },
    { x: 236, y: 265, fromAngle: -162, primary: false },
    { x: 478, y: 462, fromAngle: 38, primary: false },
  ];
  const SEEDING_SVG = RF_EXPERIMENT_FILAMENTS + RF0_STABILIZE_BEAMS + SEED_TARGETS.map((target, idx) => {
    const start = polar(R.bigC - 6, target.fromAngle);
    const ctrl = {
      x: (start.x + target.x) * 0.5 + (idx % 2 === 0 ? 22 : -22),
      y: (start.y + target.y) * 0.5 + (idx % 2 === 0 ? -18 : 18),
    };
    const d = `M${start.x.toFixed(1)} ${start.y.toFixed(1)}Q${ctrl.x.toFixed(1)} ${ctrl.y.toFixed(1)} ${target.x.toFixed(1)} ${target.y.toFixed(1)}`;
    return `<path data-seed-filament="${idx}" d="${d}" fill="none" stroke="${target.primary ? LUMEN : EMERALD}" stroke-width="${target.primary ? "2.8" : "2"}" stroke-linecap="round" opacity="0"/>`;
  }).join("");

  return `<defs>
    <radialGradient id="${idPrefix}-te-wash" cx="50%" cy="48%" r="54%">
      <stop offset="0%" stop-color="#8b6bae" stop-opacity="0.16"/>
      <stop offset="65%" stop-color="#8b6bae" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#8b6bae" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${idPrefix}-big-c-surface" cx="32%" cy="26%" r="85%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="38%" stop-color="#e8fcf4"/>
      <stop offset="76%" stop-color="#c6f5e3"/>
      <stop offset="100%" stop-color="#94e6c7"/>
    </radialGradient>
    <radialGradient id="${idPrefix}-local-surface" cx="32%" cy="26%" r="85%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#d2faea"/>
      <stop offset="78%" stop-color="#8be5c3"/>
      <stop offset="100%" stop-color="#42cf9e"/>
    </radialGradient>
    <linearGradient id="${idPrefix}-rim" x1="0%" y1="0%" x2="75%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="48%" stop-color="#bcead8"/>
      <stop offset="82%" stop-color="#0d8a5e" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.5"/>
    </linearGradient>
    <radialGradient id="${idPrefix}-frame-wash" cx="48%" cy="46%" r="72%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="68%" stop-color="#f7fafc"/>
      <stop offset="100%" stop-color="#e9f1f7"/>
    </radialGradient>
    <radialGradient id="${idPrefix}-local-wash" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${LUMEN}" stop-opacity="0.4"/>
      <stop offset="48%" stop-color="${EMERALD}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${EMERALD}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${idPrefix}-thread" x1="348" y1="352" x2="448" y2="510" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${EMERALD}" stop-opacity="0.8"/>
      <stop offset="52%" stop-color="${LUMEN}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="1"/>
    </linearGradient>
    <pattern id="${idPrefix}-grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1.05" fill="#3d6178" opacity="0.72"/>
    </pattern>
    <clipPath id="${idPrefix}-frame-clip">
      <circle cx="348" cy="352" r="${R.frame}"/>
    </clipPath>
    <marker id="${idPrefix}-intent-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M0 0L8 4L0 8Z" fill="${GOLD}"/>
    </marker>
    <marker id="${idPrefix}-option-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M1 0L6 3L1 6" fill="none" stroke="#2d526b" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
    <marker id="${idPrefix}-constraint-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0 0L6 3L0 6Z" fill="#854f0b"/>
    </marker>
    <marker id="${idPrefix}-coupling-arrow" markerWidth="6" markerHeight="6" refX="4.6" refY="3" orient="auto-start-reverse" markerUnits="strokeWidth">
      <path d="M0.6 0.6L5 3L0.6 5.4Z" fill="#0d7050"/>
    </marker>
    <marker id="${idPrefix}-outer-loop-arrow" markerWidth="8" markerHeight="8" refX="5.4" refY="3.5" orient="auto" markerUnits="strokeWidth">
      <path d="M0.5 0.5L6.5 3.5L0.5 6.5Z" fill="#be2968"/>
    </marker>
    <marker id="${idPrefix}-inner-loop-arrow" markerWidth="8" markerHeight="8" refX="5.4" refY="3.5" orient="auto" markerUnits="strokeWidth">
      <path d="M0.5 0.5L6.5 3.5L0.5 6.5Z" fill="${GOLD}"/>
    </marker>
  </defs>
  <g data-arch-stage="">
    <g data-arch-root="" transform="translate(${cx} ${cy}) scale(${scale}) translate(-348 -352)">
      <g data-arch="te">
        <circle data-te-wash="" cx="348" cy="352" r="${R.origin - 4}" fill="url(#${idPrefix}-te-wash)"/>
        <circle data-te-boundary="" cx="348" cy="352" r="${R.origin}" fill="none" stroke="#5b3b80" stroke-width="2.2" stroke-dasharray="3 8" stroke-linecap="round" opacity="0.88"/>
        <g data-te-contours="" fill="none" stroke="#5b3b80" stroke-width="1.4" stroke-dasharray="2.5 8" stroke-linecap="round" opacity="0.8">
          ${FIELD_CONTOURS.flatMap((radius) => FIELD_ARCS.map(([start, end]) => `<path d="${arcPath(radius, start, end)}"/>`)).join("")}
          ${FIELD_RAYS.map((angle) => {
            const s = polar(R.origin + 2, angle);
            const e = polar(R.origin + 20, angle);
            return `<line x1="${s.x.toFixed(1)}" y1="${s.y.toFixed(1)}" x2="${e.x.toFixed(1)}" y2="${e.y.toFixed(1)}" stroke-dasharray="none" stroke-width="1.6"/>`;
          }).join("")}
        </g>
      </g>

      <g data-arch="big-c">
        <g data-big-c-body="">
          <circle cx="348" cy="352" r="${R.bigC}" fill="url(#${idPrefix}-big-c-surface)" fill-opacity="0.9" stroke="url(#${idPrefix}-rim)" stroke-width="2.4"/>
          <path data-big-c-membrane="" d="${membranePath(348, 352, R.bigC + 2.5, { amplitude: 4.6, lobes: 5, phase: 0.35 })}" fill="none" stroke="${LUMEN}" stroke-width="2.2" opacity="0.85"/>
          <circle data-big-c-ring="1" cx="348" cy="352" r="${R.bigC}" fill="none" stroke="#086946" stroke-width="2.8"/>
          <circle data-big-c-ring="2" cx="348" cy="352" r="${R.membrane}" fill="none" stroke="${EMERALD}" stroke-width="1.4" opacity="0.55"/>
          <circle data-big-c-inner="" cx="348" cy="352" r="${INNER_MEMBRANE}" fill="none" stroke="#0a7852" stroke-width="1.4" stroke-dasharray="3 6" opacity="0.65"/>
        </g>
        <g data-big-c-details="">
          <g fill="none" stroke="#0a7852" stroke-width="1.25" stroke-dasharray="2.5 5" stroke-linecap="round" opacity="0.72">
            ${MEMBRANE_BANDS.map((radius) => `<path d="${arcPath(radius, 38, 142)}"/>`).join("")}
          </g>
          ${BIG_C_MEMBRANE_NODES}
          ${BIG_C_ORGANELLE_NODES}
        </g>
      </g>

      <g data-arch="rfn">${OTHER_FRAMES_SVG}</g>

      <g data-arch="rf0">
        <g data-rf0-body="">
          <circle cx="348" cy="352" r="${R.frame}" fill="url(#${idPrefix}-frame-wash)"/>
          <rect x="151" y="155" width="394" height="394" fill="url(#${idPrefix}-grid)" clip-path="url(#${idPrefix}-frame-clip)" opacity="0.58"/>
          <g fill="none" stroke="#3d6178" stroke-width="1.15" stroke-dasharray="2 6" opacity="0.48">
            <circle cx="348" cy="352" r="154"/>
            <circle cx="348" cy="352" r="128"/>
          </g>
          <circle data-rf0-ring="" cx="348" cy="352" r="${R.frame}" fill="none" stroke="#b86d0e" stroke-width="2.8"/>
          <circle cx="348" cy="352" r="${R.frame - 3.5}" fill="none" stroke="#b86d0e" stroke-width="3.6" stroke-dasharray="1.2 3.2" opacity="0.54"/>
          <circle cx="348" cy="352" r="191" fill="none" stroke="#365870" stroke-width="1.25" opacity="0.6"/>
        </g>
        <g data-rf0-polar="">
          ${POLAR_TICKS}
          ${RETICLES}
        </g>
        <g data-rf0-axes="">
          <g stroke="#2d526b" stroke-width="1.2" stroke-dasharray="2 10" stroke-linecap="round" opacity="0.45">
            <line x1="151" y1="352" x2="545" y2="352"/>
            <line x1="348" y1="155" x2="348" y2="549"/>
          </g>
          <g fill="none" stroke="#2d526b" stroke-width="1.4" stroke-linecap="round" opacity="0.88">
            <line x1="340" y1="352" x2="356" y2="352"/>
            <line x1="348" y1="344" x2="348" y2="360"/>
            <circle cx="348" cy="352" r="3.8"/>
          </g>
        </g>
      </g>

      <g data-arch="seeding">${SEEDING_SVG}</g>

      <g data-arch="little-c">
        <g data-little-c="relations">
          ${PEERS.filter((p) => p.relation !== "none").map(({ index, relation, from, to, brightening }) => relation === "cooperation"
            ? `<g data-relation="cooperation">
                <line data-coop-line="" x1="${from.x.toFixed(1)}" y1="${from.y.toFixed(1)}" x2="${to.x.toFixed(1)}" y2="${to.y.toFixed(1)}" stroke="#077a52" stroke-width="2.8" stroke-linecap="round"/>
                ${brightening.map((d) => `<path data-coop-arc="" d="${d}" fill="none" stroke="${LUMEN}" stroke-width="4" stroke-linecap="round" opacity="0.96"/>`).join("")}
              </g>`
            : `<line data-pressure-line="${index}" x1="${from.x.toFixed(1)}" y1="${from.y.toFixed(1)}" x2="${to.x.toFixed(1)}" y2="${to.y.toFixed(1)}" stroke="#0d7050" stroke-width="1.65" stroke-dasharray="2 5" stroke-linecap="round" marker-start="url(#${idPrefix}-coupling-arrow)" marker-end="url(#${idPrefix}-coupling-arrow)" opacity="0.88"/>`).join("")}
        </g>

        <g data-little-c="peers">
          ${PEERS.map(({ index, x, y, awareness, relation, cell: peerCell, label }) => `<g data-peer="${index}" opacity="${relation === "none" ? "0.75" : "1"}">
            <circle cx="${x}" cy="${y}" r="${awareness}" fill="${EMERALD}" fill-opacity="0.08" stroke="#0a7852" stroke-width="1.2" stroke-dasharray="1.8 4" stroke-linecap="round" opacity="0.78"/>
            <path data-peer-outer="${index}" d="${peerCell.outer}" fill="${EMERALD}" fill-opacity="0.14" stroke="#066342" stroke-width="1.4" stroke-dasharray="2.5 3" stroke-linecap="round"/>
            <path data-peer-inner="${index}" d="${peerCell.inner}" fill="none" stroke="#0a7852" stroke-width="1" stroke-dasharray="1.5 3" stroke-linecap="round" opacity="0.7"/>
            <circle cx="${x}" cy="${y}" r="3.4" fill="#066342" stroke="#ffffff" stroke-width="1.5"/>
            <text x="${label.x}" y="${label.y - 2}" text-anchor="middle" font-family="Space Grotesk" font-size="22" font-style="italic" font-weight="700" fill="#042e20" stroke="#ffffff" stroke-width="6" stroke-linejoin="round" paint-order="stroke fill">c<tspan baseline-shift="sub" font-size="15" font-style="normal">${index}</tspan></text>
          </g>`).join("")}
        </g>

        <g transform="${C1_TRANSFORM}">
          <g data-little-c="options">
            ${OPTION_ANGLES.map((angle) => {
              const from = polar(114, angle);
              const to = polar(79, angle);
              return `<line x1="${from.x.toFixed(1)}" y1="${from.y.toFixed(1)}" x2="${to.x.toFixed(1)}" y2="${to.y.toFixed(1)}" stroke="#2d526b" stroke-width="1.65" stroke-dasharray="3 5" stroke-linecap="round" marker-end="url(#${idPrefix}-option-arrow)" opacity="0.88"/>`;
            }).join("")}
          </g>
          <g data-little-c="constraints">
            ${CONSTRAINT_ANGLES.map((angle) => {
              const from = polar(C1_RADIUS + 22, angle);
              const to = polar(C1_RADIUS + 5, angle);
              return `<line x1="${from.x.toFixed(1)}" y1="${from.y.toFixed(1)}" x2="${to.x.toFixed(1)}" y2="${to.y.toFixed(1)}" stroke="#854f0b" stroke-width="2" stroke-linecap="round" marker-end="url(#${idPrefix}-constraint-arrow)"/>`;
            }).join("")}
          </g>
          <g data-little-c="intent">
            <path data-intent-glow="" d="${THREAD_D}" fill="none" stroke="${LUMEN}" stroke-width="8.5" stroke-linecap="round" opacity="0.34"/>
            <path data-intent-solid="" d="${AWARENESS_TRACE_D}" fill="none" stroke="url(#${idPrefix}-thread)" stroke-width="3.6" stroke-linecap="round"/>
            <path data-intent-dotted="" d="${POTENTIAL_TRACE_D}" fill="none" stroke="url(#${idPrefix}-thread)" stroke-width="2.6" stroke-dasharray="3.5 5" stroke-linecap="round" marker-end="url(#${idPrefix}-intent-arrow)"/>
            <circle data-intent-end="" cx="448" cy="510" r="4.5" fill="${GOLD}" stroke="#ffffff" stroke-width="1.4"/>
          </g>
          <g data-c1-cell="">
            <circle cx="348" cy="352" r="${R.awareness}" fill="url(#${idPrefix}-local-wash)"/>
            <path data-c1-surface="" d="${C1_CELL.outer}" fill="url(#${idPrefix}-local-surface)" stroke="url(#${idPrefix}-rim)" stroke-width="2"/>
            <path data-c1-outer="" d="${C1_CELL.outer}" fill="none" stroke="#065e3f" stroke-width="2.5"/>
            <path data-c1-inner="" d="${C1_CELL.inner}" fill="none" stroke="#0a7852" stroke-width="1.4" stroke-dasharray="2 3" stroke-linecap="round"/>
            <circle cx="348" cy="352" r="7.5" fill="#066342" stroke="#ffffff" stroke-width="1.8"/>
            <circle cx="348" cy="352" r="2.8" fill="#ffffff"/>
          </g>
          <g data-c1-awareness="">
            <g fill="none" stroke="#0a7852" stroke-width="1.35" stroke-dasharray="2 5.5" stroke-linecap="round" opacity="0.68">
              <path d="${arcPath(96, 122, 178)}"/>
              <path d="${arcPath(120, 122, 178)}" opacity="0.72"/>
            </g>
            <circle data-c1-awareness-ring="" cx="348" cy="352" r="${AWARENESS_RADIUS}" fill="none" stroke="#077a52" stroke-width="2.1" stroke-dasharray="3.5 4.5" stroke-linecap="round"/>
            ${OPTION_ANGLES.map((angle) => {
              const node = polar(AWARENESS_RADIUS, angle);
              return `<circle cx="${node.x.toFixed(1)}" cy="${node.y.toFixed(1)}" r="3.4" fill="#2d526b" stroke="#ffffff" stroke-width="1"/>`;
            }).join("")}
            <circle data-chosen-node="" cx="391" cy="410" r="5" fill="${GOLD}" stroke="#ffffff" stroke-width="1.5"/>
          </g>
        </g>
      </g>

      <g data-arch="loops" fill="none" stroke-linecap="round">
        <g data-loop="outer">
          <path d="${OUTER_LOOP}" stroke="#ffffff" stroke-width="7.5" opacity="0.9"/>
          <path data-loop-path="outer" d="${OUTER_LOOP}" stroke="#be2968" stroke-width="2.8" stroke-dasharray="8 8" marker-end="url(#${idPrefix}-outer-loop-arrow)"/>
        </g>
        <g transform="${C1_TRANSFORM}">
          <g data-loop="inner">
            <path d="${INNER_LOOP}" stroke="#ffffff" stroke-width="6.5" opacity="0.9"/>
            <path data-loop-path="inner" d="${INNER_LOOP}" stroke="${GOLD}" stroke-width="2.6" stroke-dasharray="7 7" marker-end="url(#${idPrefix}-inner-loop-arrow)"/>
          </g>
        </g>
      </g>

      <g data-arch="labels" font-family="Space Grotesk" font-weight="700" stroke="#ffffff" stroke-linejoin="round" paint-order="stroke fill">
        <g data-label="te">
          <rect x="302" y="-2" width="92" height="36" rx="10" fill="#fbf9fe" fill-opacity="0.95" stroke="#b89fd8" stroke-width="1.6"/>
          <text x="348" y="24" text-anchor="middle" font-size="27" fill="#35185a" stroke-width="5">T × E</text>
        </g>
        <g data-label="big-c">
          <text x="348" y="122" text-anchor="middle" font-size="36" fill="#032b1d" stroke-width="8">Big C</text>
        </g>
        <g data-label="rf0">
          <text x="348" y="194" text-anchor="middle" font-size="29" fill="#633503" stroke-width="7">RF<tspan baseline-shift="sub" font-size="18">0</tspan></text>
        </g>
        <g data-label="awareness" transform="${C1_TRANSFORM}">
          <circle cx="348" cy="424" r="2.8" fill="#ffffff" stroke="#065e3f" stroke-width="1.5"/>
          <path d="M348 427V440" fill="none" stroke="#065e3f" stroke-width="1.5" stroke-linecap="round"/>
          <text x="348" y="460" text-anchor="middle" font-size="19.5" fill="#032b1d" stroke-width="6"><tspan x="348">Awareness</tspan><tspan x="348" dy="1.12em">radius</tspan></text>
        </g>
        <g data-label="little-c" transform="${C1_TRANSFORM}">
          <line x1="378" y1="352" x2="420" y2="352" stroke="#065e3f" stroke-width="2"/>
          <rect x="420" y="330" width="118" height="62" rx="12" fill="#f4fdf9" fill-opacity="0.94" stroke="#7ddbb8" stroke-width="1.4"/>
          <text x="428" y="358" text-anchor="start" font-size="26" fill="#032b1d" stroke-width="5">Little c<tspan baseline-shift="sub" font-size="16">1</tspan><tspan x="428" dy="1.22em" font-family="Source Serif 4" font-size="20" font-weight="700" font-style="italic" fill="#065e3f">— you</tspan></text>
        </g>
      </g>
    </g>
  </g>`;
}

/** Export the website's own radial geometry, settled around its opening dot with luminous emergence nodes. */
export function splashField(width, height, cx, cy, stage, density = 1, { nodes: showNodes = true, quiet = false } = {}) {
  const { points } = radialField(width, height, density);
  const point = ({ x, y }) => `${(x + cx - width / 2).toFixed(2)} ${(y + cy - height / 2).toFixed(2)}`;
  const rings = points.map((ring) => `M${ring.map(point).join("L")}Z`).join("");
  const spokes = points[0].map((_, spoke) => `M${points.map((ring) => point(ring[spoke])).join("L")}`).join("");
  const nodes = points.flatMap((ring, index) => ring.flatMap(({ x, y }, spokeIndex) => {
    const px = x + cx - width / 2;
    const py = y + cy - height / 2;
    if (px < 0 || px > width || py < 0 || py > height) return [];
    const fade = 1 - 0.52 * index / points.length;
    const emergent = index >= 2 && index <= 12 && (index * 3 + spokeIndex) % 12 === 0;
    if (emergent) {
      const tone = (index + spokeIndex) % 3 === 0 ? "#7a52a8" : LUMEN;
      const coreTone = (index + spokeIndex) % 3 === 0 ? "#5b3b80" : EMERALD;
      return [
        `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="5.6" fill="${tone}" opacity="${(0.32 * fade).toFixed(3)}"/>`,
        `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="2.3" fill="${coreTone}" opacity="${(0.9 * fade).toFixed(3)}"/>`,
      ];
    }
    return `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="1.35" opacity="${(0.75 * fade).toFixed(3)}"/>`;
  })).join("");
  return `<defs>
    <radialGradient id="splash-clearance"><stop stop-color="black" offset="0.48"/><stop stop-color="white" offset="1"/></radialGradient>
    <radialGradient id="splash-ambient" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.98"/>
      <stop offset="0.34" stop-color="${LUMEN}" stop-opacity="0.22"/>
      <stop offset="0.66" stop-color="#fff4d2" stop-opacity="0.34"/>
      <stop offset="1" stop-color="${INK}" stop-opacity="0"/>
    </radialGradient>
    <mask id="splash-field-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="white"/>
      <circle cx="${cx}" cy="${cy}" r="${stage * 0.66}" fill="url(#splash-clearance)"/>
    </mask>
  </defs>
  <circle data-splash-ambient="" cx="${cx}" cy="${cy}" r="${Math.max(width, height) * 0.5}" fill="url(#splash-ambient)"/>
  <g data-splash-field="" mask="url(#splash-field-mask)">
    <path data-field-rings="" d="${rings}" fill="none" stroke="#684a88" stroke-width="0.95" opacity="${quiet ? 0.13 : 0.24}"/>
    <path data-field-spokes="" d="${spokes}" fill="none" stroke="${EMERALD}" stroke-width="1.05" opacity="${quiet ? 0.19 : 0.34}"/>
    ${showNodes ? `<g data-field-nodes="" fill="${EMERALD}">${nodes}</g>` : ""}
  </g>`;
}

function drawing(name, width, height, description, content, fontStyles, transparent = false, background = "url(#daylight-canvas)") {
  // Channel artwork follows the website's opening; the book retains its mark.
  const symbolPalette = name === "book-background" ? IDENTITY.dark : IDENTITY.light;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(name)}</title>
  <desc id="description">${escapeXml(description)}</desc>
  <defs>
    <style>${fontStyles}</style>
    <radialGradient id="daylight-canvas" cx="52%" cy="42%" r="78%">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.45" stop-color="#fdfcf8"/>
      <stop offset="0.82" stop-color="#f7f5ed"/>
      <stop offset="1" stop-color="#f1efe6"/>
    </radialGradient>
    <radialGradient id="field" cx="78%" cy="42%" r="85%">
      <stop offset="0" stop-color="#25453b"/>
      <stop offset="0.6" stop-color="#132820"/>
      <stop offset="1" stop-color="${symbolPalette.surface}"/>
    </radialGradient>
${name === "book-background" ? "" : `    <radialGradient id="splash-halo">
      <stop offset="0" stop-color="${LUMEN}" stop-opacity="0.45"/>
      <stop offset="0.38" stop-color="${EMERALD}" stop-opacity="0.22"/>
      <stop offset="0.72" stop-color="${MINT}" stop-opacity="0.06"/>
      <stop offset="1" stop-color="${MINT}" stop-opacity="0"/>
    </radialGradient>
    <symbol id="splash-mark" viewBox="0 0 100 100">
      <circle data-splash-halo="" cx="50" cy="50" r="50" fill="url(#splash-halo)"/>
      <circle data-emergence-outer="" cx="50" cy="50" r="43.5" fill="none" stroke="${EMERALD}" stroke-width="1.15" stroke-dasharray="3 5" opacity="0.55"/>
      <circle data-splash-ring="" cx="50" cy="50" r="33.636" fill="none" stroke="${EMERALD}" stroke-width="1.5" opacity="0.82"/>
      <path data-emergence-arc-a="" d="M 50 22 C 65.5 22 78 34.5 78 50 C 78 65.5 65.5 78 50 78" fill="none" stroke="${MINT}" stroke-width="2.15" stroke-linecap="round" opacity="0.92"/>
      <path data-emergence-arc-b="" d="M 50 78 C 34.5 78 22 65.5 22 50 C 22 34.5 34.5 22 50 22" fill="none" stroke="${EMERALD}" stroke-width="1.75" stroke-linecap="round" opacity="0.72"/>
      <circle data-emergence-boundary="" cx="50" cy="50" r="16.5" fill="none" stroke="${EMERALD}" stroke-width="1.35" opacity="0.6"/>
      <g data-emergence-nodes="" fill="${EMERALD}">
        <circle cx="50" cy="16.36" r="2"/>
        <circle cx="83.64" cy="50" r="2"/>
        <circle cx="50" cy="83.64" r="2"/>
        <circle cx="16.36" cy="50" r="2"/>
      </g>
      <circle data-splash-dot="" cx="50" cy="50" r="8.6" fill="${MINT}"/>
      <circle data-emergence-core="" cx="50" cy="50" r="3.4" fill="#ffffff" opacity="0.94"/>
    </symbol>
    <linearGradient id="amm-flame" x1="35" y1="3" x2="28" y2="55" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFB52E"/>
      <stop offset="0.35" stop-color="#FA6717"/>
      <stop offset="0.72" stop-color="#DD3410"/>
      <stop offset="1" stop-color="#881B14"/>
    </linearGradient>
    <linearGradient id="amm-heart" x1="35" y1="20" x2="30" y2="52" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFF0A4"/>
      <stop offset="0.42" stop-color="#FFD34A"/>
      <stop offset="1" stop-color="#FF8D1C"/>
    </linearGradient>
    <linearGradient id="amm-core" x1="31" y1="29" x2="32" y2="51" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFFDF0"/>
      <stop offset="0.62" stop-color="#FFF8D7"/>
      <stop offset="1" stop-color="#FFE67B"/>
    </linearGradient>
    <radialGradient id="amm-heat">
      <stop offset="0" stop-color="#FFAE32" stop-opacity="0.36"/>
      <stop offset="0.5" stop-color="#F35A15" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#F35A15" stop-opacity="0"/>
    </radialGradient>
    <symbol id="amm-emblem" viewBox="0 0 64 64">
      <ellipse cx="32" cy="35" rx="31" ry="28" fill="url(#amm-heat)"/>
      <path d="M37 2C25 12 29 24 22 31C18 27 18 22 20 17C9 25 7 35 11 43C15 52 23 55 32 54C45 54 53 45 54 36C55 30 52 23 48 20C49 28 44 32 40 34C44 24 34 19 37 2Z" fill="url(#amm-flame)"/>
      <path d="M13 17C8 25 17 29 16 37C10 34 5 28 13 17Z" fill="url(#amm-flame)"/>
      <path d="M46 9C43 17 51 19 48 27C55 20 47 15 46 9Z" fill="url(#amm-flame)"/>
      <path d="M35 18C27 27 32 30 27 37C22 35 20 32 21 28C14 38 20 49 30 51C41 53 49 45 48 36C45 41 41 42 38 40C41 31 33 28 35 18Z" fill="url(#amm-heart)"/>
      <path d="M31 29C30 36 32 39 27 43C27 39 25 38 25 36C20 44 26 50 32 50C39 50 43 45 41 40C39 45 36 45 35 43C38 38 31 36 31 29Z" fill="url(#amm-core)"/>
      <path d="M35 8C29 18 34 24 29 31" stroke="#FFEAA0" stroke-width="0.9" stroke-linecap="round" fill="none"/>
      <path d="M16 52C23 51 28 54 32 56C36 54 41 51 48 52L45 58C40 58 36 60 32 63C28 60 24 58 19 58Z" fill="${PAPER}"/>
      <path d="M19 53C24 53 28 55 32 57C36 55 40 53 45 53M32 57V61" stroke="#FBA54C" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </symbol>
`}    <symbol id="nucleus" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="44" stroke="${symbolPalette.accent}" stroke-width="1.35" opacity="0.32"/>
      <circle cx="50" cy="50" r="30" stroke="${symbolPalette.accent}" stroke-width="1.55" opacity="0.62"/>
      <path d="M 50 16 C 68 16 84 31 84 50 C 84 69 68 84 50 84" stroke="${symbolPalette.accent}" stroke-width="2.25" stroke-linecap="round" opacity="0.9"/>
      <path d="M 50 84 C 32 84 16 69 16 50 C 16 31 32 16 50 16" stroke="${symbolPalette.accent}" stroke-width="1.8" stroke-linecap="round" opacity="0.56"/>
      <circle cx="50" cy="50" r="15" stroke="${symbolPalette.accent}" stroke-width="1.4" opacity="0.36"/>
      <circle cx="50" cy="50" r="7.5" fill="${symbolPalette.accent}"/>
      <circle cx="50" cy="50" r="3.25" fill="${symbolPalette.surface}" opacity="0.72"/>
    </symbol>
  </defs>
  ${transparent ? "" : `<rect width="${width}" height="${height}" fill="${background}"/>`}
  ${content}
</svg>
`;
}

export function buildChannelAssets(author, fontStyles = "") {
  assert.equal(typeof author?.name, "string", "Author name must be a string");
  assert.ok(author.name.trim(), "Author name must not be empty");
  assert.equal(typeof author.suffix, "string", "Author suffix must be a string");
  const credit = author.suffix ? `${author.name}, ${author.suffix}` : author.name;
  const assets = [];
  const add = (name, width, height, description, content, options = {}) => {
    assets.push({
      name,
      width,
      height,
      maxBytes: 2_000_000,
      ...options,
      svg: drawing(name, width, height, description, content, fontStyles, options.transparent, options.background),
    });
  };

  add("banner", 2560, 1440,
    `Digital Organism Theory. ${credit}. Conditioning, choice, agency. dotheory.org. The website's opening dot, ring, and curved field are a visual identity, not an empirical diagram.`,
    `<defs>
      <radialGradient id="banner-text-halo" cx="54%" cy="50%" r="36%">
        <stop offset="0%" stop-color="#f8fcf9" stop-opacity="0.94"/>
        <stop offset="68%" stop-color="#f8fcf9" stop-opacity="0.82"/>
        <stop offset="100%" stop-color="#f8fcf9" stop-opacity="0"/>
      </radialGradient>
    </defs>
    ${splashField(2560, 1440, 680, 720, 230)}
    <ellipse cx="1420" cy="720" rx="680" ry="250" fill="url(#banner-text-halo)"/>
    <g data-essential="">
      ${splashMark(680, 720, 236)}
      <text x="856" y="682" font-family="Space Grotesk" font-size="82" font-weight="700" letter-spacing="-2.4" fill="#041a13">Digital Organism Theory</text>
      <text x="860" y="754" font-family="Source Serif 4" font-size="42" font-weight="600" fill="#0d3b2b">Conditioning · Choice · Agency</text>
      <text x="860" y="818" font-family="Space Grotesk" font-size="30" font-weight="700" fill="#086946">${escapeXml(credit)}   <tspan fill="#6ca88e">·</tspan>   <tspan font-family="JetBrains Mono" font-size="26" letter-spacing="1.8">dotheory.org</tspan></text>
    </g>`,
    { maxBytes: 6_000_000, safeArea: BANNER_SAFE_AREA });

  add("avatar", 800, 800,
    "Digital Organism Theory's opening dot and single ring, held in the website's curved field and centred for a circular profile image.",
    `${splashField(800, 800, 400, 400, 520, 0.5)}<g data-essential="">${splashMark(400, 400, 520)}</g>`,
    { circle: { x: 400, y: 400, radius: 380 } });

  add("watermark", 512, 512,
    "Optional transparent Digital Organism Theory opening dot and single ring for future videos. No text or call to action.",
    `<g data-essential="">${splashMark(256, 256, 440)}</g>`,
    { transparent: true, maxBytes: 999_999 });

  const thumbnail = (name, label, lines, subtitle, figure, description, options = {}) => {
    const footerLeft = options.footerLeft ?? "DIGITAL ORGANISM THEORY · BOOK ONE";
    const footerRight = options.footerRight ?? "DOTHEORY.ORG";
    const topEmblem = options.amm
      ? `${splashMark(1088, 88, 56)}${ammMark(1164, 88, 68)}`
      : splashMark(1164, 88, 84);
    const labelColor = options.amm ? AMBER : "#086946";
    add(name, 1280, 720, description,
      `${splashField(1280, 720, 984, 340, 220, 0.55)}
      <g data-essential="">
        <rect x="44" y="44" width="700" height="534" rx="24" fill="#fbfcf9" fill-opacity="0.93" stroke="#cfe4d8" stroke-width="1.6"/>
        <text x="74" y="96" font-family="JetBrains Mono" font-size="19" font-weight="700" letter-spacing="2" fill="${labelColor}">${escapeXml(label)}</text>
        ${topEmblem}
        ${lines.map((line, index) => `<text x="74" y="${224 + index * 86}" font-family="Space Grotesk" font-size="76" font-weight="700" letter-spacing="-2.2" fill="#041a13">${escapeXml(line)}</text>`).join("\n")}
        <text x="76" y="468" font-family="Source Serif 4" font-size="24" font-weight="600" fill="#0d3527">${escapeXml(subtitle)}</text>
        ${options.pill ? `<text x="76" y="534" font-family="JetBrains Mono" font-size="17.5" font-weight="700" letter-spacing="1.8" fill="${labelColor}">${escapeXml(options.pill)}</text>` : ""}
        ${figure}
        <!-- Footer stops short of the bottom-right corner, where YouTube overlays the video duration. -->
        <rect x="48" y="604" width="860" height="64" rx="16" fill="#fbfcf9" fill-opacity="0.94" stroke="#cfe4d8" stroke-width="1.5"/>
        <text x="76" y="643" font-family="JetBrains Mono" font-size="18" font-weight="700" letter-spacing="1.8" fill="#0d382a">${escapeXml(footerLeft)}  ·  <tspan fill="#086946">${escapeXml(footerRight)}</tspan></text>
      </g>`);
  };

  thumbnail("thumbnail-introduction", "AN INTRODUCTION · EMERGENCE",
    ["What is a", "digital", "organism?"],
    "How Big C, Reality Frames, and Little c emerge and choose.",
    `<g>
      ${architectureDiagram(988, 332, 0.58, "thumb-arch")}
      <rect x="764" y="534" width="448" height="38" rx="10" fill="#fbfcf9" fill-opacity="0.95" stroke="#b5decb" stroke-width="1.5"/>
      <text x="988" y="559" text-anchor="middle" font-family="JetBrains Mono" font-size="15" font-weight="700" letter-spacing="1.4" fill="#086946">A VISUAL MODEL · NOT A PHYSICAL STRUCTURE</text>
    </g>`,
    "Introductory video thumbnail: What is a digital organism? Big C, RF₀, and Little c. The drawing is a visual model, not a measured physical structure.",
    { pill: "T × E · BIG C · RF₀ · LITTLE C" });

  thumbnail("thumbnail-concepts", "BOOK ONE / CORE ARCHITECTURE",
    ["Canvas.", "Painting.", "Character."],
    "Separating awareness, inherited patterns, and the role you play.",
    `<g fill="#fbfcf9" stroke-width="2.2">
      <rect x="780" y="156" width="356" height="156" rx="16" stroke="#46685b"/>
      <text x="808" y="198" font-family="JetBrains Mono" font-size="17" font-weight="700" letter-spacing="1.8" fill="#23493b" stroke="none">01 · CANVAS</text>
      <text x="808" y="242" font-family="Space Grotesk" font-size="27" font-weight="700" fill="#062018" stroke="none">Unconditioned field</text>
      <rect x="816" y="248" width="356" height="156" rx="16" stroke="#086946"/>
      <text x="844" y="290" font-family="JetBrains Mono" font-size="17" font-weight="700" letter-spacing="1.8" fill="#086946" stroke="none">02 · PAINTING</text>
      <text x="844" y="334" font-family="Space Grotesk" font-size="27" font-weight="700" fill="#062018" stroke="none">Conditioned experience</text>
      <rect x="852" y="340" width="356" height="168" rx="16" stroke="#041a13"/>
      <text x="880" y="382" font-family="JetBrains Mono" font-size="17" font-weight="700" letter-spacing="1.8" fill="#041a13" stroke="none">03 · CHARACTER</text>
      <text x="880" y="426" font-family="Space Grotesk" font-size="27" font-weight="700" fill="#041a13" stroke="none">The agent who chooses</text>
      <circle cx="1162" cy="462" r="16" fill="#086946" stroke="none"/>
    </g>`,
    "Book One concepts video thumbnail: Canvas, Painting, Character. Three abstract layers are a visual metaphor.",
    { pill: "OBSERVATION · DOT DERIVATION" });

  thumbnail("thumbnail-agency", "BOOK ONE / THE EXPERIENCE LOOP",
    ["When fear", "governs", "the loop."],
    "How fear narrows available choices—and how agency reopens them.",
    `<g>
      <circle cx="984" cy="346" r="148" fill="#fbfcf9" fill-opacity="0.72" stroke="#086946" stroke-width="2.6"/>
      <circle cx="984" cy="346" r="88" fill="#fbfcf9" fill-opacity="0.94" stroke="${AMBER}" stroke-width="2.2" stroke-dasharray="6 7"/>
      <rect x="896" y="166" width="176" height="42" rx="10" fill="#fbfcf9" stroke="#086946" stroke-width="2"/>
      <text x="984" y="193" text-anchor="middle" font-family="JetBrains Mono" font-size="16.5" font-weight="700" letter-spacing="1.6" fill="#041a13">EXPERIENCE</text>
      <rect x="1058" y="325" width="164" height="42" rx="10" fill="#fbfcf9" stroke="#086946" stroke-width="2"/>
      <text x="1140" y="352" text-anchor="middle" font-family="JetBrains Mono" font-size="16.5" font-weight="700" letter-spacing="1.6" fill="#041a13">INTERPRET</text>
      <rect x="892" y="478" width="184" height="42" rx="10" fill="#fbfcf9" stroke="#086946" stroke-width="2"/>
      <text x="984" y="505" text-anchor="middle" font-family="JetBrains Mono" font-size="16.5" font-weight="700" letter-spacing="1.6" fill="#041a13">CONSEQUENCE</text>
      <rect x="752" y="325" width="156" height="42" rx="10" fill="#fbfcf9" stroke="#086946" stroke-width="2"/>
      <text x="830" y="352" text-anchor="middle" font-family="JetBrains Mono" font-size="16.5" font-weight="700" letter-spacing="1.6" fill="#041a13">CONDUCT</text>
      <text x="984" y="338" text-anchor="middle" font-family="JetBrains Mono" font-size="17" font-weight="700" letter-spacing="1.2" fill="${AMBER}">FEAR NARROWS</text>
      <text x="984" y="368" text-anchor="middle" font-family="JetBrains Mono" font-size="17" font-weight="700" letter-spacing="1.2" fill="#086946">CHOICE OPENS</text>
    </g>`,
    "Book One Experience Loop video thumbnail: When fear governs the loop. A conceptual diagram of experience, interpretation, conduct, and consequence.",
    { pill: "THE FEAR-GATING PRINCIPLE" });

  thumbnail("thumbnail-open-questions", "EPISTEMIC DISCIPLINE",
    ["Where the", "theory is", "still open."],
    "Four kinds of claim, and what it would take to falsify them.",
    `<g>
      <circle cx="984" cy="340" r="176" fill="none" stroke="#2d5446" stroke-width="2.4" stroke-dasharray="6 12" opacity="0.8"/>
      <path d="M 984 198 A 142 142 0 1 0 1126 340" fill="none" stroke="#086946" stroke-width="3.2" opacity="0.85"/>
      <rect x="828" y="226" width="312" height="46" rx="10" fill="#fbfcf9" stroke="#9ecbb9" stroke-width="1.8"/>
      <text x="850" y="255" font-family="JetBrains Mono" font-size="17" font-weight="700" letter-spacing="1.5" fill="#041a13">01 · OBSERVATION</text>
      <rect x="828" y="282" width="312" height="46" rx="10" fill="#fbfcf9" stroke="#9ecbb9" stroke-width="1.8"/>
      <text x="850" y="311" font-family="JetBrains Mono" font-size="17" font-weight="700" letter-spacing="1.5" fill="#041a13">02 · EXTERNAL MODEL</text>
      <rect x="828" y="338" width="312" height="46" rx="10" fill="#e6fbf3" stroke="#086946" stroke-width="2.4"/>
      <text x="850" y="367" font-family="JetBrains Mono" font-size="17" font-weight="700" letter-spacing="1.5" fill="#065e3f">03 · DOT DERIVATION</text>
      <rect x="828" y="394" width="312" height="46" rx="10" fill="#fbfcf9" stroke="#9ecbb9" stroke-width="1.8"/>
      <text x="850" y="423" font-family="JetBrains Mono" font-size="17" font-weight="700" letter-spacing="1.5" fill="#23493b">04 · SPECULATION</text>
      <rect x="838" y="524" width="292" height="38" rx="10" fill="#fbfcf9" fill-opacity="0.95" stroke="#b5decb" stroke-width="1.5"/>
      <text x="984" y="549" text-anchor="middle" font-family="JetBrains Mono" font-size="16" font-weight="700" letter-spacing="1.6" fill="#086946">INQUIRY, NOT CERTAINTY</text>
    </g>`,
    "Open questions video thumbnail: Where the theory is still open. An unfinished ring signals inquiry, not certainty.",
    { pill: "4 CLAIM LEVELS · FALSIFIABILITY" });

  thumbnail("thumbnail-amm", "THE AMERICAN MILLENNIAL MANIFESTO",
    ["How a system", "gets inside", "us."],
    "Economic dependence, cultural scripts, and everyday conduct.",
    `<g>
      <path d="M 982 233 H 1006 M 1110 294 V 322 M 1006 383 H 982 M 878 322 V 294" stroke="#086946" stroke-width="2.4" opacity="0.7"/>
      <rect x="768" y="172" width="214" height="122" rx="14" fill="#fbfcf9" stroke="${AMBER}" stroke-width="2.2"/>
      <text x="790" y="208" font-family="JetBrains Mono" font-size="15.5" font-weight="700" letter-spacing="1.4" fill="${AMBER}">01 · CONDITIONS</text>
      <text x="790" y="242" font-family="Space Grotesk" font-size="22" font-weight="700" fill="#041a13">Who sets<tspan x="790" dy="28">the terms?</tspan></text>
      <rect x="1002" y="172" width="218" height="122" rx="14" fill="#fbfcf9" stroke="#8abfa9" stroke-width="2"/>
      <text x="1024" y="208" font-family="JetBrains Mono" font-size="15.5" font-weight="700" letter-spacing="1.4" fill="#1d4939">02 · INTERPRET</text>
      <text x="1024" y="242" font-family="Space Grotesk" font-size="22" font-weight="700" fill="#041a13">What feels<tspan x="1024" dy="28">natural?</tspan></text>
      <rect x="768" y="318" width="214" height="122" rx="14" fill="#fbfcf9" stroke="#8abfa9" stroke-width="2"/>
      <text x="790" y="354" font-family="JetBrains Mono" font-size="15.5" font-weight="700" letter-spacing="1.4" fill="#086946">04 · FEEDBACK</text>
      <text x="790" y="388" font-family="Space Grotesk" font-size="22" font-weight="700" fill="#041a13">What is<tspan x="790" dy="28">corrected?</tspan></text>
      <rect x="1002" y="318" width="218" height="122" rx="14" fill="#e6fbf3" stroke="#086946" stroke-width="2.2"/>
      <text x="1024" y="354" font-family="JetBrains Mono" font-size="15.5" font-weight="700" letter-spacing="1.4" fill="#065e3f">03 · CONDUCT</text>
      <text x="1024" y="388" font-family="Space Grotesk" font-size="22" font-weight="700" fill="#041a13">Room to<tspan x="1024" dy="28">refuse?</tspan></text>
      <rect x="814" y="472" width="360" height="38" rx="10" fill="#fbfcf9" fill-opacity="0.95" stroke="#b5decb" stroke-width="1.5"/>
      <text x="994" y="497" text-anchor="middle" font-family="JetBrains Mono" font-size="16" font-weight="700" letter-spacing="1.6" fill="#086946">THE LEECH · THE HOST · RECOVERY</text>
    </g>`,
    "The American Millennial Manifesto video thumbnail: How a system gets inside us. Four analytical steps connecting institutions, culture, conduct, and feedback.",
    {
      amm: true,
      pill: "APPLIED DIGITAL ORGANISM THEORY",
      footerLeft: "THE AMERICAN MILLENNIAL MANIFESTO",
      footerRight: "DOTHEORY.ORG/AMM",
    });

  thumbnail("thumbnail-amm-power", "AMM / FOLLOW THE MONEY",
    ["Dependence.", "Extraction.", "Power."],
    "Tracing an ordinary payment to the private power that collects it.",
    `<g>
      <rect x="768" y="160" width="376" height="76" rx="12" fill="#fbfcf9" stroke="${AMBER}" stroke-width="2.2"/>
      <text x="792" y="192" font-family="JetBrains Mono" font-size="15" font-weight="700" letter-spacing="1.4" fill="${AMBER}">CONCENTRATED PRIVATE CAPITAL</text>
      <text x="792" y="220" font-family="Source Serif 4" font-size="20" font-weight="600" fill="#0d3326">Security–Industrial · Platform · Finance</text>
      <rect x="768" y="250" width="376" height="72" rx="12" fill="#fbfcf9" stroke="#8abfa9" stroke-width="2"/>
      <text x="792" y="280" font-family="JetBrains Mono" font-size="15" font-weight="700" letter-spacing="1.4" fill="#041a13">THE STATE</text>
      <text x="792" y="308" font-family="Source Serif 4" font-size="20" font-weight="600" fill="#0d3326">Customer, financier, regulator, protector</text>
      <rect x="768" y="336" width="376" height="72" rx="12" fill="#fbfcf9" stroke="#2d5446" stroke-dasharray="5 6" stroke-width="2"/>
      <text x="792" y="366" font-family="JetBrains Mono" font-size="15" font-weight="700" letter-spacing="1.4" fill="#1b4335">THE GUARDS &amp; THE STORY</text>
      <text x="792" y="394" font-family="Source Serif 4" font-size="20" font-weight="600" fill="#0d3326">Keeps the arrangement beyond correction</text>
      <rect x="768" y="422" width="376" height="74" rx="12" fill="#e6fbf3" stroke="#086946" stroke-width="2.2"/>
      <text x="792" y="452" font-family="JetBrains Mono" font-size="15" font-weight="700" letter-spacing="1.4" fill="#065e3f">THE CITIZEN · THE HOST</text>
      <text x="792" y="480" font-family="Source Serif 4" font-size="20" font-weight="600" fill="#041a13">Worker, tenant, borrower, user, taxpayer</text>
      <path d="M 1144 460 H 1182 V 198 H 1148" fill="none" stroke="${AMBER}" stroke-width="3"/>
      <path d="M 1158 190 L 1146 198 L 1158 206" fill="none" stroke="${AMBER}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="768" y="514" width="414" height="36" rx="10" fill="#fbfcf9" fill-opacity="0.95" stroke="#ebbd83" stroke-width="1.5"/>
      <text x="975" y="538" text-anchor="middle" font-family="JetBrains Mono" font-size="15" font-weight="700" letter-spacing="1.3" fill="${AMBER}">RENT · INTEREST · FEES · ATTENTION · DATA</text>
    </g>`,
    "The American Millennial Manifesto power map thumbnail: Dependence, Extraction, Power. Visual model of how recurring payments move from citizens to concentrated private capital.",
    {
      amm: true,
      pill: "CHAPTERS I–III · POWER ARCHITECTURE",
      footerLeft: "THE AMERICAN MILLENNIAL MANIFESTO",
      footerRight: "DOTHEORY.ORG/AMM",
    });

  // Typewriter captions for the opening video (hidden in the still poster). One line per act.
  const captionsSvg = SPLASH_CAPTIONS.map((caption, idx) => `${caption.tag
    ? `<text data-caption-tag="${idx}" x="960" y="876" text-anchor="middle" font-family="JetBrains Mono" font-size="15" font-weight="700" letter-spacing="3" fill="${AMBER}" opacity="0">${escapeXml(caption.tag)}</text>`
    : ""}
        <text data-caption="${idx}" x="960" y="930" text-anchor="middle" font-family="JetBrains Mono" font-size="34" fill="#0a2a1f" opacity="0">${escapeXml(caption.text)}</text>`).join("\n        ");

  add("splash", 1920, 1080,
    "Opening architecture card for Digital Organism Theory (a proposed model of reality): T × E as the speculative source (before and after, and what allows it), the emergence of Big C, Big C stabilizing itself and then building Reality Frames RF₁…RFₙ and RF₀ as tools, and Little c₁ and peers c₂…cₙ living by the rules of RF₀ and others.",
    `${splashField(1920, 1080, 960, 442, 520, 1, { nodes: false, quiet: true })}<g data-essential="">
      <g data-splash-lockup="">
        <rect x="686" y="24" width="548" height="34" rx="17" fill="#06281e" stroke="${LUMEN}" stroke-width="2"/>
        <circle cx="712" cy="41" r="5.5" fill="${LUMEN}"/>
        <text x="730" y="47" font-family="JetBrains Mono" font-size="15.5" font-weight="700" letter-spacing="2.2" fill="#ffffff">A PROPOSED MODEL OF REALITY  ·  BOOK ONE</text>
      </g>
      <g data-ledger-panel="">
        <text data-splash-title="" x="960" y="922" text-anchor="middle" font-family="Space Grotesk" font-size="76" font-weight="700" letter-spacing="-2.4" fill="#041a13">Digital Organism Theory</text>
        <text data-splash-tagline="" x="960" y="976" text-anchor="middle" font-family="JetBrains Mono" font-size="22" font-weight="700" letter-spacing="4" fill="#086946">${escapeXml(SPLASH_TAGLINE)}</text>
      </g>
      <g data-act-stage="" opacity="0">
        ${captionsSvg}
      </g>
      <rect data-type-caret="" x="960" y="900" width="3" height="34" rx="1" fill="#086946" opacity="0"/>
      ${architectureDiagram(960, 442, 1.00, "splash-arch")}
    </g>`);

  add("end-card", 1920, 1080,
    `Closing video colophon card for Digital Organism Theory and The American Millennial Manifesto, credited to ${credit}. Directs viewers to read the full text and inspect primary sources at dotheory.org without manipulative calls to action.`,
    `${splashField(1920, 1080, 960, 210, 160, 0.55)}<g data-essential="">
      ${splashMark(960, 180, 136)}
      <rect x="370" y="258" width="1180" height="132" rx="22" fill="#fbfcf9" fill-opacity="0.95" stroke="#b5decb" stroke-width="2"/>
      <text x="960" y="298" text-anchor="middle" font-family="JetBrains Mono" font-size="20" font-weight="700" letter-spacing="2.2" fill="#086946">CONTINUE THE INQUIRY AT YOUR OWN PACE</text>
      <text x="960" y="364" text-anchor="middle" font-family="Space Grotesk" font-size="56" font-weight="700" letter-spacing="-1.6" fill="#041a13">Read the full work &amp; inspect the sources.</text>
      <rect x="140" y="424" width="792" height="356" rx="22" fill="#fbfcf9" stroke="#086946" stroke-width="2.4"/>
      ${splashMark(222, 502, 76)}
      <text x="284" y="492" font-family="JetBrains Mono" font-size="18" font-weight="700" letter-spacing="1.8" fill="#086946">BOOK ONE · FOUNDATIONS</text>
      <text x="284" y="524" font-family="JetBrains Mono" font-size="16" font-weight="700" letter-spacing="1.4" fill="#1e493a">FREE DIGITAL EDITION &amp; CONCEPT MAP</text>
      <text x="186" y="592" font-family="Space Grotesk" font-size="38" font-weight="700" letter-spacing="-1" fill="#041a13">Consciousness: A Digital Organism</text>
      <text x="186" y="644" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#123d2e">Conditioning, the Experience Loop, Fear-Gating,</text>
      <text x="186" y="682" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#123d2e">the Decoupling Principle, and deliberate agency.</text>
      <text x="186" y="742" font-family="JetBrains Mono" font-size="19" font-weight="700" letter-spacing="1.6" fill="#086946">DOTHEORY.ORG/BOOK/DIGITAL-ORGANISM-THEORY</text>
      <rect x="988" y="424" width="792" height="356" rx="22" fill="#fbfcf9" stroke="${AMBER}" stroke-width="2.4"/>
      ${ammMark(1068, 502, 68)}
      <text x="1128" y="492" font-family="JetBrains Mono" font-size="18" font-weight="700" letter-spacing="1.8" fill="${AMBER}">APPLIED INQUIRY · PUBLIC LIFE</text>
      <text x="1128" y="524" font-family="JetBrains Mono" font-size="16" font-weight="700" letter-spacing="1.4" fill="#1e493a">CHAPTERS, LETTERS &amp; INTERACTIVE POWER MAPS</text>
      <text x="1034" y="592" font-family="Space Grotesk" font-size="38" font-weight="700" letter-spacing="-1" fill="#041a13">The American Millennial Manifesto</text>
      <text x="1034" y="644" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#123d2e">How economic dependence becomes extraction, how</text>
      <text x="1034" y="682" font-family="Source Serif 4" font-size="26" font-weight="600" fill="#123d2e">power protects itself, and how people live differently.</text>
      <text x="1034" y="742" font-family="JetBrains Mono" font-size="19" font-weight="700" letter-spacing="1.6" fill="${AMBER}">DOTHEORY.ORG/AMM</text>
      <rect x="140" y="818" width="1640" height="148" rx="20" fill="#fbfcf9" fill-opacity="0.95" stroke="#b5decb" stroke-width="2"/>
      <text x="960" y="872" text-anchor="middle" font-family="JetBrains Mono" font-size="18" font-weight="700" letter-spacing="1.8" fill="#0d382a">EPISTEMIC CONTRACT · OBSERVATION · EXTERNAL MODEL · DOT DERIVATION · SPECULATIVE EXTENSION</text>
      <text x="960" y="932" text-anchor="middle" font-family="Space Grotesk" font-size="32" font-weight="700" fill="#041a13">${escapeXml(credit)}  ·  dotheory.org</text>
    </g>`);

  add("book-background", 1400, 2000,
    "Ink-and-jade jacket background for the 7 by 10 inch Word/PDF edition. Text remains native in Word. The nucleus is the DOT brand mark, not a measured structure.",
    `<g fill="none" stroke="${IDENTITY.dark.accent}" opacity="0.08">
      <circle cx="1400" cy="1000" r="700"/>
      <circle cx="1400" cy="1000" r="1100"/>
    </g>
    <g data-essential="">${mark(700, 1130, 520)}</g>`,
    { background: "url(#field)" });

  return assets;
}

export function buildChannelSetup(author, book, amm = DEFAULT_AMM) {
  assert.ok(author?.name?.trim(), "Author name must not be empty");
  assert.ok(book?.project?.title?.trim(), "Book title must not be empty");
  assert.ok(amm?.title?.trim(), "AMM title must not be empty");
  const claimLevels = book.reader_contract.claim_levels;
  assert.ok(claimLevels.length === 4, "The released book must declare four claim levels");
  const website = "https://dotheory.org";
  const bookUrl = `${website}/book/${book.project.slug}`;
  const ammUrl = `${website}${amm.route || "/amm"}`;
  const doctrineUrl = `${website}/doctrine`;
  const description = [
    "Why do we react before we choose—at home, at work, and in public life?",
    `Digital Organism Theory (DOT), developed by ${author.name}, is a practical and moral framework—not an ideology. There is no side to join and no creed to adopt: only tools for seeing how conditioning, fear, and the systems around us shape what we do, and for choosing more deliberately with others.`,
    `• Inner life — Book One, ${book.project.title}: a proposed model of reality, and a practical account of how conditioning and fear-gating drive automatic reactions—and how seeing the pattern opens room for deliberate choice.\n• Public life — ${amm.title} (AMM): how economic dependence, cost of living, and attention capture get inside everyday decisions—and what people can practically do about it together.`,
    `Every argument is labeled: ${claimLevels.join(", ")}.`,
    `Read free:\n${bookUrl}\n${ammUrl}`,
  ].join("\n\n");
  assert.ok(description.length <= 1000, `Channel description exceeds 1,000 characters (${description.length})`);
  const confirmedUrl = /^https:\/\/(www\.)?youtube\.com\/@[A-Za-z0-9._-]+$/.test((author?.links?.youtube ?? "").trim())
    ? author.links.youtube.trim()
    : null;
  const confirmedHandle = confirmedUrl ? confirmedUrl.slice(confirmedUrl.indexOf("@")) : null;
  const confirmedChannelId = confirmedUrl ? "UC4CHvpLItOyp7tdCdqI8ncg" : null;
  return {
    status: confirmedUrl ? "created" : "not_created",
    name: book.project.series_title,
    author: author.name,
    visual_reference: "Website opening splash: central dot, single ring, and curved radial field",
    brand: { name: "DOT Daylight", palette: IDENTITY.light, fonts: IDENTITY.fonts },
    proposed_handles: ["@dotheory", "@digitalorganismtheory", "@dotheoryorg"],
    confirmed_handle: confirmedHandle,
    confirmed_channel_url: confirmedUrl,
    confirmed_channel_id: confirmedChannelId,
    confirmed_channel_id_url: confirmedChannelId ? `https://www.youtube.com/channel/${confirmedChannelId}` : null,
    description,
    claim_levels: claimLevels,
    links: [
      { title: "Read Book One — free", url: bookUrl },
      { title: "The American Millennial Manifesto", url: ammUrl },
      { title: "Book One Concept Map", url: doctrineUrl },
      { title: "DOT website", url: website },
    ],
    playlists: [
      {
        title: `Book One — ${book.project.title}`,
        description: "Foundational concepts from Book One: the Digital Organism, Canvas/Painting/Character, the Decoupling Principle, the Experience Loop, and the Fear-Gating Principle.",
      },
      {
        title: amm.title,
        description: "Applying Digital Organism Theory to public life: how economic dependence becomes extraction, how extraction becomes power, and how inherited culture makes it feel normal.",
      },
      {
        title: "Epistemic Method & Open Questions",
        description: `How Digital Organism Theory separates ${claimLevels.join(", ")}—and where the inquiry remains open to falsification.`,
      },
    ],
    artwork: [
      { file: "banner.png", width: 2560, height: 1440, purpose: "Channel banner", required: true },
      { file: "avatar.png", width: 800, height: 800, purpose: "Profile picture", required: true },
      { file: "watermark.png", width: 512, height: 512, purpose: "Video watermark (optional; for later)", required: false },
      { file: "end-card.png", width: 1920, height: 1080, purpose: "Closing video colophon card (Book One + AMM + Claim levels)", required: false },
    ],
    sources: {
      create: "https://support.google.com/youtube/answer/1646861?hl=en",
      branding: "https://support.google.com/youtube/answer/10456525?hl=en",
      profile: "https://support.google.com/youtube/answer/2657964?hl=en",
      handles: "https://support.google.com/youtube/answer/11585688?hl=en",
    },
  };
}

async function embeddedFonts() {
  const fonts = [
    ["space-grotesk", "Space Grotesk", 500, "normal"],
    ["space-grotesk", "Space Grotesk", 700, "normal"],
    ["source-serif-4", "Source Serif 4", 400, "normal"],
    ["source-serif-4", "Source Serif 4", 600, "normal"],
    ["source-serif-4", "Source Serif 4", 400, "italic"],
    ["jetbrains-mono", "JetBrains Mono", 400, "normal"],
    ["jetbrains-mono", "JetBrains Mono", 700, "normal"],
  ];
  const declarations = [];
  const seenLicenses = new Set();
  const licenses = [];
  for (const [packageName, family, weight, style] of fonts) {
    const directory = path.join(ROOT, "frontend", "node_modules", "@fontsource", packageName);
    const bytes = await readFile(path.join(directory, "files", `${packageName}-latin-${weight}-${style}.woff2`));
    declarations.push(`@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};src:url(data:font/woff2;base64,${bytes.toString("base64")}) format("woff2");}`);
    if (!seenLicenses.has(packageName)) {
      seenLicenses.add(packageName);
      licenses.push(`${family}\n${await readFile(path.join(directory, "LICENSE"), "utf8")}`);
    }
  }
  return { styles: declarations.join("\n"), licenses: licenses.join("\n\n") };
}

function validateBounds(asset, bounds) {
  const { x, y, width, height } = asset.safeArea ?? {
    x: 24, y: 24, width: asset.width - 48, height: asset.height - 48,
  };
  assert.ok(bounds.x >= x && bounds.y >= y
    && bounds.x + bounds.width <= x + width
    && bounds.y + bounds.height <= y + height,
  `${asset.name}: essential artwork exceeds its safe area: ${JSON.stringify(bounds)}`);
  if (asset.circle) {
    for (const cornerX of [bounds.x, bounds.x + bounds.width]) {
      for (const cornerY of [bounds.y, bounds.y + bounds.height]) {
        assert.ok(Math.hypot(cornerX - asset.circle.x, cornerY - asset.circle.y) <= asset.circle.radius,
          `${asset.name}: artwork is not safe for circular cropping`);
      }
    }
  }
}

async function render() {
  const { chromium } = await import("@playwright/test");
  const author = JSON.parse(await readFile(path.join(ROOT, "frontend", "src", "content", "author.json"), "utf8"));
  const book = JSON.parse(await readFile(path.join(ROOT, "frontend", "public", "publications", "henok", "digital-organism-theory", "v4", "manifest.json"), "utf8"));
  const setup = buildChannelSetup(author, book);
  const fonts = await embeddedFonts();
  const assets = buildChannelAssets(author, fonts.styles);
  await mkdir(OUTPUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    await page.route("**/*", (route) => route.abort("blockedbyclient"));
    for (const asset of assets) {
      await page.setViewportSize({ width: asset.width, height: asset.height });
      await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${asset.svg}</body></html>`);
      const bounds = await page.evaluate(async () => {
        await document.fonts.ready;
        for (const spec of [
          '500 26px "Space Grotesk"',
          '700 26px "Space Grotesk"',
          '400 26px "Source Serif 4"',
          '600 26px "Source Serif 4"',
          'italic 400 26px "Source Serif 4"',
          '400 26px "JetBrains Mono"',
          '700 26px "JetBrains Mono"',
        ]) {
          const faces = await document.fonts.load(spec);
          if (faces.length === 0) {
            throw new Error(`Artwork font did not load: ${spec}`);
          }
        }
        const box = document.querySelector("[data-essential]").getBBox();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      });
      validateBounds(asset, bounds);
      const png = await page.locator("svg").screenshot({ path: path.join(OUTPUT, `${asset.name}.png`), omitBackground: asset.transparent === true });
      assert.equal(png.readUInt32BE(16), asset.width, `${asset.name}: incorrect PNG width`);
      assert.equal(png.readUInt32BE(20), asset.height, `${asset.name}: incorrect PNG height`);
      assert.ok(png.length <= asset.maxBytes, `${asset.name}: PNG exceeds YouTube upload limit`);
      if (asset.transparent) {
        const alpha = await page.evaluate(async (dataUrl) => {
          const image = new Image();
          image.src = dataUrl;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0);
          return {
            corner: context.getImageData(0, 0, 1, 1).data[3],
            centre: context.getImageData(256, 256, 1, 1).data[3],
          };
        }, `data:image/png;base64,${png.toString("base64")}`);
        assert.equal(alpha.corner, 0, `${asset.name}: PNG background must be transparent`);
        assert.ok(alpha.centre > 0, `${asset.name}: PNG must contain visible artwork`);
      }
      await writeFile(path.join(OUTPUT, `${asset.name}.svg`), asset.svg);
      if (asset.safeArea) {
        await page.screenshot({
          path: path.join(OUTPUT, "banner-mobile.png"),
          clip: asset.safeArea,
        });
      }
      console.log(`${asset.name}: ${asset.width}x${asset.height}, ${Math.ceil(png.length / 1024)} KiB; safe-area check passed`);
    }
    const splash = assets.find((asset) => asset.name === "splash");
    const endCard = assets.find((asset) => asset.name === "end-card");
    const video = process.argv.includes("--video")
      ? await renderSplashVideo({ page, svg: splash.svg, output: OUTPUT, ffmpeg: FFMPEG })
      : await loadSplashVideo(OUTPUT, splash.svg);
    if (video) setup.video = video;
    const bumper = process.argv.includes("--video")
      ? await renderBumperVideo({ page, svg: splash.svg, output: OUTPUT, ffmpeg: FFMPEG })
      : await loadBumperVideo(OUTPUT, splash.svg);
    if (bumper) setup.bumper = bumper;
    const trailer = process.argv.includes("--trailer")
      ? await renderTrailerVideo({ page, splashSvg: splash.svg, endCardSvg: endCard.svg, output: OUTPUT, ffmpeg: FFMPEG })
      : await loadTrailerVideo(OUTPUT, splash.svg, endCard.svg);
    if (trailer) setup.trailer = trailer;
    await writeFile(path.join(OUTPUT, "FONT-LICENSES.txt"), fonts.licenses);
    await writeFile(path.join(OUTPUT, "channel-description.txt"), `${setup.description}\n`);
    await writeFile(path.join(OUTPUT, "channel-setup.json"), `${JSON.stringify(setup, null, 2)}\n`);
    await writeFile(path.join(OUTPUT, "START-HERE.txt"), buildSetupText(setup));
    const downloadFiles = [
      ...assets.filter((asset) => asset.name !== "book-background").flatMap((asset) => [`${asset.name}.png`, `${asset.name}.svg`]),
      "banner-mobile.png", "START-HERE.txt", "channel-description.txt", "channel-setup.json", "FONT-LICENSES.txt",
      ...(video ? [video.file, video.storyboard, "splash-video.json"] : []),
      ...(bumper ? [bumper.file, bumper.storyboard, "splash-bumper.json"] : []),
      ...(trailer ? [trailer.file, trailer.storyboard, "channel-trailer.json"] : []),
    ];
    const mimeTypes = { ".png": "image/png", ".svg": "image/svg+xml", ".txt": "text/plain", ".json": "application/json" };
    // Videos sit next to index.html and are linked by file name; embedding 4K MP4s would make the page hundreds of MB.
    const files = Object.fromEntries(await Promise.all(downloadFiles.filter((file) => path.extname(file) !== ".mp4").map(async (file) => [
      file, `data:${mimeTypes[path.extname(file)]};base64,${(await readFile(path.join(OUTPUT, file))).toString("base64")}`,
    ])));
    await writeFile(path.join(OUTPUT, "index.html"), buildSetupPage(setup, fonts.styles, files));
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await render();
}
