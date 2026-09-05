/**
 * Organism Theme — type surface.
 *
 * The site is modelled as a living digital organism (DOT = Digital Organism
 * Theory). Its appearance is its physiology: four "vital signs" are sampled
 * from real signal sources and fused into a single {@link VitalSigns} object
 * that drives the membrane, the ambient aura, and a living accent colour.
 *
 * The four sources, and their biological metaphor:
 *  - circadian  → local time of day        → day/night rhythm (hue + luminance)
 *  - arousal    → pointer / scroll / keys   → sympathetic activation (tempo)
 *  - metabolism → backend platform health   → oxygenation (chroma / vividness)
 *  - synapsis   → orchestrator activity     → neural firing (pulses / density)
 *
 * Everything here is ambient by design. Per the attention manifesto, the
 * organism never demands attention — it has no badges, counters, or alerts.
 * It only changes the *quality* of the ambient field you are already in.
 */

import type { RefObject } from "react";

export type OrganismMood =
  | "dormant" // night + idle: slow, dim, barely breathing
  | "resting" // low arousal: calm and quiet
  | "calm" // baseline equilibrium
  | "active" // user engaged: warmer, quicker breath
  | "flowing" // user engaged while the orchestrator works: peak vitality
  | "strained"; // backend / orchestrator degraded: pallid, uneasy

/**
 * Live physiological state, in the range [0, 1] unless noted. Written
 * continuously into a single ref so high-frequency signals (arousal, pulse
 * decay) never trigger React re-renders.
 */
export interface VitalSigns {
  /** Position in the 24h day. 0 = midnight, 0.5 = noon. */
  circadianPhase: number;
  /** Daylight factor. 0 = deep night, 1 = midday. */
  daylight: number;
  /** Golden-hour warmth. Peaks near dawn/dusk, low at noon and deep night. */
  warmth: number;
  /** User activity. Rises on input, decays exponentially toward 0 when idle. */
  arousal: number;
  /** Backend health / oxygenation. Fasting baseline when backend is absent. */
  metabolism: number;
  /** Orchestrator processing intensity (active imports, readiness). */
  synapsis: number;
  /** Transient spike (0..1) when a synaptic event fires; decays each frame. */
  synapticPulse: number;
  /** Distress factor (0..1) from degraded/unreachable services. */
  strain: number;
  /**
   * Quiescence. 1 = the user is reading and the organism goes still and quiet
   * (stillness as respect); 0 = fully alive. Eased by the bridge toward
   * {@link calmTarget}, which the reading probe sets from route + reading state.
   */
  calm: number;
  /** Where {@link calm} is heading; set by the reading probe, eased by the bridge. */
  calmTarget: number;
  /**
   * A synaptic event is waiting to be expressed. While the user is reading,
   * pulses are deferred rather than flashed (manifesto L4); the bridge releases
   * a single softened pulse once reading ends.
   */
  pendingPulse: boolean;
  /** True when a pending pulse was actually held back during a read. */
  pulseDeferred: boolean;
  /** Derived qualitative state. Updated at ~1Hz, drives `data-organism-mood`. */
  mood: OrganismMood;
}

/**
 * User-selectable character of the living background.
 *
 * Each field is a distinct *composition*, not a density dial on the same
 * effect. They exist because a background has a job: hold the page together
 * and stay out of the reading. None of them scatter arbitrary links across the
 * viewport — every mark has a rule behind it.
 */
export type OrganismPreset =
  | "field"
  | "aurora"
  | "dots"
  | "topology"
  | "interference"
  | "flow"
  | "strata"
  | "ink"
  | "lattice"
  | "off";

export interface OrganismPresetSpec {
  label: string;
  /** One line the appearance panel shows under the name. */
  hint: string;
  /** Scales point population (0 = no points — aurora is pure light). */
  density: number;
  /** Scales drift/animation speed. */
  speed: number;
  /** Link reach as a fraction of the viewport's short edge. */
  linkFactor: number;
  /** Overall opacity multiplier — part of the field's character. */
  alpha: number;
}

export const ORGANISM_PRESETS: Record<OrganismPreset, OrganismPresetSpec> = {
  field: {
    label: "Canvas",
    hint: "The raw stream — dots of experience drifting; filled carries, hollow waits.",
    density: 0.8,
    speed: 0.7,
    linkFactor: 0,
    alpha: 0.9,
  },
  aurora: {
    label: "Painting",
    hint: "Layered light — the inherited lens colouring experience.",
    density: 0,
    speed: 0.4,
    linkFactor: 0,
    alpha: 1,
  },
  dots: {
    label: "Little c's",
    hint: "Each dot is a centre of experience. You are one among many.",
    density: 0.7,
    speed: 0.25,
    linkFactor: 0,
    alpha: 1.0,
  },
  topology: {
    label: "Topology",
    hint: "Flowing contour lines — the landscape of experience.",
    density: 0,
    speed: 0.3,
    linkFactor: 0,
    alpha: 0.85,
  },
  interference: {
    // "Interference" is the accurate word and two characters too many for the
    // card, where it truncated to "Interfer…". The hint carries the physics.
    label: "Ripples",
    hint: "Two streams meeting — crests reinforcing, troughs cancelling.",
    density: 0,
    speed: 0.32,
    linkFactor: 0,
    alpha: 0.95,
  },
  flow: {
    label: "Current",
    hint: "Tracers carried by a slow field — the Reality Stream, drawn.",
    density: 1,
    speed: 0.7,
    linkFactor: 0,
    alpha: 0.9,
  },
  strata: {
    label: "Strata",
    hint: "Settled layers — interpretation accumulating over time.",
    density: 0,
    speed: 0.2,
    linkFactor: 0,
    alpha: 0.9,
  },
  ink: {
    label: "Intent",
    hint: "Calligraphic strokes — directed action dissolving.",
    density: 0,
    speed: 0.5,
    linkFactor: 0,
    alpha: 0.8,
  },
  lattice: {
    label: "Frame",
    hint: "The Reality Frame — a grid gently warped.",
    density: 1,
    speed: 0.75,
    linkFactor: 0,
    alpha: 0.9,
  },
  off: {
    label: "Still",
    hint: "Plain ground. The colour stays.",
    density: 0,
    speed: 0,
    linkFactor: 0,
    alpha: 0,
  },
};

/** Fields renamed in the background redesign; old saved configs still resolve. */
const LEGACY_PRESETS: Record<string, OrganismPreset> = {
  plexus: "aurora",
  cosmos: "aurora",
  constellation: "aurora",
  calm: "aurora",
  breath: "topology",
  neural: "aurora",
};

export function resolvePreset(value: unknown): OrganismPreset {
  if (typeof value !== "string") return DEFAULT_CONFIG.preset;
  if (value in ORGANISM_PRESETS) return value as OrganismPreset;
  return LEGACY_PRESETS[value] ?? DEFAULT_CONFIG.preset;
}

/** Accent source: monochrome, the circadian arc, or a pinned hue in degrees. */
export type OrganismTint = "mono" | "auto" | number;

/**
 * The panel offers named hues and a wheel, so any degree can reach storage.
 * Normalise it onto [0, 360) rather than trusting it — an out-of-range hue
 * silently breaks every `oklch()` the accent feeds.
 */
export function resolveTint(value: unknown): OrganismTint {
  if (value === "mono" || value === "auto") return value;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_CONFIG.tint;
  }
  return ((value % 360) + 360) % 360;
}

/**
 * Reading surface typography the member owns.
 *
 * Every face here is either already bundled (`@fontsource`) or resolved from
 * the operating system, so choosing one costs no download. `humanist` is the
 * accessibility option: a wide-set, open-countered system sans with looser
 * tracking, which is what most dyslexia typography guidance actually asks for.
 */
export type ReadingFont = "serif" | "sans" | "humanist" | "mono";

const READING_FONTS: ReadingFont[] = ["serif", "sans", "humanist", "mono"];

export function resolveReadingFont(value: unknown): ReadingFont {
  return READING_FONTS.includes(value as ReadingFont)
    ? (value as ReadingFont)
    : DEFAULT_CONFIG.readingFont;
}

/**
 * Line length. The one reading control with a defended right answer — prose is
 * easiest to read somewhere near 60–75 characters — and therefore the one most
 * worth letting a reader move, because the right answer depends on their type
 * size, their screen, and how far away they sit.
 */
export type ReadingMeasure = "narrow" | "standard" | "wide";

const READING_MEASURES: ReadingMeasure[] = ["narrow", "standard", "wide"];

export function resolveMeasure(value: unknown): ReadingMeasure {
  return READING_MEASURES.includes(value as ReadingMeasure)
    ? (value as ReadingMeasure)
    : DEFAULT_CONFIG.readingMeasure;
}

/**
 * How paragraphs separate. `spaced` is the web convention and scans well;
 * `indented` is the convention of the printed book this text came from, and
 * reads as continuous argument rather than a stack of blocks.
 */
export type ParagraphStyle = "spaced" | "indented";

export function resolveParagraphStyle(value: unknown): ParagraphStyle {
  return value === "indented" ? "indented" : "spaced";
}

/**
 * The colour of the page itself, independent of light/dark.
 *
 * Not decoration: a warm ground at night and a cool one under daylight are the
 * difference between finishing a chapter and stopping halfway. The tone shifts
 * paper and ink together so contrast is preserved at every setting.
 */
export type PaperTone = "neutral" | "warm" | "sepia" | "cool";

const PAPER_TONES: PaperTone[] = ["neutral", "warm", "sepia", "cool"];

export function resolvePaperTone(value: unknown): PaperTone {
  return PAPER_TONES.includes(value as PaperTone)
    ? (value as PaperTone)
    : DEFAULT_CONFIG.paperTone;
}

/** Clamp a stored dial back into range; a bad value must not blank the field. */
export function resolveDial(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

/**
 * Line height on reading surfaces. Not a cosmetic preference: leading is what
 * decides whether a long paragraph is a wall or a sequence of lines the eye can
 * return to, and the right answer differs by person, screen, and time of night.
 */
export type ReadingLeading = "tight" | "standard" | "loose";

const READING_LEADINGS: ReadingLeading[] = ["tight", "standard", "loose"];

export function resolveReadingLeading(value: unknown): ReadingLeading {
  return READING_LEADINGS.includes(value as ReadingLeading)
    ? (value as ReadingLeading)
    : DEFAULT_CONFIG.readingLeading;
}

/** Ragged-right or justified prose, as the reader prefers to be read to. */
export type ReadingAlign = "left" | "justify";

export function resolveReadingAlign(value: unknown): ReadingAlign {
  return value === "left" || value === "justify"
    ? value
    : DEFAULT_CONFIG.readingAlign;
}

/** Accessible contrast treatment across interface and reading surfaces. */
export type AppearanceContrast = "standard" | "high";

/**
 * UI surface style — how cards, borders, and interactive elements feel.
 * Each style publishes a data attribute on <html> that organism.css uses to restyle
 * shared surface tokens (border-radius, backdrop, shadow, border treatment).
 */
export type UIStyle = "default" | "neural" | "minimal" | "organic" | "editorial" | "cinematic";

export const UI_STYLE_IDS: readonly UIStyle[] = [
  "default",
  "editorial",
  "minimal",
  "organic",
  "cinematic",
  "neural",
];

export function resolveUIStyle(value: unknown): UIStyle {
  return UI_STYLE_IDS.includes(value as UIStyle)
    ? (value as UIStyle)
    : DEFAULT_CONFIG.uiStyle;
}

export function resolveContrast(value: unknown): AppearanceContrast {
  return value === "high" ? "high" : "standard";
}

export interface OrganismConfig {
  /** Master switch. When false the organism is fully inert and removes itself. */
  enabled: boolean;
  /** Global intensity dial [0..1] applied to chroma, motion, and aura strength. */
  intensity: number;
  /** Character of the living background — see {@link ORGANISM_PRESETS}. */
  preset: OrganismPreset;
  /** Render the animated membrane backdrop. */
  showMembrane: boolean;
  /** Render the diagnostic vital-signs instrument. */
  showHud: boolean;
  /** Accent source: monochrome, the time of day, or a pinned hue. */
  tint: OrganismTint;
  /** Hold the field still without disabling it (motion sensitivity, focus). */
  stillness: boolean;
  /**
   * Pattern scale [0.5..1.6]. Below 1 the field is sparser and larger-grained,
   * above 1 denser and finer. Separate from intensity: how *much* structure
   * there is, rather than how strongly it is drawn.
   */
  fieldScale: number;
  /** Drift tempo [0..1.6]. 0 leaves the field composed but motionless. */
  fieldSpeed: number;
  /**
   * How strongly the field reads against the page [0.5..2].
   *
   * The membrane is corrected for the fact that a mark reads far weaker on a
   * light ground than a dark one, but "far weaker" is a population average and
   * the right answer depends on the screen, the room, and the eyes. This is the
   * reader's own correction on top of ours.
   */
  fieldContrast: number;
  /** Contrast treatment shared by interface, diagrams, and reading surfaces. */
  contrast: AppearanceContrast;
  /** UI surface style — how cards, borders, and interactive elements feel. */
  uiStyle: UIStyle;
  /** Body-text family on reading surfaces. */
  readingFont: ReadingFont;
  /** Body-text scale multiplier on reading surfaces [0.9..1.3]. */
  readingScale: number;
  /** Line height on reading surfaces. */
  readingLeading: ReadingLeading;
  /** Ragged-right or justified prose. */
  readingAlign: ReadingAlign;
  /** Column width on reading surfaces. */
  readingMeasure: ReadingMeasure;
  /** Spaced blocks or indented continuous prose. */
  paragraphStyle: ParagraphStyle;
  /** Colour temperature of the page, applied in both light and dark. */
  paperTone: PaperTone;
}

export interface OrganismContextValue {
  config: OrganismConfig;
  setConfig: (patch: Partial<OrganismConfig>) => void;
  toggle: () => void;
  /**
   * Fire a synaptic pulse from a real platform event (a publication released,
   * someone joining the circle). This is how the backend the member acts on
   * drives the organism's nervous system: the bridge renders it as an expanding
   * ripple and a brief swell of vitality. `amplitude` in [0,1] weights the
   * event — a release swells more than a saved draft. Deferred politely while
   * the member is reading.
   */
  pulse: (amplitude?: number) => void;
  /** Single source of truth, read every frame by the bridge and membrane. */
  vitals: RefObject<VitalSigns>;
  /** Throttled (~1Hz) snapshot for UI that needs to render mood/levels. */
  mood: OrganismMood;
  /** True when the user (OS or app) has asked for reduced motion. */
  reducedMotion: boolean;
}

export const DEFAULT_VITALS: VitalSigns = {
  circadianPhase: 0.5,
  daylight: 0.6,
  warmth: 0.3,
  arousal: 0,
  metabolism: 0.6,
  synapsis: 0,
  synapticPulse: 0,
  strain: 0,
  calm: 0,
  calmTarget: 0,
  pendingPulse: false,
  pulseDeferred: false,
  mood: "calm",
};

export const DEFAULT_CONFIG: OrganismConfig = {
  enabled: true,
  intensity: 0.85,
  preset: "flow",
  showMembrane: true,
  showHud: false,
  tint: "auto",
  stillness: false,
  fieldScale: 1,
  fieldSpeed: 1,
  fieldContrast: 1,
  contrast: "standard",
  uiStyle: "default",
  readingFont: "serif",
  // Medium is 1; the S/M/L/XL scale is 0.92 / 1 / 1.12 / 1.26.
  readingScale: 1,
  // Editorial is the book's composed screen arrangement: a defended line
  // length, enough leading to return to the next line, and restrained
  // justification supported by hyphenation. Focus and Open remain ragged-right
  // alternatives for readers who track more comfortably that way.
  readingLeading: "standard",
  readingAlign: "justify",
  readingMeasure: "standard",
  paragraphStyle: "spaced",
  paperTone: "neutral",
};

export const ORGANISM_STORAGE_KEY = "dot_organism";

function resolveBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * One boundary for every appearance configuration entering the app.
 *
 * Local storage and named environments can outlive the UI that wrote them.
 * Reconstructing every field here prevents a stale or hand-edited value from
 * becoming a document attribute that no stylesheet understands. The control,
 * persistence layer, and first-visit presets therefore all resolve to the same
 * complete shape rather than maintaining parallel partial validators.
 */
export function resolveOrganismConfig(value: unknown): OrganismConfig {
  const saved = value && typeof value === "object"
    ? (value as Partial<OrganismConfig>)
    : {};

  return {
    enabled: resolveBoolean(saved.enabled, DEFAULT_CONFIG.enabled),
    intensity: resolveDial(saved.intensity, 0, 1, DEFAULT_CONFIG.intensity),
    preset: resolvePreset(saved.preset),
    showMembrane: resolveBoolean(saved.showMembrane, DEFAULT_CONFIG.showMembrane),
    showHud: resolveBoolean(saved.showHud, DEFAULT_CONFIG.showHud),
    tint: resolveTint(saved.tint),
    stillness: resolveBoolean(saved.stillness, DEFAULT_CONFIG.stillness),
    fieldScale: resolveDial(saved.fieldScale, 0.5, 1.6, DEFAULT_CONFIG.fieldScale),
    fieldSpeed: resolveDial(saved.fieldSpeed, 0, 1.6, DEFAULT_CONFIG.fieldSpeed),
    fieldContrast: resolveDial(
      saved.fieldContrast,
      0.5,
      2,
      DEFAULT_CONFIG.fieldContrast,
    ),
    contrast: resolveContrast(saved.contrast),
    uiStyle: resolveUIStyle(saved.uiStyle),
    readingFont: resolveReadingFont(saved.readingFont),
    readingScale: resolveDial(saved.readingScale, 0.9, 1.3, DEFAULT_CONFIG.readingScale),
    readingLeading: resolveReadingLeading(saved.readingLeading),
    readingAlign: resolveReadingAlign(saved.readingAlign),
    readingMeasure: resolveMeasure(saved.readingMeasure),
    paragraphStyle: resolveParagraphStyle(saved.paragraphStyle),
    paperTone: resolvePaperTone(saved.paperTone),
  };
}
