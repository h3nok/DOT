import type {
  ParagraphStyle,
  ReadingFont,
  ReadingLeading,
  ReadingMeasure,
} from "./types";

/**
 * The appearance control's catalogue.
 *
 * These are product options, not component implementation details. Keeping the
 * labels, values, preview identities, and supported scales in one module lets
 * the control, tests, and future settings surfaces share the same vocabulary.
 * Visual rendering lives in appearance.css through the stable `id` values.
 */

export interface ReadingSizeOption {
  value: number;
  id: "s" | "m" | "l" | "xl";
  label: string;
}

export const READING_SIZE_OPTIONS: readonly ReadingSizeOption[] = [
  { value: 0.92, id: "s", label: "S" },
  { value: 1, id: "m", label: "M" },
  { value: 1.12, id: "l", label: "L" },
  { value: 1.26, id: "xl", label: "XL" },
];

export interface LeadingOption {
  value: ReadingLeading;
  label: string;
  gap: number;
}

export const LEADING_OPTIONS: readonly LeadingOption[] = [
  { value: "tight", label: "Tight", gap: 3 },
  { value: "standard", label: "Normal", gap: 4.5 },
  { value: "loose", label: "Loose", gap: 6 },
];

export interface ReadingFontOption {
  value: ReadingFont;
  label: string;
  face: string;
}

export const READING_FONT_OPTIONS: readonly ReadingFontOption[] = [
  { value: "serif", label: "Serif", face: "Source Serif 4" },
  { value: "sans", label: "Sans", face: "Inter · Space Grotesk" },
  { value: "humanist", label: "Open", face: "Wide-set sans" },
  { value: "mono", label: "Mono", face: "JetBrains Mono" },
];

export interface MeasureOption {
  value: ReadingMeasure;
  label: string;
  hint: string;
  bars: number;
}

export const MEASURE_OPTIONS: readonly MeasureOption[] = [
  { value: "narrow", label: "Narrow", hint: "Around 55 characters a line", bars: 0.6 },
  { value: "standard", label: "Standard", hint: "Around 70 characters a line", bars: 0.8 },
  { value: "wide", label: "Wide", hint: "Around 85 characters a line", bars: 1 },
];

export interface ParagraphOption {
  value: ParagraphStyle;
  label: string;
  hint: string;
}

export const PARAGRAPH_OPTIONS: readonly ParagraphOption[] = [
  { value: "spaced", label: "Spaced", hint: "A blank line between paragraphs" },
  { value: "indented", label: "Indented", hint: "Set continuous, as in print" },
];
