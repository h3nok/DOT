import { useState } from "react";
import { ArrowRight, Shield, Palette, User, Box, LucideIcon } from "lucide-react";
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

const detailsContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.012,
      delayChildren: 0.05,
    },
  },
};

const detailsChar = {
  hidden: { opacity: 0, y: 3 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const gridContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function ArchitectureDiagram() {
  const [selectedId, setSelectedId] = useState<ArchitectureNode["id"]>("canvas");
  const selectedNode = NODES.find((n) => n.id === selectedId) ?? NODES[0];
  const SelectedIcon = selectedNode.icon;

  return (
    <motion.section
      id="architecture-diagram"
      aria-label="Interactive Architecture Diagram"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-20 text-center sm:px-10 border-t border-border/40"
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <span className="dot-label text-[color:var(--organism-accent-strong)]">
          Visual Model
        </span>
        <h3 className="mt-1 font-serif text-3xl font-normal text-foreground sm:text-4xl lg:text-5xl">
          Architecture of Experience
        </h3>
        <p className="dot-caption mt-2 text-base sm:text-lg">
          Select a layer to explore the loop
        </p>
      </div>

      {/* 4 Interactive Layer Cards with Stagger Reveal */}
      <motion.div
        variants={gridContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {NODES.map((node) => {
          const isSelected = node.id === selectedId;
          const IconComponent = node.icon;
          return (
            <motion.button
              key={node.id}
              type="button"
              variants={cardVariant}
              onClick={() => setSelectedId(node.id)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex flex-col items-center justify-between rounded-2xl p-6 text-center transition-all overflow-hidden border backdrop-blur-md ${
                isSelected
                  ? "border-[color:var(--organism-accent-strong)] bg-foreground/[0.04] shadow-md"
                  : "border-border/40 bg-transparent hover:border-border/70 hover:bg-foreground/[0.015]"
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="node-accent-bar"
                  className="absolute top-0 left-0 right-0 h-0.5 bg-[color:var(--organism-accent-strong)]"
                />
              )}
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center justify-center gap-2">
                  <span className={`dot-label ${isSelected ? "text-[color:var(--organism-accent-strong)] font-semibold" : ""}`}>
                    {node.num} · {node.level}
                  </span>
                </div>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      isSelected
                        ? "bg-[color:var(--organism-accent-strong)] text-background"
                        : "bg-foreground/[0.04] text-muted-foreground"
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <h4 className="font-serif text-xl font-medium text-foreground">
                    {node.title}
                  </h4>
                </div>
                <p className={`dot-label mt-1.5 ${isSelected ? "text-[color:var(--organism-accent-strong)] font-semibold" : ""}`}>
                  {node.role}
                </p>
              </div>
              <p className="dot-caption mt-4 text-xs leading-relaxed text-foreground/80">
                {node.description}
              </p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Detailed Breakdown with Typewriter Reveal */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="mt-10 rounded-2xl p-8 sm:p-12 border border-[color:var(--organism-accent-soft)] bg-foreground/[0.015] backdrop-blur-md text-center max-w-6xl mx-auto w-full"
        >
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--organism-accent-soft)] bg-foreground/[0.03] px-4 py-1.5 text-foreground">
              <SelectedIcon className="h-4 w-4 text-[color:var(--organism-accent-strong)]" />
              <span className="dot-label text-foreground font-semibold">
                {selectedNode.title} · {selectedNode.role}
              </span>
            </span>
          </div>

          <motion.p
            variants={detailsContainer}
            initial="hidden"
            animate="visible"
            className="mt-6 text-balance text-xl leading-relaxed text-foreground/90 sm:text-2xl lg:text-3xl font-light max-w-5xl mx-auto"
          >
            {selectedNode.details.split("").map((char, index) => (
              <motion.span key={`${char}-${index}`} variants={detailsChar}>
                {char}
              </motion.span>
            ))}
          </motion.p>

          {/* The Circuit loop summary */}
          <div className="mt-8 border-t border-border/30 pt-6">
            <p className="dot-label text-[color:var(--organism-accent-strong)]">
              The Recursive Feedback Circuit
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {NODES.map((node, i) => (
                <div key={node.id} className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`rounded-full px-4 py-1.5 font-mono text-xs transition-all ${
                      node.id === selectedId
                        ? "bg-[color:var(--organism-accent-strong)] text-background font-semibold shadow-xs"
                        : "border border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {i + 1}. {node.title}
                  </motion.button>
                  {i < NODES.length - 1 && (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}

export default ArchitectureDiagram;
