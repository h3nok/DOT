import React, { useEffect, useRef, useState } from "react";
import {
  AlignJustify,
  AlignLeft,
  Check,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useTheme } from "../shared/contexts/SimpleThemeContext";
import { DotSwitch } from "../shared/DotControls";
import { useOrganism } from "./OrganismContext";
import theme from "../content/theme.json";
import {
  READING_PRESETS,
  matchReadingPreset,
  type ReadingPreset,
} from "./readingPresets";
import {
  LEADING_OPTIONS,
  MEASURE_OPTIONS,
  PARAGRAPH_OPTIONS,
  READING_FONT_OPTIONS,
  READING_SIZE_OPTIONS,
} from "./appearanceOptions";
import { DEFAULT_CONFIG, type ReadingAlign } from "./types";
import "./appearance.css";

const Section: React.FC<{
  title: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ title, hint, children }) => (
  <section className="appearance-section px-5 py-4 first:border-t-0">
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h3 className="dot-label">{title}</h3>
      {hint && (
        <span className="truncate text-xs text-muted-foreground">{hint}</span>
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

const FineTune: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <details className="appearance-fine-tune">
    <summary>
      <SlidersHorizontal aria-hidden="true" />
      <span>{label}</span>
    </summary>
    <div className="appearance-fine-tune__body">{children}</div>
  </details>
);

type ThemeBase = "light" | "dark";

/** The one theme in its two lights. Each card is the page it selects, drawn small. */
const THEME_CHOICES: ReadonlyArray<{ base: ThemeBase; label: string; hint: string }> = [
  { base: "light", label: "Light", hint: "Warm paper, charcoal ink, and rust." },
  { base: "dark", label: "Dark", hint: "Charcoal ground, warm-white ink, and rust." },
];

const ThemeSwatch: React.FC<{ base: ThemeBase }> = ({ base }) => {
  const { surface, ink, accent } = theme[base];
  return (
    <svg viewBox="0 0 150 48" aria-hidden="true">
      <rect x="0" y="0" width="150" height="48" rx="7" fill={surface} />
      <line x1="14" y1="12" x2="38" y2="12" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <g stroke={ink} strokeLinecap="round" strokeWidth="2">
        <line x1="14" y1="22" x2="118" y2="22" strokeOpacity="0.62" />
        <line x1="14" y1="30" x2="132" y2="30" strokeOpacity="0.4" />
        <line x1="14" y1="38" x2="84" y2="38" strokeOpacity="0.28" />
      </g>
    </svg>
  );
};

const ThemeOption: React.FC<{
  base: ThemeBase;
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ base, label, hint, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    title={hint}
    className={`${optionClass(selected)} appearance-theme-option`}
  >
    <ThemeSwatch base={base} />
    <span className="mt-1.5 flex items-center gap-1">
      <span className="text-xs font-medium">{label}</span>
      {selected && (
        <Check
          className="h-3 w-3 text-[color:var(--organism-accent-strong)]"
          aria-hidden="true"
        />
      )}
    </span>
  </button>
);

/** A reading arrangement, shown as a page rather than as another icon. */
const ReadingStylePreview: React.FC<{ preset: ReadingPreset }> = ({ preset }) => {
  const { config } = preset;

  return (
    <span
      className="appearance-reading-preview"
      data-reading={config.readingFont}
      data-align={config.readingAlign}
      data-leading={config.readingLeading}
      data-measure={config.readingMeasure}
      data-paragraph={config.paragraphStyle}
      aria-hidden="true"
    >
      <span className="appearance-reading-preview__glyph">Aa</span>
      <span className="appearance-reading-preview__lines">
        {[0, 1, 2, 3].map((index) => (
          <span key={`${preset.id}-${index}`} />
        ))}
      </span>
    </span>
  );
};

/**
 * The appearance control.
 *
 * The site has one theme, the AMM signature, in light and dark (ADR-0061), so
 * there is nothing here to compose a look from. What stays is what the reader
 * genuinely owns: which light, how the text reads, stronger contrast, and a page
 * that holds still. Everything persists, so a reader's choices are theirs across
 * visits; the finer reading controls stay folded until asked for.
 */
export const AppearanceControl: React.FC<{
  placement?: "floating" | "inline";
}> = ({ placement = "floating" }) => {
  const { theme: base, setTheme } = useTheme();
  const { config, setConfig } = useOrganism();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    panelRef.current?.focus();
    // Captured now: by cleanup time the ref may point somewhere else.
    const trigger = triggerRef.current;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
      // The panel was opened from the trigger; that is where focus belongs
      // when it closes, not at the top of the document.
      trigger?.focus();
    };
  }, [open]);

  const inline = placement === "inline";
  const activeReadingPreset = matchReadingPreset(config);

  return (
    <div
      ref={ref}
      data-appearance-control
      data-inline={inline}
      className={
        inline
          ? "relative z-50 transition-opacity"
          : // Stacked just above the menu control, so the lower-left corner holds the site's controls in one column.
            "fixed bottom-20 left-2 z-50 flex flex-col-reverse items-start transition-opacity sm:bottom-[5.75rem] sm:left-6"
      }
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Appearance settings"
        aria-expanded={open}
        title="Light or dark, and how the text reads"
        className={`appearance-ui-control organism-alive group flex items-center justify-center border bg-background/60 text-foreground/70 backdrop-blur-xl transition-all hover:border-[color:var(--organism-accent-strong)]/30 hover:text-foreground hover:shadow-lg hover:shadow-[color:var(--organism-accent-strong)]/10 ${
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
          ref={panelRef}
          role="dialog"
          aria-label="Appearance"
          tabIndex={-1}
          className={`appearance-panel organism-alive flex flex-col overflow-hidden rounded-2xl text-foreground backdrop-blur-2xl ${
            inline
              ? "fixed left-4 right-4 top-16 w-auto sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[min(23rem,calc(100vw-2rem))]"
              : "mb-3 w-[min(23rem,calc(100vw-2rem))]"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4">
            <span className="dot-card-kicker">
              <span className="dot-mark" aria-hidden="true" />
              <span className="dot-label font-semibold">Appearance</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-m-1 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close appearance panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="appearance-scroll min-h-0 flex-1 overflow-y-auto pt-2">
            <Section title="Theme" hint="The AMM signature">
              <div className="grid grid-cols-2 gap-1.5">
                {THEME_CHOICES.map((choice) => (
                  <ThemeOption
                    key={choice.base}
                    {...choice}
                    selected={base === choice.base}
                    onSelect={() => setTheme(choice.base)}
                  />
                ))}
              </div>
            </Section>

            <Section
              title="Reading style"
              hint={
                activeReadingPreset
                  ? READING_PRESETS.find((preset) => preset.id === activeReadingPreset)?.label
                  : "Custom"
              }
            >
              <div className="grid grid-cols-2 gap-1.5">
                {READING_PRESETS.map((preset) => {
                  const selected = activeReadingPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setConfig(preset.config)}
                      aria-pressed={selected}
                      aria-label={`${preset.label} reading style`}
                      title={preset.hint}
                      className={`${optionClass(selected)} appearance-reading-style p-2.5`}
                    >
                      <ReadingStylePreview preset={preset} />
                      <span className="mt-2 flex items-center gap-1.5">
                        <span className="text-xs font-medium">{preset.label}</span>
                        {selected && (
                          <Check
                            className="h-3 w-3 text-[color:var(--organism-accent-strong)]"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <span className="dot-micro mt-0.5 block text-muted-foreground">
                        {preset.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="Size">
              <div className="grid grid-cols-4 gap-1.5">
                {READING_SIZE_OPTIONS.map((size) => {
                  const selected = config.readingScale === size.value;
                  return (
                    <button
                      key={size.label}
                      type="button"
                      onClick={() => setConfig({ readingScale: size.value })}
                      aria-pressed={selected}
                      aria-label={`Text size ${size.label}`}
                      className={`${optionClass(selected)} flex h-11 items-center justify-center p-0`}
                    >
                      <span
                        className="appearance-size-sample font-serif font-medium leading-none"
                        data-size={size.id}
                      >
                        {size.label}
                      </span>
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
                <DotSwitch
                  checked={config.contrast === "high"}
                  onChange={() =>
                    setConfig({
                      contrast: config.contrast === "high" ? "standard" : "high",
                    })
                  }
                  label="High contrast"
                />
              </div>
            </Section>

            <Section title="Motion">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  Hold still
                  <span className="ml-1.5 text-xs text-muted-foreground/60">
                    nothing moves
                  </span>
                </span>
                <DotSwitch
                  checked={config.stillness}
                  onChange={() => setConfig({ stillness: !config.stillness })}
                  label="Hold the page still"
                />
              </div>
            </Section>

            <FineTune label="Fine tune reading">
            <Section title="Type">
              <div className="grid grid-cols-2 gap-1.5">
                {READING_FONT_OPTIONS.map(({ value, label, face }) => {
                  const selected = config.readingFont === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setConfig({ readingFont: value })}
                      aria-pressed={selected}
                      aria-label={label}
                      className={`${optionClass(selected)} px-3 py-2`}
                    >
                      {/* The sample is set in the face it selects, so the
                          choice is made by looking rather than by name. */}
                      <span
                        className="appearance-font-sample block text-lg leading-none"
                        data-reading={value}
                      >
                        Ag
                      </span>
                      <span className="mt-1.5 block text-xs font-medium">{label}</span>
                      <span className="dot-micro block text-muted-foreground">
                        {face}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Measure sits next to size because they are one decision:
                bigger text in the same column is a different read. */}
            <Section title="Measure" hint="Line length">
              <div className="grid grid-cols-3 gap-1.5">
                {MEASURE_OPTIONS.map(({ value, label, hint, bars }) => {
                  const selected = config.readingMeasure === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setConfig({ readingMeasure: value })}
                      aria-pressed={selected}
                      aria-label={`Line length ${label}`}
                      title={hint}
                      className={`${optionClass(selected)} flex flex-col items-center gap-1 p-2`}
                    >
                      <svg viewBox="0 0 32 20" className="h-5 w-full" aria-hidden="true">
                        {[0, 1, 2, 3].map((line) => (
                          <line
                            key={line}
                            x1={16 - (bars * 24) / 2}
                            x2={16 + (bars * 24) / 2}
                            y1={4 + line * 4}
                            y2={4 + line * 4}
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

            <Section title="Leading" hint="Space between lines">
              <div className="grid grid-cols-3 gap-1.5">
                {LEADING_OPTIONS.map(({ value, label, gap }) => {
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

            <Section title="Paragraphs">
              <div className="grid grid-cols-2 gap-1.5">
                {PARAGRAPH_OPTIONS.map(({ value, label, hint }) => {
                  const selected = config.paragraphStyle === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setConfig({ paragraphStyle: value })}
                      aria-pressed={selected}
                      aria-label={`${label} paragraphs`}
                      title={hint}
                      className={`${optionClass(selected)} flex flex-col items-center gap-1 p-2`}
                    >
                      <svg viewBox="0 0 32 20" className="h-5 w-full" aria-hidden="true">
                        {(value === "spaced"
                          ? [
                              [4, 3],
                              [4, 7],
                              [4, 14],
                              [4, 18],
                            ]
                          : [
                              [4, 3],
                              [4, 7],
                              [9, 11],
                              [4, 15],
                            ]
                        ).map(([x, y], line) => (
                          <line
                            key={line}
                            x1={x}
                            x2="28"
                            y1={y}
                            y2={y}
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

            {/* The settings are about this; show it rather than describe it.
                Two paragraphs, because one cannot show what separates them. */}
            <Section title="Preview">
              <div
                className="appearance-reading-sample text-muted-foreground"
                data-reading={config.readingFont}
                data-scale={String(config.readingScale)}
                data-leading={config.readingLeading}
                data-align={config.readingAlign}
                data-paragraph={config.paragraphStyle}
              >
                <p>
                  Feeling is data about an interpreter's relationship to reality, and
                  feeling is not automatically truth.
                </p>
                <p>
                  To exclude feeling is to discard evidence from inside the phenomenon
                  being studied.
                </p>
              </div>
            </Section>
            </FineTune>
          </div>

          <div className="shrink-0 border-t border-border/30 px-5 py-2.5">
            <button
              type="button"
              onClick={() => setConfig(DEFAULT_CONFIG)}
              className="appearance-reset inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
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
