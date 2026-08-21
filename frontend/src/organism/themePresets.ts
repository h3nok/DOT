import { DEFAULT_CONFIG, type OrganismConfig } from "./types";

/**
 * Reading environments — the appearance panel's front door.
 *
 * Every knob in the panel is worth having, and nobody arrives wanting to set
 * eight of them. A preset is one considered answer to "what should this feel
 * like to read in": a base, a background, a surface treatment, an accent, and a
 * paper tone that were decided together rather than dialled independently.
 *
 * Choosing one is not a mode. It writes the same config the individual controls
 * write, so the next adjustment refines it instead of leaving it — the panel
 * simply stops showing a preset as current once its values no longer match.
 *
 * Every environment here is a state of the organism rather than an imitation of
 * some other medium. An earlier set included a printed-paper pastiche and a flat
 * product-console look; both were the site pretending to be something it is not,
 * and neither survived. What is left runs from Meridian's full daylight vitality
 * to Clarity's deliberate stillness, and the ones in between are lit, fluid, and
 * quietly alive. Four take the `neural` surface — glass with a living edge whose
 * glow is driven by the organism's own vitals — because that is what this place
 * actually feels like when it is working.
 */

export type ThemePresetId =
  | "meridian"
  | "membrane"
  | "aperture"
  | "clarity"
  | "midnight"
  | "synapse"
  | "nocturne"
  | "ember";

/** The config keys a preset speaks for. Anything else is left as the reader set it. */
export type PresetConfig = Pick<
  OrganismConfig,
  | "preset"
  | "uiStyle"
  | "tint"
  | "intensity"
  | "paperTone"
  | "stillness"
  | "showMembrane"
  | "enabled"
>;

export interface ThemePreset {
  id: ThemePresetId;
  label: string;
  /** What it is for, in the reader's terms rather than the system's. */
  hint: string;
  base: "light" | "dark";
  config: PresetConfig;
  /** Three colours the panel paints a miniature page with. */
  swatch: { surface: string; ink: string; accent: string };
}

const PRESET_KEYS: Array<keyof PresetConfig> = [
  "preset",
  "uiStyle",
  "tint",
  "intensity",
  "paperTone",
  "stillness",
  "showMembrane",
  "enabled",
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "meridian",
    label: "Meridian",
    hint: "Daylight and a living field. The organism at its most present.",
    base: "light",
    config: {
      preset: "field",
      uiStyle: "organic",
      tint: "auto",
      intensity: 0.58,
      paperTone: "warm",
      stillness: false,
      showMembrane: true,
      enabled: true,
    },
    swatch: { surface: "hsl(48 30% 96%)", ink: "hsl(200 20% 20%)", accent: "hsl(158 44% 42%)" },
  },
  {
    id: "membrane",
    label: "Membrane",
    hint: "Warm light behind lit glass, with the Reality Stream drawn slowly beneath it.",
    base: "light",
    config: {
      preset: "flow",
      uiStyle: "neural",
      tint: "auto",
      intensity: 0.35,
      paperTone: "warm",
      stillness: false,
      showMembrane: true,
      enabled: true,
    },
    swatch: { surface: "hsl(42 34% 96%)", ink: "hsl(30 16% 21%)", accent: "hsl(168 48% 42%)" },
  },
  {
    id: "aperture",
    label: "Aperture",
    hint: "The Reality Frame, gently warped. Structure you can see through.",
    base: "light",
    config: {
      preset: "lattice",
      uiStyle: "neural",
      tint: 202,
      intensity: 0.55,
      paperTone: "neutral",
      stillness: false,
      showMembrane: true,
      enabled: true,
    },
    swatch: { surface: "hsl(210 24% 97%)", ink: "hsl(212 26% 18%)", accent: "hsl(202 62% 46%)" },
  },
  {
    id: "clarity",
    label: "Clarity",
    hint: "Nothing behind the words and nothing moving. A quiet daylight page.",
    base: "light",
    config: {
      preset: "off",
      uiStyle: "organic",
      tint: 212,
      intensity: 0.35,
      paperTone: "neutral",
      stillness: true,
      showMembrane: false,
      enabled: true,
    },
    swatch: { surface: "hsl(0 0% 100%)", ink: "hsl(0 0% 8%)", accent: "hsl(212 72% 42%)" },
  },
  {
    id: "midnight",
    label: "Midnight",
    hint: "Deep indigo behind lit glass, with the Reality Stream drawn slowly beneath it.",
    base: "dark",
    config: {
      preset: "flow",
      uiStyle: "neural",
      tint: 212,
      intensity: 0.62,
      paperTone: "cool",
      stillness: false,
      showMembrane: true,
      enabled: true,
    },
    swatch: { surface: "hsl(222 34% 12%)", ink: "hsl(214 30% 88%)", accent: "hsl(212 62% 62%)" },
  },
  {
    id: "synapse",
    label: "Synapse",
    hint: "Centres of experience firing in the dark. The organism at full vitality.",
    base: "dark",
    config: {
      preset: "dots",
      uiStyle: "neural",
      tint: 288,
      intensity: 0.72,
      paperTone: "neutral",
      stillness: false,
      showMembrane: true,
      enabled: true,
    },
    swatch: { surface: "hsl(266 30% 9%)", ink: "hsl(268 24% 88%)", accent: "hsl(288 66% 68%)" },
  },
  {
    id: "nocturne",
    label: "Nocturne",
    hint: "Dark ground, violet depth, contours moving slowly behind the text.",
    base: "dark",
    config: {
      preset: "topology",
      uiStyle: "cinematic",
      tint: 265,
      intensity: 0.64,
      paperTone: "neutral",
      stillness: false,
      showMembrane: true,
      enabled: true,
    },
    swatch: { surface: "hsl(258 26% 10%)", ink: "hsl(260 22% 86%)", accent: "hsl(265 58% 66%)" },
  },
  {
    id: "ember",
    label: "Ember",
    hint: "Warm dark and slow strokes. The long night reading, without the glare.",
    base: "dark",
    config: {
      preset: "ink",
      uiStyle: "organic",
      tint: 26,
      intensity: 0.56,
      paperTone: "sepia",
      stillness: false,
      showMembrane: true,
      enabled: true,
    },
    swatch: { surface: "hsl(26 22% 11%)", ink: "hsl(34 26% 87%)", accent: "hsl(26 72% 58%)" },
  },
];

/**
 * The environment a reader lands in before they have chosen anything.
 *
 * Both are the same idea in the two lights: Current as the ground (slow tracers
 * carried by the Reality Stream), the neural surface so the page is visibly
 * the organism, and Source Serif for long-form. They differ only where the two
 * bases genuinely want different things — daylight takes a warm page and the
 * hour's own accent, night takes a cooler page and a pinned indigo, because an
 * unpinned accent has less chroma to spend and a dark ground shows colour less
 * readily.
 *
 * Naming the defaults as environments rather than as a loose bag of values is
 * deliberate: a reader who opens the panel on their first visit sees the
 * environment they are actually in, selected, instead of "Custom" — which
 * would describe a choice they never made.
 */
export const DEFAULT_ENVIRONMENT: Record<"light" | "dark", ThemePresetId> = {
  light: "membrane",
  dark: "midnight",
};

/**
 * The full starting config for a base: the default environment, over the
 * neutral reading defaults it does not speak for.
 *
 * Used for a reader's first visit and for Reset, so "back to how it was" and
 * "how it was" are the same values rather than two nearby guesses.
 */
export function defaultConfigFor(base: "light" | "dark"): OrganismConfig {
  return { ...DEFAULT_CONFIG, ...themePreset(DEFAULT_ENVIRONMENT[base]).config };
}

export function themePreset(id: ThemePresetId): ThemePreset {
  const found = THEME_PRESETS.find((preset) => preset.id === id);
  if (!found) throw new Error(`Unknown theme preset: ${id}`);
  return found;
}

/**
 * Which preset the current appearance *is*, if any.
 *
 * A preset is current only while every value it speaks for still matches. The
 * moment the reader changes one of them the panel stops claiming a preset is
 * selected, because it no longer describes what they are looking at.
 */
export function matchThemePreset(
  config: OrganismConfig,
  base: "light" | "dark",
): ThemePresetId | null {
  const match = THEME_PRESETS.find(
    (preset) =>
      preset.base === base &&
      PRESET_KEYS.every((key) => config[key] === preset.config[key]),
  );
  return match?.id ?? null;
}
