import { useEffect, useState } from "react";

export interface CircadianReading {
  /** 0 = midnight, 0.5 = noon, in [0,1). */
  phase: number;
  /** 0 = deep night, 1 = midday. A smooth solar arc. */
  daylight: number;
  /** Golden-hour warmth, peaks near dawn (~7h) and dusk (~18h). */
  warmth: number;
}

function readClock(now = new Date()): CircadianReading {
  const h = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  // Solar arc: zero at 06:00 and 18:00, unity at noon, clamped at night.
  const daylight = Math.max(0, Math.sin((Math.PI * (h - 6)) / 12));

  // Two gaussians centred on the golden hours give a warm dawn/dusk and a
  // cool, blue midday and deep night.
  const dawn = Math.exp(-((h - 7) ** 2) / 2);
  const dusk = Math.exp(-((h - 18) ** 2) / 2);
  const warmth = Math.min(1, dawn + dusk);

  return { phase: h / 24, daylight, warmth };
}

/**
 * The organism's day/night rhythm. Pure function of the local clock; it
 * resamples every 30s, which is far finer than the eye can perceive at these
 * cadences but keeps the membrane drifting with real time.
 */
export function useCircadian(): CircadianReading {
  const [reading, setReading] = useState<CircadianReading>(() => readClock());

  useEffect(() => {
    const tick = () => setReading(readClock());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return reading;
}
