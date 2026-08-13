import React, { useEffect, useRef, useState } from "react";
import { Moon, Palette, RotateCcw, Sparkles, Sun, X } from "lucide-react";
import { useTheme } from "../shared/contexts/SimpleThemeContext";
import { useOrganism } from "./OrganismContext";
import { FieldPreview } from "./FieldPreview";
import {
  DEFAULT_CONFIG,
  ORGANISM_PRESETS,
  type OrganismPreset,
  type OrganismTint,
  type ReadingFont,
  type UIStyle,
} from "./types";

const UI_STYLES: Array<{ value: UIStyle; label: string; hint: string }> = [
  { value: "default", label: "Default", hint: "The standard DOT surface" },
  { value: "neural", label: "Neural", hint: "Fluid glass with living borders" },
  { value: "minimal", label: "Minimal", hint: "Flat and sharp — pure content" },
  { value: "organic", label: "Organic", hint: "Soft, rounded, warm" },
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

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="border-t border-border/40 px-4 py-3.5 first:border-t-0">
    <h3 className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
      {title}
    </h3>
    {children}
  </section>
);

const chip = (selected: boolean) =>
  `rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
    selected
      ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.07] text-foreground"
      : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
  }`;

/**
 * The appearance control — DOT's living theme, made the member's.
 *
 * One quiet affordance (bottom-left) opens a panel that owns every appearance
 * choice in one place: the light/dark base, the character of the background
 * field, the accent tint, how loud the whole thing is, whether it moves at all,
 * and the typography of the reading surfaces. Everything persists in the
 * organism config, so a member's environment is theirs across visits.
 */
export const AppearanceControl: React.FC<{
  placement?: "floating" | "inline";
}> = ({ placement = "floating" }) => {
  const { theme, setTheme } = useTheme();
  const { config, setConfig } = useOrganism();
  const [open, setOpen] = useState(false);
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
        title="Make it yours — theme, background, tint, text"
        className={`organism-alive group flex items-center justify-center rounded-full border border-border/60 bg-background/70 text-foreground/80 backdrop-blur-md transition-colors hover:text-foreground ${
          inline ? "h-9 w-9" : "gap-2 px-3.5 py-2 shadow-lg"
        }`}
      >
        {inline ? (
          <Palette className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        <span className={inline ? "sr-only" : "text-[11px] font-medium"}>
          Appearance
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Appearance"
          className={`organism-alive max-h-[calc(100svh-5.5rem)] overflow-y-auto rounded-2xl border border-border/60 bg-background/90 text-foreground shadow-2xl backdrop-blur-xl ${
            inline
              ? "fixed left-4 right-4 top-16 w-auto sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[min(19rem,calc(100vw-2rem))]"
              : "mb-3 w-[min(19rem,calc(100vw-2rem))]"
          }`}
        >
          <div className="flex items-center justify-between px-4 pb-1 pt-3.5">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Appearance
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close appearance panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <Section title="Base">
            <div className="grid grid-cols-2 gap-2">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  aria-pressed={(t === "dark") === isDark}
                  className={`${chip((t === "dark") === isDark)} flex items-center justify-center gap-1.5 capitalize`}
                >
                  {t === "light" ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                  {t}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Background">
            <div className="space-y-1.5">
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
                    className={`flex w-full items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                      selected
                        ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06]"
                        : "border-transparent hover:bg-foreground/[0.03]"
                    }`}
                  >
                    <FieldPreview field={field} />
                    <span className="min-w-0">
                      <span
                        className={`block text-xs font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {spec.label}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground/70">
                        {spec.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Tint">
            <div className="flex flex-wrap items-center gap-1.5">
              {TINTS.map((t) => {
                const selected = config.tint === t.value;
                if (t.value === "auto") {
                  return (
                    <button
                      key="auto"
                      type="button"
                      onClick={() => setConfig({ tint: "auto" })}
                      aria-pressed={selected}
                      title={t.label}
                      className={chip(selected)}
                    >
                      Auto
                    </button>
                  );
                }
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setConfig({ tint: t.value })}
                    aria-pressed={selected}
                    aria-label={t.label}
                    title={t.label}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      selected
                        ? "scale-110 border-foreground/70"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ background: t.swatch }}
                  />
                );
              })}
            </div>
          </Section>

          <Section title="Style">
            <div className="grid grid-cols-4 gap-1.5">
              {UI_STYLES.map(({ value, label, hint }) => {
                const selected = config.uiStyle === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setConfig({ uiStyle: value })}
                    aria-pressed={selected}
                    title={hint}
                    className={`rounded-md border px-1 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      selected
                        ? "border-foreground/40 bg-foreground/[0.07] text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <span className="block text-[10px] font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Presence">
            <label className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="w-14 shrink-0">Intensity</span>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={config.intensity}
                onChange={(e) =>
                  setConfig({ intensity: Number(e.target.value) })
                }
                className="flex-1 accent-[color:var(--organism-accent)]"
              />
            </label>
            <label className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
              <span>
                Hold still
                <span className="mt-0.5 block text-[10px] text-muted-foreground/70">
                  Keeps the colour, stops the motion.
                </span>
              </span>
              <input
                type="checkbox"
                checked={config.stillness}
                onChange={(e) => setConfig({ stillness: e.target.checked })}
                className="h-4 w-4 shrink-0 accent-[color:var(--organism-accent)]"
              />
            </label>
          </Section>

          <Section title="Reading">
            <div className="mb-2 grid grid-cols-2 gap-2">
              {(
                [
                  ["serif", "Serif"],
                  ["sans", "Sans"],
                ] as Array<[ReadingFont, string]>
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setConfig({ readingFont: value })}
                  aria-pressed={config.readingFont === value}
                  className={`${chip(config.readingFont === value)} ${
                    value === "serif" ? "font-serif" : "font-sans"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {READING_SIZES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setConfig({ readingScale: s.value })}
                  aria-pressed={config.readingScale === s.value}
                  aria-label={`Text size ${s.label}`}
                  className={chip(config.readingScale === s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Section>

          <div className="border-t border-border/40 px-4 py-2.5">
            <button
              type="button"
              onClick={() => setConfig(DEFAULT_CONFIG)}
              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset appearance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
