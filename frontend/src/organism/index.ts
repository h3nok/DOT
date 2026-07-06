/**
 * Organism Theme — a living, ambient skin for DOT (Digital Organisms Theory).
 *
 * The site behaves like an organism whose physiology is driven by four real
 * signals: the local clock (circadian), your input (arousal), backend health
 * (metabolism), and orchestrator activity (synapsis). See {@link ./types}.
 *
 * Wiring:
 *   1. import "./organism/organism.css" once (after the base stylesheet);
 *   2. wrap the app in <OrganismProvider>;
 *   3. render <OrganismThemeBridge/>, <OrganismMembrane/> and (optionally)
 *      <OrganismHud/> inside it.
 *
 * Components opt into the living accent with `var(--organism-accent)` or the
 * `.organism-alive` utility class.
 */
export { OrganismProvider, useOrganism } from "./OrganismContext";
export { useOrganismPulse } from "./OrganismContext";
export { OrganismThemeBridge } from "./OrganismThemeBridge";
export { OrganismMembrane } from "./OrganismMembrane";
export { OrganismReadingProbe } from "./OrganismReadingProbe";
export { OrganismHud } from "./OrganismHud";
export { AppearanceControl } from "./AppearanceControl";
export { ORGANISM_PRESETS } from "./types";
export {
  EASE_SETTLE,
  EASE_BREATHE,
  ORGANIC_SPRING,
  ORGANIC_SPRING_SNAPPY,
  bloomFromOrigin,
  staggerContainer,
  staggerChild,
  emerge,
} from "./motion";
export type {
  VitalSigns,
  OrganismConfig,
  OrganismMood,
  OrganismPreset,
  OrganismContextValue,
} from "./types";
