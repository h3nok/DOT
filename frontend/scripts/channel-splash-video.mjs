import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NOTE, writeDigitalScore } from "./channel-digital-audio.mjs";

/** Layout space for all artwork; videos are rasterized from it at a higher density (2× = 4K). */
export const LOGICAL = { width: 1920, height: 1080 };

export const SPLASH_VIDEO = {
  file: "splash-intro.mp4",
  poster: "splash.png",
  storyboard: "splash-storyboard.png",
  width: 3840,
  height: 2160,
  fps: 30,
  duration_seconds: 14,
  frames: 420,
  audio: true,
  audio_codec: "AAC",
  audio_style: "quiet digital",
  animation_version: 11,
  sequence: ["T × E", "Big C", "RF₁…RFₙ", "RF₀", "Little c", "Rules of RF₀ & Others"],
};

/** Short episode-opening cut of the same animation (no captions, brand lockup only). */
export const SPLASH_BUMPER = {
  file: "splash-bumper.mp4",
  poster: "splash.png",
  storyboard: "splash-bumper-storyboard.png",
  width: 3840,
  height: 2160,
  fps: 30,
  duration_seconds: 5,
  frames: 150,
  audio: true,
  audio_codec: "AAC",
  audio_style: "quiet digital",
  animation_version: 3,
};

/** One clean typewriter line per beat. No boxes, no paragraphs. */
export const CAPTION_MS_PER_CHAR = 22;
export const SPLASH_CAPTIONS = [
  { start: 100, end: 1750, text: "T × E — before, after, and what allows it", tag: "SPECULATIVE" },
  { start: 1850, end: 3350, text: "Big C emerges and stabilizes itself" },
  { start: 3450, end: 6750, text: "Then it builds tools — worlds with rules" },
  { start: 6900, end: 9050, text: "Little c — you, among others" },
  { start: 9150, end: 11350, text: "See the rules. Choose with others." },
];
export const SPLASH_TAGLINE = "CONDITIONING · CHOICE · AGENCY";
export const LOCKUP_TITLE_START = 11550;
export const LOCKUP_TAGLINE_START = 12200;

/** Bumper seconds → splash seconds. Slow reveal, fast build, then the full brand lockup. */
const BUMPER_SEGMENTS = [[0, 0], [0.5, 0.9], [3.2, 11.4], [5, 14]];
const mapSegments = (value, from, to) => {
  for (let i = 0; i < BUMPER_SEGMENTS.length - 1; i++) {
    const a = BUMPER_SEGMENTS[i];
    const b = BUMPER_SEGMENTS[i + 1];
    if (value <= b[from] || i === BUMPER_SEGMENTS.length - 2) {
      const u = (value - a[from]) / (b[from] - a[from]);
      return a[to] + Math.max(0, Math.min(1, u)) * (b[to] - a[to]);
    }
  }
  return value;
};
export const bumperToSplash = (seconds) => mapSegments(seconds, 0, 1);
export const splashToBumper = (seconds) => mapSegments(seconds, 1, 0);

/** Score events in splash time; the bumper reuses them through the time map. */
const SCORE_EVENTS = [
  { t: 0.18, freq: NOTE.A3, amp: 0.55, pan: 0 },
  { t: 0.78, freq: NOTE.A4, amp: 0.5, pan: -0.3 },
  { t: 0.86, freq: NOTE.C5, amp: 0.45, pan: 0 },
  { t: 0.94, freq: NOTE.E5, amp: 0.42, pan: 0.3 },
  { t: 2.56, freq: NOTE.D5, amp: 0.45, pan: 0.45 },
  { t: 3.04, freq: NOTE.E5, amp: 0.45, pan: -0.45 },
  { t: 3.52, freq: NOTE.G5, amp: 0.42, pan: -0.2 },
  { t: 4.78, freq: NOTE.A1, amp: 0.7, kind: "thump" },
  { t: 4.78, freq: NOTE.A3, amp: 0.5, pan: -0.15 },
  { t: 4.78, freq: NOTE.E4, amp: 0.42, pan: 0.15 },
  { t: 7.08, freq: NOTE.A5, amp: 0.4, pan: 0 },
  { t: 7.52, freq: NOTE.E5, amp: 0.3, pan: 0.4 },
  { t: 7.72, freq: NOTE.G5, amp: 0.3, pan: 0.55 },
  { t: 7.92, freq: NOTE.D5, amp: 0.3, pan: -0.5 },
  { t: 9.92, freq: NOTE.C5, amp: 0.38, pan: -0.2 },
  { t: 10.0, freq: NOTE.E5, amp: 0.34, pan: 0.2 },
  { t: 10.38, freq: NOTE.G5, amp: 0.34, pan: -0.25 },
  { t: 10.46, freq: NOTE.A5, amp: 0.32, pan: 0.25 },
  // Brand moment: a two-note FM bell (sonic logo).
  { t: 11.6, freq: NOTE.E5, amp: 0.55, pan: -0.1, kind: "bell" },
  { t: 11.84, freq: NOTE.A5, amp: 0.5, pan: 0.1, kind: "bell" },
];

const typedTicks = (startMs, text) => Array.from(text, (_, index) => (startMs + index * CAPTION_MS_PER_CHAR) / 1000);
const CAPTION_TICKS = SPLASH_CAPTIONS.flatMap(({ start, text }) => typedTicks(start, text));
const TAGLINE_TICKS = typedTicks(LOCKUP_TAGLINE_START, SPLASH_TAGLINE);

export function splashSourceHash(svg) {
  return createHash("sha256").update(svg).digest("hex");
}

export function bumperSourceHash(svg) {
  return createHash("sha256").update(svg).update(`bumper-${SPLASH_BUMPER.animation_version}`).digest("hex");
}

export async function loadBumperVideo(output, svg) {
  try {
    const metadata = JSON.parse(await readFile(path.join(output, "splash-bumper.json"), "utf8"));
    if (metadata.animation_version !== SPLASH_BUMPER.animation_version) return undefined;
    if (metadata.source_sha256 !== bumperSourceHash(svg)) return undefined;
    const video = await readFile(path.join(output, SPLASH_BUMPER.file));
    if (metadata.video_sha256 !== createHash("sha256").update(video).digest("hex")) return undefined;
    await readFile(path.join(output, SPLASH_BUMPER.storyboard));
    return metadata;
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function loadSplashVideo(output, svg) {
  try {
    const metadata = JSON.parse(await readFile(path.join(output, "splash-video.json"), "utf8"));
    if (metadata.animation_version !== SPLASH_VIDEO.animation_version) return undefined;
    if (metadata.source_sha256 !== splashSourceHash(svg)) return undefined;
    const video = await readFile(path.join(output, SPLASH_VIDEO.file));
    if (metadata.video_sha256 !== createHash("sha256").update(video).digest("hex")) return undefined;
    await readFile(path.join(output, SPLASH_VIDEO.storyboard));
    return metadata;
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

/** Paused animations are sampled by frame number, independent of render speed. */
export function buildSplashAnimationDocument(svg) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    html,body{margin:0;background:#ffffff}svg{display:block}
  </style></head><body>${svg}<script>
    const svg = document.querySelector("svg");
    const make = (name, attributes = {}) => {
      const element = document.createElementNS(svg.namespaceURI, name);
      for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
      return element;
    };

    const membranePath = (cx, cy, radius, { amplitude, lobes, phase = 0 }) => {
      const steps = 96;
      const points = Array.from({ length: steps }, (_, step) => {
        const t = (step / steps) * Math.PI * 2;
        const r = radius + amplitude * (
          0.7 * Math.sin(lobes * t + phase) + 0.3 * Math.sin((lobes + 3) * t + phase * 1.7)
        );
        return (cx + Math.cos(t) * r).toFixed(2) + " " + (cy + Math.sin(t) * r).toFixed(2);
      });
      return "M" + points.join("L") + "Z";
    };

    const ambient = svg.querySelector("[data-splash-ambient]");
    const field = svg.querySelector("[data-splash-field]");
    const fieldRingsPath = svg.querySelector("[data-field-rings]");
    const fieldSpokesPath = svg.querySelector("[data-field-spokes]");
    const fieldNodesGroup = svg.querySelector("[data-field-nodes]");
    const archStage = svg.querySelector("[data-arch-stage]");
    const archRoot = svg.querySelector("[data-arch-root]");
    const ledgerPanel = svg.querySelector("[data-ledger-panel]");
    const actStage = svg.querySelector("[data-act-stage]");
    const lockup = svg.querySelector("[data-splash-lockup]");

    const reveal = make("circle", { cx: 960, cy: 442, r: 0 });
    const clipping = make("clipPath", { id: "intro-field-reveal", clipPathUnits: "userSpaceOnUse" });
    clipping.append(reveal);
    svg.querySelector("defs").append(clipping);
    if (field) field.setAttribute("clip-path", "url(#intro-field-reveal)");

    // Synaptic travellers streaming across the living background T × E grid
    const fieldPacketsLayer = make("g", { "data-field-packets": "" });
    if (field) field.append(fieldPacketsLayer);
    const fieldPacketSpecs = Array.from({ length: 28 }, (_, idx) => {
      const mode = idx % 3 === 0 ? "ring" : "spoke";
      const color = idx % 3 === 0 ? "#7a52a8" : idx % 2 === 0 ? "#2ad89d" : "#d98218";
      const halo = make("circle", { r: 7.5, fill: color, opacity: 0.32 });
      const core = make("circle", { r: 2.8, fill: color, stroke: "#ffffff", "stroke-width": 1 });
      fieldPacketsLayer.append(halo, core);
      return {
        halo,
        core,
        mode,
        spokeIdx: (idx * 7) % 96,
        ringIdx: 4 + (idx * 3) % 18,
        speed: (idx % 2 === 0 ? 1 : -1) * (0.00022 + (idx % 5) * 0.00004),
        phase: (idx / 28) * Math.PI * 2,
      };
    });

    // Dynamic emergence FX layer inside the 700x700 canonical architecture space
    const fxLayer = make("g", { "data-emergence-fx": "" });
    archRoot.append(fxLayer);

    // Pre-Big-C undifferentiated awareness sparks spiraling within T × E into (348, 352)
    const awarenessAngles = [-150, -120, -85, -50, -15, 20, 55, 95, 130, 165, 200, 235];
    const awarenessSparks = awarenessAngles.map((deg, idx) => {
      const rad = (deg * Math.PI) / 180;
      const startR = 135 + (idx % 3) * 32;
      const halo = make("circle", { cx: 348, cy: 352, r: 8, fill: idx % 2 === 0 ? "#2ad89d" : "#8b6bae", opacity: 0 });
      const dot = make("circle", { cx: 348, cy: 352, r: 3.6, fill: "#ffffff", stroke: "#086946", "stroke-width": 1.4, opacity: 0 });
      fxLayer.append(halo, dot);
      return { halo, dot, baseRad: rad, startR, start: 60 + idx * 45, duration: 920 };
    });

    // Primordial spark that ignites at (348, 352) and expands into Big C
    const primordialHalo = make("circle", { cx: 348, cy: 352, r: 42, fill: "#2ad89d", opacity: 0 });
    const primordialDot = make("circle", { cx: 348, cy: 352, r: 12, fill: "#086946", opacity: 0 });
    const primordialCore = make("circle", { cx: 348, cy: 352, r: 5, fill: "#ffffff", opacity: 0 });
    fxLayer.append(primordialHalo, primordialDot, primordialCore);

    // Concentric emergence & evolution waves across the 14-second story:
    // 1. T × E source (120ms) -> 2. Big C emerges (720ms) -> 3. RF₁/RF₂/RFₙ experiments (2650ms, 3150ms, 3650ms)
    // -> 4. RF₀ stabilized for Free Will (4850ms, 5350ms) -> 5. Little c₁ created (7150ms, 7750ms)
    // -> 6. Rules of RF₀, Intent, Cooperation & Evolution return wave to Big C (9550ms, 10250ms, 10650ms)
    const echoSpecs = [
      { cx: 348, cy: 352, start: 120, duration: 1650, color: "#5b3b80", minR: 12, maxR: 340, peak: 0.44, width: 2.4 },
      { cx: 348, cy: 352, start: 720, duration: 1850, color: "#2ad89d", minR: 18, maxR: 316, peak: 0.52, width: 2.8 },
      { cx: 543, cy: 200, start: 2680, duration: 1100, color: "#d98218", minR: 8, maxR: 58, peak: 0.52, width: 2.2 },
      { cx: 145, cy: 494, start: 3180, duration: 1100, color: "#d98218", minR: 8, maxR: 58, peak: 0.52, width: 2.2 },
      { cx: 113, cy: 276, start: 3680, duration: 1100, color: "#d98218", minR: 8, maxR: 58, peak: 0.52, width: 2.2 },
      { cx: 348, cy: 352, start: 4850, duration: 1550, color: "#d98218", minR: 36, maxR: 215, peak: 0.54, width: 2.6 },
      { cx: 348, cy: 352, start: 5350, duration: 1450, color: "#b86d0e", minR: 90, maxR: 202, peak: 0.4, width: 2 },
      { cx: 314, cy: 332, start: 7150, duration: 1450, color: "#12966b", minR: 8, maxR: 102, peak: 0.56, width: 2.6 },
      { cx: 314, cy: 332, start: 7750, duration: 1550, color: "#2ad89d", minR: 28, maxR: 136, peak: 0.45, width: 2.2 },
      { cx: 414, cy: 490, start: 10150, duration: 1250, color: "#d98218", minR: 5, maxR: 54, peak: 0.58, width: 2.4 },
      { cx: 413, cy: 230, start: 10380, duration: 1350, color: "#2ad89d", minR: 8, maxR: 66, peak: 0.55, width: 2.4 },
      // Evolution feedback wave from Little c₁ & c₂ returning to Big C's overarching membrane!
      { cx: 348, cy: 352, start: 10680, duration: 1650, color: "#12966b", minR: 72, maxR: 302, peak: 0.46, width: 2.5 },
    ];
    const echoes = echoSpecs.map((spec) => {
      const circle = make("circle", {
        cx: spec.cx,
        cy: spec.cy,
        r: spec.minR,
        fill: "none",
        stroke: spec.color,
        "stroke-width": spec.width,
        opacity: 0,
      });
      fxLayer.append(circle);
      return { circle, ...spec };
    });

    // Helper for travelling creation filaments (RF₁…RFₙ experiments, RF₀ stabilization, and Little c creation)
    const buildTravellerFilaments = (selector, baseStart, stagger, duration, haloColor, strokeColor) => {
      return [...archRoot.querySelectorAll(selector)].map((pathEl, idx) => {
        const total = pathEl.getTotalLength();
        pathEl.style.strokeDasharray = (total * 0.48).toFixed(1) + " " + total.toFixed(1);
        const sparkHalo = make("circle", { r: 9.5, fill: haloColor, opacity: 0 });
        const sparkDot = make("circle", { r: 4, fill: "#ffffff", stroke: strokeColor, "stroke-width": 1.8, opacity: 0 });
        fxLayer.append(sparkHalo, sparkDot);
        return {
          pathEl,
          sparkHalo,
          sparkDot,
          total,
          start: baseStart + idx * stagger,
          duration,
        };
      });
    };

    // 1. Big C projects experimental Reality Frames RF₁, RF₂, RFₙ (2.40s – 4.30s)
    const rfExperimentFilaments = buildTravellerFilaments("[data-rf-filament]", 2420, 480, 920, "#d98218", "#b86d0e");
    // 2. Big C engineers & stabilizes RF₀ for human experience (4.68s – 5.95s)
    const rf0StabilizeBeams = buildTravellerFilaments("[data-rf0-beam]", 4680, 90, 960, "#d98218", "#b86d0e");
    // 3. Big C creates Little c₁ and peers c₂…cₙ inside RF₀ (6.88s – 8.35s)
    const littleCFilaments = buildTravellerFilaments("[data-seed-filament]", 6880, 85, 1020, "#2ad89d", "#086946");
    const allFilaments = [...rfExperimentFilaments, ...rf0StabilizeBeams, ...littleCFilaments];

    // Intent traveller spark + Cooperation pulse in Act V (The Purpose of Humanity)
    const intentGroup = archRoot.querySelector("[data-little-c='intent']");
    const intentGlowPath = archRoot.querySelector("[data-intent-glow]");
    const intentTotal = intentGlowPath ? intentGlowPath.getTotalLength() : 180;
    const intentSparkHalo = make("circle", { r: 12, fill: "#d98218", opacity: 0 });
    const intentSparkDot = make("circle", { r: 4.8, fill: "#ffffff", stroke: "#d98218", "stroke-width": 1.8, opacity: 0 });
    if (intentGroup) intentGroup.append(intentSparkHalo, intentSparkDot);

    // Cooperation & Peer interaction pulses (between c₁ and c₂, c₃, c₄)
    const coopLine = archRoot.querySelector("[data-coop-line]");
    const coopSparkHalo = make("circle", { r: 10, fill: "#2ad89d", opacity: 0 });
    const coopSparkDot = make("circle", { r: 4.2, fill: "#ffffff", stroke: "#077a52", "stroke-width": 1.6, opacity: 0 });
    fxLayer.append(coopSparkHalo, coopSparkDot);

    // Synchronized Left-to-Right Ontological Ledger choreography (zero overlap with the right architectural stage)
    const animations = [];
    const animate = (element, keyframes, delay, duration, easing = "ease-out", origin, box = "view-box") => {
      if (!element) return;
      if (origin) {
        element.style.transformBox = box;
        element.style.transformOrigin = origin;
      }
      const animation = element.animate(keyframes, { delay, duration, easing, fill: "both", iterations: 1 });
      animation.pause();
      animation.currentTime = 0;
      animations.push(animation);
    };

    // Clean typewriter text: one line per beat, centre-justified as it types (it grows from the
    // centre outward), then the brand tagline. The caret is placed from the live text width.
    const MS_PER_CHAR = ${CAPTION_MS_PER_CHAR};
    const CAPTION_SPECS = ${JSON.stringify(SPLASH_CAPTIONS)};
    const caret = svg.querySelector("[data-type-caret]");
    const prepareTyped = (el, start, end, baselineY, fontSize) => {
      if (!el) return null;
      const full = el.textContent;
      el.setAttribute("text-anchor", "middle");
      el.setAttribute("x", "960");
      return { el, full, start, end, typedAt: start + full.length * MS_PER_CHAR, baselineY, fontSize };
    };
    const captionItems = CAPTION_SPECS.map((spec, idx) => ({
      ...prepareTyped(svg.querySelector(\`[data-caption="\${idx}"]\`), spec.start, spec.end, 930, 34),
      tag: svg.querySelector(\`[data-caption-tag="\${idx}"]\`),
    })).filter((item) => item.el);
    const lockupTitle = svg.querySelector("[data-splash-title]");
    const taglineItem = prepareTyped(svg.querySelector("[data-splash-tagline]"), ${LOCKUP_TAGLINE_START}, Infinity, 976, 22);
    const typeAt = (item, time) => {
      const elapsed = time - item.start;
      if (elapsed < 0 || time > item.end) {
        item.el.setAttribute("opacity", "0");
        return null;
      }
      const count = Math.min(item.full.length, Math.floor(elapsed / MS_PER_CHAR) + 1);
      item.el.textContent = item.full.slice(0, count);
      const fade = Number.isFinite(item.end) && time > item.end - 240 ? 1 - ease(clamp((time - (item.end - 240)) / 240)) : 1;
      item.el.setAttribute("opacity", fade.toFixed(3));
      return { x: 960 + item.el.getComputedTextLength() / 2 + 4, typing: count < item.full.length, fade };
    };
    const placeCaret = (item, state, time, hideAfter = Infinity) => {
      if (!caret) return;
      if (!state || time > hideAfter) {
        caret.setAttribute("opacity", "0");
        return;
      }
      const blinkOn = state.typing || Math.floor((time - item.typedAt) / 265) % 2 === 0;
      caret.setAttribute("x", state.x.toFixed(1));
      caret.setAttribute("y", (item.baselineY - item.fontSize * 0.8).toFixed(1));
      caret.setAttribute("height", (item.fontSize * 1.0).toFixed(1));
      caret.setAttribute("opacity", blinkOn ? state.fade.toFixed(3) : "0");
    };

    if (lockup) {
      animate(lockup, [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "translateY(0px)" }
      ], 40, 580, "cubic-bezier(0.22,1,0.36,1)");
    }

    if (ambient) animate(ambient, [{ opacity: 0 }, { opacity: 1 }], 0, 900, "ease-out");
    if (field) animate(field, [{ opacity: 0 }, { opacity: 1 }], 80, 1200, "ease-out");

    // Primordial spark at (348, 352) coalescing into Big C
    animate(primordialHalo, [
      { opacity: 0, transform: "scale(0.1)", offset: 0 },
      { opacity: 0.65, transform: "scale(1.55)", offset: 0.45 },
      { opacity: 0, transform: "scale(2.8)", offset: 1 }
    ], 420, 980, "ease-out", "348px 352px");
    animate(primordialDot, [
      { opacity: 0, transform: "scale(0.1)", offset: 0 },
      { opacity: 1, transform: "scale(1.3)", offset: 0.4 },
      { opacity: 0, transform: "scale(0.4)", offset: 1 }
    ], 380, 880, "cubic-bezier(0.16,1,0.3,1)", "348px 352px");
    animate(primordialCore, [
      { opacity: 0, transform: "scale(0.1)", offset: 0 },
      { opacity: 0.98, transform: "scale(1.25)", offset: 0.4 },
      { opacity: 0, transform: "scale(0.2)", offset: 1 }
    ], 420, 840, "ease-out", "348px 352px");

    // ACT I: T × E (The Source) & Big C Emergence (0.0s – 2.35s)
    animate(archRoot.querySelector("[data-te-wash]"), [{ opacity: 0 }, { opacity: 1 }], 60, 800);
    animate(archRoot.querySelector("[data-te-boundary]"), [
      { opacity: 0, transform: "scale(0.68)" },
      { opacity: 0.88, transform: "scale(1)" }
    ], 100, 900, "cubic-bezier(0.22,1,0.36,1)", "348px 352px");
    animate(archRoot.querySelector("[data-te-contours]"), [
      { opacity: 0, transform: "scale(0.8)" },
      { opacity: 0.8, transform: "scale(1)" }
    ], 220, 900, "cubic-bezier(0.22,1,0.36,1)", "348px 352px");
    animate(archRoot.querySelector("[data-label='te']"), [
      { opacity: 0, transform: "scale(0.7) translateY(10px)" },
      { opacity: 1, transform: "scale(1) translateY(0px)" }
    ], 300, 560, "cubic-bezier(0.22,1,0.36,1)", "348px 22px");

    animate(archRoot.querySelector("[data-big-c-body]"), [
      { opacity: 0, transform: "scale(0.025)", offset: 0 },
      { opacity: 1, transform: "scale(1.03)", offset: 0.74 },
      { opacity: 1, transform: "scale(1)", offset: 1 }
    ], 680, 1320, "cubic-bezier(0.16,1,0.3,1)", "348px 352px");

    animate(archRoot.querySelector("[data-big-c-details]"), [
      { opacity: 0 },
      { opacity: 1 }
    ], 1480, 660, "ease-out");

    archRoot.querySelectorAll("[data-big-c-node]").forEach((node, idx) => {
      animate(node, [
        { opacity: 0, transform: "scale(0.2)" },
        { opacity: 1, transform: "scale(1)" }
      ], 1480 + idx * 65, 520, "cubic-bezier(0.22,1,0.36,1)", "center", "fill-box");
    });

    animate(archRoot.querySelector("[data-label='big-c']"), [
      { opacity: 0, transform: "scale(0.72)", offset: 0 },
      { opacity: 1, transform: "scale(1.12)", offset: 0.65 },
      { opacity: 1, transform: "scale(1)", offset: 1 }
    ], 1320, 680, "cubic-bezier(0.22,1,0.36,1)", "348px 110px");

    animate(archRoot.querySelector("[data-loop='outer']"), [
      { opacity: 0 },
      { opacity: 0.92 }
    ], 1680, 680, "ease-out");

    // ACT II: Big C Experiments with Reality Frames RF₁ → RF₂ → RFₙ FIRST (2.35s – 4.65s)
    archRoot.querySelectorAll("[data-rfn-body]").forEach((frameBody, idx) => {
      animate(frameBody, [
        { opacity: 0, transform: "scale(0.12) rotate(-35deg)", offset: 0 },
        { opacity: 1, transform: "scale(1.22) rotate(8deg)", offset: 0.62 },
        { opacity: 1, transform: "scale(1) rotate(0deg)", offset: 1 }
      ], 2560 + idx * 480, 860, "cubic-bezier(0.22,1,0.36,1)", "center", "fill-box");
    });

    // ACT III: RF₀ Is Engineered & Made Stable for Human Experience (4.65s – 6.85s)
    animate(archRoot.querySelector("[data-rf0-body]"), [
      { opacity: 0, transform: "scale(0.22)", offset: 0 },
      { opacity: 1, transform: "scale(1.03)", offset: 0.76 },
      { opacity: 1, transform: "scale(1)", offset: 1 }
    ], 4760, 1120, "cubic-bezier(0.22,1,0.36,1)", "348px 352px");

    animate(archRoot.querySelector("[data-rf0-polar]"), [
      { opacity: 0, transform: "rotate(-48deg) scale(0.86)" },
      { opacity: 1, transform: "rotate(0deg) scale(1)" }
    ], 4960, 1080, "cubic-bezier(0.22,1,0.36,1)", "348px 352px");

    animate(archRoot.querySelector("[data-rf0-axes]"), [
      { opacity: 0 },
      { opacity: 1 }
    ], 5380, 680, "ease-out");

    animate(archRoot.querySelector("[data-label='rf0']"), [
      { opacity: 0, transform: "scale(0.72) translateY(8px)" },
      { opacity: 1, transform: "scale(1) translateY(0px)" }
    ], 5480, 580, "cubic-bezier(0.22,1,0.36,1)", "348px 181px");

    // ACT IV: Big C Creates Little c₁ & Peers c₂…cₙ Inside RF₀ (6.85s – 9.15s)
    animate(archRoot.querySelector("[data-c1-cell]"), [
      { opacity: 0, transform: "scale(0.05)", offset: 0 },
      { opacity: 1, transform: "scale(1.18)", offset: 0.7 },
      { opacity: 1, transform: "scale(1)", offset: 1 }
    ], 7080, 960, "cubic-bezier(0.16,1,0.3,1)", "348px 352px");

    animate(archRoot.querySelector("[data-label='little-c']"), [
      { opacity: 0, transform: "translateX(-14px) scale(0.88)" },
      { opacity: 1, transform: "translateX(0px) scale(1)" }
    ], 7440, 620, "cubic-bezier(0.22,1,0.36,1)", "418px 352px");

    animate(archRoot.querySelector("[data-loop='inner']"), [
      { opacity: 0 },
      { opacity: 0.94 }
    ], 7620, 660, "ease-out");

    archRoot.querySelectorAll("[data-peer]").forEach((peer, idx) => {
      const targetOpacity = peer.getAttribute("opacity") || "1";
      animate(peer, [
        { opacity: 0, transform: "scale(0.12)", offset: 0 },
        { opacity: Number(targetOpacity), transform: "scale(1.18)", offset: 0.72 },
        { opacity: Number(targetOpacity), transform: "scale(1)", offset: 1 }
      ], 7520 + idx * 180, 760, "cubic-bezier(0.22,1,0.36,1)", "center", "fill-box");
    });

    animate(archRoot.querySelector("[data-c1-awareness]"), [
      { opacity: 0, transform: "scale(0.28)", offset: 0 },
      { opacity: 1, transform: "scale(1.05)", offset: 0.75 },
      { opacity: 1, transform: "scale(1)", offset: 1 }
    ], 7880, 880, "cubic-bezier(0.22,1,0.36,1)", "348px 352px");

    animate(archRoot.querySelector("[data-label='awareness']"), [
      { opacity: 0, transform: "translateY(-8px)" },
      { opacity: 1, transform: "translateY(0px)" }
    ], 8280, 560, "ease-out");

    // ACT V: The Purpose of Humanity — Living by the Rules of RF₀ & With Others (9.15s – 11.75s)
    animate(archRoot.querySelector("[data-little-c='constraints']"), [
      { opacity: 0, transform: "scale(1.18)" },
      { opacity: 1, transform: "scale(1)" }
    ], 9180, 580, "cubic-bezier(0.22,1,0.36,1)", "348px 352px");

    animate(archRoot.querySelector("[data-purpose-tag='rules']"), [
      { opacity: 0, transform: "translateX(8px)" },
      { opacity: 1, transform: "translateX(0px)" }
    ], 9280, 520, "ease-out");

    animate(archRoot.querySelector("[data-little-c='options']"), [
      { opacity: 0 },
      { opacity: 1 }
    ], 9460, 580, "ease-out");

    animate(archRoot.querySelector("[data-little-c='relations']"), [
      { opacity: 0 },
      { opacity: 1 }
    ], 9680, 680, "ease-out");

    // Chosen option & Intent trajectory
    const chosenNode = archRoot.querySelector("[data-chosen-node]");
    if (chosenNode) {
      animate(chosenNode, [
        { opacity: 0, transform: "scale(0.25)", offset: 0 },
        { opacity: 1, transform: "scale(1.55)", offset: 0.55 },
        { opacity: 1, transform: "scale(1)", offset: 1 }
      ], 9920, 620, "cubic-bezier(0.22,1,0.36,1)", "391px 410px");
    }

    const solidIntent = archRoot.querySelector("[data-intent-solid]");
    if (solidIntent) {
      const sLen = solidIntent.getTotalLength();
      solidIntent.style.strokeDasharray = String(sLen);
      animate(solidIntent, [
        { opacity: 0, strokeDashoffset: String(sLen) },
        { opacity: 1, strokeDashoffset: "0" }
      ], 9980, 580, "cubic-bezier(0.22,1,0.36,1)");
    }

    const dottedIntent = archRoot.querySelector("[data-intent-dotted]");
    if (dottedIntent) {
      animate(dottedIntent, [
        { opacity: 0 },
        { opacity: 0.95 }
      ], 10320, 580, "ease-out");
    }

    if (intentGlowPath) {
      animate(intentGlowPath, [
        { opacity: 0 },
        { opacity: 0.52, offset: 0.55 },
        { opacity: 0.34, offset: 1 }
      ], 10040, 960, "ease-out");
    }

    animate(archRoot.querySelector("[data-intent-end]"), [
      { opacity: 0, transform: "scale(0.2)", offset: 0 },
      { opacity: 1, transform: "scale(1.5)", offset: 0.6 },
      { opacity: 1, transform: "scale(1)", offset: 1 }
    ], 10440, 540, "cubic-bezier(0.22,1,0.36,1)", "448px 510px");

    animate(archRoot.querySelector("[data-purpose-tag='intent']"), [
      { opacity: 0, transform: "translateY(6px)" },
      { opacity: 1, transform: "translateY(0px)" }
    ], 10480, 520, "ease-out");

    archRoot.querySelectorAll("[data-coop-arc]").forEach((arc) => {
      animate(arc, [
        { opacity: 0 },
        { opacity: 1, offset: 0.5 },
        { opacity: 0.96, offset: 1 }
      ], 10380, 740, "ease-out");
    });

    const bigCMembrane = archRoot.querySelector("[data-big-c-membrane]");
    const c1Surface = archRoot.querySelector("[data-c1-surface]");
    const c1Outer = archRoot.querySelector("[data-c1-outer]");
    const c1Inner = archRoot.querySelector("[data-c1-inner]");
    const outerLoopPath = archRoot.querySelector("[data-loop-path='outer']");
    const innerLoopPath = archRoot.querySelector("[data-loop-path='inner']");
    const outerLoopLen = outerLoopPath ? outerLoopPath.getTotalLength() : 600;
    const innerLoopLen = innerLoopPath ? innerLoopPath.getTotalLength() : 120;
    const outerLoopHalo = make("circle", { r: 8.5, fill: "#a61c63", opacity: 0 });
    const outerLoopDot = make("circle", { r: 3.4, fill: "#ffffff", stroke: "#a61c63", "stroke-width": 1.6, opacity: 0 });
    fxLayer.append(outerLoopHalo, outerLoopDot);
    const innerLoopGroup = archRoot.querySelector("[data-loop='inner']");
    const innerLoopHalo = make("circle", { r: 7, fill: "#d9560b", opacity: 0 });
    const innerLoopDot = make("circle", { r: 2.8, fill: "#ffffff", stroke: "#d9560b", "stroke-width": 1.4, opacity: 0 });
    if (innerLoopGroup) innerLoopGroup.append(innerLoopHalo, innerLoopDot);

    const latticeRules = archRoot.querySelector("[data-rfn-rules='lattice']");
    const polarRules = archRoot.querySelector("[data-rfn-rules='polar']");
    const peerCells = [
      { index: "2", x: 413, y: 230, order: 0 },
      { index: "3", x: 505, y: 285, order: 1 },
      { index: "4", x: 236, y: 265, order: 2 },
      { index: "n", x: 478, y: 462, order: 3 },
    ].map((p) => ({
      ...p,
      outer: archRoot.querySelector(\`[data-peer-outer="\${p.index}"]\`),
      inner: archRoot.querySelector(\`[data-peer-inner="\${p.index}"]\`),
    }));

    const clamp = (value) => Math.max(0, Math.min(1, value));
    const ease = (value) => 1 - Math.pow(1 - value, 3);

    // Precompute base radialField parameters for 1920x1080 centered at (960, 442)
    const FIELD_W = 1920;
    const FIELD_H = 1080;
    const FIELD_CX = 960;
    const FIELD_CY = 442;
    const FIELD_CORE = Math.min(FIELD_W, FIELD_H) * 0.047;
    const FIELD_SPOKES = 96;
    const FIELD_RINGS = 30;
    const FIELD_EXTENT = Math.hypot(FIELD_W, FIELD_H);

    // Dynamic living T × E background grid computation per frame
    const updateLivingField = (time) => {
      if (!fieldRingsPath || !fieldSpokesPath) return;
      // Smooth envelope that guarantees 0 displacement at t=14000ms (matching still poster) while vividly moving at all earlier frames
      const motionEnv = Math.sin(Math.PI * clamp(time / 14000));
      // Shockwaves from Big C ignition (720ms), RF₀ stabilization (4850ms), Little c birth (7150ms), and Cooperation (10380ms)
      const shock1 = Math.sin(Math.PI * clamp((time - 600) / 2200));
      const shock2 = Math.sin(Math.PI * clamp((time - 4750) / 2200));
      const shock3 = Math.sin(Math.PI * clamp((time - 7050) / 2200));
      const shock4 = Math.sin(Math.PI * clamp((time - 10200) / 2200));

      const grid = Array.from({ length: FIELD_RINGS }, (_, ring) => {
        const progress = ring / (FIELD_RINGS - 1);
        const baseRadius = FIELD_CORE * 1.2 * Math.pow(FIELD_EXTENT / (FIELD_CORE * 1.2), progress);
        const power = 2 + 5 * Math.pow(progress, 3);
        const radialRipple = motionEnv * (
          6 * Math.sin(ring * 0.55 - time * 0.0038) +
          4 * (shock1 + shock2 + shock3 + shock4) * Math.sin(ring * 0.7 - time * 0.0055)
        );
        const angleTwist = motionEnv * (
          0.018 * Math.sin(ring * 0.24 - time * 0.0022) +
          0.008 * Math.cos(ring * 0.4 + time * 0.0017)
        );
        return Array.from({ length: FIELD_SPOKES }, (_, spoke) => {
          const baseAngle = (spoke / FIELD_SPOKES) * Math.PI * 2;
          const spokeRipple = motionEnv * 2.5 * Math.cos(spoke * 0.25 + time * 0.0028);
          const angle = baseAngle + angleTwist * (1 - 0.35 * progress);
          const c = Math.cos(angle);
          const s = Math.sin(angle);
          const stretch = 1 / Math.pow(Math.pow(Math.abs(c), power) + Math.pow(Math.abs(s), power), 1 / power);
          const r = Math.max(12, baseRadius + radialRipple + spokeRipple);
          return {
            x: FIELD_CX + r * c * stretch,
            y: FIELD_CY + r * s * stretch,
          };
        });
      });

      const pt = (p) => p.x.toFixed(1) + " " + p.y.toFixed(1);
      fieldRingsPath.setAttribute("d", grid.map((ring) => "M" + ring.map(pt).join("L") + "Z").join(""));
      fieldSpokesPath.setAttribute("d", grid[0].map((_, s) => "M" + grid.map((ring) => pt(ring[s])).join("L")).join(""));

      // Update synaptic field packets streaming along the warped grid
      for (const pkt of fieldPacketSpecs) {
        if (motionEnv <= 0.01) {
          pkt.halo.setAttribute("opacity", "0");
          pkt.core.setAttribute("opacity", "0");
          continue;
        }
        let px = FIELD_CX;
        let py = FIELD_CY;
        if (pkt.mode === "spoke") {
          const u = ((time * pkt.speed + pkt.phase) % 1 + 1) % 1;
          const rFloat = 2 + u * (FIELD_RINGS - 5);
          const r0 = Math.floor(rFloat);
          const r1 = Math.min(FIELD_RINGS - 1, r0 + 1);
          const f = rFloat - r0;
          const p0 = grid[r0][pkt.spokeIdx];
          const p1 = grid[r1][pkt.spokeIdx];
          px = p0.x + (p1.x - p0.x) * f;
          py = p0.y + (p1.y - p0.y) * f;
        } else {
          const u = ((time * pkt.speed * 0.7 + pkt.phase) % 1 + 1) % 1;
          const sFloat = u * FIELD_SPOKES;
          const s0 = Math.floor(sFloat) % FIELD_SPOKES;
          const s1 = (s0 + 1) % FIELD_SPOKES;
          const f = sFloat - Math.floor(sFloat);
          const p0 = grid[pkt.ringIdx][s0];
          const p1 = grid[pkt.ringIdx][s1];
          px = p0.x + (p1.x - p0.x) * f;
          py = p0.y + (p1.y - p0.y) * f;
        }
        pkt.halo.setAttribute("cx", px.toFixed(1));
        pkt.halo.setAttribute("cy", py.toFixed(1));
        pkt.halo.setAttribute("opacity", (0.38 * motionEnv).toFixed(3));
        pkt.core.setAttribute("cx", px.toFixed(1));
        pkt.core.setAttribute("cy", py.toFixed(1));
        pkt.core.setAttribute("opacity", (0.92 * motionEnv).toFixed(3));
      }
    };

    // Gentle cosine-eased camera on the centred architecture. Zoom stays ≤ 1.04 so the
    // T × E label never reaches the "proposed model" pill at the top of the frame.
    const cameraStops = [
      { t: 0,     scale: 1.02, panX: 0,  panY: 0 },
      { t: 1800,  scale: 0.96, panX: 0,  panY: 0 },
      { t: 4400,  scale: 0.96, panX: 0,  panY: 0 },
      { t: 5400,  scale: 1.00, panX: 0,  panY: 0 },
      { t: 6600,  scale: 1.00, panX: 0,  panY: 0 },
      { t: 7500,  scale: 1.04, panX: 6,  panY: 2 },
      { t: 11400, scale: 1.03, panX: 4,  panY: 0 },
      { t: 12700, scale: 1.00, panX: 0,  panY: 0 },
      { t: 14000, scale: 1.00, panX: 0,  panY: 0 },
    ];
    const updateCamera = (time) => {
      if (!archRoot) return;
      let s0 = cameraStops[0];
      let s1 = cameraStops[cameraStops.length - 1];
      for (let i = 0; i < cameraStops.length - 1; i++) {
        if (time >= cameraStops[i].t && time <= cameraStops[i + 1].t) {
          s0 = cameraStops[i];
          s1 = cameraStops[i + 1];
          break;
        }
      }
      const span = Math.max(1, s1.t - s0.t);
      const u = clamp((time - s0.t) / span);
      const smooth = 0.5 - 0.5 * Math.cos(u * Math.PI);
      const camScale = 1.00 * (s0.scale + (s1.scale - s0.scale) * smooth);
      const tx = -348 + s0.panX + (s1.panX - s0.panX) * smooth;
      const ty = -352 + s0.panY + (s1.panY - s0.panY) * smooth;
      archRoot.setAttribute("transform", \`translate(960 442) scale(\${camScale.toFixed(4)}) translate(\${tx.toFixed(2)} \${ty.toFixed(2)})\`);
    };

    // Calm, clean motion: the structure builds and breathes, but nothing buzzes around it.
    // No travelling particles, sparks, orbiting dots, or scattered field nodes.
    for (const el of [
      ...fieldPacketSpecs.flatMap((packet) => [packet.halo, packet.core]),
      ...awarenessSparks.flatMap((spark) => [spark.halo, spark.dot]),
      ...allFilaments.flatMap((item) => [item.sparkHalo, item.sparkDot]),
      ...echoes.filter((echo) => echo.cx !== 348 || echo.cy !== 352).map((echo) => echo.circle),
      outerLoopHalo, outerLoopDot, innerLoopHalo, innerLoopDot,
      intentSparkHalo, intentSparkDot, coopSparkHalo, coopSparkDot,
      fieldNodesGroup,
    ]) {
      if (el) el.style.display = "none";
    }

    window.seekSplash = async (milliseconds) => {
      const time = Math.max(0, Math.min(${SPLASH_VIDEO.duration_seconds * 1000}, milliseconds));
      for (const animation of animations) animation.currentTime = time;

      // 1. Radial field reveal, living grid warp & deterministic camera lens
      reveal.setAttribute("r", String(2100 * ease(clamp((time - 40) / 1950))));
      // Camera and background grid stay still. Moving every fine line on every frame is what
      // makes YouTube's re-compression blur the picture; only the parts being built move.

      // 1b. Typewriter captions (0s – 11.4s), then the brand lockup: title fades up, tagline types.
      if (actStage) actStage.setAttribute("opacity", "1");
      let activeCaret = null;
      for (const item of captionItems) {
        const state = window.splashCaptions === false ? null : typeAt(item, time);
        if (!state) item.el.setAttribute("opacity", "0");
        if (item.tag) item.tag.setAttribute("opacity", state ? state.fade.toFixed(3) : "0");
        if (state) activeCaret = [item, state];
      }
      if (ledgerPanel) ledgerPanel.setAttribute("opacity", time < ${LOCKUP_TITLE_START} ? "0" : "1");
      if (lockupTitle) {
        const titleIn = ease(clamp((time - ${LOCKUP_TITLE_START}) / 620));
        lockupTitle.setAttribute("opacity", titleIn.toFixed(3));
        lockupTitle.setAttribute("transform", \`translate(0 \${((1 - titleIn) * 12).toFixed(1)})\`);
      }
      if (taglineItem) {
        const state = typeAt(taglineItem, time);
        if (state) activeCaret = [taglineItem, state, taglineItem.typedAt + 900];
      }
      if (activeCaret) placeCaret(activeCaret[0], activeCaret[1], time, activeCaret[2]);
      else placeCaret(null, null, time);

      // 2. Pre-Big-C undifferentiated awareness sparks spiraling into (348, 352)
      for (const spark of awarenessSparks) {
        const p = clamp((time - spark.start) / spark.duration);
        if (p <= 0 || p >= 1) {
          spark.halo.setAttribute("opacity", "0");
          spark.dot.setAttribute("opacity", "0");
        } else {
          const ep = ease(p);
          const r = spark.startR * (1 - ep);
          const angle = spark.baseRad + ep * 1.15;
          const x = (348 + Math.cos(angle) * r).toFixed(1);
          const y = (352 + Math.sin(angle) * r).toFixed(1);
          const light = Math.sin(Math.PI * p);
          spark.halo.setAttribute("cx", x);
          spark.halo.setAttribute("cy", y);
          spark.halo.setAttribute("opacity", (light * 0.45).toFixed(3));
          spark.dot.setAttribute("cx", x);
          spark.dot.setAttribute("cy", y);
          spark.dot.setAttribute("opacity", (light * 0.96).toFixed(3));
        }
      }

      // 3. Living organic membrane breathing for Big C, Little c₁, and peers c₂…cₙ (settles to canonical phase at 14s)
      const breatheEnvelope = Math.sin(Math.PI * clamp(time / 14000));
      const bigCPhase = 0.35 + breatheEnvelope * Math.sin(time * 0.0024) * 0.78;
      if (bigCMembrane) {
        bigCMembrane.setAttribute("d", membranePath(348, 352, 300.5, { amplitude: 4.6, lobes: 5, phase: bigCPhase }));
      }
      const c1Phase = 0.4 + breatheEnvelope * Math.sin(time * 0.0034) * 0.95;
      const c1OuterD = membranePath(348, 352, 28, { amplitude: 2.1, lobes: 4, phase: c1Phase });
      const c1InnerD = membranePath(348, 352, 21.84, { amplitude: 1.54, lobes: 4, phase: c1Phase + 2 });
      if (c1Surface) c1Surface.setAttribute("d", c1OuterD);
      if (c1Outer) c1Outer.setAttribute("d", c1OuterD);
      if (c1Inner) c1Inner.setAttribute("d", c1InnerD);

      for (const peer of peerCells) {
        const pPhase = peer.order * 1.9 + breatheEnvelope * Math.sin(time * 0.0038 + peer.order) * 0.9;
        if (peer.outer) {
          peer.outer.setAttribute("d", membranePath(peer.x, peer.y, 7.5, { amplitude: 7.5 * 0.075, lobes: 4, phase: pPhase }));
        }
        if (peer.inner) {
          peer.inner.setAttribute("d", membranePath(peer.x, peer.y, 7.5 * 0.78, { amplitude: 7.5 * 0.055, lobes: 4, phase: pPhase + 2 }));
        }
      }

      // 4. Experimental Reality Frames RF₁ & RF₂ internal rule-grid rotation
      const rfSpin = (breatheEnvelope * Math.sin(time * 0.0022) * 18).toFixed(2);
      if (latticeRules) {
        latticeRules.setAttribute("transform", \`rotate(\${rfSpin} 543 200)\`);
      }
      if (polarRules) {
        polarRules.setAttribute("transform", \`rotate(\${(-Number(rfSpin) * 1.2).toFixed(2)} 145 494)\`);
      }

      // 5. Continuous clockwise dash flow & orbiting state-update particles on Big C's outer loop & Little c₁'s inner loop
      if (outerLoopPath) {
        outerLoopPath.style.strokeDashoffset = String((-time * 0.032).toFixed(2));
        if (time >= 1750 && breatheEnvelope > 0.02) {
          const u = ((time - 1750) * 0.00028) % 1;
          const pos = outerLoopPath.getPointAtLength(u * outerLoopLen);
          const op = Math.min(1, (time - 1750) / 500) * breatheEnvelope;
          outerLoopHalo.setAttribute("cx", pos.x.toFixed(1));
          outerLoopHalo.setAttribute("cy", pos.y.toFixed(1));
          outerLoopHalo.setAttribute("opacity", (0.48 * op).toFixed(3));
          outerLoopDot.setAttribute("cx", pos.x.toFixed(1));
          outerLoopDot.setAttribute("cy", pos.y.toFixed(1));
          outerLoopDot.setAttribute("opacity", (0.95 * op).toFixed(3));
        } else {
          outerLoopHalo.setAttribute("opacity", "0");
          outerLoopDot.setAttribute("opacity", "0");
        }
      }
      if (innerLoopPath) {
        innerLoopPath.style.strokeDashoffset = String((-time * 0.028).toFixed(2));
        if (time >= 7700 && breatheEnvelope > 0.02) {
          const u = ((time - 7700) * 0.00042) % 1;
          const pos = innerLoopPath.getPointAtLength(u * innerLoopLen);
          const op = Math.min(1, (time - 7700) / 500) * breatheEnvelope;
          innerLoopHalo.setAttribute("cx", pos.x.toFixed(1));
          innerLoopHalo.setAttribute("cy", pos.y.toFixed(1));
          innerLoopHalo.setAttribute("opacity", (0.5 * op).toFixed(3));
          innerLoopDot.setAttribute("cx", pos.x.toFixed(1));
          innerLoopDot.setAttribute("cy", pos.y.toFixed(1));
          innerLoopDot.setAttribute("opacity", (0.96 * op).toFixed(3));
        } else {
          innerLoopHalo.setAttribute("opacity", "0");
          innerLoopDot.setAttribute("opacity", "0");
        }
      }

      // 6. Concentric emergence & evolution echoes
      for (const echo of echoes) {
        const progress = clamp((time - echo.start) / echo.duration);
        echo.circle.setAttribute("r", String(echo.minR + (echo.maxR - echo.minR) * ease(progress)));
        echo.circle.setAttribute("opacity", String(echo.peak * Math.sin(Math.PI * progress)));
      }

      // 7. Creation filaments: RF₁…RFₙ experiments, RF₀ stabilization beams, and Little c creation filaments
      for (const item of allFilaments) {
        const p = clamp((time - item.start) / item.duration);
        if (p <= 0 || p >= 1) {
          item.pathEl.setAttribute("opacity", "0");
          item.sparkHalo.setAttribute("opacity", "0");
          item.sparkDot.setAttribute("opacity", "0");
        } else {
          const dist = item.total * ease(p);
          const pos = item.pathEl.getPointAtLength(dist);
          const light = Math.sin(Math.PI * p);
          item.pathEl.style.strokeDashoffset = String((item.total * 0.48 - dist).toFixed(1));
          item.pathEl.setAttribute("opacity", String((light * 0.85).toFixed(3)));
          item.sparkHalo.setAttribute("cx", pos.x.toFixed(1));
          item.sparkHalo.setAttribute("cy", pos.y.toFixed(1));
          item.sparkHalo.setAttribute("opacity", String((light * 0.54).toFixed(3)));
          item.sparkDot.setAttribute("cx", pos.x.toFixed(1));
          item.sparkDot.setAttribute("cy", pos.y.toFixed(1));
          item.sparkDot.setAttribute("opacity", String((light * 0.98).toFixed(3)));
        }
      }

      // 8. Intent traveller spark along c₁'s chosen trajectory
      if (intentGlowPath) {
        const p = clamp((time - 9960) / 960);
        if (p <= 0 || p >= 1) {
          intentSparkHalo.setAttribute("opacity", "0");
          intentSparkDot.setAttribute("opacity", "0");
        } else {
          const dist = intentTotal * ease(p);
          const pos = intentGlowPath.getPointAtLength(dist);
          const light = Math.sin(Math.PI * p);
          intentSparkHalo.setAttribute("cx", pos.x.toFixed(1));
          intentSparkHalo.setAttribute("cy", pos.y.toFixed(1));
          intentSparkHalo.setAttribute("opacity", String((light * 0.56).toFixed(3)));
          intentSparkDot.setAttribute("cx", pos.x.toFixed(1));
          intentSparkDot.setAttribute("cy", pos.y.toFixed(1));
          intentSparkDot.setAttribute("opacity", String((light * 0.98).toFixed(3)));
        }
      }

      // 9. Cooperation traveller spark between c₁ and c₂
      if (coopLine) {
        const p = clamp((time - 10260) / 1080);
        if (p <= 0 || p >= 1) {
          coopSparkHalo.setAttribute("opacity", "0");
          coopSparkDot.setAttribute("opacity", "0");
        } else {
          const x1 = Number(coopLine.getAttribute("x1"));
          const y1 = Number(coopLine.getAttribute("y1"));
          const x2 = Number(coopLine.getAttribute("x2"));
          const y2 = Number(coopLine.getAttribute("y2"));
          const u = 0.5 - 0.5 * Math.cos(p * Math.PI * 2);
          const cx = (x2 + (x1 - x2) * u).toFixed(1);
          const cy = (y2 + (y1 - y2) * u).toFixed(1);
          const light = Math.sin(Math.PI * p);
          coopSparkHalo.setAttribute("cx", cx);
          coopSparkHalo.setAttribute("cy", cy);
          coopSparkHalo.setAttribute("opacity", String((light * 0.55).toFixed(3)));
          coopSparkDot.setAttribute("cx", cx);
          coopSparkDot.setAttribute("cy", cy);
          coopSparkDot.setAttribute("opacity", String((light * 0.98).toFixed(3)));
        }
      }

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    };
  </script></body></html>`;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let log = "";
    child.stderr.on("data", (chunk) => { log += chunk; });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(log) : reject(new Error(`${command} exited ${code}: ${log.slice(-4000)}`)));
  });
}

/** FFmpeg reading frames from stdin, with backpressure so large 4K frames never pile up in memory. */
function startEncoder(command, args) {
  const child = spawn(command, args, { stdio: ["pipe", "ignore", "pipe"] });
  let log = "";
  child.stderr.on("data", (chunk) => { log += chunk; });
  const done = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(log) : reject(new Error(`${command} exited ${code}: ${log.slice(-4000)}`)));
  });
  return {
    write: (buffer) => new Promise((resolve, reject) => {
      if (child.exitCode !== null) {
        reject(new Error(`${command} stopped early: ${log.slice(-4000)}`));
        return;
      }
      if (child.stdin.write(buffer)) resolve();
      else child.stdin.once("drain", resolve);
    }),
    finish: () => {
      child.stdin.end();
      return done;
    },
  };
}

/** Splash-time score events and keystroke ticks, optionally re-timed (for the bumper). */
function scoreFor({ durationSeconds, mapTime = (t) => t, captions = true }) {
  const events = SCORE_EVENTS.map((event) => ({ ...event, t: mapTime(event.t) }));
  const ticks = [...(captions ? CAPTION_TICKS : []), ...TAGLINE_TICKS].map(mapTime);
  return { durationSeconds, events, ticks };
}

async function measureLoudness(ffmpeg, file) {
  const log = await run(ffmpeg, ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const integrated = Number(log.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop()?.match(/-?[\d.]+/)?.[0]);
  const truePeak = Number(log.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop()?.match(/-?[\d.]+/)?.[0]);
  return { integrated_lufs: integrated, true_peak_dbfs: truePeak };
}

async function renderIntroVariant({ page: sharedPage, svg, output, ffmpeg, spec, metadataFile, sourceHash, toSplashMs, captions, sampleFrames, score, checks = [] }) {
  try {
    await run(ffmpeg, ["-version"]);
  } catch (error) {
    throw new Error("Video export needs FFmpeg with libx264. Install FFmpeg or set DOT_FFMPEG to its executable path.", { cause: error });
  }
  const temporary = await mkdtemp(path.join(os.tmpdir(), "dot-channel-splash-"));
  // A fresh page per variant: reusing the page after another export left its frames frozen.
  // The artwork is laid out at 1920 × 1080 and rasterized at the spec's density (2× for 4K),
  // so every line and letter is drawn natively at full resolution rather than upscaled.
  const page = await sharedPage.context().browser().newPage({ deviceScaleFactor: spec.width / LOGICAL.width });
  await page.route("**/*", (route) => route.abort("blockedbyclient"));
  try {
    await mkdir(output, { recursive: true });
    await page.setViewportSize(LOGICAL);
    await page.setContent(buildSplashAnimationDocument(svg));
    await page.evaluate(async (showCaptions) => {
      window.splashCaptions = showCaptions;
      await document.fonts.ready;
      for (const fontSpec of [
        '500 30px "Space Grotesk"',
        '700 30px "Space Grotesk"',
        '400 30px "Source Serif 4"',
        '600 30px "Source Serif 4"',
        'italic 400 30px "Source Serif 4"',
        '400 30px "JetBrains Mono"',
        '700 30px "JetBrains Mono"',
      ]) {
        const faces = await document.fonts.load(fontSpec);
        if (!faces.length) throw new Error(`Video font failed to load: ${fontSpec}`);
      }
    }, captions);

    const wavPath = path.join(temporary, "score.wav");
    await writeDigitalScore({ ...score, wavPath });
    const encoded = path.join(temporary, spec.file);
    // Lossless PNG frames are piped straight into the encoder (no lossy intermediates, no disk).
    const encoder = startEncoder(ffmpeg, [
      "-hide_banner", "-loglevel", "error", "-y",
      "-f", "image2pipe", "-framerate", String(spec.fps), "-c:v", "png", "-i", "-",
      "-i", wavPath,
      "-frames:v", String(spec.frames),
      "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
      "-c:v", "libx264", "-threads", "8", "-preset", "slow", "-tune", "animation", "-crf", "12",
      "-profile:v", "high", "-level:v", "5.1",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest",
      "-movflags", "+faststart", encoded,
    ]);
    const checkpoints = new Map();
    for (let frame = 0; frame < spec.frames; frame++) {
      await page.evaluate((milliseconds) => window.seekSplash(milliseconds), toSplashMs((frame * 1000) / spec.fps));
      const png = await page.screenshot({ type: "png", animations: "allow" });
      if (sampleFrames.includes(frame)) {
        checkpoints.set(frame, png);
        await writeFile(path.join(temporary, `${String(frame).padStart(4, "0")}.png`), png);
      }
      await encoder.write(png);
    }
    await encoder.finish();
    for (const [a, b, message] of checks) assert.notDeepEqual(checkpoints.get(a), checkpoints.get(b), message);

    // Decode the delivered MP4, rather than accepting a successful encode alone.
    const decoded = await run(ffmpeg, ["-hide_banner", "-i", encoded, "-f", "null", "-"]);
    assert.match(decoded, /Video: h264/);
    assert.match(decoded, new RegExp(`${spec.width}x${spec.height}`));
    assert.match(decoded, /30 fps/);
    assert.ok(decoded.includes(`Duration: 00:00:${spec.duration_seconds.toFixed(2).padStart(5, "0")}`));
    assert.match(decoded, new RegExp(`frame=\\s*${spec.frames}\\b`));
    assert.match(decoded, /Audio: aac/);
    const loudness = await measureLoudness(ffmpeg, encoded);
    assert.ok(loudness.true_peak_dbfs < -6, `${spec.file}: audio must stay quiet (true peak ${loudness.true_peak_dbfs} dBFS)`);

    const thumbEntries = [];
    for (const [frame] of checkpoints) {
      const srcPath = path.join(temporary, `${String(frame).padStart(4, "0")}.png`);
      const thumbPath = path.join(temporary, `thumb-${String(frame).padStart(4, "0")}.png`);
      const density = spec.width / LOGICAL.width;
      await run(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", srcPath, "-vf", `scale=${480 * density}:${270 * density}:flags=lanczos`, thumbPath]);
      thumbEntries.push([frame, await readFile(thumbPath)]);
    }
    const frames = thumbEntries.map(([frame, png]) => `<figure><img src="data:image/png;base64,${png.toString("base64")}"><figcaption>${(frame / spec.fps).toFixed(2)}s</figcaption></figure>`).join("");
    const styles = svg.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
    await page.setViewportSize({ width: 1920, height: 620 });
    await page.setContent(`<!doctype html><html><head><style>${styles}
      html,body{margin:0;background:#f8f7f2;color:#142822;font:20px "Space Grotesk",sans-serif}
      main{display:grid;grid-template-columns:repeat(4,480px)}figure{margin:0}img{display:block;width:480px;height:270px}figcaption{height:40px;padding:8px 20px;box-sizing:border-box}
    </style></head><body><main>${frames}</main></body></html>`);
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const image of document.images) {
        await image.decode();
      }
    });
    await page.screenshot({ path: path.join(output, spec.storyboard) });
    await copyFile(encoded, path.join(output, spec.file));
    const metadata = {
      ...spec,
      codec: "H.264",
      ...loudness,
      source_sha256: sourceHash,
      video_sha256: createHash("sha256").update(await readFile(encoded)).digest("hex"),
    };
    await writeFile(path.join(output, metadataFile), `${JSON.stringify(metadata, null, 2)}\n`);
    console.log(`${spec.file}: ${metadata.width}x${metadata.height}, ${metadata.fps} fps, ${metadata.duration_seconds}s, ${metadata.frames} decoded frames, H.264 + AAC; ${loudness.integrated_lufs} LUFS, true peak ${loudness.true_peak_dbfs} dBFS`);
    return metadata;
  } finally {
    await page.close();
    await rm(temporary, { recursive: true, force: true });
  }
}

export function renderSplashVideo({ page, svg, output, ffmpeg = "ffmpeg" }) {
  return renderIntroVariant({
    page, svg, output, ffmpeg,
    spec: SPLASH_VIDEO,
    metadataFile: "splash-video.json",
    sourceHash: splashSourceHash(svg),
    toSplashMs: (ms) => ms,
    captions: true,
    sampleFrames: [30, 75, 120, 168, 238, 300, 345, 419],
    score: scoreFor({ durationSeconds: SPLASH_VIDEO.duration_seconds }),
    checks: [
      [30, 75, "T × E must give way to Big C trying out possible worlds"],
      [75, 168, "Big C must then settle RF₀"],
      [168, 238, "Little c₁ and peers must appear inside RF₀"],
      [238, 300, "Little c₁ must navigate RF₀ rules and peers via Intent and Cooperation"],
      [300, 419, "The sequence must settle into the brand lockup"],
    ],
  });
}

export function renderBumperVideo({ page, svg, output, ffmpeg = "ffmpeg" }) {
  return renderIntroVariant({
    page, svg, output, ffmpeg,
    spec: SPLASH_BUMPER,
    metadataFile: "splash-bumper.json",
    sourceHash: bumperSourceHash(svg),
    toSplashMs: (ms) => bumperToSplash(ms / 1000) * 1000,
    captions: false,
    sampleFrames: [6, 24, 45, 66, 87, 102, 120, 149],
    score: scoreFor({ durationSeconds: SPLASH_BUMPER.duration_seconds, mapTime: splashToBumper, captions: false }),
    checks: [
      [6, 45, "The bumper must build the architecture"],
      [45, 87, "The bumper must reach RF₀ and Little c"],
      [87, 149, "The bumper must settle into the brand lockup"],
    ],
  });
}
