import { useState } from "react";
import { Shield, Palette, User, Box, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ArchitectureNode {
  id: "canvas" | "painting" | "character" | "frame";
  num: "01" | "02" | "03" | "04";
  title: string;
  role: string;
  description: string;
  level: "Observation" | "Model";
  details: string;
  icon: LucideIcon;
}

const NODES: ArchitectureNode[] = [
  {
    id: "canvas",
    num: "01",
    title: "Little c & Canvas",
    role: "Holds Awareness",
    description: "The localized experiencing center (Little c) and quiet field of state.",
    level: "Model",
    details:
      "Little c is the localized center of awareness tied to Big C. It holds the Canvas—the raw, self-preserving field of awareness carrying the felt weight of everything you encounter.",
    icon: Shield,
  },
  {
    id: "painting",
    num: "02",
    title: "The Painting",
    role: "Perceives",
    description: "Inherited lenses, feelings, and habits coloring the present.",
    level: "Observation",
    details:
      "You were shaped by your environment. Yet Little c still chooses within its available decision space through automatic reactions and intentional focus.",
    icon: Palette,
  },
  {
    id: "character",
    num: "03",
    title: "Character",
    role: "Acts",
    description: "Who you choose to be when stepping out of habit.",
    level: "Model",
    details:
      "Active agency—intentional choice by Little c stepping out of automatic reaction into direct action.",
    icon: User,
  },
  {
    id: "frame",
    num: "04",
    title: "Reality Frame",
    role: "Environment",
    description: "The rule-bound arena where action meets consequence.",
    level: "Model",
    details:
      "An immersive environment providing the hard friction needed for Big C and Little c to reflect, learn, and adapt.",
    icon: Box,
  },
];

export function ArchitectureDiagram() {
  const [selectedId, setSelectedId] = useState<ArchitectureNode["id"]>("canvas");
  const selectedNode = NODES.find((n) => n.id === selectedId) ?? NODES[0];
  const SelectedIcon = selectedNode.icon;

  return (
    <motion.section
      id="architecture-diagram"
      aria-label="Architecture of Experience"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="scroll-mt-24 border-t border-border/40 py-20 dot-page-container"
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="dot-label text-[color:var(--organism-accent-strong)]">
          Visual Model
        </span>
        <h3 className="dot-page-heading mt-2">
          Architecture of Experience
        </h3>
        <p className="dot-caption mt-3">
          Four layers form a recursive loop. Each one feeds the next.
        </p>
      </div>

      {/* ── Circuit selector ─────────────────────────────────────────── */}
      <div className="mx-auto mt-10 max-w-2xl text-center">
        <p className="dot-label">The Recursive Feedback Circuit</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {NODES.map((node, i) => {
            const isSelected = node.id === selectedId;
            const IconComponent = node.icon;
            return (
              <div key={node.id} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedId(node.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[11px] transition-all ${
                    isSelected
                      ? "bg-[color:var(--organism-accent-strong)] text-background font-semibold"
                      : "border border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <IconComponent className="h-3 w-3" />
                  {node.title}
                </button>
                {i < NODES.length - 1 && (
                  <span className="text-muted-foreground/30" aria-hidden="true">→</span>
                )}
              </div>
            );
          })}
          <span className="text-muted-foreground/30" aria-hidden="true">↩</span>
        </div>
      </div>

      {/* ── Detail panel ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mx-auto mt-6 max-w-2xl rounded-lg border border-[color:var(--organism-accent-soft)] bg-foreground/[0.015] p-6 text-center sm:p-8"
        >
          <div className="inline-flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--organism-accent-strong)] text-background">
              <SelectedIcon className="h-3.5 w-3.5" />
            </div>
            <span className="dot-section-heading">
              {selectedNode.title}
            </span>
          </div>

          <p className="dot-label mt-2">
            {selectedNode.role} · {selectedNode.level}
          </p>

          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-foreground/85 sm:text-base" style={{ fontFamily: "var(--font-serif)" }}>
            {selectedNode.description}
          </p>

          <p className="dot-caption mx-auto mt-3 max-w-lg">
            {selectedNode.details}
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}

export default ArchitectureDiagram;
