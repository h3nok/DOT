/**
 * DOT — the graph design language.
 *
 * Every surface in DOT is a living graph: a central **Dot** (the purpose of the
 * page) surrounded by **attribute nodes** connected to it like organelles to a
 * nucleus. The model is recursive — focusing a node makes *it* the centre and
 * its own children radiate out, so a profile, a book, or a doctrine are all the
 * same shape at different depths.
 *
 * The graph is pure data ({@link DotNode}); the rendering ({@link ../dot} React
 * components) gives it a body, and the organism theme gives that body life.
 */

import type { DotRelation } from "../attention-os/focus/relations";

export type DotNodeKind = "self" | "attribute" | "page" | "external";
/** Platform surfaces a node can open instead of a plain reading panel. */
export type DotSurface =
  | "publications"
  | "circle"
  | "vault"
  | "support"
  | "join"
  | "twin";

export interface DotNode {
  /** Stable identity, unique among its siblings. */
  id: string;
  /** Short name shown on the node. */
  label: string;
  /** How the node behaves when activated. Defaults to "attribute". */
  kind?: DotNodeKind;
  /** When set, activating this node opens a live platform surface (the
   *  publication library, the circle) rather than static reading content. */
  surface?: DotSurface;
  /** Route ("/doctrine") for `page`, or URL ("mailto:…", "https://…") for `external`. */
  href?: string;
  /** One-line essence, revealed when the node is focused. */
  description?: string;
  /** Short framing copy shown above a node when it is used as a page nucleus. */
  introduction?: string;
  /** Reader-facing command used when this node is promoted as the primary action. */
  actionLabel?: string;
  /** Rich content (plain text / light markdown) shown in the node's reading
   *  panel. This is the node's substance — the profile, the project, the note. */
  body?: string;
  /** Optional metadata chips (e.g. role, period, status, stack). */
  meta?: { label: string; value: string }[];
  /** Optional portrait/image URL. On the Self node it becomes the face at the
   *  centre of the graph, framed by the fingerprint; elsewhere it can mark a
   *  node with an image. */
  image?: string;
  /** How this node relates to its parent. Navigation is offered in these terms
   *  rather than as a menu, so every move has a stated reason (doc 12 §4). */
  relation?: DotRelation;
  /** The single action under the nucleus (ADR-0017: "The Canon is the primary
   *  entry"). A primary limb is promoted out of the ring and rendered as that
   *  one action, so the same destination is never offered twice at two
   *  different weights. At most one child per parent should carry it. */
  primary?: boolean;
  /** Declared but not built. Planned limbs stay in the anatomy and stay out of
   *  the ring — ADR-0016 is explicit that "a quiet text link is the remedy,
   *  never a ring node" — so the field shows only doors that open. */
  planned?: boolean;
  /** Child attributes. Focusing this node re-centres the graph on it. */
  children?: DotNode[];
}

/** True when activating a node should drill the graph into it. */
export function hasChildren(node: DotNode): boolean {
  return !!node.children && node.children.length > 0;
}
