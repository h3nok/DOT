import React, { useEffect, useRef, useState } from "react";
import {
  AlignJustify,
  AlignLeft,
  Bookmark,
  Check,
  Moon,
  Palette,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useTheme } from "../shared/contexts/SimpleThemeContext";
import { useOrganism } from "./OrganismContext";
import { EnvironmentSwatch } from "./EnvironmentSwatch";
import { FieldPreview } from "./FieldPreview";
import {
  THEME_PRESETS,
  defaultConfigFor,
  matchThemePreset,
  themePreset,
} from "./themePresets";
import {
  READING_PRESETS,
  matchReadingPreset,
  type ReadingPreset,
} from "./readingPresets";
import {
  MAX_ENVIRONMENT_NAME,
  MAX_SAVED_ENVIRONMENTS,
  loadEnvironments,
  matchSavedEnvironment,
  normaliseName,
  persistEnvironments,
  removeEnvironment,
  upsertEnvironment,
  type SavedEnvironment,
} from "./savedEnvironments";
import {
  DEFAULT_PINNED_HUE,
  LEADING_OPTIONS,
  MEASURE_OPTIONS,
  PAPER_TONE_OPTIONS,
  PARAGRAPH_OPTIONS,
  READING_FONT_OPTIONS,
  READING_SIZE_OPTIONS,
  TINT_OPTIONS,
  UI_STYLE_OPTIONS,
} from "./appearanceOptions";
import {
  ORGANISM_PRESETS,
  type OrganismPreset,
  type ReadingAlign,
} from "./types";
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
  const [environments, setEnvironments] = useState<SavedEnvironment[]>(loadEnvironments);
  const [naming, setNaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (naming) nameRef.current?.focus();
  }, [naming]);

  const isDark = theme === "dark";
  const base = isDark ? "dark" : "light";
  const fields = Object.keys(ORGANISM_PRESETS) as OrganismPreset[];
  const inline = placement === "inline";
  const activePreset = matchThemePreset(config, base);
  const activeReadingPreset = matchReadingPreset(config);
  const activeSaved = matchSavedEnvironment(environments, config, base);
  const atEnvironmentLimit = environments.length >= MAX_SAVED_ENVIRONMENTS;

  /** Saved environments are the reader's, so every write goes straight to disk. */
  const commitEnvironments = (next: SavedEnvironment[]) => {
    setEnvironments(next);
    persistEnvironments(next);
  };

  const saveEnvironment = () => {
    const name = normaliseName(draftName);
    if (!name) return;
    commitEnvironments(upsertEnvironment(environments, { name, base, config }));
    setDraftName("");
    setNaming(false);
  };

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
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Appearance settings"
        aria-expanded={open}
        title="Make it yours — environment, background, accent, type"
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
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              setTab((current) => (current === "environment" ? "reading" : "environment"));
            }}
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
                id={`appearance-tab-${value}`}
                aria-selected={tab === value}
                aria-controls={`appearance-panel-${value}`}
                tabIndex={tab === value ? 0 : -1}
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

          <div
            role="tabpanel"
            id={`appearance-panel-${tab}`}
            aria-labelledby={`appearance-tab-${tab}`}
            tabIndex={0}
            className="appearance-scroll min-h-0 flex-1 overflow-y-auto pt-2"
          >
            {tab === "environment" ? (
              <>
                {/* Presets — one considered answer, before any dials. */}
                <Section
                  title="Environment"
                  hint={activePreset || activeSaved ? undefined : "Custom"}
                >
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
                          <EnvironmentSwatch preset={preset} />
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

                  {activePreset && (
                    <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                      {themePreset(activePreset).hint}
                    </p>
                  )}

                  {/* The reader's own environments, kept beside ours because
                      by the second visit theirs is the one they want. */}
                  {environments.length > 0 && (
                    <ul className="mt-2.5 space-y-1">
                      {environments.map((entry) => {
                        const selected = activeSaved === entry.id;
                        return (
                          <li key={entry.id} className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setTheme(entry.base);
                                setConfig(entry.config);
                              }}
                              aria-pressed={selected}
                              className={`${optionClass(selected)} flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5`}
                            >
                              <Bookmark
                                className="h-3 w-3 shrink-0 text-[color:var(--organism-accent-strong)]"
                                aria-hidden="true"
                              />
                              <span className="truncate text-xs font-medium">
                                {entry.name}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                commitEnvironments(removeEnvironment(environments, entry.id))
                              }
                              aria-label={`Forget ${entry.name}`}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                            >
                              <Trash2 className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Saving is the whole point of the dials below: tune it once,
                      name it, and it is waiting the next time. */}
                  {naming ? (
                    <form
                      className="mt-2 flex items-center gap-1.5"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveEnvironment();
                      }}
                    >
                      <input
                        ref={nameRef}
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            event.stopPropagation();
                            setNaming(false);
                            setDraftName("");
                          }
                        }}
                        maxLength={MAX_ENVIRONMENT_NAME}
                        placeholder="Name this environment"
                        aria-label="Name this environment"
                        className="min-w-0 flex-1 rounded-lg border border-border/40 bg-transparent px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-[color:var(--organism-accent-soft)] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!normaliseName(draftName)}
                        className="rounded-lg border border-[color:var(--organism-accent-soft)] px-2.5 py-1.5 text-xs font-medium text-foreground transition-opacity disabled:opacity-40"
                      >
                        Save
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setNaming(true)}
                      disabled={atEnvironmentLimit}
                      title={
                        atEnvironmentLimit
                          ? `You can keep ${MAX_SAVED_ENVIRONMENTS} environments. Forget one to save another.`
                          : undefined
                      }
                      className="appearance-save mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      Save this environment
                    </button>
                  )}
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
                      {TINT_OPTIONS.map((t) => {
                        const selected = config.tint === t.value;
                        return (
                          <button
                            key={String(t.value)}
                            type="button"
                            onClick={() => setConfig({ tint: t.value })}
                            aria-pressed={selected}
                            aria-label={t.label}
                            title={t.label}
                            data-tint={t.id}
                            className={`appearance-tint h-6 w-6 rounded-full border-2 transition-transform ${
                              selected
                                ? "scale-110 border-foreground/70 shadow-sm"
                                : "border-transparent hover:scale-105"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Eight named hues answer most of it; the wheel is there so
                      "most" is not the ceiling. Moving it pins the accent,
                      which is the same thing the swatches do. */}
                  <label className="mt-3 flex items-center gap-3">
                    <span className="w-14 shrink-0 text-xs text-muted-foreground">
                      {config.tint === "auto" ? "Auto" : `${Math.round(config.tint)}°`}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={359}
                      step={1}
                      value={config.tint === "auto" ? DEFAULT_PINNED_HUE : config.tint}
                      onChange={(e) => setConfig({ tint: Number(e.target.value) })}
                      aria-label="Accent hue"
                      data-auto={config.tint === "auto" ? "true" : "false"}
                      className="appearance-hue-track h-1.5 flex-1 cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-[color:var(--organism-accent-strong)] [&::-webkit-slider-thumb]:shadow-md"
                    />
                  </label>
                </Section>

                {/* The page itself. Warmth at night is not decoration — it is
                    the difference between finishing a chapter and stopping. */}
                <Section title="Paper" hint="The colour of the page">
                  <div className="grid grid-cols-4 gap-1.5">
                    {PAPER_TONE_OPTIONS.map((tone) => {
                      const selected = config.paperTone === tone.value;
                      return (
                        <button
                          key={tone.value}
                          type="button"
                          onClick={() => setConfig({ paperTone: tone.value })}
                          aria-pressed={selected}
                          aria-label={`${tone.label} paper`}
                          className={`${optionClass(selected)} flex flex-col items-center gap-1.5 p-1.5`}
                        >
                          <span
                            className="appearance-preset-page block h-8 w-full p-1.5"
                            data-paper-tone={tone.value}
                            data-base={isDark ? "dark" : "light"}
                            aria-hidden="true"
                          >
                            <span className="block h-[2px] w-full rounded-full bg-current opacity-45" />
                            <span className="mt-1 block h-[2px] w-3/4 rounded-full bg-current opacity-30" />
                          </span>
                          <span className="w-full truncate text-center text-xs font-medium">
                            {tone.label}
                          </span>
                        </button>
                      );
                    })}
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

                  {/* The pattern's own dials. Contrast is here rather than
                      under Presence because it answers a question the reader
                      asks about the background specifically: whether they can
                      see it at all. Our correction for light grounds is a
                      population average; this is theirs. */}
                  {config.preset !== "off" && (
                    <div className="mt-3 space-y-2.5">
                      {(
                        [
                          ["fieldContrast", "Presence", 0.5, 2, "How strongly the pattern reads"],
                          ["fieldScale", "Scale", 0.5, 1.6, "Finer or coarser structure"],
                          ["fieldSpeed", "Tempo", 0, 1.6, "How fast it drifts"],
                        ] as const
                      ).map(([key, label, min, max, hint]) => (
                        <label key={key} className="flex items-center gap-3">
                          <span className="w-14 shrink-0 text-xs text-muted-foreground">
                            {label}
                          </span>
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step={0.05}
                            value={config[key]}
                            onChange={(e) => setConfig({ [key]: Number(e.target.value) })}
                            aria-label={`${label} — ${hint}`}
                            title={hint}
                            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-[color:var(--organism-accent-strong)] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[color:var(--organism-accent-strong)] [&::-webkit-slider-thumb]:shadow-md"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </Section>

                <Section title="Surface">
                  <div className="grid grid-cols-3 gap-1.5">
                    {UI_STYLE_OPTIONS.map(({ value, label, hint }) => {
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
                          <span className="mt-0.5 block text-[0.68rem] leading-snug text-muted-foreground">
                            {preset.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Section>

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
                          <span className="block text-[0.68rem] leading-tight text-muted-foreground">
                            {face}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                <Section title="Size">
                  <div className="grid grid-cols-4 gap-1.5">
                    {READING_SIZE_OPTIONS.map((s) => {
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
                            className="appearance-size-sample font-serif font-medium leading-none"
                            data-size={s.id}
                          >
                            {s.label}
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
              </>
            )}
          </div>

          <div className="shrink-0 border-t border-border/30 px-5 py-2.5">
            <button
              type="button"
              onClick={() => setConfig(defaultConfigFor(base))}
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
