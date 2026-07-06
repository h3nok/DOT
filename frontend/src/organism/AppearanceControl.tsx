import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Sun, Moon, X } from "lucide-react";
import { useTheme } from "../shared/contexts/SimpleThemeContext";
import { useOrganism } from "./OrganismContext";
import { ORGANISM_PRESETS, type OrganismPreset } from "./types";

/**
 * The appearance control — DOT's living theme, made the user's.
 *
 * A single quiet affordance (bottom-right) opens a small panel for choosing the
 * light/dark base, the character of the living background (the organism
 * presets), and its intensity. Choices persist via the organism config. This is
 * the user-facing counterpart to the developer HUD; it is deliberately calm and
 * stays out of the way until asked for.
 */
export const AppearanceControl: React.FC = () => {
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
  const choosePreset = (preset: OrganismPreset) =>
    setConfig({ preset, enabled: true, showMembrane: preset !== "off" });

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="organism-alive mb-3 w-64 rounded-2xl border border-border/60 bg-background/80 p-4 text-foreground shadow-xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Appearance
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close appearance panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Base: light / dark */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            {(["light", "dark"] as const).map((t) => {
              const selected = (t === "dark") === isDark;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  aria-pressed={selected}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors ${
                    selected
                      ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] text-foreground"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "light" ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                  {t}
                </button>
              );
            })}
          </div>

          {/* Living background presets */}
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Living background
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {(Object.keys(ORGANISM_PRESETS) as OrganismPreset[]).map((p) => {
              const selected =
                p === "off" ? !config.showMembrane : config.preset === p && config.showMembrane;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => choosePreset(p)}
                  aria-pressed={selected}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    selected
                      ? "border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] text-foreground"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ORGANISM_PRESETS[p].label}
                </button>
              );
            })}
          </div>

          {/* Intensity */}
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Intensity
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={config.intensity}
              onChange={(e) => setConfig({ intensity: Number(e.target.value) })}
              className="flex-1 accent-[color:var(--organism-accent)]"
            />
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Appearance settings"
        aria-expanded={open}
        className="organism-alive flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/70 text-foreground/80 shadow-lg backdrop-blur-md transition-colors hover:text-foreground"
      >
        <Sparkles className="h-4 w-4" />
      </button>
    </div>
  );
};
