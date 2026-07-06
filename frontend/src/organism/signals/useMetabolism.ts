import { useEffect, useState } from "react";
import PlatformMetricsService from "../../services/PlatformMetricsService";

export interface MetabolismReading {
  /** Backend health / oxygenation in [0,1]. */
  level: number;
  /** True while the backend is unreachable (fasting on fallback data). */
  fasting: boolean;
}

const FASTING_BASELINE = 0.45;

/**
 * Maps living-community signal from the backend into the organism's
 * "metabolism" — how oxygenated and vivid it looks.
 *
 * It polls the dashboard metrics slowly (every 45s). The service already
 * degrades gracefully to fallback demo data when the Flask backend is down,
 * so we additionally detect "fasting" via a probe and let metabolism settle
 * toward a calm baseline rather than reading the synthetic numbers as health.
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
        const m = await PlatformMetricsService.getDashboardMetrics();
        if (cancelled) return;

        // Activity of the colony, normalised with gentle saturation curves so
        // a thriving community reads as fully oxygenated without ever pegging.
        const members = clamp01(Math.log10(Math.max(1, m.members)) / 3.7); // ~5000 → 1
        const discussions = clamp01(m.discussions / 600);
        const integrations = clamp01(m.integrations / 30);

        const level = clamp01(
          0.35 + 0.4 * members + 0.15 * discussions + 0.1 * integrations,
        );
        setReading({ level, fasting: false });
      } catch {
        if (!cancelled) {
          // Ease toward the fasting baseline instead of snapping.
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

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
