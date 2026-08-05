import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_CONFIG,
  DEFAULT_VITALS,
  ORGANISM_STORAGE_KEY,
  resolvePreset,
  type OrganismConfig,
  type OrganismContextValue,
  type OrganismMood,
  type VitalSigns,
} from "./types";
import { useReducedMotion } from "./signals/useReducedMotion";
import { useCircadian } from "./signals/useCircadian";
import { useArousal } from "./signals/useArousal";
import { useMetabolism } from "./signals/useMetabolism";
import { useSynapticActivity } from "./signals/useSynapticActivity";

const OrganismContext = createContext<OrganismContextValue | null>(null);

function loadConfig(): OrganismConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(ORGANISM_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const saved = JSON.parse(raw) as Partial<OrganismConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...saved,
      preset: resolvePreset(saved.preset),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Pure mapping from current vitals to a qualitative mood. */
function deriveMood(v: VitalSigns): OrganismMood {
  if (v.strain > 0.5) return "strained";
  // Reading is rest: ignore scroll/pointer arousal and settle.
  if (v.calm > 0.6) return "resting";
  if (v.synapsis > 0.4 && v.arousal > 0.25) return "flowing";
  if (v.arousal > 0.35) return "active";
  if (v.daylight < 0.12 && v.arousal < 0.08) return "dormant";
  if (v.arousal < 0.12) return "resting";
  return "calm";
}

/**
 * The organism's brain.
 *
 * Owns the single mutable {@link VitalSigns} ref that every other part reads,
 * fuses the four signal sources into it, derives a throttled mood, and reflects
 * its state onto `<html>` as `data-organism` / `data-organism-mood` so plain
 * CSS can respond without JavaScript.
 */
export const OrganismProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [config, setConfigState] = useState<OrganismConfig>(loadConfig);
  const [mood, setMood] = useState<OrganismMood>("calm");
  const reducedMotion = useReducedMotion();

  const vitals = useRef<VitalSigns>({ ...DEFAULT_VITALS });

  // --- Signal sources ---------------------------------------------------
  const live = config.enabled;
  const circadian = useCircadian();
  const metabolism = useMetabolism(live);
  const synaptic = useSynapticActivity(live);
  useArousal(vitals, { active: live, reducedMotion });

  // Fold the low-frequency (state-based) signals into the shared ref.
  useEffect(() => {
    const v = vitals.current;
    v.circadianPhase = circadian.phase;
    v.daylight = circadian.daylight;
    v.warmth = circadian.warmth;
    v.metabolism = metabolism.level;
    v.synapsis = synaptic.synapsis;
    v.strain = Math.max(synaptic.strain, metabolism.fasting ? 0.18 : 0);
  }, [circadian, metabolism, synaptic]);

  // A change in the orchestrator's import landscape requests one pulse. The
  // bridge fires it immediately when alive, or defers it while reading.
  useEffect(() => {
    if (synaptic.pulseSeq > 0) vitals.current.pendingPulse = true;
  }, [synaptic.pulseSeq]);

  // Derive mood at ~1Hz from the live ref (cheap; only re-renders on change).
  useEffect(() => {
    if (!live) {
      setMood("calm");
      return;
    }
    const id = window.setInterval(() => {
      const next = deriveMood(vitals.current);
      setMood((prev) => (prev === next ? prev : next));
    }, 1000);
    return () => window.clearInterval(id);
  }, [live]);

  // Reflect state onto the document for pure-CSS consumers.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.organism = config.enabled ? "on" : "off";
    root.dataset.organismMood = mood;
    root.style.setProperty("--organism-intensity", String(config.intensity));
    return () => {
      // Leave attributes in place on unmount; the provider lives for the app.
    };
  }, [config.enabled, config.intensity, mood]);

  // The member's reading choices are theirs, not the route's: publish them as
  // variables the reading surfaces consume.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.reading = config.readingFont;
    root.style.setProperty("--reading-scale", config.readingScale.toFixed(2));
  }, [config.readingFont, config.readingScale]);

  const setConfig = useCallback((patch: Partial<OrganismConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(ORGANISM_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — run with in-memory config */
      }
      return next;
    });
  }, []);

  const toggle = useCallback(
    () => setConfig({ enabled: !config.enabled }),
    [config.enabled, setConfig],
  );

  // Imperative pulse: a real platform event firing the organism's nervous
  // system. We mark a pending pulse (the bridge renders the ripple, deferring
  // it politely while the member reads) and briefly oxygenate the field so a
  // meaningful action — a release, a new connection — is felt, not just shown.
  const pulse = useCallback((amplitude = 1) => {
    const v = vitals.current;
    if (!v) return;
    const a = Math.max(0, Math.min(1, amplitude));
    v.pendingPulse = true;
    v.synapsis = Math.min(1, v.synapsis + 0.3 * a);
  }, []);

  const value = useMemo<OrganismContextValue>(
    () => ({ config, setConfig, toggle, pulse, vitals, mood, reducedMotion }),
    [config, setConfig, toggle, pulse, mood, reducedMotion],
  );

  return (
    <OrganismContext.Provider value={value}>
      {children}
    </OrganismContext.Provider>
  );
};

export function useOrganism(): OrganismContextValue {
  const ctx = useContext(OrganismContext);
  if (!ctx) {
    throw new Error("useOrganism must be used within an OrganismProvider");
  }
  return ctx;
}

/**
 * Provider-safe pulse handle for code that should fire the organism but must
 * not depend on the provider being present (e.g. graph surfaces in isolation
 * or tests). Returns a no-op when rendered outside an {@link OrganismProvider}.
 */
export function useOrganismPulse(): (amplitude?: number) => void {
  const ctx = useContext(OrganismContext);
  return useCallback((amplitude?: number) => ctx?.pulse(amplitude), [ctx]);
}
