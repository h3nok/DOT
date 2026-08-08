import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Layers,
  Link2,
  Map,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { hasChildren, type DotNode } from "./types";
import { NucleusMark } from "./NucleusMark";

interface GraphNodeProps {
  node: DotNode;
  variant: "center" | "leaf";
  active?: boolean;
  reducedMotion: boolean;
  editing?: boolean;
  /**
   * Set the centre's one-line essence as the book's thesis rather than as
   * metadata. Only true at the root of the field: at depth the essence is a
   * short label ("Steward") that would read absurdly at display size.
   */
  thesis?: boolean;
  onActivate: (node: DotNode) => void;
  onAddChild?: (node: DotNode) => void;
  onEdit?: (node: DotNode) => void;
  onRemove?: (node: DotNode) => void;
}

const IconButton: React.FC<{
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, danger, children }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    className={cn(
      "inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-background/70 backdrop-blur-md transition-colors [&_svg]:pointer-events-none",
      danger
        ? "text-muted-foreground hover:border-destructive/50 hover:text-destructive"
        : "text-muted-foreground hover:border-[color:var(--organism-accent-soft)] hover:text-foreground",
    )}
  >
    {children}
  </button>
);

/**
 * NucleusFace — the identity at the centre of the graph.
 *
 * The fingerprint mark is always present (this place is held by someone). When
 * the Self node carries a portrait, it sits inside the fingerprint like a face
 * framed by its own whorl; otherwise the bare fingerprint stands, with initials
 * resting at its core. Either way the centre breathes on the organism heartbeat.
 */
const NucleusFace: React.FC<{ node: DotNode; reducedMotion: boolean }> = ({
  node,
  reducedMotion,
}) => (
  <div className="relative mb-7 mt-4 flex items-center justify-center">
    <div
      data-nucleus-core
      className="relative flex h-36 w-36 items-center justify-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
    >
      <NucleusMark size={144} reducedMotion={reducedMotion} />
      {node.image ? (
        <img
          src={node.image}
          alt={node.label}
          className="absolute h-20 w-20 rounded-full border border-border object-cover"
        />
      ) : null}
    </div>
  </div>
);

/**
 * One cell of the graph.
 *
 * The centre is the nucleus — the living fingerprint identity. Leaves are the
 * attribute dots: each carries a kind affordance (drillable, page link,
 * external arrow), brightens on hover, and — in edit mode — exposes inline
 * controls to add a child, edit, or remove it. Colour, glow, and orbit all read
 * from the organism accent variables, so the whole graph is alive and on-theme
 * with zero per-frame work of its own.
 */
export const GraphNode: React.FC<GraphNodeProps> = ({
  node,
  variant,
  active = false,
  reducedMotion,
  editing = false,
  thesis = false,
  onActivate,
  onAddChild,
  onEdit,
  onRemove,
}) => {
  const isCenter = variant === "center";
  const drillable = hasChildren(node);
  const kind = node.kind ?? "attribute";
  const comingSoon = node.planned === true;
  const pageDestination = kind === "page" && Boolean(node.href) && !comingSoon;

  if (isCenter) {
    return (
      <button
        type="button"
        onClick={() => onActivate(node)}
        aria-label={
          editing
            ? `Open ${node.label}`
            : `Consult ${node.label}'s grounded knowledge`
        }
        className="group flex flex-col items-center text-center outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--organism-accent-strong)] focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <NucleusFace node={node} reducedMotion={reducedMotion} />
        <span className="max-w-[min(82vw,32rem)] text-balance font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          {node.label}
        </span>
        {node.description &&
          (thesis ? (
            // The thesis, set in the book's voice. Letterspaced uppercase mono
            // is the register this product uses for word counts and edition
            // labels; the sentence the whole framework turns on should not
            // arrive looking like metadata.
            <span className="mt-3 max-w-[min(88vw,34rem)] text-balance font-serif text-lg italic leading-snug text-muted-foreground sm:text-xl">
              {node.description}
            </span>
          ) : (
            <span className="mt-2 font-mono text-[11px] uppercase text-muted-foreground">
              {node.description}
            </span>
          ))}
      </button>
    );
  }

  if (pageDestination && !editing) {
    const DestinationIcon = node.id === "theory" ? Map : NotebookPen;

    return (
      <motion.button
        type="button"
        onClick={() => onActivate(node)}
        aria-label={
          node.description ? `${node.label} — ${node.description}` : node.label
        }
        className="dot-graph-destination group flex min-h-[5.5rem] w-[min(42vw,13rem)] items-center gap-3 rounded-md border px-3.5 py-3 text-left outline-none"
        whileTap={reducedMotion ? undefined : { scale: 0.99 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <span className="dot-graph-destination-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <DestinationIcon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">
            {node.label}
          </span>
          {node.description && (
            <span className="mt-1 hidden text-[11px] leading-snug text-muted-foreground sm:line-clamp-2">
              {node.description}
            </span>
          )}
        </span>
        <ArrowRight
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          aria-hidden="true"
        />
      </motion.button>
    );
  }

  const dotSize = active ? 18 : 13;
  const ringSize = dotSize + 16;
  const outerRingSize = ringSize + 10;

  const kindGlyph = comingSoon ? (
    <Clock3 className="h-3 w-3" />
  ) : drillable ? (
    <Layers className="h-3 w-3" />
  ) : kind === "page" ? (
    <Link2 className="h-3 w-3" />
  ) : kind === "external" ? (
    <ArrowUpRight className="h-3 w-3" />
  ) : null;

  return (
    <div className="group flex select-none flex-col items-center gap-2">
      <motion.button
        type="button"
        disabled={comingSoon && !editing}
        onClick={() => onActivate(node)}
        aria-label={
          node.description ? `${node.label} — ${node.description}` : node.label
        }
        className={cn(
          "flex flex-col items-center gap-2 outline-none",
          comingSoon && !editing && "cursor-default opacity-55",
        )}
        whileHover={reducedMotion || comingSoon ? undefined : { scale: 1.03 }}
        whileTap={reducedMotion || comingSoon ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <span
          className="relative flex items-center justify-center"
          style={{ width: outerRingSize, height: outerRingSize }}
        >
          {/* Quiet base ring — hairline, brightens on hover/selection. */}
          <span
            className={cn(
              "absolute rounded-full border bg-background/60 transition-colors duration-300",
              active
                ? "border-primary"
                : comingSoon
                  ? "border-border/40"
                  : "border-border/50 group-hover:border-primary/50",
            )}
            style={{ width: outerRingSize, height: outerRingSize }}
          />

          {/* Drillable dashed indicator */}
          {drillable && (
            <span
              className={cn(
                "absolute rounded-full border border-dashed border-primary/40 opacity-70 transition-opacity duration-500",
                !reducedMotion && "node-halo-drillable"
              )}
              style={{ width: ringSize, height: ringSize }}
            />
          )}

          {/* External gap tick */}
          {kind === "external" && !drillable && (
            <svg
              className="absolute opacity-60"
              width={ringSize}
              height={ringSize}
              viewBox={`0 0 ${ringSize} ${ringSize}`}
              fill="none"
            >
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={(ringSize - 2) / 2}
                stroke="var(--organism-accent-soft)"
                strokeWidth={1.5}
                strokeDasharray={`${(Math.PI * (ringSize - 2)) * 0.8} ${(Math.PI * (ringSize - 2)) * 0.2}`}
                strokeLinecap="round"
              />
            </svg>
          )}

          {/* The core dot — one idea, flat and legible. */}
          <span
            className="block rounded-full transition-all duration-300 relative z-10"
            style={{
              width: dotSize,
              height: dotSize,
              background: "var(--primary)",
              boxShadow:
                "0 0 calc(2px + var(--organism-glow, 0px)) var(--organism-accent-soft)",
            }}
          />
        </span>
        <span className="flex items-center gap-1.5 text-[15px] font-medium text-foreground transition-colors duration-300">
          {node.label}
          {kindGlyph && (
            <span className="text-muted-foreground" aria-hidden="true">
              {kindGlyph}
            </span>
          )}
        </span>
      </motion.button>

      {/* Inline edit controls — add a child to this node, edit it, remove it. */}
      {editing && (
        <div className="flex items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
          <IconButton
            label={`Add a node to ${node.label}`}
            onClick={() => onAddChild?.(node)}
          >
            <Plus className="h-3 w-3" />
          </IconButton>
          <IconButton
            label={`Edit ${node.label}`}
            onClick={() => onEdit?.(node)}
          >
            <Pencil className="h-3 w-3" />
          </IconButton>
          <IconButton
            label={`Remove ${node.label}`}
            danger
            onClick={() => onRemove?.(node)}
          >
            <Trash2 className="h-3 w-3" />
          </IconButton>
        </div>
      )}
    </div>
  );
};
