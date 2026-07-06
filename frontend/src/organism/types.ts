/**
 * Organism Theme — type surface.
 *
 * The site is modelled as a living digital organism (DOT = Digital Organisms
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

/** User-selectable character of the living background. */
export type OrganismPreset = "plexus" | "calm" | "cosmos" | "off";

export interface OrganismPresetSpec {
  label: string;
  /** Scales cell population (0 = no cells, aura only). */
  density: number;
  /** Scales drift/animation speed. */
  speed: number;
}

export const ORGANISM_PRESETS: Record<OrganismPreset, OrganismPresetSpec> = {
  plexus: { label: "Plexus", density: 1, speed: 1 },
  calm: { label: "Calm", density: 0.45, speed: 0.5 },
  cosmos: { label: "Cosmos", density: 1.7, speed: 1.35 },
  off: { label: "Off", density: 0, speed: 0 },
};

export interface OrganismConfig {
  /** Master switch. When false the organism is fully inert and removes itself. */
  enabled: boolean;
  /** Global intensity dial [0..1] applied to chroma, motion, and aura strength. */
  intensity: number;
  /** Character of the living background — see {@link ORGANISM_PRESETS}. */
  preset: OrganismPreset;
  /** Render the animated plexus membrane backdrop. */
  showMembrane: boolean;
  /** Render the diagnostic vital-signs instrument. */
  showHud: boolean;
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
  preset: "plexus",
  showMembrane: true,
  showHud: false,
};

export const ORGANISM_STORAGE_KEY = "dot_organism";
