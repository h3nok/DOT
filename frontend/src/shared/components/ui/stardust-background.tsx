import React from 'react';
import { cn } from '../../../lib/utils';

interface StardustBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  showGrid?: boolean;
  crisp?: boolean;
}

export const StardustBackground: React.FC<StardustBackgroundProps> = ({
  children,
  className,
  showGrid = true,
  crisp = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-1000",
        className
      )}
      {...props}
    >
      {/* Dynamic Digital Retro-Grid Pattern */}
      {showGrid && (
        <div className={cn(
          "absolute inset-0 pointer-events-none z-[1]",
          crisp && "opacity-40"
        )}
        style={{
          backgroundImage: 'linear-gradient(to right, color-mix(in oklch, var(--foreground) 2%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 2%, transparent) 1px, transparent 1px)',
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)'
        }} />
      )}

      {/* Ambient Theme-Aware Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn(
          "absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full animate-pulse-slow",
          crisp ? "blur-[24px] opacity-10" : "blur-[80px]"
        )}
        style={{ background: 'radial-gradient(circle, color-mix(in oklch, var(--foreground) 5%, transparent) 0%, transparent 70%)' }} />
        <div className={cn(
          "absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full animate-pulse-slow",
          crisp ? "blur-[30px] opacity-10" : "blur-[100px]"
        )} style={{ animationDelay: '2s', background: 'radial-gradient(circle, color-mix(in oklch, var(--foreground) 4%, transparent) 0%, transparent 70%)' }} />
        <div className={cn(
          "absolute top-[30%] right-[15%] w-[35%] h-[35%] rounded-full animate-pulse-slow",
          crisp ? "blur-[24px] opacity-8" : "blur-[90px]"
        )} style={{ animationDelay: '4s', background: 'radial-gradient(circle, color-mix(in oklch, var(--foreground) 3%, transparent) 0%, transparent 70%)' }} />
      </div>

      {/* Emergent Complexity Particle & Connection System */}
      <div className={cn(
        "emergent-complexity absolute inset-0 pointer-events-none z-[2]",
        crisp ? "opacity-[0.12]" : "opacity-100"
      )}>
        <div className="consciousness-field" />
        <div className="fractal-field" />
        <div className="flow-field" />

        {/* Primary Fractal Nodes (1 to 16) */}
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={`n1-${i}`} className="fractal-node" />
        ))}

        {/* Secondary Fractal Nodes (17 to 24) */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`n2-${i}`} className="fractal-node-2" style={{ contentVisibility: 'auto' }} />
        ))}

        {/* Micro Nodes for Depth (25 to 30) */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`n3-${i}`} className="fractal-node-3" style={{ contentVisibility: 'auto' }} />
        ))}

        {/* System Clusters (31 to 33) */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`sc-${i}`} className="system-cluster" />
        ))}

        {/* Connections (34 to 37) */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`c-${i}`} className="fractal-connection" />
        ))}
      </div>

      {/* Render children with high-fidelity layering */}
      <div className="relative z-10 w-full h-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default StardustBackground;
