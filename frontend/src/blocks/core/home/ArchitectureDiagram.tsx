import { useState } from "react";
import {
  ArrowRight,
  Box,
  Palette,
  RotateCcw,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
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
    description: "Awareness receives a present state before it decides what that state means.",
    level: "Model",
    details:
      "DOT calls the local point of experience Little c and the state it carries the Canvas. Big C remains a hypothesis; the immediate claim is simply that experience has a situated point of view.",
    icon: Shield,
  },
  {
    id: "painting",
    num: "02",
    title: "The Painting",
    role: "Perceives",
    description: "Inherited expectations interpret what the present appears to mean.",
    level: "Observation",
    details:
      "The Painting names conditioning in operation: prior learning, identity, emotion, and expectation shaping what becomes salient before deliberate choice begins.",
    icon: Palette,
  },
  {
    id: "character",
    num: "03",
    title: "Character",
    role: "Acts",
    description: "Interpretation becomes response, habit, or a more deliberate act.",
    level: "Model",
    details:
      "Character is the enacted pattern. DOT reserves the word for what you repeatedly do, including the moments when Intent widens the response beyond automatic reaction.",
    icon: User,
  },
  {
    id: "frame",
    num: "04",
    title: "Reality Frame",
    role: "Environment",
    description: "Action meets a world with limits, consequences, and other lives.",
    level: "Model",
    details:
      "The Reality Frame is not whatever the mind prefers. It is the environment that answers action with consequence; that feedback can revise the next Canvas and Painting.",
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
      className="scroll-mt-24 border-t border-border/40 py-16 dot-page-container"
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="dot-label">The core model</span>
        <h2 className="dot-page-heading mt-2">Experience becomes action, then feedback.</h2>
        <p className="dot-lede mx-auto mt-4 max-w-xl text-balance">
          A present state is interpreted, enacted, and answered by consequence.
          What happens next becomes part of the next state.
        </p>
      </div>

      {/* ── Circuit selector ─────────────────────────────────────────── */}
      <div className="mx-auto mt-10 max-w-3xl">
        <p className="dot-label text-center">Select a stage</p>
        <ol className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border/50 bg-border/50 sm:grid-cols-4">
          {NODES.map((node, i) => {
            const isSelected = node.id === selectedId;
            const IconComponent = node.icon;
            return (
              <li key={node.id} className="relative bg-background">
                <button
                  type="button"
                  onClick={() => setSelectedId(node.id)}
                  aria-pressed={isSelected}
                  className={`flex min-h-[4.5rem] w-full flex-col items-start justify-between gap-2 px-4 py-3 text-left transition-colors sm:min-h-24 sm:gap-3 sm:py-4 ${
                    isSelected
                      ? "bg-foreground/[0.065] text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                  }`}
                >
                  <span className="flex w-full items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em]">
                      {node.num}
                    </span>
                    <IconComponent
                      className={`h-4 w-4 ${isSelected ? "text-[color:var(--organism-accent-strong)]" : ""}`}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-sm font-semibold leading-tight">{node.title}</span>
                </button>
                {i < NODES.length - 1 ? (
                  <ArrowRight
                    className="absolute -right-2 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 bg-background text-muted-foreground sm:block"
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
        <p className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Consequence informs the next state
        </p>
      </div>

      {/* ── Detail panel ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mx-auto mt-6 grid max-w-3xl gap-5 border-y border-[color:var(--organism-accent-soft)] py-7 text-left sm:grid-cols-[12rem_1fr] sm:items-start"
        >
          <div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--organism-accent-strong)] text-background">
              <SelectedIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <p className="dot-label mt-4">
              {selectedNode.role} · {selectedNode.level}
            </p>
          </div>
          <div>
            <h3 className="dot-section-heading">{selectedNode.title}</h3>
            <p className="dot-lede mt-3">{selectedNode.description}</p>
            <p className="dot-caption mt-3 max-w-xl">{selectedNode.details}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}

export default ArchitectureDiagram;
