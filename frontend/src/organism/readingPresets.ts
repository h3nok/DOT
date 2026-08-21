import type { OrganismConfig } from "./types";

/**
 * Complete reading arrangements, separate from the visual environment.
 *
 * A reader should be able to ask for a different kind of page without also
 * changing its colour, field, or motion. These presets therefore speak only
 * for typography and contrast. The individual controls write the same values,
 * so choosing a preset is a starting point rather than a locked mode.
 */

export type ReadingPresetId = "editorial" | "print" | "focus" | "open";

export type ReadingPresetConfig = Pick<
  OrganismConfig,
  | "readingFont"
  | "readingScale"
  | "readingLeading"
  | "readingAlign"
  | "readingMeasure"
  | "paragraphStyle"
  | "contrast"
>;

export interface ReadingPreset {
  id: ReadingPresetId;
  label: string;
  hint: string;
  config: ReadingPresetConfig;
}

const READING_KEYS: Array<keyof ReadingPresetConfig> = [
  "readingFont",
  "readingScale",
  "readingLeading",
  "readingAlign",
  "readingMeasure",
  "paragraphStyle",
  "contrast",
];

export const READING_PRESETS: ReadingPreset[] = [
  {
    id: "editorial",
    label: "Editorial",
    hint: "Composed serif pages with measured, justified argument.",
    config: {
      readingFont: "serif",
      readingScale: 1,
      readingLeading: "standard",
      readingAlign: "justify",
      readingMeasure: "standard",
      paragraphStyle: "spaced",
      contrast: "standard",
    },
  },
  {
    id: "print",
    label: "Print",
    hint: "Indented, justified pages with a continuous book rhythm.",
    config: {
      readingFont: "serif",
      readingScale: 1,
      readingLeading: "standard",
      readingAlign: "justify",
      readingMeasure: "standard",
      paragraphStyle: "indented",
      contrast: "standard",
    },
  },
  {
    id: "focus",
    label: "Focus",
    hint: "Larger sans type, shorter lines, and generous air.",
    config: {
      readingFont: "sans",
      readingScale: 1.12,
      readingLeading: "loose",
      readingAlign: "left",
      readingMeasure: "narrow",
      paragraphStyle: "spaced",
      contrast: "standard",
    },
  },
  {
    id: "open",
    label: "Open",
    hint: "Wide-set letterforms and stronger contrast for easier tracking.",
    config: {
      readingFont: "humanist",
      readingScale: 1.12,
      readingLeading: "loose",
      readingAlign: "left",
      readingMeasure: "narrow",
      paragraphStyle: "spaced",
      contrast: "high",
    },
  },
];

export function matchReadingPreset(config: OrganismConfig): ReadingPresetId | null {
  const match = READING_PRESETS.find((preset) =>
    READING_KEYS.every((key) => config[key] === preset.config[key]),
  );
  return match?.id ?? null;
}
