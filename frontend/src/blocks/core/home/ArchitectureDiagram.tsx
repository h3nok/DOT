import { useState, useEffect, useRef, type CSSProperties } from "react";
import {
  ArrowDown,
  Box,
  Palette,
  RotateCcw,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { NucleusMark } from "../../../dot";

export interface NodeItem {
  id: "stream" | "painting" | "intent" | "return";
  num: "01" | "02" | "03" | "04";
  title: string;
  role: string;
  shortDesc: string;
  scope: string;
  statement: string;
  nextFlow: string;
  icon: LucideIcon;
  cx: number;
  cy: number;
}

export interface EdgeItem {
  id: string;
  from: NodeItem["id"];
  to: NodeItem["id"];
  label: string;
  sublabel: string;
  pathD: string;
  badgeX: number;
  badgeY: number;
}

const NODES: NodeItem[] = [
  {
    id: "stream",
    num: "01",
    title: "Reality Stream",
    role: "Presents",
    shortDesc: "Presents current state",
    scope: "Frame Output",
    statement:
      "RF₀ presents a time-ordered Reality Stream. The Frame's generator and rules structure what can occur without requiring moment-to-moment supervision by Big C.",
    nextFlow: "The arriving state meets the conditioned Painting (02)",
    icon: Box,
    cx: 175,
    cy: 125,
  },
  {
    id: "painting",
    num: "02",
    title: "The Painting",
    role: "Perceives",
    shortDesc: "Memory shapes meaning",
    scope: "Internal Filter",
    statement:
      "The Painting interprets — inherited associations and learned predictions color reality before conscious thought.",
    nextFlow: "Structures the available decision space for Character (03)",
    icon: Palette,
    cx: 545,
    cy: 125,
  },
  {
    id: "intent",
    num: "03",
    title: "Intent & Character",
    role: "Commits",
    shortDesc: "Intent becomes action",
    scope: "Expressed Agency",
    statement:
      "Little c interrupts automatic reaction, forms Intent, and expresses it through the body. That embodied choice then enters RF₀, where the Frame's causal rules return consequence.",
    nextFlow: "The Frame returns consequence and updates the Canvas (04)",
    icon: User,
    cx: 545,
    cy: 375,
  },
  {
    id: "return",
    num: "04",
    title: "Consequence & Canvas",
    role: "Updates",
    shortDesc: "Rules update Canvas",
    scope: "Frame Return",
    statement:
      "Consequence is built into RF₀'s causal structure. The body reports it, Little c experiences it, and the Canvas carries the resulting update.",
    nextFlow: "The updated Canvas shapes the next encounter with RF₀ (01)",
    icon: Shield,
    cx: 175,
    cy: 375,
  },
];

const EDGES: EdgeItem[] = [
  {
    id: "stream-to-painting",
    from: "stream",
    to: "painting",
    label: "Interpret State",
    sublabel: "Frame state meets memory",
    pathD: "M 245 125 L 475 125",
    badgeX: 360,
    badgeY: 108,
  },
  {
    id: "painting-to-intent",
    from: "painting",
    to: "intent",
    label: "Form Intent",
    sublabel: "Intent commits choice",
    pathD: "M 545 195 L 545 305",
    badgeX: 603,
    badgeY: 250,
  },
  {
    id: "intent-to-return",
    from: "intent",
    to: "return",
    label: "Apply Consequence",
    sublabel: "Intent enters the Frame",
    pathD: "M 475 375 L 245 375",
    badgeX: 360,
    badgeY: 392,
  },
  {
    id: "return-to-stream",
    from: "return",
    to: "stream",
    label: "Update State",
    sublabel: "Consequence changes the start",
    pathD: "M 175 305 L 175 195",
    badgeX: 117,
    badgeY: 250,
  },
];

const RESIDUAL_LINKS: Array<{ id: NodeItem["id"]; pathD: string }> = [
  { id: "stream", pathD: "M 236 157 L 325 224" },
  { id: "painting", pathD: "M 484 157 L 395 224" },
  { id: "intent", pathD: "M 484 343 L 395 276" },
  { id: "return", pathD: "M 236 343 L 325 276" },
];

const FLOW_LABELS = [
  "State enters interpretation",
  "Painting opens options",
  "Intent meets Frame rules",
  "Canvas updates the next state",
] as const;

export function ArchitectureDiagram() {
  const [selectedNodeId, setSelectedNodeId] = useState<NodeItem["id"]>("stream");
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const reducedMotion = useReducedMotion();
  const autoPlayTimer = useRef<number | null>(null);

  const activeNode = NODES.find((n) => n.id === selectedNodeId) ?? NODES[0];
  const activeIndex = NODES.findIndex((n) => n.id === selectedNodeId);

  // Demonstrate one complete pass, then settle for reading.
  useEffect(() => {
    if (!isPlaying || reducedMotion) {
      if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
      return;
    }

    if (activeIndex >= NODES.length - 1) {
      setIsPlaying(false);
      return;
    }

    autoPlayTimer.current = window.setTimeout(() => {
      setSelectedNodeId(NODES[activeIndex + 1].id);
    }, 4500);

    return () => {
      if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
    };
  }, [activeIndex, isPlaying, reducedMotion]);

  const selectNode = (id: NodeItem["id"]) => {
    setHasInteracted(true);
    setSelectedNodeId(id);
    setIsPlaying(false);
  };

  const pauseAutomation = () => {
    setIsPlaying(false);
  };

  return (
    <motion.section
      id="architecture-diagram"
      aria-label="Architecture of Experience"
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: reducedMotion ? 0 : 0.45 }}
      onViewportEnter={() => {
        setHasEntered(true);
        if (!reducedMotion && !hasInteracted && activeIndex === 0) setIsPlaying(true);
      }}
      className="home-environment home-architecture-environment scroll-mt-24"
    >
      <div className="dot-page-container dot-page-wide">
        {/* ── Section Header ────────────────────────────────────────── */}
        <div className="home-section-heading-row">
          <div>
            <span className="dot-label">Frame development · State-machine hypothesis</span>
            <h2 className="dot-page-heading mt-3 text-balance">
              Big C develops the Frame. RF₀ carries the loop.
            </h2>
          </div>
          <p className="dot-lede max-w-lg">
            DOT proposes that Big C works upstream—shaping RF₀'s generator,
            transition rules, consequences, feedback, and Canvas-update
            mechanisms. Little c then experiences and acts within those
            conditions.
          </p>
        </div>

        {/* ── Inline Directed Graph ─────────────────────────────────── */}
        <div
          className={`arch-standalone-card mt-12 ${
            hasEntered || reducedMotion ? "is-entered" : ""
          }`}
          onPointerDown={pauseAutomation}
          onFocusCapture={pauseAutomation}
        >
          <div className="arch-mobile-loop" aria-label="Experience loop stages">
            <div className="arch-mobile-observer">
              <NucleusMark size={42} thinking={isPlaying} />
              <span>
                <strong>Little c</strong>
                Experiencing observer
              </span>
            </div>

            {NODES.map((node, index) => {
              const Icon = node.icon;
              const isActive = node.id === selectedNodeId;
              return (
                <div
                  className="arch-mobile-step"
                  key={node.id}
                  style={
                    {
                      "--arch-step-delay": `${index * 620}ms`,
                    } as CSSProperties
                  }
                >
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => selectNode(node.id)}
                    className={`arch-mobile-node ${isActive ? "is-active" : ""}`}
                  >
                    <span className="arch-mobile-node-number">
                      Step {node.num}
                    </span>
                    <span className="arch-mobile-node-copy">
                      <strong>{node.title}</strong>
                      <small>{node.shortDesc}</small>
                    </span>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {isActive && hasInteracted ? (
                    <div className="arch-mobile-detail">
                      <span>{node.role}</span>
                      <p>{node.statement}</p>
                    </div>
                  ) : null}
                  <div className="arch-mobile-edge" aria-hidden="true">
                    <span>{FLOW_LABELS[index]}</span>
                    {index === NODES.length - 1 ? (
                      <RotateCcw className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SVG Diagram Area */}
          <div className="arch-svg-viewport">
            <svg
              viewBox="0 0 720 500"
              className="arch-svg"
              aria-label="Four-state RF₀ automaton with residual links toward Little c"
            >
              <defs>
                <linearGradient id="arch-node-surface" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0"
                    stopColor="color-mix(in oklch, var(--background) 88%, white)"
                  />
                  <stop offset="0.52" stopColor="var(--background)" />
                  <stop
                    offset="1"
                    stopColor="color-mix(in oklch, var(--background) 94%, var(--foreground))"
                  />
                </linearGradient>
                <linearGradient
                  id="arch-node-surface-active"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0"
                    stopColor="color-mix(in oklch, var(--background) 76%, white)"
                  />
                  <stop
                    offset="0.48"
                    stopColor="color-mix(in oklch, var(--background) 89%, var(--organism-accent-soft))"
                  />
                  <stop
                    offset="1"
                    stopColor="color-mix(in oklch, var(--background) 82%, var(--organism-accent-soft))"
                  />
                </linearGradient>
                <marker
                  id="arrow-head-loop"
                  markerWidth="10"
                  markerHeight="10"
                  refX="7"
                  refY="5"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path
                    d="M 1 1 L 7 5 L 1 9"
                    fill="none"
                    stroke="color-mix(in oklch, var(--organism-accent-strong) 44%, var(--muted-foreground))"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.78"
                  />
                </marker>
                <marker
                  id="arrow-head-feedback"
                  markerWidth="7"
                  markerHeight="7"
                  refX="5.5"
                  refY="3.5"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path
                    d="M 1 1 L 5.5 3.5 L 1 6"
                    fill="none"
                    stroke="var(--muted-foreground)"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </marker>
                <marker
                  id="arrow-head-feedback-active"
                  markerWidth="7"
                  markerHeight="7"
                  refX="5.5"
                  refY="3.5"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path
                    d="M 1 1 L 5.5 3.5 L 1 6"
                    fill="none"
                    stroke="var(--organism-accent-strong)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </marker>
              </defs>

              {/* ── RF₀ generator and causal rule boundary ─────────────── */}
              <g className="arch-reality-frame" aria-hidden="true">
                <rect
                  x="12"
                  y="12"
                  width="696"
                  height="476"
                  rx="22"
                  fill="none"
                  stroke="var(--organism-accent-soft)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                  opacity="0.35"
                />

                <text x="26" y="34" className="arch-svg-field-label">
                  RF₀ · experiential state machine
                </text>
                <text
                  x="694"
                  y="34"
                  textAnchor="end"
                  className="arch-svg-field-label arch-svg-field-label--hypothesis"
                >
                  Frame-development model · hypothesis
                </text>

                {/* Quiet guides keep the automaton geometrically legible. */}
                <circle cx="360" cy="250" r="142" fill="none" stroke="var(--border)" strokeDasharray="3 6" opacity="0.28" />
                <circle cx="360" cy="250" r="72" fill="none" stroke="var(--border)" strokeWidth="0.75" opacity="0.24" />
              </g>

              {/* Residual links: every state reports inward to the observer. */}
              <g className="arch-residual-group" aria-hidden="true">
                {RESIDUAL_LINKS.map((link, index) => {
                  const isActive = link.id === selectedNodeId;
                  return (
                    <g
                      key={link.id}
                      className="arch-residual-step"
                      style={
                        {
                          "--arch-step-delay": `${index * 620}ms`,
                        } as CSSProperties
                      }
                    >
                      <path
                        d={link.pathD}
                        pathLength="1"
                        className={`arch-residual-link ${isActive ? "is-active" : ""} ${
                          isActive && isPlaying ? "is-flowing" : ""
                        }`}
                        markerEnd={
                          isActive
                            ? "url(#arrow-head-feedback-active)"
                            : "url(#arrow-head-feedback)"
                        }
                      />
                    </g>
                  );
                })}
              </g>

              {/* ── Central Experiencing Observer: Little c ───────────── */}
              <g className="arch-center-nexus" transform="translate(360, 250)">
                {/* Soft glow halo */}
                <circle
                  r="44"
                  fill="color-mix(in oklch, var(--background) 90%, var(--organism-accent-soft))"
                  stroke="var(--organism-accent-soft)"
                  strokeWidth="1.2"
                />
                <circle r="36" fill="none" stroke="var(--organism-accent-strong)" strokeDasharray="3 3" opacity="0.7" />

                <foreignObject x="-26" y="-26" width="52" height="52">
                  <div className="flex h-full w-full items-center justify-center">
                    <NucleusMark size={44} thinking={isPlaying} />
                  </div>
                </foreignObject>

                {/* Observer Labels */}
                <text y="58" textAnchor="middle" className="arch-svg-little-c-title">
                  Little c
                </text>
                <text y="70" textAnchor="middle" className="arch-svg-little-c-sub">
                  Experiencing Observer
                </text>
              </g>

              {/* ── Directed Interaction Edges (Causal Flows) ─────────── */}
              {EDGES.map((edge, index) => {
                const isActive = edge.from === selectedNodeId;
                return (
                  <g
                    key={edge.id}
                    className="arch-edge-group"
                    style={
                      {
                        "--arch-step-delay": `${index * 620}ms`,
                      } as CSSProperties
                    }
                  >
                    <path
                      d={edge.pathD}
                      pathLength="1"
                      fill="none"
                      className="arch-loop-path"
                      markerEnd="url(#arrow-head-loop)"
                    />

                    {isActive && isPlaying && !reducedMotion ? (
                      <path
                        d={edge.pathD}
                        pathLength="1"
                        className="arch-loop-flow"
                        aria-hidden="true"
                      />
                    ) : null}

                    <text
                      x={edge.badgeX}
                      y={edge.badgeY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="arch-edge-label"
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}

              {/* ── Graph Node Cards ──────────────────────────────────── */}
              {NODES.map((node, index) => {
                const isActive = node.id === selectedNodeId;
                const Icon = node.icon;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.cx}, ${node.cy})`}
                    onClick={() => selectNode(node.id)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isActive}
                    aria-label={`${node.num} ${node.title} — ${node.role}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectNode(node.id);
                      }
                    }}
                    className={`arch-node-group ${isActive ? "is-active" : ""}`}
                    style={
                      {
                        "--arch-step-delay": `${index * 620}ms`,
                      } as CSSProperties
                    }
                  >
                    {/* Circular state: every stage is one DOT in the automaton. */}
                    <circle
                      cy="6"
                      r="67"
                      className="arch-node-depth-plane"
                    />
                    <circle
                      r="67"
                      fill={
                        isActive
                          ? "url(#arch-node-surface-active)"
                          : "url(#arch-node-surface)"
                      }
                      stroke={
                        isActive
                          ? "color-mix(in oklch, var(--organism-accent-strong) 76%, var(--border))"
                          : "var(--border)"
                      }
                      strokeWidth={isActive ? "1.6" : "1"}
                      className="arch-node-card-bg"
                    />

                    {/* HTML Content Overlay within SVG */}
                    <foreignObject x="-52" y="-52" width="104" height="104">
                      <div className="flex h-full w-full select-none flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1.5 font-mono text-[0.48rem] font-semibold uppercase tracking-[0.08em] text-[color:var(--organism-accent-strong)]">
                          <span>Step {node.num}</span>
                          <Icon className="h-2.5 w-2.5 opacity-70" aria-hidden="true" />
                        </div>
                        <span className="mt-1 font-mono text-[0.4rem] uppercase tracking-[0.09em] text-[color:var(--muted-foreground)]">
                          {node.scope}
                        </span>
                        <strong className="mt-1.5 max-w-[6rem] font-serif text-[0.78rem] font-medium leading-[1.08] text-[color:var(--foreground)]">
                          {node.title}
                        </strong>
                        <small className="mt-1 max-w-[5.6rem] font-mono text-[0.38rem] uppercase leading-[1.2] tracking-[0.035em] text-[color:var(--muted-foreground)]">
                          {node.shortDesc}
                        </small>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Focused stage plate */}
          <div className="arch-bottom-panel">
            <div className="arch-bottom-stage">
              <span className="arch-bottom-number">{activeNode.num}</span>
              <strong>{activeNode.title}</strong>
              <span className="arch-bottom-role">{activeNode.role}</span>
            </div>

            <div className="arch-bottom-copy">
              <p className="arch-bottom-statement">{activeNode.statement}</p>
              <div className="arch-bottom-next">
                <RotateCcw className="h-3 w-3 text-[color:var(--organism-accent-strong)]" />
                <span>{activeNode.nextFlow}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default ArchitectureDiagram;
