import { useEffect, useState } from "react";
import { fetchOrchestratorReadiness } from "../../services/OrchestratorPublicationService";
import { fetchFootprintImports } from "../../services/OrchestratorGraphService";

export interface SynapticReading {
  /** Orchestrator processing intensity in [0,1]. */
  synapsis: number;
  /** Distress from a degraded or unreachable orchestrator in [0,1]. */
  strain: number;
  /** Increments whenever a discrete synaptic event fires (import begun/ended). */
  pulseSeq: number;
}

const ACTIVE_STATUSES = new Set([
  "pending",
  "queued",
  "running",
  "processing",
  "in_progress",
  "started",
]);

/**
 * The orchestrator is the organism's nervous system. This hook listens to it
 * and turns its work into "synaptic activity":
 *
 *  - readiness (`/health/ready`) sets a floor and feeds `strain` when degraded;
 *  - footprint imports that are pending/running raise `synapsis`;
 *  - any change to the set of imports (a new one appears, or one reaches a
 *    terminal state) fires a discrete *pulse* — a single neuron firing — which
 *    the membrane renders as an expanding ripple and the aura as a brief flash.
 *
 * Polling is adaptive: it samples every 5s while work is in flight and every
 * 16s when the orchestrator is quiet, so the organism feels the orchestrator
 * without hammering it. All network access is abortable and failure-tolerant;
 * an offline orchestrator simply lowers synapsis and raises strain.
 */
export function useSynapticActivity(active: boolean): SynapticReading {
  const [reading, setReading] = useState<SynapticReading>({
    synapsis: 0,
    strain: 0,
    pulseSeq: 0,
  });

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer = 0;
    let lastSignature = "";
    let pulseSeq = 0;
    // Skip the very first signature diff so initial load isn't read as a burst.
    let primed = false;

    const sample = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4000);

      let synapsis = 0;
      let strain = 0;
      let activeCount = 0;

      try {
        const readiness = await fetchOrchestratorReadiness(controller.signal);
        if (readiness.status !== "ready") strain = Math.max(strain, 0.6);
        const failingChecks = Object.values(readiness.checks ?? {}).filter(
          (v) => v !== "ok" && v !== "ready" && v !== "healthy",
        ).length;
        strain = Math.min(1, strain + failingChecks * 0.2);
      } catch {
        // Orchestrator unreachable: a dull ache, not a scream.
        strain = Math.max(strain, 0.5);
      }

      try {
        const imports = await fetchFootprintImports({
          limit: 25,
          signal: controller.signal,
        });
        activeCount = imports.filter((i) =>
          ACTIVE_STATUSES.has((i.status ?? "").toLowerCase()),
        ).length;
        const failed = imports.filter((i) =>
          ["failed", "error"].includes((i.status ?? "").toLowerCase()),
        ).length;

        // Saturating curve: one job already feels alive, many jobs glow.
        synapsis = Math.min(1, 1 - Math.exp(-activeCount / 2.2));
        if (failed > 0) strain = Math.min(1, strain + 0.25);

        // Signature of the current import landscape; a change = a synapse fired.
        const signature = imports
          .map((i) => `${i.id}:${(i.status ?? "").toLowerCase()}`)
          .sort()
          .join("|");
        if (primed && signature !== lastSignature) pulseSeq += 1;
        lastSignature = signature;
        primed = true;
      } catch {
        synapsis = 0;
      } finally {
        window.clearTimeout(timeout);
      }

      if (!cancelled) {
        setReading((prev) => ({
          // Ease synapsis so it swells and fades like real activation.
          synapsis: prev.synapsis + (synapsis - prev.synapsis) * 0.5,
          strain: prev.strain + (strain - prev.strain) * 0.4,
          pulseSeq,
        }));
        // Quick cadence while busy, relaxed when idle.
        const next = activeCount > 0 ? 5000 : 16000;
        timer = window.setTimeout(sample, next);
      }
    };

    sample();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active]);

  return reading;
}
