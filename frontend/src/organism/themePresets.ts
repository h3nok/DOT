import type { OrganismConfig } from "./types";

/**
 * Reading environments — the appearance panel's front door.
 *
 * Every knob in the panel is worth having, and nobody arrives wanting to set
 * eight of them. A preset is one considered answer to "what should this feel
 * like to read in": a base, a background, a surface treatment, an accent, and a
 * type choice that were decided together rather than dialled independently.
 *
 * Choosing one is not a mode. It writes the same config the individual controls
 * write, so the next adjustment refines it instead of leaving it — the panel
 * simply stops showing a preset as current once its values no longer match.
 */

export type ThemePresetId =
  | "vellum"
  | "midnight"
  | "studio"
  | "nocturne"
  | "meridian"
  | "clarity";

/** The config keys a preset speaks for. Anything else is left as the reader set it. */
export type PresetConfig = Pick<
  OrganismConfig,
  | "preset"
  | "uiStyle"
  | "tint"
  | "intensity"
  | "contrast"
  | "readingFont"
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
  "contrast",
  "readingFont",
  "stillness",
  "showMembrane",
  "enabled",
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "vellum",
    label: "Vellum",
    hint: "Warm paper and ink. The quietest way to read a long chapter.",
    base: "light",
    config: {
      preset: "ink",
      uiStyle: "editorial",
      tint: 32,
      intensity: 0.55,
      contrast: "standard",
      readingFont: "serif",
      stillness: false,
      showMembrane: true,
      enabled: true,
    },
    swatch: { surface: "hsl(38 42% 95%)", ink: "hsl(28 18% 22%)", accent: "hsl(28 62% 48%)" },
  },
  {
    id: "midnight",
    label: "Midnight",
    hint: "Deep indigo under soft light. Reading after the day has ended.",
    base: "dark",
    config: {
      preset: "aurora",
      uiStyle: "default",
      tint: 212,
      intensity: 0.85,
      contrast: "standard",
      readingFont: "serif",
      stillness: false,
      showMembrane: true,
      enabled: true,
    },
    swatch: { surface: "hsl(222 34% 12%)", ink: "hsl(214 30% 88%)", accent: "hsl(212 62% 62%)" },
  },
  {
    id: "studio",
    label: "Studio",
    hint: "Flat, exact, and cool. For working through the argument rather than sitting with it.",
    base: "light",
    config: {
      preset: "lattice",
      uiStyle: "minimal",
      tint: 190,
      intensity: 0.65,
      contrast: "standard",
      readingFont: "sans",
      stillness: false,
      showMembrane: true,
      enabled: true,
    },
    swatch: { surface: "hsl(210 18% 97%)", ink: "hsl(215 22% 20%)", accent: "hsl(190 58% 42%)" },
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
      intensity: 0.9,
      contrast: "standard",
      readingFont: "serif",
      stillness: false,
      showMembrane: true,
      enabled: true,
    },
    swatch: { surface: "hsl(258 26% 10%)", ink: "hsl(260 22% 86%)", accent: "hsl(265 58% 66%)" },
  },
  {
    id: "meridian",
    label: "Meridian",
    hint: "Daylight and a living field. The organism at its most present.",
    base: "light",
    config: {
      preset: "field",
      uiStyle: "organic",
      tint: "auto",
      intensity: 0.85,
      contrast: "standard",
      readingFont: "serif",
      stillness: false,
      showMembrane: true,
      enabled: true,
    },
    swatch: { surface: "hsl(48 30% 96%)", ink: "hsl(200 20% 20%)", accent: "hsl(158 44% 42%)" },
  },
  {
    id: "clarity",
    label: "Clarity",
    hint: "Nothing behind the words, nothing moving, maximum contrast.",
    base: "light",
    config: {
      preset: "off",
      uiStyle: "minimal",
      tint: 212,
      intensity: 0.35,
      contrast: "high",
      readingFont: "sans",
      stillness: true,
      showMembrane: false,
      enabled: true,
    },
    swatch: { surface: "hsl(0 0% 100%)", ink: "hsl(0 0% 8%)", accent: "hsl(212 72% 42%)" },
  },
];

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
