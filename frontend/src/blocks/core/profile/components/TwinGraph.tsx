import React from 'react';
import { Activity } from 'lucide-react';

interface Particle {
  id: number;
  startX: number;
  startY: number;
  color: string;
}

interface TwinNode {
  id: string;
  label: string;
  type: string;
  size: number;
  x: number;
  y: number;
  description: string;
  properties?: Record<string, any>;
}

interface TwinLink {
  source: string;
  target: string;
  label: string;
}

interface TwinGraphProps {
  twinNodes: TwinNode[];
  twinLinks: TwinLink[];
  selectedNodeId: string;
  setSelectedNodeId: (id: string) => void;
  twinStatus: 'idle' | 'processing' | 'indexing' | 'synchronized';
  particles: Particle[];
}

export const TwinGraph: React.FC<TwinGraphProps> = ({
  twinNodes,
  twinLinks,
  selectedNodeId,
  setSelectedNodeId,
  twinStatus,
  particles,
}) => {
  // Helper to determine node colors
  const getNodeColor = (type: string, isSelected: boolean) => {
    if (isSelected) {
      switch (type) {
        case 'core': return '#2563eb'; // Signal Blue
        case 'venture': return '#fbbf24'; // Gold Sunset
        case 'skill': return '#38bdf8'; // Liberty Blue
        case 'project': return '#0f766e';
        case 'badge': return '#34d399'; // Emerald
        case 'location': return '#10b981'; // Geographic emerald
        default: return '#2563eb';
      }
    }
    switch (type) {
      case 'core': return '#93c5fd';
      case 'venture': return '#fcd34d';
      case 'skill': return '#7dd3fc';
      case 'project': return '#38bdf8';
      case 'badge': return '#6ee7b7';
      case 'location': return '#a7f3d0'; // Soft Mint
      default: return '#cbd5e1';
    }
  };

  // Helper to resolve source/target coordinates for SVG links
  const getLinkCoords = (link: TwinLink) => {
    const sNode = twinNodes.find(n => n.id === link.source);
    const tNode = twinNodes.find(n => n.id === link.target);
    if (sNode && tNode) {
      return { x1: sNode.x, y1: sNode.y, x2: tNode.x, y2: tNode.y };
    }
    return null;
  };

  return (
    <div className="lg:col-span-2 relative min-h-[350px] md:min-h-[380px] p-5 bg-background/10 flex flex-col justify-between overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

      {/* Overlay Metadata Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-sky-400/80 font-bold bg-sky-500/5 border border-sky-500/10 px-2 py-0.5 rounded">
          <Activity className="w-3 h-3 text-sky-400 animate-pulse" />
          <span>COGNITIVE_TWIN_METRICS.MAP</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-black/70 border border-border/30 font-mono text-[8.5px] uppercase tracking-wider">
          <span className={`w-1.5 h-1.5 rounded-full ${twinStatus === 'processing' || twinStatus === 'indexing' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse-dot'}`}></span>
          <span>{twinStatus === 'idle' ? 'Twin Standby' : twinStatus === 'processing' ? 'On-Device LLM' : twinStatus === 'indexing' ? 'Indexing SQLite' : 'Sync Complete'}</span>
        </div>
      </div>

      {/* Interactive Network SVG Canvas */}
      <div className="flex-1 flex items-center justify-center p-2 relative z-10 my-2">
        <svg className="w-full max-w-[420px] aspect-[300/220] relative" viewBox="0 0 300 220">
          {/* Embedded Gradients & Filters */}
          <defs>
            <filter id="nodeGlow" x="-25%" y="-25%" width="150%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="coreGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#2563eb" />
            </radialGradient>
          </defs>

          {/* Render Inter-Node Relationship Link Lines */}
          {twinLinks.map((link, idx) => {
            const coords = getLinkCoords(link);
            if (!coords) return null;
            const isLineSelected = selectedNodeId === link.source || selectedNodeId === link.target;
            return (
              <g key={`link-${idx}`}>
                {/* Glow Backing Line on Select */}
                {isLineSelected && (
                  <line
                    x1={coords.x1}
                    y1={coords.y1}
                    x2={coords.x2}
                    y2={coords.y2}
                    stroke={link.source === selectedNodeId ? '#2563eb' : '#fbbf24'}
                    strokeWidth="2.5"
                    strokeOpacity="0.4"
                    filter="url(#nodeGlow)"
                  />
                )}

                {/* Base Topological Edge */}
                <line
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  stroke={isLineSelected ? '#2563eb' : '#334155'}
                  strokeWidth={isLineSelected ? 1.25 : 0.75}
                  strokeOpacity={isLineSelected ? 0.95 : 0.45}
                  strokeDasharray={isLineSelected ? '4, 4' : undefined}
                  className={isLineSelected ? 'packet-flow-line' : undefined}
                />
              </g>
            );
          })}

          {/* Render Topological Semantic Nodes */}
          {twinNodes.map((node) => {
            const isNodeSelected = selectedNodeId === node.id;
            const activeColor = getNodeColor(node.type, true);
            const baseColor = getNodeColor(node.type, false);
            return (
              <g
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className="cursor-pointer select-none transition-all duration-300 hover:scale-110 origin-center group/node"
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              >
                {/* Orbit ring visual structure for select node / hover focus */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size + 6}
                  fill="none"
                  stroke={activeColor}
                  strokeWidth="0.75"
                  strokeDasharray="4, 2"
                  className="orbit-ring-cw"
                  strokeOpacity={isNodeSelected ? 0.8 : 0.15}
                />

                {/* Soft background volumetric glow */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size + 3}
                  fill={activeColor}
                  fillOpacity={isNodeSelected ? 0.22 : 0.03}
                  className={isNodeSelected ? 'animate-pulse' : 'group-hover/node:fill-opacity-10'}
                />

                {/* Primary Semantic Node Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size}
                  fill={node.id === 'core' ? 'url(#coreGlowGrad)' : isNodeSelected ? activeColor : '#18181b'}
                  stroke={isNodeSelected ? '#ffffff' : baseColor}
                  strokeWidth={isNodeSelected ? 1.5 : 1}
                  filter={isNodeSelected ? 'url(#nodeGlow)' : undefined}
                  className="transition-all duration-300"
                />

                {/* Center core target dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size * 0.3}
                  fill={isNodeSelected ? '#ffffff' : baseColor}
                  fillOpacity={isNodeSelected ? 1 : 0.6}
                />

                {/* Node Name Label */}
                <text
                  x={node.x}
                  y={node.y + node.size + 11}
                  textAnchor="middle"
                  className={`font-sans text-[8px] font-bold tracking-tight select-none transition-all duration-300 ${
                    isNodeSelected ? 'fill-white font-extrabold shadow-sm' : 'fill-slate-400/80 group-hover/node:fill-slate-200'
                  }`}
                >
                  {node.label}
                </text>
              </g>
            );
          })}

          {/* Dynamic flying particles during footprint feed ingestion */}
          {particles.map((p) => {
            const dx = 150 - p.startX;
            const dy = 110 - p.startY;
            return (
              <circle
                key={p.id}
                cx={p.startX}
                cy={p.startY}
                r="4"
                fill={p.color}
                className="particle-transit"
                style={{
                  '--dx': `${dx}px`,
                  '--dy': `${dy}px`,
                } as React.CSSProperties}
              />
            );
          })}
        </svg>
      </div>

      {/* Interactive Graph Color Key / Legend */}
      <div className="relative z-10 flex flex-wrap gap-x-3 gap-y-1.5 justify-start text-[8px] font-mono text-muted-foreground uppercase font-bold tracking-wider mt-1 border-t border-border/10 pt-2.5">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          <span>Sovereign Identity</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>Venture Node</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          <span>Competency</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
          <span>Active Project</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Trust Badge</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
          <span>Geographic Anchor</span>
        </div>
      </div>
    </div>
  );
};
