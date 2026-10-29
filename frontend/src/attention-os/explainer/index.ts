/**
 * Explainer primitives: finite, reader-paced visual stories. Each takes data and
 * draws from the surrounding theme's tokens (foreground, muted, border, accent),
 * so a publication supplies the content and the palette, never the markup.
 */
export { ExplainerHero, type ContentsItem } from "./ExplainerHero";
export { Artwork, type ExplainerImage } from "./Artwork";
export { FigureKey, type FigureKeyItem } from "./FigureKey";
export { ExplainerSection } from "./ExplainerSection";
export { PullQuote } from "./PullQuote";
export { ScrollStory, type StoryStep, type StoryPosition } from "./ScrollStory";
export { FlowMap, type FlowTier, type FlowLink, type FlowRail } from "./FlowMap";
export { Ledger, type LedgerEntry } from "./Ledger";
export { CycleDiagram, type CycleStep } from "./CycleDiagram";
export { ShareGrid } from "./ShareGrid";
export { BarList, type BarRow } from "./BarList";
export { FigureRow } from "./FigureRow";
export { Contrast, type ContrastSide } from "./Contrast";
export { CardGrid, Disclosure, type ExplainerCard } from "./CardGrid";
export { Glossary, type GlossaryTerm } from "./Glossary";
export { Note } from "./Note";
export { Questions, type ExplainerQuestion } from "./Questions";
export { SourceList, type ExplainerSource } from "./SourceList";
export { Handoff } from "./Handoff";
