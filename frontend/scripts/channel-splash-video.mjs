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
  duration_seconds: 18,
  frames: 540,
  audio: true,
  audio_codec: "AAC",
  audio_style: "quiet digital",
  animation_version: 12,
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
  animation_version: 4,
};

/** One clean typewriter line per beat. No boxes, no paragraphs. */
export const CAPTION_MS_PER_CHAR = 22;
export const SPLASH_CAPTIONS = [
  { start: 180, end: 2550, text: "T × E — before, after, and what allows it", tag: "SPECULATIVE" },
  { start: 2700, end: 5350, text: "Big C emerges and stabilizes itself" },
  { start: 5500, end: 9450, text: "Then it builds tools — worlds with rules" },
  { start: 9600, end: 12350, text: "Little c — you, among others" },
  { start: 12500, end: 15150, text: "See the rules. Choose with others." },
];
export const SPLASH_TAGLINE = "CONDITIONING · CHOICE · AGENCY";
export const LOCKUP_TITLE_START = 15300;
export const LOCKUP_TAGLINE_START = 15850;

/** Bumper seconds → splash seconds. Slow reveal, fast build, then the full brand lockup. */
const BUMPER_SEGMENTS = [[0, 0], [0.5, 1.3], [3.2, 15.2], [5, 18]];
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
  { t: 0.22, freq: NOTE.A3, amp: 0.52, pan: 0 },
  { t: 2.68, freq: NOTE.A4, amp: 0.48, pan: -0.28 },
  { t: 2.78, freq: NOTE.C5, amp: 0.44, pan: 0 },
  { t: 2.88, freq: NOTE.E5, amp: 0.42, pan: 0.28 },
  { t: 5.58, freq: NOTE.D5, amp: 0.44, pan: 0.42 },
  { t: 6.06, freq: NOTE.E5, amp: 0.44, pan: -0.42 },
  { t: 6.54, freq: NOTE.G5, amp: 0.4, pan: -0.18 },
  { t: 7.48, freq: NOTE.A1, amp: 0.68, kind: "thump" },
  { t: 7.48, freq: NOTE.A3, amp: 0.48, pan: -0.15 },
  { t: 7.48, freq: NOTE.E4, amp: 0.4, pan: 0.15 },
  { t: 9.72, freq: NOTE.A5, amp: 0.4, pan: 0 },
  { t: 10.18, freq: NOTE.E5, amp: 0.3, pan: 0.38 },
  { t: 10.38, freq: NOTE.G5, amp: 0.3, pan: 0.52 },
  { t: 10.58, freq: NOTE.D5, amp: 0.3, pan: -0.48 },
  { t: 13.32, freq: NOTE.C5, amp: 0.38, pan: -0.2 },
  { t: 13.42, freq: NOTE.E5, amp: 0.34, pan: 0.2 },
  { t: 13.82, freq: NOTE.G5, amp: 0.34, pan: -0.24 },
  { t: 13.92, freq: NOTE.A5, amp: 0.32, pan: 0.24 },
  // Brand moment: a two-note FM bell (sonic logo).
  { t: 15.35, freq: NOTE.E5, amp: 0.54, pan: -0.1, kind: "bell" },
  { t: 15.59, freq: NOTE.A5, amp: 0.48, pan: 0.1, kind: "bell" },
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

    // Studio key-light halo inside the canonical 700x700 architecture space (settles to 0 at 18s so the final frame matches splash.png)
    const studioDefs = svg.querySelector("defs");
    const studioGrad = make("radialGradient", { id: "splash-studio-key-grad", cx: "42%", cy: "38%", r: "58%" });
    const studioStop0 = make("stop", { offset: "0%", "stop-color": "#8b6bae", "stop-opacity": "0.26" });
    const studioStop1 = make("stop", { offset: "55%", "stop-color": "#2ad89d", "stop-opacity": "0.10" });
    const studioStop2 = make("stop", { offset: "100%", "stop-color": "#ffffff", "stop-opacity": "0" });
    studioGrad.append(studioStop0, studioStop1, studioStop2);
    if (studioDefs) studioDefs.append(studioGrad);
    const studioKeyHalo = make("circle", { cx: 348, cy: 352, r: 340, fill: "url(#splash-studio-key-grad)", opacity: 0 });
    archRoot.insertBefore(studioKeyHalo, archRoot.firstChild);

    // Concentric emergence & evolution waves across the 18-second story:
    // 1. T × E source (140ms) -> 2. Big C emerges (2720ms) -> 3. RF₁/RF₂/RFₙ experiments (5620ms, 6100ms, 6580ms)
    // -> 4. RF₀ stabilized for Free Will (7520ms, 8020ms) -> 5. Little c₁ created (9740ms, 10340ms)
    // -> 6. Rules of RF₀, Intent, Cooperation & Evolution return wave to Big C (13450ms, 13880ms, 14180ms)
    const echoSpecs = [
      { cx: 348, cy: 352, start: 140, duration: 2100, color: "#5b3b80", minR: 12, maxR: 340, peak: 0.44, width: 2.4 },
      { cx: 348, cy: 352, start: 2720, duration: 2100, color: "#2ad89d", minR: 18, maxR: 316, peak: 0.52, width: 2.8 },
      { cx: 543, cy: 200, start: 5620, duration: 1150, color: "#d98218", minR: 8, maxR: 58, peak: 0.52, width: 2.2 },
      { cx: 145, cy: 494, start: 6100, duration: 1150, color: "#d98218", minR: 8, maxR: 58, peak: 0.52, width: 2.2 },
      { cx: 113, cy: 276, start: 6580, duration: 1150, color: "#d98218", minR: 8, maxR: 58, peak: 0.52, width: 2.2 },
      { cx: 348, cy: 352, start: 7520, duration: 1650, color: "#d98218", minR: 36, maxR: 215, peak: 0.54, width: 2.6 },
      { cx: 348, cy: 352, start: 8020, duration: 1550, color: "#b86d0e", minR: 90, maxR: 202, peak: 0.4, width: 2 },
      { cx: 314, cy: 332, start: 9740, duration: 1550, color: "#12966b", minR: 8, maxR: 102, peak: 0.56, width: 2.6 },
      { cx: 314, cy: 332, start: 10340, duration: 1650, color: "#2ad89d", minR: 28, maxR: 136, peak: 0.45, width: 2.2 },
      { cx: 414, cy: 490, start: 13450, duration: 1350, color: "#d98218", minR: 5, maxR: 54, peak: 0.58, width: 2.4 },
      { cx: 413, cy: 230, start: 13880, duration: 1450, color: "#2ad89d", minR: 8, maxR: 66, peak: 0.55, width: 2.4 },
      // Evolution feedback wave from Little c₁ & c₂ returning to Big C's overarching membrane!
      { cx: 348, cy: 352, start: 14180, duration: 1850, color: "#12966b", minR: 72, maxR: 302, peak: 0.46, width: 2.5 },
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

    // 1. Big C projects experimental Reality Frames RF₁, RF₂, RFₙ (5.48s – 7.40s)
    const rfExperimentFilaments = buildTravellerFilaments("[data-rf-filament]", 5480, 480, 960, "#d98218", "#b86d0e");
    // 2. Big C engineers & stabilizes RF₀ for human experience (7.40s – 8.70s)
    const rf0StabilizeBeams = buildTravellerFilaments("[data-rf0-beam]", 7400, 95, 1020, "#d98218", "#b86d0e");
    // 3. Big C creates Little c₁ and peers c₂…cₙ inside RF₀ (9.52s – 11.10s)
    const littleCFilaments = buildTravellerFilaments("[data-seed-filament]", 9520, 90, 1060, "#2ad89d", "#086946");
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
      const fade = Number.isFinite(item.end) && time > item.end - 260 ? 1 - ease(clamp((time - (item.end - 260)) / 260)) : 1;
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
      ], 40, 640, "cubic-bezier(0.22,1,0.36,1)");
    }

    if (ambient) animate(ambient, [{ opacity: 0 }, { opacity: 1 }], 0, 960, "ease-out");
    if (field) animate(field, [{ opacity: 0 }, { opacity: 1 }], 80, 1280, "ease-out");

    // Primordial spark at (348, 352) coalescing into Big C at the transition to Act II (2.30s – 3.30s)
    animate(primordialHalo, [
      { opacity: 0, transform: "scale(0.1)", offset: 0 },
      { opacity: 0.65, transform: "scale(1.55)", offset: 0.45 },
      { opacity: 0, transform: "scale(2.8)", offset: 1 }
    ], 2320, 980, "ease-out", "348px 352px");
    animate(primordialDot, [
      { opacity: 0, transform: "scale(0.1)", offset: 0 },
      { opacity: 1, transform: "scale(1.3)", offset: 0.4 },
      { opacity: 0, transform: "scale(0.4)", offset: 1 }
    ], 2280, 880, "cubic-bezier(0.16,1,0.3,1)", "348px 352px");
    animate(primordialCore, [
      { opacity: 0, transform: "scale(0.1)", offset: 0 },
      { opacity: 0.98, transform: "scale(1.25)", offset: 0.4 },
      { opacity: 0, transform: "scale(0.2)", offset: 1 }
    ], 2320, 840, "ease-out", "348px 352px");

    // ACT I: T × E (The Speculative Source — before, after, and what allows it) (0.0s – 2.55s)
    animate(archRoot.querySelector("[data-te-wash]"), [{ opacity: 0 }, { opacity: 1 }], 60, 860);
    animate(archRoot.querySelector("[data-te-boundary]"), [
      { opacity: 0, transform: "scale(0.68)" },
      { opacity: 0.88, transform: "scale(1)" }
    ], 100, 960, "cubic-bezier(0.22,1,0.36,1)", "348px 352px");
    animate(archRoot.querySelector("[data-te-contours]"), [
      { opacity: 0, transform: "scale(0.8)" },
      { opacity: 0.8, transform: "scale(1)" }
    ], 220, 960, "cubic-bezier(0.22,1,0.36,1)", "348px 352px");
    animate(archRoot.querySelector("[data-label='te']"), [
      { opacity: 0, transform: "scale(0.7) translateY(10px)" },
      { opacity: 1, transform: "scale(1) translateY(0px)" }
    ], 320, 620, "cubic-bezier(0.22,1,0.36,1)", "348px 22px");

    // ACT II: Big C Emerges and Stabilizes Itself (2.60s – 5.35s)
    animate(archRoot.querySelector("[data-big-c-body]"), [
      { opacity: 0, transform: "scale(0.025)", offset: 0 },
      { opacity: 1, transform: "scale(1.03)", offset: 0.74 },
      { opacity: 1, transform: "scale(1)", offset: 1 }
    ], 2680, 1380, "cubic-bezier(0.16,1,0.3,1)", "348px 352px");

    animate(archRoot.querySelector("[data-big-c-details]"), [
      { opacity: 0 },
      { opacity: 1 }
    ], 3480, 720, "ease-out");

    archRoot.querySelectorAll("[data-big-c-node]").forEach((node, idx) => {
      animate(node, [
        { opacity: 0, transform: "scale(0.2)" },
        { opacity: 1, transform: "scale(1)" }
      ], 3480 + idx * 70, 560, "cubic-bezier(0.22,1,0.36,1)", "center", "fill-box");
    });

    animate(archRoot.querySelector("[data-label='big-c']"), [
      { opacity: 0, transform: "scale(0.72)", offset: 0 },
      { opacity: 1, transform: "scale(1.12)", offset: 0.65 },
      { opacity: 1, transform: "scale(1)", offset: 1 }
    ], 3320, 720, "cubic-bezier(0.22,1,0.36,1)", "348px 110px");

    animate(archRoot.querySelector("[data-loop='outer']"), [
      { opacity: 0 },
      { opacity: 0.92 }
    ], 3820, 740, "ease-out");

    // ACT III-A: Big C Experiments with Candidate Reality Frames RF₁ → RF₂ → RFₙ FIRST (5.45s – 7.40s)
    archRoot.querySelectorAll("[data-rfn-body]").forEach((frameBody, idx) => {
      animate(frameBody, [
        { opacity: 0, transform: "scale(0.12) rotate(-35deg)", offset: 0 },
        { opacity: 1, transform: "scale(1.22) rotate(8deg)", offset: 0.62 },
        { opacity: 1, transform: "scale(1) rotate(0deg)", offset: 1 }
      ], 5560 + idx * 480, 880, "cubic-bezier(0.22,1,0.36,1)", "center", "fill-box");
    });

    // ACT III-B: RF₀ Is Engineered & Made Stable for Human Experience (7.40s – 9.45s)
    animate(archRoot.querySelector("[data-rf0-body]"), [
      { opacity: 0, transform: "scale(0.22)", offset: 0 },
      { opacity: 1, transform: "scale(1.03)", offset: 0.76 },
      { opacity: 1, transform: "scale(1)", offset: 1 }
    ], 7480, 1140, "cubic-bezier(0.22,1,0.36,1)", "348px 352px");

    animate(archRoot.querySelector("[data-rf0-polar]"), [
      { opacity: 0, transform: "rotate(-48deg) scale(0.86)" },
      { opacity: 1, transform: "rotate(0deg) scale(1)" }
    ], 7720, 1100, "cubic-bezier(0.22,1,0.36,1)", "348px 352px");

    animate(archRoot.querySelector("[data-rf0-axes]"), [
      { opacity: 0 },
      { opacity: 1 }
    ], 8140, 700, "ease-out");

    animate(archRoot.querySelector("[data-label='rf0']"), [
      { opacity: 0, transform: "scale(0.72) translateY(8px)" },
      { opacity: 1, transform: "scale(1) translateY(0px)" }
    ], 8260, 620, "cubic-bezier(0.22,1,0.36,1)", "348px 181px");

    // ACT IV: Big C Creates Little c₁ & Peers c₂…cₙ Inside RF₀ (9.55s – 12.35s)
    animate(archRoot.querySelector("[data-c1-cell]"), [
      { opacity: 0, transform: "scale(0.05)", offset: 0 },
      { opacity: 1, transform: "scale(1.18)", offset: 0.7 },
      { opacity: 1, transform: "scale(1)", offset: 1 }
    ], 9680, 980, "cubic-bezier(0.16,1,0.3,1)", "348px 352px");

    animate(archRoot.querySelector("[data-label='little-c']"), [
      { opacity: 0, transform: "translateX(-14px) scale(0.88)" },
      { opacity: 1, transform: "translateX(0px) scale(1)" }
    ], 10080, 640, "cubic-bezier(0.22,1,0.36,1)", "418px 352px");

    animate(archRoot.querySelector("[data-loop='inner']"), [
      { opacity: 0 },
      { opacity: 0.94 }
    ], 10280, 680, "ease-out");

    archRoot.querySelectorAll("[data-peer]").forEach((peer, idx) => {
      const targetOpacity = peer.getAttribute("opacity") || "1";
      animate(peer, [
        { opacity: 0, transform: "scale(0.12)", offset: 0 },
        { opacity: Number(targetOpacity), transform: "scale(1.18)", offset: 0.72 },
        { opacity: Number(targetOpacity), transform: "scale(1)", offset: 1 }
      ], 10180 + idx * 190, 780, "cubic-bezier(0.22,1,0.36,1)", "center", "fill-box");
    });

    animate(archRoot.querySelector("[data-c1-awareness]"), [
      { opacity: 0, transform: "scale(0.28)", offset: 0 },
      { opacity: 1, transform: "scale(1.05)", offset: 0.75 },
      { opacity: 1, transform: "scale(1)", offset: 1 }
    ], 10540, 900, "cubic-bezier(0.22,1,0.36,1)", "348px 352px");

    animate(archRoot.querySelector("[data-label='awareness']"), [
      { opacity: 0, transform: "translateY(-8px)" },
      { opacity: 1, transform: "translateY(0px)" }
    ], 10920, 600, "ease-out");

    // ACT V: The Purpose of Humanity — Living by the Rules of RF₀ & With Others (12.45s – 15.15s)
    animate(archRoot.querySelector("[data-little-c='constraints']"), [
      { opacity: 0, transform: "scale(1.18)" },
      { opacity: 1, transform: "scale(1)" }
    ], 12560, 600, "cubic-bezier(0.22,1,0.36,1)", "348px 352px");

    animate(archRoot.querySelector("[data-purpose-tag='rules']"), [
      { opacity: 0, transform: "translateX(8px)" },
      { opacity: 1, transform: "translateX(0px)" }
    ], 12660, 540, "ease-out");

    animate(archRoot.querySelector("[data-little-c='options']"), [
      { opacity: 0 },
      { opacity: 1 }
    ], 12840, 600, "ease-out");

    animate(archRoot.querySelector("[data-little-c='relations']"), [
      { opacity: 0 },
      { opacity: 1 }
    ], 13080, 700, "ease-out");

    // Chosen option & Intent trajectory
    const chosenNode = archRoot.querySelector("[data-chosen-node]");
    if (chosenNode) {
      animate(chosenNode, [
        { opacity: 0, transform: "scale(0.25)", offset: 0 },
        { opacity: 1, transform: "scale(1.55)", offset: 0.55 },
        { opacity: 1, transform: "scale(1)", offset: 1 }
      ], 13320, 640, "cubic-bezier(0.22,1,0.36,1)", "391px 410px");
    }

    const solidIntent = archRoot.querySelector("[data-intent-solid]");
    if (solidIntent) {
      const sLen = solidIntent.getTotalLength();
      solidIntent.style.strokeDasharray = String(sLen);
      animate(solidIntent, [
        { opacity: 0, strokeDashoffset: String(sLen) },
        { opacity: 1, strokeDashoffset: "0" }
      ], 13380, 620, "cubic-bezier(0.22,1,0.36,1)");
    }

    const dottedIntent = archRoot.querySelector("[data-intent-dotted]");
    if (dottedIntent) {
      animate(dottedIntent, [
        { opacity: 0 },
        { opacity: 0.95 }
      ], 13740, 620, "ease-out");
    }

    if (intentGlowPath) {
      animate(intentGlowPath, [
        { opacity: 0 },
        { opacity: 0.52, offset: 0.55 },
        { opacity: 0.34, offset: 1 }
      ], 13440, 980, "ease-out");
    }

    animate(archRoot.querySelector("[data-intent-end]"), [
      { opacity: 0, transform: "scale(0.2)", offset: 0 },
      { opacity: 1, transform: "scale(1.5)", offset: 0.6 },
      { opacity: 1, transform: "scale(1)", offset: 1 }
    ], 13860, 580, "cubic-bezier(0.22,1,0.36,1)", "448px 510px");

    animate(archRoot.querySelector("[data-purpose-tag='intent']"), [
      { opacity: 0, transform: "translateY(6px)" },
      { opacity: 1, transform: "translateY(0px)" }
    ], 13900, 540, "ease-out");

    archRoot.querySelectorAll("[data-coop-arc]").forEach((arc) => {
      animate(arc, [
        { opacity: 0 },
        { opacity: 1, offset: 0.5 },
        { opacity: 0.96, offset: 1 }
      ], 13820, 760, "ease-out");
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

      // 1. Radial field reveal & studio key-light envelope (settles to 0 at 18s so frame 539 matches splash.png)
      reveal.setAttribute("r", String(2100 * ease(clamp((time - 40) / 1950))));
      const studioEnv = Math.sin(Math.PI * clamp(time / 17600));
      if (studioKeyHalo) {
        if (time < 2600) {
          studioStop0.setAttribute("stop-color", "#8b6bae");
          studioStop1.setAttribute("stop-color", "#c3aee0");
        } else if (time < 5500) {
          studioStop0.setAttribute("stop-color", "#2ad89d");
          studioStop1.setAttribute("stop-color", "#12966b");
        } else if (time < 9550) {
          studioStop0.setAttribute("stop-color", "#f2b866");
          studioStop1.setAttribute("stop-color", "#d98218");
        } else {
          studioStop0.setAttribute("stop-color", "#2ad89d");
          studioStop1.setAttribute("stop-color", "#d98218");
        }
        studioKeyHalo.setAttribute("opacity", (0.72 * studioEnv).toFixed(3));
      }

      // 1b. Typewriter captions (0s – 15.15s), then the brand lockup: title fades up, tagline types.
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
        const titleIn = ease(clamp((time - ${LOCKUP_TITLE_START}) / 640));
        lockupTitle.setAttribute("opacity", titleIn.toFixed(3));
        lockupTitle.setAttribute("transform", \`translate(0 \${((1 - titleIn) * 12).toFixed(1)})\`);
      }
      if (taglineItem) {
        const state = typeAt(taglineItem, time);
        if (state) activeCaret = [taglineItem, state, taglineItem.typedAt + 950];
      }
      if (activeCaret) placeCaret(activeCaret[0], activeCaret[1], time, activeCaret[2]);
      else placeCaret(null, null, time);

      // 3. Living organic membrane breathing for Big C, Little c₁, and peers c₂…cₙ (settles to canonical phase at 18s)
      const breatheEnvelope = Math.sin(Math.PI * clamp(time / 18000));
      const bigCPhase = 0.35 + breatheEnvelope * Math.sin(time * 0.0022) * 0.78;
      if (bigCMembrane) {
        bigCMembrane.setAttribute("d", membranePath(348, 352, 300.5, { amplitude: 4.6, lobes: 5, phase: bigCPhase }));
      }
      const c1Phase = 0.4 + breatheEnvelope * Math.sin(time * 0.0031) * 0.95;
      const c1OuterD = membranePath(348, 352, 28, { amplitude: 2.1, lobes: 4, phase: c1Phase });
      const c1InnerD = membranePath(348, 352, 21.84, { amplitude: 1.54, lobes: 4, phase: c1Phase + 2 });
      if (c1Surface) c1Surface.setAttribute("d", c1OuterD);
      if (c1Outer) c1Outer.setAttribute("d", c1OuterD);
      if (c1Inner) c1Inner.setAttribute("d", c1InnerD);

      for (const peer of peerCells) {
        const pPhase = peer.order * 1.9 + breatheEnvelope * Math.sin(time * 0.0034 + peer.order) * 0.9;
        if (peer.outer) {
          peer.outer.setAttribute("d", membranePath(peer.x, peer.y, 7.5, { amplitude: 7.5 * 0.075, lobes: 4, phase: pPhase }));
        }
        if (peer.inner) {
          peer.inner.setAttribute("d", membranePath(peer.x, peer.y, 7.5 * 0.78, { amplitude: 7.5 * 0.055, lobes: 4, phase: pPhase + 2 }));
        }
      }

      // 4. Experimental Reality Frames RF₁ & RF₂ internal rule-grid rotation
      const rfSpin = (breatheEnvelope * Math.sin(time * 0.002) * 18).toFixed(2);
      if (latticeRules) {
        latticeRules.setAttribute("transform", \`rotate(\${rfSpin} 543 200)\`);
      }
      if (polarRules) {
        polarRules.setAttribute("transform", \`rotate(\${(-Number(rfSpin) * 1.2).toFixed(2)} 145 494)\`);
      }

      // 5. Continuous clockwise dash flow on Big C's outer loop & Little c₁'s inner loop
      if (outerLoopPath) {
        outerLoopPath.style.strokeDashoffset = String((-time * 0.028).toFixed(2));
      }
      if (innerLoopPath) {
        innerLoopPath.style.strokeDashoffset = String((-time * 0.024).toFixed(2));
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
        } else {
          const dist = item.total * ease(p);
          const light = Math.sin(Math.PI * p);
          item.pathEl.style.strokeDashoffset = String((item.total * 0.48 - dist).toFixed(1));
          item.pathEl.setAttribute("opacity", String((light * 0.85).toFixed(3)));
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
    sampleFrames: [39, 117, 204, 264, 345, 429, 486, 539],
    score: scoreFor({ durationSeconds: SPLASH_VIDEO.duration_seconds }),
    checks: [
      [39, 117, "T × E must give way to Big C emerging and stabilizing itself"],
      [117, 204, "Big C must try out candidate Reality Frames RF₁…RFₙ"],
      [204, 264, "Big C must then settle RF₀"],
      [264, 345, "Little c₁ and peers must appear inside RF₀"],
      [345, 429, "Little c₁ must navigate RF₀ rules and peers via Intent and Cooperation"],
      [429, 539, "The sequence must settle into the brand lockup"],
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
    sampleFrames: [8, 26, 48, 66, 86, 104, 122, 149],
    score: scoreFor({ durationSeconds: SPLASH_BUMPER.duration_seconds, mapTime: splashToBumper, captions: false }),
    checks: [
      [8, 48, "The bumper must build the architecture"],
      [48, 86, "The bumper must reach RF₀ and Little c"],
      [86, 149, "The bumper must settle into the brand lockup"],
    ],
  });
}
