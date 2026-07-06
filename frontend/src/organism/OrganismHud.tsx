import React, { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { useOrganism } from "./OrganismContext";

const MOOD_GLYPH: Record<string, string> = {
  dormant: "🌙",
  resting: "🫧",
  calm: "○",
  active: "◐",
  flowing: "✦",
  strained: "⚠",
};

interface BarProps {
  label: string;
  valueRef: RefObject<number>;
}

/** A single vital read straight from the ref via rAF — never re-renders React. */
const VitalBar: React.FC<BarProps> = ({ label, valueRef }) => {
  const fill = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (fill.current) {
        const pct = Math.round(Math.max(0, Math.min(1, valueRef.current)) * 100);
        fill.current.style.width = `${pct}%`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [valueRef]);

  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
      <span className="w-16 shrink-0 opacity-70">{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10">
        <div
          ref={fill}
          className="h-full rounded-full"
          style={{ width: "0%", background: "var(--organism-accent)" }}
        />
      </div>
    </div>
  );
};

/**
 * A compact diagnostic instrument: the live mood plus the four vital channels.
 * Hidden by default (`config.showHud`); useful while tuning the organism and as
 * an honest, ambient readout of what the system is actually feeling. It draws
 * its bars from the shared ref every frame, so it costs one rAF and no
 * re-renders.
 */
export const OrganismHud: React.FC = () => {
  const { config, setConfig, vitals, mood, reducedMotion } = useOrganism();

  // Stable refs into the live vitals object for the bars to poll.
  const refs = useRef({
    arousal: { current: 0 },
    metabolism: { current: 0 },
    synapsis: { current: 0 },
    daylight: { current: 0 },
    stillness: { current: 0 },
  });
  const readingChip = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const v = vitals.current;
      refs.current.arousal.current = v.arousal;
      refs.current.metabolism.current = v.metabolism;
      refs.current.synapsis.current = v.synapsis;
      refs.current.daylight.current = v.daylight;
      refs.current.stillness.current = v.calm;
      if (readingChip.current) {
        readingChip.current.style.opacity = v.calm > 0.5 ? "1" : "0.25";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [vitals]);

  if (!config.showHud) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-60 select-none rounded-xl border border-border/60 bg-background/70 p-3 text-foreground shadow-lg backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide">
          {MOOD_GLYPH[mood] ?? "○"} organism · {mood}
          <span
            ref={readingChip}
            className="ml-1 rounded px-1 text-[9px] uppercase"
            style={{
              background: "var(--organism-accent-soft)",
              transition: "opacity 400ms ease",
            }}
          >
            reading
          </span>
        </span>
        <button
          type="button"
          onClick={() => setConfig({ showHud: false })}
          className="text-xs opacity-50 hover:opacity-100"
          aria-label="Hide organism instrument"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1.5">
        <VitalBar label="arousal" valueRef={refs.current.arousal} />
        <VitalBar label="metabol." valueRef={refs.current.metabolism} />
        <VitalBar label="synapsis" valueRef={refs.current.synapsis} />
        <VitalBar label="daylight" valueRef={refs.current.daylight} />
        <VitalBar label="stillness" valueRef={refs.current.stillness} />
      </div>

      <div className="mt-3 flex items-center gap-3 text-[10px]">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={config.showMembrane}
            onChange={(e) => setConfig({ showMembrane: e.target.checked })}
          />
          membrane
        </label>
        <label className="flex flex-1 items-center gap-1">
          intensity
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.intensity}
            onChange={(e) => setConfig({ intensity: Number(e.target.value) })}
            className="flex-1"
          />
        </label>
      </div>

      {reducedMotion && (
        <p className="mt-2 text-[10px] leading-tight opacity-60">
          Reduced motion is on — physiology stays, animation is stilled.
        </p>
      )}
    </div>
  );
};
