import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useReading } from "../shared/contexts";
import { useOrganism } from "./OrganismContext";

/**
 * The reading reflex.
 *
 * DOT is, above all, a place to read — so the organism must yield to reading.
 * When the user is on a reading surface (or has an article open) this probe
 * raises the quiescence target; the bridge and membrane ease toward stillness,
 * arousal stops exciting the field, and orchestrator pulses are deferred rather
 * than flashed. The organism is most alive while you explore and most still
 * while you read. Stillness as respect (manifesto L2–L4).
 *
 * It must live *inside* the Router (it needs `useLocation`), which is why it is
 * a tiny mounted component rather than part of the provider that sits above it.
 * Renders nothing.
 */

// Route prefixes that are primarily reading surfaces.
const READING_ROUTES = ["/book", "/read", "/doctrine"];

export const OrganismReadingProbe: React.FC = () => {
  const { pathname } = useLocation();
  const { state } = useReading();
  const { vitals, config } = useOrganism();

  const onReadingRoute = READING_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
  const hasOpenArticle = state.reading.currentArticle != null;

  useEffect(() => {
    if (!config.enabled) {
      vitals.current.calmTarget = 0;
      document.documentElement.removeAttribute("data-organism-reading");
      return;
    }
    // Route is the authoritative gate: leaving a reading surface always
    // restores life, even if a page left `currentArticle` set. On a reading
    // route, an open article deepens the stillness to full.
    const target = onReadingRoute ? (hasOpenArticle ? 1 : 0.88) : 0;
    vitals.current.calmTarget = target;
    document.documentElement.dataset.organismReading =
      target > 0.5 ? "true" : "false";
  }, [vitals, config.enabled, onReadingRoute, hasOpenArticle]);

  return null;
};
