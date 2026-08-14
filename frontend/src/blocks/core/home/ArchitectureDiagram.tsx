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
      className="home-environment home-architecture-environment scroll-mt-24"
    >
      <div className="dot-page-container dot-page-wide">
        <div className="home-section-heading-row">
          <div>
            <span className="dot-label">Architecture of Experience · Model</span>
            <h2 className="dot-page-heading mt-3 text-balance">
              Experience becomes a feedback loop.
            </h2>
          </div>
          <p className="dot-lede max-w-lg">
            State is interpreted, interpretation shapes action, and consequence
            returns as the next state. Select a stage to examine its role.
          </p>
        </div>

        {/* ── Circuit selector ─────────────────────────────────────────── */}
        <div className="home-architecture-track mt-12">
          {NODES.map((node) => {
            const isSelected = node.id === selectedId;
            const IconComponent = node.icon;
            return (
              <button
                key={node.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedId(node.id)}
                className="home-architecture-node"
              >
                <span className="home-architecture-node-heading">
                  <span className="home-architecture-node-number">{node.num}</span>
                  <span className="home-architecture-node-icon">
                    <IconComponent className="h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
                <span className="home-architecture-node-title">{node.title}</span>
                <span className="home-architecture-node-role">{node.role}</span>
                <span className="home-architecture-node-flow" aria-hidden="true">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>

        <p className="home-architecture-return-path">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Consequence becomes the next state
        </p>

        {/* ── Detail panel ───────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedNode.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="home-architecture-detail"
          >
            <div className="home-architecture-detail-heading">
              <span className="home-architecture-detail-icon">
                <SelectedIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="dot-label">
                  {selectedNode.level} · {selectedNode.role}
                </p>
                <h3 className="dot-section-heading mt-2">{selectedNode.title}</h3>
              </div>
            </div>
            <div className="home-architecture-detail-copy">
              <p className="home-architecture-detail-summary">
                {selectedNode.description}
              </p>
              <p className="home-architecture-detail-body">{selectedNode.details}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

export default ArchitectureDiagram;
