import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Layers,
  Link2,
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

function initialsOf(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
  <div className="relative mb-8 mt-4 flex items-center justify-center group">
    {/* The fingerprint ridges — quiet ground the identity rests on. */}
    <div className="absolute inset-0 flex items-center justify-center">
      <NucleusMark size={168} reducedMotion={reducedMotion} />
    </div>

    {/* One slow orbit — presence, not spectacle. */}
    {!reducedMotion && (
      <div
        className="absolute w-[150px] h-[150px] rounded-full border border-primary/15 border-t-primary/50"
        style={{ animation: "orbSpin 24s linear infinite" }}
      />
    )}

    {/* The Core Avatar / User Representation */}
    <div
      className="relative z-10 flex h-[96px] w-[96px] sm:h-[112px] sm:w-[112px] items-center justify-center rounded-full bg-background/70 backdrop-blur-md border border-border transition-transform duration-700 ease-out group-hover:scale-[1.02]"
      style={{ boxShadow: "var(--premium-shadow)" }}
    >
      {node.image ? (
        <img
          src={node.image}
          alt={node.label}
          className="absolute inset-[6px] h-[calc(100%-12px)] w-[calc(100%-12px)] rounded-full object-cover"
        />
      ) : (
        <span className="absolute font-serif text-4xl font-semibold tracking-wide text-foreground">
          {initialsOf(node.label)}
        </span>
      )}
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
  onActivate,
  onAddChild,
  onEdit,
  onRemove,
}) => {
  const isCenter = variant === "center";
  const drillable = hasChildren(node);
  const kind = node.kind ?? "attribute";

  if (isCenter) {
    return (
      <div className="pointer-events-none flex flex-col items-center text-center">
        <NucleusFace node={node} reducedMotion={reducedMotion} />
        <span className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {node.label}
        </span>
        {node.description && (
          <span className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {node.description}
          </span>
        )}
      </div>
    );
  }

  const dotSize = active ? 18 : 13;
  const ringSize = dotSize + 16;
  const outerRingSize = ringSize + 10;

  const kindGlyph = drillable ? (
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
        onClick={() => onActivate(node)}
        aria-label={
          node.description ? `${node.label} — ${node.description}` : node.label
        }
        className="flex flex-col items-center gap-2 outline-none"
        whileHover={reducedMotion ? undefined : { scale: 1.03 }}
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
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
        <span className="flex items-center gap-1.5 text-[15px] font-medium tracking-tight text-foreground transition-colors duration-300">
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
