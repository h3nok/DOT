/**
 * DOT graph design language.
 *
 * A surface is a central Dot with attribute nodes radiating around it, alive on
 * the organism background. Compose one with <NucleusGraph root={...} /> over a
 * {@link DotNode} tree (see {@link ./profileGraph}). The model is recursive:
 * any node with children becomes a surface of its own.
 */
export { resolveNode, runAgent, type AgentResult } from "./agent";
export { AgentWorkspace } from "./AgentWorkspace";
export { BloomSurface } from "./BloomSurface";
export { CircleSurface } from "./Circle";
export { GraphChat } from "./GraphChat";
export { GraphNode } from "./GraphNode";
export {
    addChild,
    clearGraph,
    findNode,
    removeNode,
    updateNode,
    type NodeDraft
} from "./graphStore";
export { Invite } from "./Invite";
export { InviteWelcome } from "./InviteWelcome";
export { radialSlots } from "./layout";
export { NodeEditor } from "./NodeEditor";
export { NodeStage } from "./NodeStage";
export { NucleusGraph } from "./NucleusGraph";
export { NucleusMark } from "./NucleusMark";
export { dotGraph } from "./dotGraph";
export { SignIn } from "./SignIn";
export { SupportSurface } from "./SupportSurface";
export { SynapticEdge } from "./SynapticEdge";
export { hasChildren } from "./types";
export type { DotNode, DotNodeKind } from "./types";
export { useAuth } from "./useAuth";
export { acceptInvite, useCircle, type Circle } from "./useCircle";
export { useEditableGraph } from "./useEditableGraph";
export { useInviteArrival } from "./useInviteArrival";
export { useOwnerMode } from "./useOwnerMode";
export {
  formatAmount,
  useSupport,
  type SupportCheckout,
  type SupportCheckoutStatus,
  type SupportOptions,
} from "./useSupport";
