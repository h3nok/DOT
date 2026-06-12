import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Cpu,
  RefreshCw,
  Compass,
  BookOpen,
  Mail,
  User,
  Layers3,
  ChevronRight,
  Camera,
} from "lucide-react";
import { NodeState } from "./graph/graphModel";
import { Button } from "../../../shared/components/ui/button";
import ModernThemeToggle from "../../../shared/components/ui/ModernThemeToggle";
import { StayLogo } from "../../../shared/components/ui/StayLogo";
import {
  NeuralNode,
  NeuralLink,
  PremiumTitle,
  PremiumText,
  OrbitalTracks,
} from "../../../shared/components/ui/design-system-primitives";
import { AquaticBackground } from "../../../shared/components/ui/aquatic-background";

// =========================================================================
// PREMIUM CUSTOM COGNITION COMPONENTS FOR OCTOPUS HEAD THEMES
// =========================================================================

// Option A: Live Telemetry Double Sine-Wave Analyzer
const LiveWaveform: React.FC<{ active: boolean; color: string }> = ({ active, color }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let frameId: number;
    const tick = () => {
      setPhase((p) => p + (active ? 0.16 : 0.05));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active]);

  const path1 = useMemo(() => {
    const points = [];
    const width = 160;
    const height = 18;
    const freq = active ? 0.08 : 0.04;
    const amp = active ? 5.5 : 3;
    for (let x = 0; x <= width; x += 4) {
      const y = Math.sin(x * freq + phase) * amp + height / 2;
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')}`;
  }, [phase, active]);

  const path2 = useMemo(() => {
    const points = [];
    const width = 160;
    const height = 18;
    const freq = active ? 0.06 : 0.03;
    const amp = active ? 4 : 2;
    for (let x = 0; x <= width; x += 4) {
      const y = Math.cos(x * freq - phase * 0.8) * amp + height / 2;
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')}`;
  }, [phase, active]);

  return (
    <svg className="w-40 h-5 overflow-visible pointer-events-none opacity-80" viewBox="0 0 160 18">
      <path d={path1} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
      <path d={path2} fill="none" stroke={color} strokeWidth="1.0" strokeLinecap="round" strokeOpacity="0.4" />
    </svg>
  );
};

// Option B: Logarithmic Fibonacci Nautilus Spiral Watermark
const NautilusSpiral: React.FC<{ color: string }> = ({ color }) => {
  const spiralPath1 = useMemo(() => {
    const points = [];
    const a = 1.0;
    const b = 0.12;
    for (let theta = 0; theta < Math.PI * 5; theta += 0.15) {
      const r = a * Math.exp(b * theta);
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')}`;
  }, []);

  const spiralPath2 = useMemo(() => {
    const points = [];
    const a = 1.0;
    const b = 0.12;
    for (let theta = 0; theta < Math.PI * 5; theta += 0.15) {
      const r = a * Math.exp(b * theta);
      const x = r * Math.cos(-theta);
      const y = r * Math.sin(-theta);
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')}`;
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
      <motion.svg
        className="w-[280px] h-[280px] overflow-visible opacity-25"
        viewBox="-80 -80 160 180"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <path d={spiralPath1} fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="3 3" />
      </motion.svg>
      <motion.svg
        className="w-[280px] h-[280px] overflow-visible opacity-15 absolute"
        viewBox="-80 -80 160 180"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      >
        <path d={spiralPath2} fill="none" stroke={color} strokeWidth="0.6" strokeDasharray="2 4" />
      </motion.svg>
    </div>
  );
};

// Option C: Stellar Constellation & Twinkling Reef Dust
const CelestialConstellation: React.FC<{ color: string }> = ({ color }) => {
  const stars = useMemo(() => [
    { x: -60, y: -40, size: 2.2 },
    { x: 50, y: -70, size: 1.5 },
    { x: -90, y: 30, size: 1.8 },
    { x: 80, y: 50, size: 2.5 },
    { x: -20, y: 80, size: 1.2 },
    { x: 30, y: 15, size: 2.0 },
    { x: -10, y: -90, size: 2.8 },
    { x: 90, y: -20, size: 1.2 },
  ], []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
      <svg className="w-[300px] h-[300px] overflow-visible opacity-45" viewBox="-120 -120 240 240">
        <line x1="-60" y1="-40" x2="30" y2="15" stroke={color} strokeWidth="0.6" strokeOpacity="0.3" strokeDasharray="4 4" />
        <line x1="30" y1="15" x2="80" y2="50" stroke={color} strokeWidth="0.6" strokeOpacity="0.3" />
        <line x1="-60" y1="-40" x2="-90" y2="30" stroke={color} strokeWidth="0.6" strokeOpacity="0.3" />
        <line x1="-90" y1="30" x2="-20" y2="80" stroke={color} strokeWidth="0.6" strokeOpacity="0.2" strokeDasharray="2 2" />
        <line x1="50" y1="-70" x2="30" y2="15" stroke={color} strokeWidth="0.6" strokeOpacity="0.3" />
        <line x1="-10" y1="-90" x2="50" y2="-70" stroke={color} strokeWidth="0.6" strokeOpacity="0.25" />

        {stars.map((star, i) => (
          <motion.circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill="#fff"
            style={{ filter: `drop-shadow(0 0 3px ${color})` }}
            animate={{ opacity: [0.25, 0.95, 0.25], scale: [0.85, 1.1, 0.85] }}
            transition={{
              duration: 2.2 + (i % 3),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.35
            }}
          />
        ))}
      </svg>
    </div>
  );
};

interface NodeConfig {
  id: string;
  label: string;
  badge: string;
  tagline: string;
  icon: React.ReactNode;
  color: string; // oklch glow values
  accentColor: string; // plain text color representation
  subProcessors: string[];
}

const telemetryContent: Record<
  string,
  { title: string; subtitle: string; body: string; label: string; accentColor: string }
> = {
  about: {
    title: "SYSTEMS LEADER",
    subtitle: "10+ Years Architecture",
    body: "Delivering high-performance cloud networks, secure virtualization runtimes, and elite venture engineering.",
    label: "Biography",
    accentColor: "#0f766e",
  },
  medroute: {
    title: "AVIA MEDROUTE",
    subtitle: "HIPAA Patient Logistics",
    body: "Architected dynamic NEMT patient transport routing, spatial VDB caches, and multi-fleet automated dispatch engines.",
    label: "NEMT SYSTEM",
    accentColor: "#14b8a6", // Neon Teal
  },
  blog: {
    title: "RESEARCH CHANNEL",
    subtitle: "AI & Virtualization",
    body: "Authoring highly technical guides on sandboxed VM runtimes, secure token protocols, and WebGL state machines.",
    label: "Knowledge",
    accentColor: "#2563eb",
  },
  sullix: {
    title: "SULLIX CORP",
    subtitle: "AI Labor & Matcher VM",
    body: "Designed decentralized labor matching state machines, cryptographic escrow runtimes, and validation consensus protocols.",
    label: "DECENTRALIZED VM",
    accentColor: "#3b82f6", // Sapphire Blue
  },
  hki: {
    title: "HKI SECURITY",
    subtitle: "Sandbox Virtualization",
    body: "Engineered secure gRPC check probes, isolated runtime run-containers, and virtual machine malware detection shielding.",
    label: "Sandbox",
    accentColor: "#10b981", // Emerald
  },
  stay: {
    title: "STAY COMMUNITY",
    subtitle: "Mesh-Networking & Smart Space",
    body: "Architecting real-time physical-digital mesh community protocols, semantic graph matching engines, and secure IoT-driven localized proximity nodes.",
    label: "MESH PROTOCOLS",
    accentColor: "#f97316", // Warm Sunset Amber/Orange
  },
  contact: {
    title: "CONTACT PORTAL",
    subtitle: "Secure Gateway",
    body: "Active for advisory roles, premium consulting contracts, and technical co-founder alignment queries.",
    label: "COLLABORATION",
    accentColor: "#0f766e", // Magenta
  },
};

const defaultContent = {
  title: "H. GHEBRECHRISTOS",
  subtitle: "Systems Architect & Venture Builder",
  body: "Austin, TX • React 19 & TypeScript • Active Builder • Interactive digital portfolio featuring Stay, a technology-driven community mesh.",
  label: "CORE PORTFOLIO",
};

const HomePage: React.FC = () => {
  // 1. Selection & Hover States
  const navigate = useNavigate();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [, setNodeStates] = useState<Record<string, NodeState>>({
    aether: "idle",
    stay: "active",
    sullix: "active",
    medroute: "active",
    hki: "active",
    about: "active",
    contact: "active",
    blog: "active",
  });

  // 2. Profile Image State (Persists locally)
  const [profileImage, setProfileImage] = useState<string>(() => {
    try {
      return localStorage.getItem("dot_profile_image") || "";
    } catch {
      return "";
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2.5 Active Octopus Head Option Option State (A: Bio-Pulse, B: Nautiloid, C: Celestial)
  const [activeOption, setActiveOption] = useState<'A' | 'B' | 'C'>(() => {
    try {
      return (localStorage.getItem("dot_octopus_option") as 'A' | 'B' | 'C') || 'A';
    } catch {
      return 'A';
    }
  });

  const handleOptionChange = (opt: 'A' | 'B' | 'C') => {
    setActiveOption(opt);
    try {
      localStorage.setItem("dot_octopus_option", opt);
      console.log(`COGNITION_OPTION :: Center head sub-theme transitioned to [Option ${opt}]`);
    } catch (err) {
      console.error("Failed to save option selection to localStorage:", err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProfileImage(base64);
      try {
        localStorage.setItem("dot_profile_image", base64);
        console.log("USER_PROFILE :: Profile picture updated successfully.");
      } catch (err) {
        console.error("Failed to save image to localStorage:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  // 3. Responsive Coordinate Tracking (Kept for alignment structures)
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [cardCoords, setCardCoords] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const updateCoords = () => {
    if (!boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const coords: Record<string, { x: number; y: number }> = {};

    Object.entries(cardRefs.current).forEach(([id, el]) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        coords[id] = {
          x: rect.left - boardRect.left + rect.width / 2,
          y: rect.top - boardRect.top + rect.height / 2,
        };
      }
    });
    setCardCoords(coords);
  };

  useEffect(() => {
    updateCoords();
    if (boardRef.current) {
      const observer = new ResizeObserver(() => {
        updateCoords();
      });
      observer.observe(boardRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(updateCoords, 300);
    return () => clearTimeout(timer);
  }, []);

  const selectedNodeId = null; // Always null as we use direct navigation now

  // Handle slideout selection
  // Handle direct navigation on click of a neural node (no more popups!)
  const handleSelectNode = (id: string | null) => {
    if (!id) return;
    console.log(`ROUTING :: Seamlessly navigating to cluster: [${id.toUpperCase()}]`);
    if (id === "about" || id === "contact" || id === "blog") {
      navigate(`/${id}`);
    } else if (id === "stay" || id === "sullix" || id === "medroute" || id === "hki") {
      navigate(`/work/${id}`);
    }
  };

  // Restore everything to optimal
  const handleRestoreSystem = () => {
    setNodeStates({
      aether: "idle",
      stay: "active",
      sullix: "active",
      medroute: "active",
      hki: "active",
      about: "active",
      contact: "active",
      blog: "active",
    });
    console.log("SYSTEM_RESTORE :: All portfolio telemetry re-aligned.");
  };

  // Node specifications representing our 3x3 Symmetrical Map (Portfolio Items)
  const leftNodes: NodeConfig[] = [
    {
      id: "about",
      label: "About HG",
      badge: "Biography",
      tagline: "Professional experience, capabilities & milestones.",
      icon: <User className="w-5 h-5" />,
      color: "oklch(0.95 0 0)",
      accentColor: "#0f766e",
      subProcessors: ["Ast. Metric", "Resume V1"],
    },
    {
      id: "medroute",
      label: "Avia MedRoute",
      badge: "HIPAA logistics",
      tagline: "Dynamic NEMT patient transport routing dispatch.",
      icon: <Compass className="w-5 h-5" />,
      color: "oklch(0.85 0 0)",
      accentColor: "#14b8a6",
      subProcessors: ["NEMT Ingest", "Spatial VDB"],
    },
    {
      id: "blog",
      label: "Technical Blog",
      badge: "Knowledge",
      tagline: "Deep dive articles on AI systems, sandboxes & security.",
      icon: <BookOpen className="w-5 h-5" />,
      color: "oklch(0.75 0 0)",
      accentColor: "#2563eb",
      subProcessors: ["Query Perf.", "Doc Ingestion"],
    },
  ];

  const rightNodes: NodeConfig[] = [
    {
      id: "sullix",
      label: "Sullix Corp",
      badge: "AI escrow",
      tagline: "Decentralized crypto labor market & matching vm.",
      icon: <Layers3 className="w-5 h-5" />,
      color: "oklch(0.85 0 0)",
      accentColor: "#3b82f6",
      subProcessors: ["Escrow Flow", "Matcher VM"],
    },
    {
      id: "hki",
      label: "HKI Security",
      badge: "Sandbox",
      tagline: "AI agent runtime isolation & VM virtualization checks.",
      icon: <Shield className="w-5 h-5" />,
      color: "oklch(0.70 0 0)",
      accentColor: "#10b981",
      subProcessors: ["gRPC VM Check", "Review Probe"],
    },
    {
      id: "stay",
      label: "Stay Community",
      badge: "Smart community",
      tagline: "Technology-driven physical-digital mesh community & matching.",
      icon: <Cpu className="w-5 h-5" />,
      color: "oklch(0.85 0.22 55)", // Sunset orange glowing aura
      accentColor: "#f97316", // Vibrant warm orange
      subProcessors: ["Mesh Node", "Semantic Match"],
    },
  ];

  const bottomNodes: NodeConfig[] = [
    {
      id: "contact",
      label: "Contact Portal",
      badge: "Gateway",
      tagline: "Direct message routing & collaboration scope proposals.",
      icon: <Mail className="w-5 h-5" />,
      color: "oklch(0.80 0 0)",
      accentColor: "#0f766e",
      subProcessors: ["Public GPG", "Secure Ingestion"],
    },
  ];

  const allOuterNodes = [...leftNodes, ...rightNodes, ...bottomNodes];

  return (
    <AquaticBackground
      showGrid={true}
      option={activeOption}
      className="w-screen h-screen overflow-hidden relative font-sans select-none flex flex-col items-center justify-center pt-20"
    >
      {/* 1. ULTRA-PREMIUM FLOATING NAV BAR HEADER */}
      <header
        className="absolute top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl min-h-16 border border-foreground/5 dark:border-white/10 bg-card/80 backdrop-blur-xl px-6 py-2 rounded-xl grid grid-cols-[1fr_auto_1fr] items-center z-30 select-none"
        style={{ boxShadow: "var(--premium-shadow)" }}
      >
        {/* Cyber-notched corners and subtle white under-lighting glow */}
        <div className="absolute top-0 left-4 w-4 h-[1px] bg-white/30" />
        <div className="absolute bottom-0 right-4 w-4 h-[1px] bg-white/30" />

        {/* Left Side: Brand Name & Icon (Hides text on mobile to avoid layout overlap) */}
        <div className="flex justify-start">
          <Link
            to="/"
            className="flex items-center space-x-3 group"
            onClick={() => handleSelectNode(null)}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-foreground/10 dark:border-white/10 bg-background transition-all duration-300 group-hover:scale-105 group-hover:border-primary/80">
              <span className="font-mono font-extrabold text-base text-foreground select-none">
                HG
              </span>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-sans font-bold text-sm tracking-normal text-foreground group-hover:text-foreground/80 transition-colors duration-200">
                H. Ghebrechristos
              </span>
              <span className="text-xs text-foreground/70 font-sans leading-snug font-medium">
                Systems Architect
              </span>
            </div>
          </Link>
        </div>

        {/* Center Side: Stay-branded Sovereign Digital Twin Capsule Link with Live Breathing & Hover Shimmer Sweep */}
        <div className="flex justify-center">
          <Link
            to="/profile"
            className="flex items-center space-x-2.5 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 transition-all duration-300 group relative overflow-hidden shrink-0 animate-border-pulse hover:border-sky-500/50 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)]"
          >
            <StayLogo size={24} themeVariant="patriot" animationState="sync" />
            <div className="hidden sm:flex flex-col text-left font-sans">
              <span className="text-sm font-semibold text-foreground group-hover:text-sky-400 transition-colors leading-tight">
                Sovereign digital twin
              </span>
              <span className="text-xs text-sky-400/90 font-medium leading-snug mt-0.5">
                Powered by Stay
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform hidden sm:block" />
            <div className="shimmer-sweep-element group-hover:animate-shimmer-sweep" />
          </Link>
        </div>

        {/* Right Side: Theme Toggle Controller */}
        <div className="flex justify-end items-center space-x-4">
          <Link
            to="/invite"
            className="hidden sm:inline-flex items-center text-xs font-sans font-semibold tracking-normal text-sky-400 hover:text-sky-500 hover:scale-[1.02] transition-all duration-200 border border-sky-500/20 rounded px-3 py-1.5 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/40"
          >
            Request invite
          </Link>
          <Link
            to="/ui"
            className="hidden sm:inline-flex items-center text-xs font-sans font-semibold tracking-normal text-foreground/75 hover:text-sky-400 hover:scale-[1.02] transition-all duration-200 border border-border/30 rounded px-3 py-1.5 bg-background/50 hover:bg-sky-500/5 hover:border-sky-500/30"
          >
            Design system
          </Link>
          <ModernThemeToggle />
        </div>
      </header>

      {/* Background retro grid lines (completely crisp, extremely faint structure with ZERO blur or glow) */}
      <div className="absolute inset-0 digital-grid opacity-[0.04] pointer-events-none z-0" />

      {/* 2. MAIN COCKPIT BOARD CONTAINER (Widescreen Orbital View) */}
      <div
        ref={boardRef}
        className="w-full h-full max-w-7xl px-8 flex-1 hidden lg:flex items-center justify-center relative z-10"
      >
        {/* Full-Screen Responsive Neural Connections Layer (SVG) */}
        {Object.keys(cardCoords).length > 0 && cardCoords.aether && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* 1. Dashed concentric orbital tracks guides */}
            <OrbitalTracks center={cardCoords.aether} />

            {/* 2. Beautiful connections link lines */}
            {allOuterNodes.map((node) => {
              const coord = cardCoords[node.id];
              return (
                <NeuralLink
                  key={`link-${node.id}`}
                  from={cardCoords.aether}
                  to={coord || null}
                  accentColor={node.accentColor}
                  isHovered={hoveredNodeId === node.id}
                  isSelected={selectedNodeId === node.id}
                />
              );
            })}
          </svg>
        )}

        {/* ==================== COLUMN 1: LEFT NEURAL SECTOR ==================== */}
        <div className="flex-1 flex flex-col justify-between h-[520px] max-w-[280px] z-10">
          {leftNodes.map((node, index) => {
            const staggerClass =
              index === 0
                ? "translate-x-14"
                : index === 1
                  ? "-translate-x-4"
                  : "translate-x-14";
            return (
              <NeuralNode
                key={node.id}
                ref={(el) => {
                  cardRefs.current[node.id] = el;
                }}
                id={node.id}
                label={node.label}
                badge={node.badge}
                tagline={node.tagline}
                icon={node.icon}
                color={node.color}
                accentColor={node.accentColor}
                isHovered={hoveredNodeId === node.id}
                isSelected={selectedNodeId === node.id}
                index={index}
                onClick={() => handleSelectNode(node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className={staggerClass}
              />
            );
          })}
        </div>

        {/* ==================== COLUMN 2: CENTER PROFILE CARD ==================== */}
        <div className="flex-1 max-w-[400px] flex flex-col items-center justify-center space-y-6 z-10 mx-6 relative">
          {/* Theme Option Selector Pill Group */}
          <div className="flex justify-center items-center gap-1.5 p-1 bg-card/60 backdrop-blur-xl rounded-full border border-border/30 shadow-sm z-20 mb-2">
            {(['A', 'B', 'C'] as const).map((opt) => (
              <button
                key={opt}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionChange(opt);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-semibold tracking-normal transition-all duration-300 ${
                  activeOption === opt
                    ? opt === 'A'
                      ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : opt === 'B'
                        ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        : 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.4)]'
                    : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                {opt === 'A' ? 'Focus' : opt === 'B' ? 'Calm' : 'Signal'}
              </button>
            ))}
          </div>

          {/* Main Central Circular Telemetry Console */}
          <motion.div
            ref={(el) => {
              if (el) {
                cardRefs.current.aether = el as unknown as HTMLDivElement;
              }
            }}
            onClick={() => handleSelectNode(null)}
            className={`w-[340px] h-[340px] rounded-full p-[1px] relative cursor-pointer group flex items-center justify-center select-none overflow-hidden card-3d`}
            style={{
              background: hoveredNodeId
                ? `linear-gradient(to bottom, ${telemetryContent[hoveredNodeId]?.accentColor}, ${telemetryContent[hoveredNodeId]?.accentColor}15)`
                : "linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 15%, transparent), color-mix(in oklch, var(--foreground) 5%, transparent))",
              boxShadow: hoveredNodeId
                ? `0 25px 60px -10px ${telemetryContent[hoveredNodeId]?.accentColor}30, 0 0 35px ${telemetryContent[hoveredNodeId]?.accentColor}20, inset 0 1px 1px rgba(255,255,255,0.15)`
                : "var(--premium-shadow)",
            }}
            animate={
              activeOption === 'A'
                ? { scale: hoveredNodeId ? 1.02 : [1, 1.015, 1] }
                : { scale: selectedNodeId ? 0.95 : 1.0 }
            }
            transition={
              activeOption === 'A' && !hoveredNodeId
                ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
            }
          >
            {/* Hidden upload channel */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Inner circular glass console */}
            <div className="w-full h-full rounded-full bg-gradient-to-b from-card/95 to-card/75 dark:from-card/90 dark:to-card/65 flex flex-col items-center justify-between text-center p-6 backdrop-blur-3xl backdrop-saturate-[1.6] overflow-hidden relative z-10">

              {/* Razor-sharp physical glass bevel borders */}
              <div className="absolute inset-0 rounded-full border border-foreground/10 dark:border-white/10 pointer-events-none z-20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.12),_inset_0_-1px_2px_rgba(0,0,0,0.15)]" />

              {/* Ambient shift glow matching the active outer node */}
              <div
                className="absolute inset-0 opacity-15 blur-xl pointer-events-none transition-all duration-500 z-0 scale-[1.3]"
                style={{
                  background: hoveredNodeId
                    ? `radial-gradient(circle, ${telemetryContent[hoveredNodeId]?.accentColor} 0%, transparent 70%)`
                    : "radial-gradient(circle, var(--foreground) 0%, transparent 70%)",
                }}
              />

              {/* Option-specific Background Layers (B/C themes) */}
              {activeOption === 'B' && (
                <>
                  <NautilusSpiral color={hoveredNodeId ? `${telemetryContent[hoveredNodeId]?.accentColor}40` : "rgba(16, 185, 129, 0.3)"} />
                  {/* Fibonacci Golden-Ratio spaced concentric ripple rings */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute rounded-full border border-emerald-500/20"
                        style={{
                          width: '100%',
                          height: '100%',
                          borderColor: hoveredNodeId ? `${telemetryContent[hoveredNodeId]?.accentColor}25` : 'rgba(16, 185, 129, 0.2)',
                        }}
                        initial={{ scale: 0.3, opacity: 0.6 }}
                        animate={{ scale: 1.15, opacity: 0 }}
                        transition={{
                          duration: 3.5,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: i * 1.1, // Elegant staggered Fibonacci-styled delays
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              {activeOption === 'C' && (
                <CelestialConstellation color={hoveredNodeId ? `${telemetryContent[hoveredNodeId]?.accentColor}40` : "rgba(14, 165, 233, 0.35)"} />
              )}

              {/* Spinning tech bevel border ring */}
              <div
                className="absolute inset-2.5 rounded-full border border-dashed border-border/20 animate-[spin_40s_linear_infinite] pointer-events-none z-0"
                style={{
                  borderColor: hoveredNodeId ? `${telemetryContent[hoveredNodeId]?.accentColor}30` : "",
                }}
              />

              {/* Outer degree tech ticks */}
              <div
                className="absolute inset-4 rounded-full border border-dotted border-border/10 animate-[spin_70s_linear_infinite] pointer-events-none z-0"
                style={{
                  borderColor: hoveredNodeId ? `${telemetryContent[hoveredNodeId]?.accentColor}15` : "",
                }}
              />

              {/* Console Layout Rows */}
              {/* 1. Header Row: Active Stream Badge */}
              <div className="relative z-10 mt-2 shrink-0">
                <div
                  className="text-xs font-sans font-semibold tracking-normal border rounded-full px-3 py-1.5 bg-background/70 dark:bg-black/40 flex items-center justify-center space-x-1.5 transition-all duration-300 shadow-sm"
                  style={{
                    borderColor: hoveredNodeId
                      ? `${telemetryContent[hoveredNodeId]?.accentColor}40`
                      : "color-mix(in oklch, var(--border) 30%, transparent)",
                    color: hoveredNodeId ? telemetryContent[hoveredNodeId]?.accentColor : "var(--foreground)",
                    boxShadow: hoveredNodeId ? `0 0 12px ${telemetryContent[hoveredNodeId]?.accentColor}15` : "none",
                  }}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${hoveredNodeId ? "animate-ping" : "animate-pulse"}`}
                    style={{
                      backgroundColor: hoveredNodeId ? telemetryContent[hoveredNodeId]?.accentColor : "var(--border)",
                    }}
                  />
                  <span>
                    {hoveredNodeId ? `Viewing ${telemetryContent[hoveredNodeId]?.label}` : "Ready"}
                  </span>
                </div>
              </div>

              {/* 2. Middle Row: Avatar Circle (Click to upload) */}
              <div className="relative z-10 shrink-0 mt-3">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="w-16 h-16 rounded-full border border-foreground/10 dark:border-white/10 bg-muted relative overflow-hidden group/avatar cursor-pointer shadow-inner z-10 transition-transform duration-300 hover:scale-[1.05] flex items-center justify-center"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      className="w-full h-full object-cover grayscale"
                      alt="H. Ghebrechristos"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-card to-muted text-foreground">
                      <User className="w-6 h-6 text-foreground/80" />
                    </div>
                  )}

                  {/* Upload Hover Overlay */}
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-[7px] text-white font-mono font-bold">
                    <Camera className="w-3 h-3 mb-0.5 text-white animate-pulse" />
                    <span>UPLOAD</span>
                  </div>
                </div>
              </div>

              {/* 3. Text Info Row (Dynamic Transition) */}
              <div className="relative z-10 flex flex-col items-center px-4 flex-1 justify-center space-y-1.5 mt-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={hoveredNodeId || "default"}
                    initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="flex flex-col items-center w-full"
                  >
                    <h2
                      className="text-xl sm:text-2xl font-bold font-serif text-foreground transition-all duration-300"
                      style={{
                        letterSpacing: 0,
                        textShadow: hoveredNodeId ? `0 0 15px ${telemetryContent[hoveredNodeId]?.accentColor}30` : 'none'
                      }}
                    >
                      {hoveredNodeId ? telemetryContent[hoveredNodeId]?.title : defaultContent.title}
                    </h2>
                    <p
                      className="text-sm tracking-normal font-sans font-semibold mt-1 leading-snug transition-colors duration-300"
                      style={{
                        color: hoveredNodeId ? telemetryContent[hoveredNodeId]?.accentColor : "var(--foreground)",
                      }}
                    >
                      {hoveredNodeId ? telemetryContent[hoveredNodeId]?.subtitle : defaultContent.subtitle}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed font-sans text-foreground/85 dark:text-foreground/80 text-center max-w-[260px] px-2 min-h-[64px] flex items-center justify-center">
                      {hoveredNodeId ? telemetryContent[hoveredNodeId]?.body : defaultContent.body}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* 4. Pulsing Horizontal Wave Reticle or Live Waveform */}
              <div className="h-6 flex items-center justify-center shrink-0 mt-1">
                {activeOption === 'A' ? (
                  <LiveWaveform
                    active={hoveredNodeId !== null}
                    color={hoveredNodeId ? telemetryContent[hoveredNodeId]?.accentColor : "var(--border)"}
                  />
                ) : (
                  <div className="w-24 h-[1.5px] bg-gradient-to-r from-transparent via-border to-transparent relative opacity-30">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"
                      style={{
                        backgroundImage: hoveredNodeId
                          ? `linear-gradient(to right, transparent, ${telemetryContent[hoveredNodeId]?.accentColor}, transparent)`
                          : "",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 5. Return/Status Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectNode(null);
                }}
                className="px-4 py-2 border border-foreground/15 dark:border-white/10 hover:border-foreground/35 dark:hover:border-white/35 rounded-full bg-background/50 hover:bg-muted text-xs text-foreground font-sans tracking-normal transition-all duration-200 mt-2.5 mb-2 shrink-0 font-semibold shadow-sm"
              >
                Calibrated
              </button>
            </div>
          </motion.div>

          {/* Symmetrical Bottom Contact Card */}
          {bottomNodes.map((node) => (
            <NeuralNode
              key={node.id}
              ref={(el) => {
                cardRefs.current[node.id] = el;
              }}
              id={node.id}
              label={node.label}
              badge={node.badge}
              tagline={node.tagline}
              icon={node.icon}
              color={node.color}
              accentColor={node.accentColor}
              isHovered={hoveredNodeId === node.id}
              isSelected={selectedNodeId === node.id}
              index={6}
              onClick={() => handleSelectNode(node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              className="max-w-[280px] w-full"
            />
          ))}
        </div>

        {/* ==================== COLUMN 3: RIGHT NEURAL SECTOR ==================== */}
        <div className="flex-1 flex flex-col justify-between h-[520px] max-w-[280px] z-10">
          {rightNodes.map((node, index) => {
            const staggerClass =
              index === 0
                ? "-translate-x-14"
                : index === 1
                  ? "translate-x-4"
                  : "-translate-x-14";
            return (
              <NeuralNode
                key={node.id}
                ref={(el) => {
                  cardRefs.current[node.id] = el;
                }}
                id={node.id}
                label={node.label}
                badge={node.badge}
                tagline={node.tagline}
                icon={node.icon}
                color={node.color}
                accentColor={node.accentColor}
                isHovered={hoveredNodeId === node.id}
                isSelected={selectedNodeId === node.id}
                index={index + 3}
                onClick={() => handleSelectNode(node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className={staggerClass}
              />
            );
          })}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. MOBILE & TABLET RESPONSIVE GLASS LIST VIEW              */}
      {/* ========================================================== */}
      <div className="w-full max-w-lg mx-auto flex lg:hidden flex-col h-full overflow-y-auto custom-scrollbar px-6 py-10 relative z-10 space-y-5">
        {/* Mobile Header Banner - Updated to match Profile Center */}
        <div className="text-center space-y-4 border-b border-foreground/5 dark:border-white/5 pb-6 mb-2 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border border-foreground/10 dark:border-white/10 bg-muted relative overflow-hidden flex items-center justify-center shadow-md">
            {profileImage ? (
              <img
                src={profileImage}
                className="w-full h-full object-cover grayscale"
                alt="Profile"
              />
            ) : (
              <User className="w-10 h-10 text-foreground/80" />
            )}
          </div>
          <div className="space-y-1.5">
            <PremiumTitle
              tag="h2"
              variant="solid"
              serif={true}
              className="text-xl font-bold font-sans tracking-wide text-foreground"
            >
              H. Ghebrechristos
            </PremiumTitle>
            <PremiumText
              variant="body"
              size="sm"
              className="tracking-wide font-medium font-sans text-foreground/75"
            >
              Systems Architect & Venture Builder
            </PremiumText>
          </div>
          <div className="flex items-center justify-center space-x-2 pt-1 text-xs font-sans text-emerald-500 font-semibold tracking-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online</span>
          </div>
        </div>

        {/* List of Main Cards */}
        {[...leftNodes, ...rightNodes, ...bottomNodes].map((node) => (
          <button
            key={node.id}
            onClick={() => handleSelectNode(node.id)}
            className="w-full rounded-2xl border border-border/35 bg-card/90 px-4 py-4 text-left shadow-[var(--premium-shadow)] transition-all duration-200 hover:border-primary/40 hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/35"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-xl border border-border/40 bg-background flex items-center justify-center shrink-0"
                style={{ color: node.accentColor }}
              >
                {node.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-sans font-semibold text-primary mb-1">
                  {node.badge}
                </div>
                <h3 className="text-lg font-bold font-sans text-foreground leading-snug">
                  {node.label}
                </h3>
                <p className="mt-1 text-sm text-foreground/75 font-sans leading-relaxed">
                  {node.tagline}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-primary shrink-0" />
            </div>
          </button>
        ))}

        {/* Sync Restore Core Button */}
        <Button
          variant="glass"
          onClick={handleRestoreSystem}
          className="w-full py-3.5 text-primary font-sans text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 tracking-normal transition-all duration-200 border border-border/60"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Calibrate Cognition System</span>
        </Button>
      </div>
    </AquaticBackground>
  );
};

export default HomePage;
