import React, { useEffect, useMemo, useState } from "react";
import type { SoundscapeType } from "../../services/SoundscapeService";

interface BrainwaveVisualizerProps {
  type: SoundscapeType;
  volume: number;
}

export const BrainwaveVisualizer: React.FC<BrainwaveVisualizerProps> = ({
  type,
  volume,
}) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (type === "off") return;

    let frameId: number;
    const speed =
      type === "alpha"
        ? 0.05
        : type === "gamma"
          ? 0.22
          : type === "ocean"
            ? 0.02
            : 0.03;

    const tick = () => {
      setPhase((currentPhase) => currentPhase + speed);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [type]);

  const paths = useMemo(() => {
    if (type === "off") {
      return { primary: "M 0,20 L 400,20", secondary: "M 0,20 L 400,20" };
    }

    const points1: string[] = [];
    const points2: string[] = [];
    const width = 400;
    const height = 40;

    let freq1 = 0.03;
    let amp1 = 8;
    let freq2 = 0.015;
    let amp2 = 4;

    if (type === "alpha") {
      freq1 = 0.04;
      amp1 = 10;
      freq2 = 0.02;
      amp2 = 5;
    } else if (type === "gamma") {
      freq1 = 0.15;
      amp1 = 4;
      freq2 = 0.08;
      amp2 = 2.5;
    } else if (type === "ocean") {
      freq1 = 0.01;
      amp1 = 14;
      freq2 = 0.005;
      amp2 = 7;
    }

    const volumeScale = 0.2 + volume * 0.8;
    const finalAmp1 = amp1 * volumeScale;
    const finalAmp2 = amp2 * volumeScale;

    for (let x = 0; x <= width; x += 5) {
      const y1 = Math.sin(x * freq1 + phase) * finalAmp1 + height / 2;
      const y2 = Math.cos(x * freq2 - phase * 0.8) * finalAmp2 + height / 2;
      points1.push(`${x},${y1}`);
      points2.push(`${x},${y2}`);
    }

    return {
      primary: `M ${points1.join(" L ")}`,
      secondary: `M ${points2.join(" L ")}`,
    };
  }, [phase, type, volume]);

  const waveGlowColor =
    type === "alpha"
      ? "rgba(20,184,166,0.8)"
      : type === "gamma"
        ? "rgba(37,99,235,0.8)"
        : type === "ocean"
          ? "rgba(59,130,246,0.8)"
          : "rgba(255,255,255,0.2)";

  return (
    <div className="w-full h-10 relative overflow-hidden select-none bg-black/15 dark:bg-black/40 rounded-lg border border-white/5 flex items-center justify-center p-1.5">
      <div className="absolute top-1.5 left-2.5 font-mono text-[8px] uppercase tracking-widest text-muted-foreground z-10 flex items-center gap-1">
        <span
          className={
            type !== "off"
              ? "w-1 h-1 rounded-full bg-emerald-500 animate-pulse"
              : "w-1 h-1 rounded-full bg-neutral-600"
          }
        />
        Telemetry:{" "}
        {type === "off" ? "RESTING" : `${type.toUpperCase()} WAVE SYNTHESIS`}
      </div>
      <svg
        className="w-full h-full overflow-visible pointer-events-none opacity-80"
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
      >
        <path
          d={paths.primary}
          fill="none"
          stroke={waveGlowColor}
          strokeWidth="2.0"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${waveGlowColor})` }}
        />
        <path
          d={paths.secondary}
          fill="none"
          stroke={waveGlowColor}
          strokeWidth="1.0"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
      </svg>
    </div>
  );
};
