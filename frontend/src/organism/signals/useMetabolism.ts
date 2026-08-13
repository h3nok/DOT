import { useEffect, useState } from "react";
import { fetchOrchestratorReadiness } from "../../services/OrchestratorPublicationService";

export interface MetabolismReading {
  /** Backend health / oxygenation in [0,1]. */
  level: number;
  /** True while the backend is unreachable (fasting on fallback data). */
  fasting: boolean;
}

const FASTING_BASELINE = 0.45;
const ALIVE_LEVEL = 0.75;

/**
 * Probes the orchestrator's readiness endpoint to derive the organism's
 * "metabolism" — how oxygenated and vivid it looks. A reachable backend
 * reads as alive; an unreachable one settles toward a calm fasting baseline.
 */
export function useMetabolism(active: boolean): MetabolismReading {
  const [reading, setReading] = useState<MetabolismReading>({
    level: FASTING_BASELINE,
    fasting: true,
  });

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const sample = async () => {
      try {
        const r = await fetchOrchestratorReadiness();
        if (cancelled) return;
        const alive = r.status === "ok";
        setReading({ level: alive ? ALIVE_LEVEL : FASTING_BASELINE, fasting: !alive });
      } catch {
        if (!cancelled) {
          setReading((prev) => ({
            level: prev.level + (FASTING_BASELINE - prev.level) * 0.5,
            fasting: true,
          }));
        }
      }
    };

    sample();
    const id = window.setInterval(sample, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [active]);

  return reading;
}
