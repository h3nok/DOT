import React from 'react';
import { Map } from 'lucide-react';
import { HighContrastBadge } from '../../../../shared/components/ui/design-system-primitives';

interface MeshAnchor {
  id: number;
  name: string;
  x: number;
  y: number;
  active: boolean;
  scale: number;
}

interface MeshMapProps {
  meshAnchors: MeshAnchor[];
  onDropAnchor: (x: number, y: number) => void;
  disabled: boolean;
}

export const MeshMap: React.FC<MeshMapProps> = ({ meshAnchors, onDropAnchor, disabled }) => {
  return (
    <div className="pt-6 border-t border-border/20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <h4 className="text-sm font-sans font-bold text-foreground flex items-center gap-2">
            <Map className="w-4 h-4 text-emerald-400" />
            <span>Interactive Stay Mesh Map (Austin Node 0x01)</span>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click anywhere on the physical topographical mesh coordinate grid to <strong className="text-foreground font-semibold">drop a Stay Anchor</strong> and watch local peer telemetry synchronize!
          </p>
        </div>
        <HighContrastBadge glowColor="success" pulse>
          Active Neighbors: {meshAnchors.length} Nodes
        </HighContrastBadge>
      </div>

      <div className="relative rounded-2xl border border-border/40 overflow-hidden bg-black/50 p-1 group">
        <svg
          viewBox="0 0 300 160"
          className="w-full h-auto bg-black/60 rounded-xl relative z-10 cursor-crosshair select-none"
          onClick={(e) => {
            if (disabled) return;
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 300;
            const y = ((e.clientY - rect.top) / rect.height) * 160;
            onDropAnchor(Math.round(x), Math.round(y));
          }}
        >
          <defs>
            <linearGradient id="coloradoRiver" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#1d4ed8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <g stroke="rgba(255,255,255,0.02)" strokeWidth="0.5">
            {[20, 40, 60, 80, 100, 120, 140].map(val => <line key={`h-${val}`} x1="0" y1={val} x2="300" y2={val} />)}
            {[30, 60, 90, 120, 150, 180, 210, 240, 270].map(val => <line key={`v-${val}`} x1={val} y1="0" x2={val} y2="160" />)}
          </g>

          <path
            d="M -10,80 Q 50,60 100,85 T 200,90 T 310,65"
            fill="none"
            stroke="url(#coloradoRiver)"
            strokeWidth="12"
            strokeLinecap="round"
            className="animate-pulse"
            style={{ animationDuration: '4s' }}
          />

          {/* Topographic contours */}
          <path d="M 40,30 C 50,20 80,25 90,40 C 95,50 80,60 70,55 C 60,50 35,40 40,30 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
          <path d="M 230,120 C 240,110 270,115 280,130 C 285,140 270,150 260,145 C 250,140 225,130 230,120 Z" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />

          {/* Connected Links of Neighbors */}
          <g stroke="rgba(56, 189, 248, 0.25)" strokeWidth="0.8">
            {meshAnchors.map((node, i) =>
              meshAnchors.slice(i + 1).map((peer) => {
                const dx = node.x - peer.x;
                const dy = node.y - peer.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 95) {
                  return (
                    <g key={`${node.id}-${peer.id}`}>
                      <line x1={node.x} y1={node.y} x2={peer.x} y2={peer.y} className="animate-pulse" style={{ animationDuration: '3s' }} />
                      <circle r="1.5" fill="#38bdf8" className="packet-transit-map">
                        <animateMotion path={`M ${node.x},${node.y} L ${peer.x},${peer.y}`} dur="2s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  );
                }
                return null;
              })
            )}
          </g>

          {/* Anchors */}
          {meshAnchors.map((node) => (
            <g key={node.id} transform={`translate(${node.x}, ${node.y}) scale(${node.scale})`} className="transition-transform duration-500 origin-center">
              <circle cx="0" cy="0" r="14" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" className="animate-pulse" />
              <circle cx="0" cy="0" r="6" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="2" fill="#34d399" />
              <text x="8" y="3" fill="#ffffff" fontSize="6" fontFamily="monospace" className="font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none select-none">
                {node.name.split(' (')[0]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
