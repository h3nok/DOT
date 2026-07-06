/**
 * DOT graph design language.
 *
 * A surface is a central Dot with attribute nodes radiating around it, alive on
 * the organism background. Compose one with <NucleusGraph root={...} /> over a
 * {@link DotNode} tree (see {@link ./profileGraph}). The model is recursive:
 * any node with children becomes a surface of its own.
 */
export { NucleusGraph } from "./NucleusGraph";
export { GraphNode } from "./GraphNode";
export { SynapticEdge } from "./SynapticEdge";
export { NucleusMark } from "./NucleusMark";
export { NodeEditor } from "./NodeEditor";
export { NodeStage } from "./NodeStage";
export { GraphChat } from "./GraphChat";
export { runAgent, resolveNode, type AgentResult } from "./agent";
export { useEditableGraph } from "./useEditableGraph";
export { useOwnerMode } from "./useOwnerMode";
export { useAuth } from "./useAuth";
export { SignIn } from "./SignIn";
export { Invite } from "./Invite";
export { InviteWelcome } from "./InviteWelcome";
export { useInviteArrival } from "./useInviteArrival";
export { Publications } from "./Publications";
export { usePublications, type Publication } from "./usePublications";
export { CircleSurface } from "./Circle";
export { useCircle, acceptInvite, type Circle } from "./useCircle";
export { BloomSurface } from "./BloomSurface";
export { profileGraph } from "./profileGraph";
export { radialSlots } from "./layout";
export { hasChildren } from "./types";
export {
  addChild,
  removeNode,
  updateNode,
  findNode,
  clearGraph,
  type NodeDraft,
} from "./graphStore";
export type { DotNode, DotNodeKind } from "./types";
