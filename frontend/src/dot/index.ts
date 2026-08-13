/**
 * DOT graph design language — public API.
 *
 * Components import directly from their source files for tree-shaking.
 * This barrel exports only the types and entry points that other modules need.
 */
export { NucleusGraph } from "./NucleusGraph";
export { NucleusMark } from "./NucleusMark";
export { dotGraph } from "./dotGraph";
export { hasChildren } from "./types";
export type { DotNode, DotNodeKind } from "./types";
