import React, { useEffect, useRef, useState } from "react";
import {
  AlignJustify,
  AlignLeft,
  Check,
  Moon,
  Palette,
  RotateCcw,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "../shared/contexts/SimpleThemeContext";
import { useOrganism } from "./OrganismContext";
import { FieldPreview } from "./FieldPreview";
import { THEME_PRESETS, matchThemePreset } from "./themePresets";
import {
  DEFAULT_CONFIG,
  ORGANISM_PRESETS,
  type OrganismPreset,
  type OrganismTint,
  type ReadingAlign,
  type ReadingFont,
  type ReadingLeading,
  type UIStyle,
} from "./types";
import "./appearance.css";

const UI_STYLES: Array<{ value: UIStyle; label: string; hint: string }> = [
  { value: "default", label: "Glass", hint: "Translucent surfaces, soft blur" },
  { value: "editorial", label: "Editorial", hint: "Typographic, high contrast" },
  { value: "minimal", label: "Minimal", hint: "Flat, sharp, no effects" },
  { value: "organic", label: "Organic", hint: "Warm, rounded, tinted" },
  { value: "cinematic", label: "Cinematic", hint: "Deep shadows, dramatic" },
  { value: "neural", label: "Neural", hint: "Lit edges, network surfaces" },
];

/** Pinned tints. Named for what they feel like, not their degrees. */
const TINTS: Array<{ value: OrganismTint; label: string; swatch: string }> = [
  { value: "auto", label: "Follow the time of day", swatch: "" },
  { value: 212, label: "Indigo", swatch: "hsl(212 52% 55%)" },
  { value: 265, label: "Violet", swatch: "hsl(265 48% 60%)" },
  { value: 158, label: "Jade", swatch: "hsl(158 42% 45%)" },
  { value: 28, label: "Amber", swatch: "hsl(28 62% 55%)" },
  { value: 348, label: "Rose", swatch: "hsl(348 52% 58%)" },
  { value: 190, label: "Cyan", swatch: "hsl(190 55% 50%)" },
  { value: 82, label: "Sage", swatch: "hsl(82 35% 48%)" },
];

const READING_SIZES: Array<{ value: number; label: string }> = [
  { value: 0.92, label: "S" },
  { value: 1, label: "M" },
  { value: 1.12, label: "L" },
  { value: 1.26, label: "XL" },
];

const LEADINGS: Array<{ value: ReadingLeading; label: string; gap: number }> = [
  { value: "tight", label: "Tight", gap: 3 },
  { value: "standard", label: "Normal", gap: 4.5 },
  { value: "loose", label: "Loose", gap: 6 },
];

const Section: React.FC<{
  title: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ title, hint, children }) => (
  <section className="appearance-section px-5 py-4 first:border-t-0">
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h3 className="dot-label">{title}</h3>
      {hint && (
        <span className="truncate text-xs text-muted-foreground/70">{hint}</span>
      )}
    </div>
    {children}
  </section>
);

/** The shared shape of every choosable thing in the panel. */
const optionClass = (selected: boolean) =>
  `appearance-option rounded-xl border p-2 text-left transition-colors ${
    selected
      ? "border-transparent text-foreground"
      : "border-border/30 text-muted-foreground hover:border-border/60 hover:bg-foreground/[0.04] hover:text-foreground"
  }`;

/**
 * The appearance control — DOT's living theme, made the reader's.
 *
 * One quiet affordance opens everything that decides how the site looks and
 * how the book reads. It is organised the way the decision is actually made:
 * a set of considered environments first, for the reader who wants one answer
 * rather than eight; then the parts, for the reader who wants their own.
 *
 * Two tabs, not one long column. Environment holds what the page *is* — base,
 * background, surface, accent, motion. Reading holds what the text *does* —
 * face, size, leading, alignment, contrast. Everything persists in the organism
 * config, so a reader's environment is theirs across visits.
 */
export const AppearanceControl: React.FC<{
  placement?: "floating" | "inline";
}> = ({ placement = "floating" }) => {
  const { theme, setTheme } = useTheme();
  const { config, setConfig } = useOrganism();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"environment" | "reading">("environment");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const isDark = theme === "dark";
  const fields = Object.keys(ORGANISM_PRESETS) as OrganismPreset[];
  const inline = placement === "inline";
  const activePreset = matchThemePreset(config, isDark ? "dark" : "light");

  return (
    <div
      ref={ref}
      data-appearance-control
      className={
        inline
          ? "relative z-50 transition-opacity"
          : "fixed bottom-4 left-4 z-50 flex flex-col-reverse items-start transition-opacity sm:bottom-5 sm:left-5"
      }
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Appearance settings"
        aria-expanded={open}
        title="Make it yours — environment, background, accent, type"
        className={`organism-alive group flex items-center justify-center rounded-full border border-border/40 bg-background/60 text-foreground/70 backdrop-blur-xl transition-all hover:border-[color:var(--organism-accent-strong)]/30 hover:text-foreground hover:shadow-lg hover:shadow-[color:var(--organism-accent-strong)]/10 ${
          inline ? "h-9 w-9" : "gap-2 px-3.5 py-2.5 shadow-lg"
        }`}
      >
        {inline ? (
          <Palette className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        <span className={inline ? "sr-only" : "hidden text-xs font-medium sm:inline"}>
          Appearance
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Appearance"
          className={`appearance-panel organism-alive flex flex-col overflow-hidden rounded-2xl text-foreground backdrop-blur-2xl ${
            inline
              ? "fixed left-4 right-4 top-16 w-auto sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[min(23rem,calc(100vw-2rem))]"
              : "mb-3 w-[min(23rem,calc(100vw-2rem))]"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4">
            <span className="dot-label font-semibold">Appearance</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-m-1 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close appearance panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Two rooms rather than one long corridor. */}
          <div
            role="tablist"
            aria-label="Appearance sections"
            className="appearance-tabs mx-5 mt-3 flex shrink-0 gap-1 rounded-full p-0.5"
          >
            {(
              [
                ["environment", "Environment"],
                ["reading", "Reading"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="appearance-scroll min-h-0 flex-1 overflow-y-auto pt-2">
            {tab === "environment" ? (
              <>
                {/* Presets — one considered answer, before any dials. */}
                <Section title="Environment" hint={activePreset ? undefined : "Custom"}>
                  <div className="grid grid-cols-2 gap-1.5">
                    {THEME_PRESETS.map((preset) => {
                      const selected = activePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setTheme(preset.base);
                            setConfig(preset.config);
                          }}
                          aria-pressed={selected}
                          title={preset.hint}
                          className={optionClass(selected)}
                        >
                          <span
                            className="appearance-preset-page block h-11 w-full p-1.5"
                            style={{ background: preset.swatch.surface, color: preset.swatch.ink }}
                            aria-hidden="true"
                          >
                            <span
                              className="block h-[3px] w-3/5 rounded-full"
                              style={{ background: preset.swatch.accent }}
                            />
                            <span
                              className="mt-1.5 block h-[2px] w-full rounded-full opacity-45"
                              style={{ background: "currentColor" }}
                            />
                            <span
                              className="mt-1 block h-[2px] w-11/12 rounded-full opacity-35"
                              style={{ background: "currentColor" }}
                            />
                            <span
                              className="mt-1 block h-[2px] w-2/3 rounded-full opacity-25"
                              style={{ background: "currentColor" }}
                            />
                          </span>
                          <span className="mt-1.5 flex items-center gap-1">
                            <span className="text-xs font-medium">{preset.label}</span>
                            {selected && (
                              <Check
                                className="h-3 w-3 text-[color:var(--organism-accent-strong)]"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                {/* Base + accent — one row, because they are one decision. */}
                <Section title="Light and colour">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {(["light", "dark"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTheme(t)}
                          aria-pressed={(t === "dark") === isDark}
                          aria-label={t}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                            (t === "dark") === isDark
                              ? "border-[color:var(--organism-accent-soft)] bg-[color:var(--organism-accent-strong)]/10 text-foreground"
                              : "border-border/40 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t === "light" ? (
                            <Sun className="h-3.5 w-3.5" />
                          ) : (
                            <Moon className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ))}
                    </div>
                    <span className="h-5 w-px bg-border/50" aria-hidden="true" />
                    <div className="flex flex-wrap items-center gap-1.5">
                      {TINTS.map((t) => {
                        const selected = config.tint === t.value;
                        return (
                          <button
                            key={String(t.value)}
                            type="button"
                            onClick={() => setConfig({ tint: t.value })}
                            aria-pressed={selected}
                            aria-label={t.label}
                            title={t.label}
                            className={`h-6 w-6 rounded-full border-2 transition-transform ${
                              selected
                                ? "scale-110 border-foreground/70 shadow-sm"
                                : "border-transparent hover:scale-105"
                            }`}
                            style={{
                              background:
                                t.value === "auto"
                                  ? "conic-gradient(hsl(212 52% 55%), hsl(265 48% 60%), hsl(348 52% 58%), hsl(28 62% 55%), hsl(158 42% 45%), hsl(212 52% 55%))"
                                  : t.swatch,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </Section>

                <Section title="Background" hint={ORGANISM_PRESETS[config.preset].label}>
                  <div className="grid grid-cols-4 gap-1.5">
                    {fields.map((field) => {
                      const spec = ORGANISM_PRESETS[field];
                      const selected = config.preset === field;
                      return (
                        <button
                          key={field}
                          type="button"
                          onClick={() =>
                            setConfig({
                              preset: field,
                              enabled: true,
                              showMembrane: field !== "off",
                            })
                          }
                          aria-pressed={selected}
                          title={spec.hint}
                          className={`${optionClass(selected)} flex flex-col items-center gap-1.5 p-1.5`}
                        >
                          <FieldPreview field={field} />
                          <span className="w-full truncate text-center text-xs font-medium">
                            {spec.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                <Section title="Surface">
                  <div className="grid grid-cols-3 gap-1.5">
                    {UI_STYLES.map(({ value, label, hint }) => {
                      const selected = config.uiStyle === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setConfig({ uiStyle: value })}
                          aria-pressed={selected}
                          title={hint}
                          className={`${optionClass(selected)} flex flex-col items-center gap-1 p-1.5`}
                        >
                          <svg viewBox="0 0 40 24" className="h-5 w-full" aria-hidden="true">
                            {value === "default" && (
                              <rect x="4" y="3" width="32" height="18" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.5" />
                            )}
                            {value === "editorial" && (
                              <>
                                <rect x="4" y="3" width="32" height="18" rx="1" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
                                <line x1="8" y1="8" x2="28" y2="8" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
                                <line x1="8" y1="12" x2="32" y2="12" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
                                <line x1="8" y1="15" x2="24" y2="15" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
                              </>
                            )}
                            {value === "minimal" && (
                              <rect x="4" y="3" width="32" height="18" rx="2" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="0.75" />
                            )}
                            {value === "organic" && (
                              <rect x="4" y="3" width="32" height="18" rx="9" fill="var(--organism-accent)" fillOpacity="0.14" stroke="var(--organism-accent-soft)" strokeWidth="0.75" />
                            )}
                            {value === "cinematic" && (
                              <>
                                <rect x="4" y="3" width="32" height="18" rx="3" fill="currentColor" fillOpacity="0.08" />
                                <rect x="4" y="16" width="32" height="5" rx="1" fill="currentColor" fillOpacity="0.22" />
                              </>
                            )}
                            {value === "neural" && (
                              <>
                                <rect x="4" y="3" width="32" height="18" rx="3" fill="currentColor" fillOpacity="0.06" stroke="var(--organism-accent-strong)" strokeOpacity="0.5" strokeWidth="0.6" />
                                <circle cx="13" cy="12" r="1.6" fill="var(--organism-accent-strong)" />
                                <circle cx="27" cy="9" r="1.6" fill="var(--organism-accent-strong)" />
                                <line x1="13" y1="12" x2="27" y2="9" stroke="var(--organism-accent-strong)" strokeOpacity="0.6" strokeWidth="0.6" />
                              </>
                            )}
                          </svg>
                          <span className="w-full truncate text-center text-xs font-medium">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                <Section title="Presence">
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="w-14 shrink-0">Intensity</span>
                      <input
                        type="range"
                        min={0.2}
                        max={1}
                        step={0.05}
                        value={config.intensity}
                        onChange={(e) => setConfig({ intensity: Number(e.target.value) })}
                        aria-label="Background intensity"
                        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-[color:var(--organism-accent-strong)] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[color:var(--organism-accent-strong)] [&::-webkit-slider-thumb]:shadow-md"
                      />
                    </label>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">
                        Hold still
                        <span className="ml-1.5 text-xs text-muted-foreground/60">
                          nothing moves
                        </span>
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={config.stillness}
                        aria-label="Hold the background still"
                        onClick={() => setConfig({ stillness: !config.stillness })}
                        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                          config.stillness
                            ? "bg-[color:var(--organism-accent-strong)]"
                            : "bg-border"
                        }`}
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                            config.stillness ? "translate-x-4" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </Section>
              </>
            ) : (
              <>
                <Section title="Type">
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        ["serif", "Serif", "Source Serif"],
                        ["sans", "Sans", "Inter"],
                      ] as Array<[ReadingFont, string, string]>
                    ).map(([value, label, face]) => {
                      const selected = config.readingFont === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setConfig({ readingFont: value })}
                          aria-pressed={selected}
                          className={`${optionClass(selected)} px-3 py-2`}
                        >
                          <span
                            className={`block text-lg leading-none ${
                              value === "serif" ? "font-serif" : "font-sans"
                            }`}
                          >
                            Ag
                          </span>
                          <span className="mt-1.5 block text-xs font-medium">{label}</span>
                          <span className="block text-xs text-muted-foreground/70">{face}</span>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                <Section title="Size">
                  <div className="grid grid-cols-4 gap-1.5">
                    {READING_SIZES.map((s) => {
                      const selected = config.readingScale === s.value;
                      return (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setConfig({ readingScale: s.value })}
                          aria-pressed={selected}
                          aria-label={`Text size ${s.label}`}
                          className={`${optionClass(selected)} flex h-11 items-center justify-center p-0`}
                        >
                          <span
                            className="font-serif font-medium leading-none"
                            style={{ fontSize: `${0.7 * s.value}rem` }}
                          >
                            {s.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                <Section title="Leading" hint="Space between lines">
                  <div className="grid grid-cols-3 gap-1.5">
                    {LEADINGS.map(({ value, label, gap }) => {
                      const selected = config.readingLeading === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setConfig({ readingLeading: value })}
                          aria-pressed={selected}
                          aria-label={`Line spacing ${label}`}
                          className={`${optionClass(selected)} flex flex-col items-center gap-1 p-2`}
                        >
                          <svg viewBox="0 0 32 20" className="h-5 w-full" aria-hidden="true">
                            {[0, 1, 2].map((line) => (
                              <line
                                key={line}
                                x1="4"
                                x2="28"
                                y1={4 + line * gap}
                                y2={4 + line * gap}
                                stroke="currentColor"
                                strokeOpacity="0.5"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                              />
                            ))}
                          </svg>
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                <Section title="Alignment">
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        ["left", "Ragged right", AlignLeft],
                        ["justify", "Justified", AlignJustify],
                      ] as Array<[ReadingAlign, string, typeof AlignLeft]>
                    ).map(([value, label, Icon]) => {
                      const selected = config.readingAlign === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setConfig({ readingAlign: value })}
                          aria-pressed={selected}
                          aria-label={label}
                          className={`${optionClass(selected)} flex items-center gap-2 px-3 py-2.5`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate text-xs font-medium">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                <Section title="Contrast">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      Stronger text and edges
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.contrast === "high"}
                      aria-label="High contrast"
                      onClick={() =>
                        setConfig({
                          contrast: config.contrast === "high" ? "standard" : "high",
                        })
                      }
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                        config.contrast === "high"
                          ? "bg-[color:var(--organism-accent-strong)]"
                          : "bg-border"
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                          config.contrast === "high" ? "translate-x-4" : ""
                        }`}
                      />
                    </button>
                  </div>
                </Section>

                {/* The settings are about this; show it rather than describe it. */}
                <Section title="Preview">
                  <p
                    className={`book-reading-copy text-sm text-muted-foreground ${
                      config.readingFont === "serif" ? "font-serif" : "font-sans"
                    }`}
                    style={{
                      fontSize: `${0.86 * config.readingScale}rem`,
                      lineHeight:
                        config.readingLeading === "tight"
                          ? 1.48
                          : config.readingLeading === "loose"
                            ? 1.92
                            : 1.68,
                      textAlign: config.readingAlign === "justify" ? "justify" : "left",
                      hyphens: config.readingAlign === "justify" ? "auto" : "manual",
                    }}
                  >
                    Feeling is data about an interpreter's relationship to reality, and
                    feeling is not automatically truth.
                  </p>
                </Section>
              </>
            )}
          </div>

          <div className="shrink-0 border-t border-border/30 px-5 py-2.5">
            <button
              type="button"
              onClick={() => setConfig(DEFAULT_CONFIG)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
