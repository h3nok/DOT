import React from 'react';
import {
  PremiumText,
  PremiumTitle,
  PremiumGlassCard
} from '../../../../shared/components/ui/design-system-primitives';
import { StayLogo } from '../../../../shared/components/ui/StayLogo';
import { Flag, MapPin, Network, Radio } from 'lucide-react';

interface BrandSandboxProps {
  brandTheme: 'patriot' | 'hearth' | 'midnight' | 'sovereign';
  setBrandTheme: (theme: 'patriot' | 'hearth' | 'midnight' | 'sovereign') => void;
  brandAnimation: 'sync' | 'beacon' | 'tectonic' | 'blueprint';
  setBrandAnimation: (anim: 'sync' | 'beacon' | 'tectonic' | 'blueprint') => void;
  hoveredSymbol: 'anchor' | 'constellation' | 'compass' | null;
  setHighlightedSymbol: (symbol: 'anchor' | 'constellation' | 'compass' | null) => void;
  children?: React.ReactNode;
}

export const BrandSandbox: React.FC<BrandSandboxProps> = ({
  brandTheme,
  setBrandTheme,
  brandAnimation,
  setBrandAnimation,
  hoveredSymbol,
  setHighlightedSymbol,
  children,
}) => {
  return (
    <PremiumGlassCard enable3D={false} className="w-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.04),transparent_50%)] pointer-events-none"></div>

      <div className="border-b border-border/20 pb-4 mb-6 relative z-10 flex items-center gap-2">
        <Flag className="w-5 h-5 text-blue-400" />
        <PremiumTitle tag="h2" variant="gradient">
          Stay Brand Experience: Conceptualizing the American Community Mesh
        </PremiumTitle>
      </div>

      <div className="space-y-8 relative z-10 w-full">
        <PremiumText variant="vibrant">
          Stay is a technology-driven community model engineered to restore trust, agency, and robust physical relationships in American neighborhoods. Our brand visualizes this synthesis of physical grounding and modern decentralized cryptographic networks.
        </PremiumText>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left: Beautiful Logo Sandbox Canvas */}
          <div className="md:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-black/30 border border-border/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-sky-500/5"></div>
            <div className="absolute inset-0.5 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"></div>

            <div className="flex flex-col items-center justify-center py-6 relative z-10">
              <StayLogo
                size={150}
                themeVariant={brandTheme}
                animationState={brandAnimation}
                highlightElement={hoveredSymbol}
                interactive={true}
              />
              <PremiumText variant="contrast" size="xs" weight="bold" className="font-mono uppercase tracking-widest mt-4">
                Stay Brand Icon Model v1.2
              </PremiumText>
            </div>

            {/* Brand Sandbox Live Controls */}
            <div className="space-y-3.5 pt-4 border-t border-border/20 relative z-10">
              <div>
                <PremiumText variant="secondary" size="xs" weight="bold" className="font-mono uppercase tracking-wider block mb-1.5">
                  Color Palette Themes
                </PremiumText>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['patriot', 'hearth', 'midnight', 'sovereign'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setBrandTheme(t)}
                      className={`py-1 text-[9px] font-mono uppercase rounded border transition-all ${brandTheme === t ? 'bg-sky-500/20 text-sky-400 border-sky-500/30 font-bold' : 'bg-transparent text-muted-foreground border-border/40 hover:border-border'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <PremiumText variant="secondary" size="xs" weight="bold" className="font-mono uppercase tracking-wider block mb-1.5">
                  Motion Modalities
                </PremiumText>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['sync', 'beacon', 'tectonic', 'blueprint'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => setBrandAnimation(a)}
                      className={`py-1 text-[9px] font-mono uppercase rounded border transition-all ${brandAnimation === a ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold' : 'bg-transparent text-muted-foreground border-border/40 hover:border-border'}`}
                    >
                      {a === 'tectonic' ? 'Breath' : a === 'blueprint' ? 'CAD' : a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Logo Symbol Anatomy breakdown */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <PremiumTitle tag="h3" variant="primary" className="mb-4">
                Interactive Symbol Anatomy
              </PremiumTitle>
              <PremiumText variant="vibrant" className="mb-4">
                Hover over the structural layers below to dissect the constitutional engineering and American community concepts behind Stay:
              </PremiumText>

              <div className="space-y-3">
                {/* Part 1: Anchor Core */}
                <div
                  onMouseEnter={() => setHighlightedSymbol('anchor')}
                  onMouseLeave={() => setHighlightedSymbol(null)}
                  className={`p-3 rounded-xl border transition-all duration-300 flex items-start gap-3.5 cursor-help ${hoveredSymbol === 'anchor' ? 'bg-sky-500/10 border-sky-500/30 shadow-md translate-x-1' : 'bg-background/40 border-border/10'}`}
                >
                  <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <PremiumText variant="contrast" className="font-mono uppercase font-bold text-foreground">
                      The Physical Anchor Core
                    </PremiumText>
                    <PremiumText variant="vibrant" size="xs">
                      Represents <strong className="text-foreground font-semibold">"Staying" rooted</strong> in real, physical spaces—defying the transience and dislocation of cloud databases. The core star anchors community connections within exact geographical proximity zones.
                    </PremiumText>
                  </div>
                </div>

                {/* Part 2: Constellation Mesh */}
                <div
                  onMouseEnter={() => setHighlightedSymbol('constellation')}
                  onMouseLeave={() => setHighlightedSymbol(null)}
                  className={`p-3 rounded-xl border transition-all duration-300 flex items-start gap-3.5 cursor-help ${hoveredSymbol === 'constellation' ? 'bg-blue-500/10 border-blue-500/30 shadow-md translate-x-1' : 'bg-background/40 border-border/10'}`}
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                    <Network className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <PremiumText variant="contrast" className="font-mono uppercase font-bold text-foreground">
                      The Citizen Star Constellation
                    </PremiumText>
                    <PremiumText variant="vibrant" size="xs">
                      Synthesizes <strong className="text-foreground font-semibold">American federation with distributed technology</strong>. The 5 stars connect in a decentralized mesh, symbolizing sovereign individuals who co-own their digital presence while forming high-trust local community meshes.
                    </PremiumText>
                  </div>
                </div>

                {/* Part 3: Compass Rings */}
                <div
                  onMouseEnter={() => setHighlightedSymbol('compass')}
                  onMouseLeave={() => setHighlightedSymbol(null)}
                  className={`p-3 rounded-xl border transition-all duration-300 flex items-start gap-3.5 cursor-help ${hoveredSymbol === 'compass' ? 'bg-amber-500/10 border-amber-500/30 shadow-md translate-x-1' : 'bg-background/40 border-border/10'}`}
                >
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <PremiumText variant="contrast" className="font-mono uppercase font-bold text-foreground">
                      Dual-Orbit Compass Boundary
                    </PremiumText>
                    <PremiumText variant="vibrant" size="xs">
                      Intricate orbiting compass coordinate rings representing <strong className="text-foreground font-semibold">regional mesh bounds and discovery shields</strong>. The counter-rotating paths represent on-device proximity matching filters, scanning and handshaking using WebRTC and local Bluetooth mesh.
                    </PremiumText>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {children}
      </div>
    </PremiumGlassCard>
  );
};
