import { ArrowUpRight, Layers, Link2, Pencil, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { hasChildren, type DotNode } from "./types";
import { BloomSurface } from "./BloomSurface";
import { RelationExits } from "../attention-os/focus/RelationExits";
import { staggerChild } from "../organism";

/**
 * NodeStage — a node's content, blooming from the centre of the graph.
 *
 * It is a thin specialization of {@link BloomSurface}: the one shell every
 * focused surface in DOT shares. When a node is activated its content grows out
 * of the nucleus; closing collapses it back. The graph stays alive behind it.
 */

interface NodeStageProps {
  node: DotNode;
  editing?: boolean;
  /** Screen-space centre of the graph nucleus, so the bloom originates there. */
  origin: { x: number; y: number };
  /** True for synthetic chat answers (hide structural actions). */
  ephemeral?: boolean;
  reducedMotion?: boolean;
  onClose: () => void;
  onOpenChildren?: (node: DotNode) => void;
  onFollow?: (node: DotNode) => void;
  /** Focus a related node by id, so movement happens in relation language. */
  onFollowRelation?: (id: string) => void;
  onEdit?: (node: DotNode) => void;
  onAddChild?: (node: DotNode) => void;
}

export const NodeStage: React.FC<NodeStageProps> = ({
  node,
  editing = false,
  origin,
  ephemeral = false,
  reducedMotion = false,
  onClose,
  onOpenChildren,
  onFollow,
  onFollowRelation,
  onEdit,
  onAddChild,
}) => {
  const drillable = hasChildren(node);
  const kind = node.kind ?? "attribute";
  const paragraphs = (node.body ?? "")
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const hasActions = !ephemeral && (drillable || Boolean(node.href) || editing);

  const footer = hasActions ? (
    <div className="flex flex-wrap items-center gap-2">
      {drillable && (
        <button
          type="button"
          onClick={() => onOpenChildren?.(node)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
        >
          <Layers className="h-3.5 w-3.5" />
          Explore {node.children?.length} inside
        </button>
      )}
      {node.href && (
        <button
          type="button"
          onClick={() => onFollow?.(node)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 px-4 py-2.5 text-xs font-medium text-foreground/80 transition-colors hover:text-foreground"
        >
          {kind === "external" ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
          {kind === "external" ? "Visit" : "Open page"}
        </button>
      )}
      {editing && (
        <>
          <button
            type="button"
            onClick={() => onEdit?.(node)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onAddChild?.(node)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/50 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add inside
          </button>
        </>
      )}
    </div>
  ) : undefined;

  return (
    <BloomSurface
      kicker={ephemeral ? "answer" : kind}
      title={node.label}
      description={node.description}
      origin={origin}
      reducedMotion={reducedMotion}
      zIndex={30}
      size="lg"
      onClose={onClose}
      footer={footer}
    >
      {node.meta && node.meta.length > 0 && (
        <motion.dl
          className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3"
          variants={staggerChild}
          custom={reducedMotion}
        >
          {node.meta.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border/50 bg-foreground/[0.03] px-3.5 py-3"
            >
              <dt className="dot-label">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {item.value}
              </dd>
            </div>
          ))}
        </motion.dl>
      )}

      {paragraphs.length > 0 ? (
        <div className="space-y-4">
          {paragraphs.map((paragraph, index) => (
            <motion.p
              key={index}
              variants={staggerChild}
              custom={reducedMotion}
              className="text-[15px] leading-7 text-foreground/85 first:text-[17px] first:leading-8 first:text-foreground"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">
          {editing
            ? "No content yet. Use Edit to give this node substance."
            : "A quiet node, still finding its words."}
        </p>
      )}

      {!ephemeral && !editing && (
        <RelationExits
          reducedMotion={reducedMotion}
          exits={(node.children ?? []).map((child) => ({
            id: child.id,
            label: child.label,
            relation: child.relation,
          }))}
          onFollow={(id) => onFollowRelation?.(id)}
          onStop={onClose}
        />
      )}
    </BloomSurface>
  );
};

export default NodeStage;
