import React, { useMemo, useEffect, useRef } from 'react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../contexts/SimpleThemeContext';

interface AquaticBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  showGrid?: boolean;
  option?: 'A' | 'B' | 'C'; // A: Bio-Pulse, B: Nautiloid, C: Celestial
}

interface Spore {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  alphaSpeed: number;
  color: string;
  swaySpeed: number;
  swayOffset: number;
  baseAlpha: number;
}

export const AquaticBackground: React.FC<AquaticBackgroundProps> = ({
  children,
  className,
  showGrid = true,
  option = 'A',
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  const { theme } = useTheme();
  const isLight = theme === 'light' || theme === 'paper';

  // 1. Theme Configuration based on Selection (Option A, B, or C) and light/dark modes
  const themeConfig = useMemo(() => {
    if (isLight) {
      switch (option) {
        case 'B': // Nautiloid Geometric Balance (Jade & Amber) - Light Mode
          return {
            gradient: 'bg-gradient-to-b from-[#f4fbf7] via-[#fdf9e2] to-[#fde68a]/80', // Mint/warm alabaster to yellow amber
            spotlight1: 'bg-[radial-gradient(circle,rgba(16,185,129,0.12)_0%,transparent,transparent)]', // Jade
            spotlight2: 'bg-[radial-gradient(circle,rgba(245,158,11,0.1)_0%,transparent,transparent)]',   // Amber
            spotlight3: 'bg-[radial-gradient(circle,rgba(52,211,153,0.08)_0%,transparent,transparent)]',   // Emerald
            sporeColors: ['#059669', '#10b981', '#d97706', '#f59e0b', '#047857'],
            causticsGlow: 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(16,185,129,0.08)_0%,transparent_60%)]',
            interaction: 'attract', // Golden ratio pulls inward
          };
        case 'C': // Signal Reef (Blue & Teal) - Light Mode
          return {
            gradient: 'bg-gradient-to-b from-[#eff6ff] via-[#ecfeff] to-[#bfdbfe]/80',
            spotlight1: 'bg-[radial-gradient(circle,rgba(14,165,233,0.12)_0%,transparent,transparent)]',
            spotlight2: 'bg-[radial-gradient(circle,rgba(37,99,235,0.1)_0%,transparent,transparent)]',
            spotlight3: 'bg-[radial-gradient(circle,rgba(20,184,166,0.08)_0%,transparent,transparent)]',
            sporeColors: ['#38bdf8', '#0f766e', '#2563eb', '#2563eb', '#0f766e'],
            causticsGlow: 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(14,165,233,0.08)_0%,transparent_60%)]',
            interaction: 'orbit', // Celestial orbits around mouse
          };
        case 'A': // Bioluminescent Bio-Pulse Core (Teal & Sapphire) - Light Mode
        default:
          return {
            gradient: 'bg-gradient-to-b from-[#f0fdfa] via-[#e0f2fe] to-[#bae6fd]/80', // Soft teal-cyan to light sapphire blue
            spotlight1: 'bg-[radial-gradient(circle,rgba(6,182,212,0.15)_0%,transparent,transparent)]',  // Cyan
            spotlight2: 'bg-[radial-gradient(circle,rgba(59,130,246,0.12)_0%,transparent,transparent)]',  // Blue
            spotlight3: 'bg-[radial-gradient(circle,rgba(20,184,166,0.1)_0%,transparent,transparent)]',  // Teal
            sporeColors: ['#0891b2', '#0284c7', '#2563eb', '#0d9488', '#3b82f6'],
            causticsGlow: 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(6,182,212,0.1)_0%,transparent_60%)]',
            interaction: 'repel', // Biological defense push-away
          };
      }
    } else {
      // Dark Mode configurations
      switch (option) {
        case 'B': // Nautiloid Geometric Balance (Jade & Amber) - Dark Mode
          return {
            gradient: 'bg-gradient-to-b from-[#030704] via-[#05160d] to-[#122817]/90',
            spotlight1: 'bg-[radial-gradient(circle,rgba(16,185,129,0.06)_0%,transparent,transparent)]', // Jade
            spotlight2: 'bg-[radial-gradient(circle,rgba(245,158,11,0.05)_0%,transparent,transparent)]',   // Amber
            spotlight3: 'bg-[radial-gradient(circle,rgba(52,211,153,0.04)_0%,transparent,transparent)]',   // Emerald
            sporeColors: ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#059669'],
            causticsGlow: 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(16,185,129,0.025)_0%,transparent_60%)]',
            interaction: 'attract', // Golden ratio pulls inward
          };
        case 'C': // Signal Reef (Blue & Teal) - Dark Mode
          return {
            gradient: 'bg-gradient-to-b from-[#020617] via-[#082f49] to-[#042f2e]/90',
            spotlight1: 'bg-[radial-gradient(circle,rgba(14,165,233,0.06)_0%,transparent,transparent)]',
            spotlight2: 'bg-[radial-gradient(circle,rgba(37,99,235,0.05)_0%,transparent,transparent)]',
            spotlight3: 'bg-[radial-gradient(circle,rgba(20,184,166,0.04)_0%,transparent,transparent)]',
            sporeColors: ['#38bdf8', '#0f766e', '#2563eb', '#14b8a6', '#0f766e'],
            causticsGlow: 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(14,165,233,0.025)_0%,transparent_60%)]',
            interaction: 'orbit', // Celestial orbits around mouse
          };
        case 'A': // Bioluminescent Bio-Pulse Core (Teal & Sapphire) - Dark Mode
        default:
          return {
            gradient: 'bg-gradient-to-b from-[#020617] via-[#030712] to-[#082f49]/90',
            spotlight1: 'bg-[radial-gradient(circle,rgba(6,182,212,0.07)_0%,transparent,transparent)]',  // Cyan
            spotlight2: 'bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0%,transparent,transparent)]',  // Blue
            spotlight3: 'bg-[radial-gradient(circle,rgba(20,184,166,0.04)_0%,transparent,transparent)]',  // Teal
            sporeColors: ['#06b6d4', '#22d3ee', '#3b82f6', '#14b8a6', '#60a5fa'],
            causticsGlow: 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(6,182,212,0.03)_0%,transparent_60%)]',
            interaction: 'repel', // Biological defense push-away
          };
      }
    }
  }, [option, isLight]);

  // 2. High-Performance Canvas Particles (Bioluminescent Spores)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize deterministic spore array
    const sporeCount = 45;
    const spores: Spore[] = [];
    const colors = themeConfig.sporeColors;

    for (let i = 0; i < sporeCount; i++) {
      const size = Math.random() * 3 + 1; // 1px to 4px
      const baseAlpha = Math.random() * 0.5 + 0.3; // 0.3 to 0.8
      spores.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size,
        vx: (Math.random() - 0.5) * 0.3,
        vy: Math.random() * 0.4 + 0.15, // float upwards
        alpha: baseAlpha,
        baseAlpha,
        alphaSpeed: Math.random() * 0.02 + 0.005,
        color: colors[i % colors.length],
        swaySpeed: Math.random() * 0.01 + 0.005,
        swayOffset: Math.random() * Math.PI * 2,
      });
    }

    // Render loop
    let time = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 1;

      // Draw subtle ray-traced water light caustics on Canvas
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const gradient = ctx.createLinearGradient(width / 3, 0, width / 2, height);
      if (option === 'A') {
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.03)');
        gradient.addColorStop(0.3, 'rgba(34, 211, 238, 0.015)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (option === 'B') {
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.025)');
        gradient.addColorStop(0.3, 'rgba(52, 211, 153, 0.012)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(14, 165, 233, 0.025)');
        gradient.addColorStop(0.3, 'rgba(20, 184, 166, 0.012)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Smooth mouse interpolation
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      // Draw and update spores
      spores.forEach((spore) => {
        // Apply biological/celestial/geometric upward movement & sway
        spore.y -= spore.vy;
        spore.x += spore.vx + Math.sin(time * spore.swaySpeed + spore.swayOffset) * 0.15;

        // Mouse interaction physics
        const dx = spore.x - mouse.x;
        const dy = spore.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 180;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          if (themeConfig.interaction === 'repel') {
            // Bio-defense push-away
            const angle = Math.atan2(dy, dx);
            spore.x += Math.cos(angle) * force * 1.5;
            spore.y += Math.sin(angle) * force * 1.5;
          } else if (themeConfig.interaction === 'attract') {
            // Golden spiral pull-in
            const angle = Math.atan2(dy, dx);
            spore.x -= Math.cos(angle) * force * 1.2;
            spore.y -= Math.sin(angle) * force * 1.2;
          } else if (themeConfig.interaction === 'orbit') {
            // Cosmic orbital gravity
            const angle = Math.atan2(dy, dx);
            const orbitAngle = angle + Math.PI / 2;
            spore.x += Math.cos(orbitAngle) * force * 1.8;
            spore.y += Math.sin(orbitAngle) * force * 1.8;
          }
        }

        // Loop boundaries
        if (spore.y < -20) {
          spore.y = height + 20;
          spore.x = Math.random() * width;
        }
        if (spore.x < -20) spore.x = width + 20;
        if (spore.x > width + 20) spore.x = -20;

        // Pulse spore brightness (bioluminescent sparkle)
        spore.alpha = spore.baseAlpha + Math.sin(time * spore.alphaSpeed) * 0.2;
        if (spore.alpha < 0.1) spore.alpha = 0.1;
        if (spore.alpha > 0.95) spore.alpha = 0.95;

        // Draw glowing spore node
        ctx.beginPath();
        const radGrad = ctx.createRadialGradient(
          spore.x,
          spore.y,
          0,
          spore.x,
          spore.y,
          spore.size * 2.5
        );
        radGrad.addColorStop(0, `rgba(255, 255, 255, ${spore.alpha})`);
        radGrad.addColorStop(0.3, spore.color);
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.arc(spore.x, spore.y, spore.size * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Mouse movement listeners
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    const handleMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [themeConfig, option]);

  // Generate highly realistic bubbles using useMemo
  const bubbles = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => {
      const size = Math.round(Math.random() * 10 + 4); // 4px to 14px
      const left = Math.round(Math.random() * 100);
      const delay = Math.round(Math.random() * 12 * 10) / 10;
      const duration = Math.round((Math.random() * 8 + 14) * 10) / 10;
      const sway = Math.round(Math.random() * 40 - 20);
      const scale = Math.round((Math.random() * 0.4 + 0.7) * 10) / 10;
      return { id: i, size, left, delay, duration, sway, scale };
    });
  }, []);

  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-hidden text-foreground transition-all duration-1000",
        themeConfig.gradient,
        className
      )}
      {...props}
    >
      {/* 1. Subtle Structural Digital Grid - extremely faint for organic integration */}
      {showGrid && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-[1]" />
      )}

      {/* 2. Fluid Moving Currents & Oceanic Deep Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Spotlights matching option colors */}
        <div
          className={cn("absolute -top-[10%] -left-[10%] w-[65%] h-[65%] rounded-full animate-fluid-current", themeConfig.spotlight1)}
          style={{ animationDuration: '28s' }}
        />
        <div
          className={cn("absolute -bottom-[10%] -right-[5%] w-[70%] h-[70%] rounded-full animate-fluid-current", themeConfig.spotlight2)}
          style={{ animationDuration: '32s', animationDelay: '-4s' }}
        />
        <div
          className={cn("absolute top-[25%] right-[10%] w-[45%] h-[45%] rounded-full animate-fluid-current", themeConfig.spotlight3)}
          style={{ animationDuration: '24s', animationDelay: '-8s' }}
        />
        {/* Under-water Caustic Ripple Refraction Simulation */}
        <div className={cn("absolute inset-0 animate-caustics pointer-events-none", themeConfig.causticsGlow)} />
      </div>

      {/* 3. High-Performance Canvas Layer for Interactive Spores and Sunbeams */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-[1] select-none"
      />

      {/* 4. Layered vector Seaweed Kelp currents swaying gracefully in background (Symmetrical Corner Placement) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2] select-none opacity-40 dark:opacity-50">
        <svg className="absolute bottom-0 left-[-40px] w-48 h-[380px] overflow-visible pointer-events-none">
          <defs>
            <linearGradient id="kelp-grad-1" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={isLight ? (option === 'B' ? '#a7f3d0' : option === 'C' ? '#f3e8ff' : '#ccfbf1') : (option === 'B' ? '#064e3b' : option === 'C' ? '#1e1b4b' : '#0f172a')} stopOpacity="0.8" />
              <stop offset="100%" stopColor={option === 'B' ? '#34d399' : option === 'C' ? '#0f766e' : '#14b8a6'} stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="kelp-grad-2" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={isLight ? (option === 'B' ? '#d1fae5' : option === 'C' ? '#fae8ff' : '#e0f2fe') : (option === 'B' ? '#022c22' : option === 'C' ? '#0f172a' : '#082f49')} stopOpacity="0.9" />
              <stop offset="100%" stopColor={option === 'B' ? '#059669' : option === 'C' ? '#0f766e' : '#06b6d4'} stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {/* Kelp Blade 1 */}
          <path
            d="M 50 380 Q 20 220 70 120 T 50 10"
            fill="none"
            stroke="url(#kelp-grad-1)"
            strokeWidth="24"
            strokeLinecap="round"
            className="origin-bottom"
            style={{
              animation: 'swayKelp 14s ease-in-out infinite',
              animationDelay: '-1s'
            }}
          />
          {/* Kelp Blade 2 */}
          <path
            d="M 90 380 Q 120 250 80 140 T 110 30"
            fill="none"
            stroke="url(#kelp-grad-2)"
            strokeWidth="16"
            strokeLinecap="round"
            className="origin-bottom"
            style={{
              animation: 'swayKelp 11s ease-in-out infinite',
              animationDelay: '-4s'
            }}
          />
        </svg>

        <svg className="absolute bottom-0 right-[-40px] w-48 h-[350px] overflow-visible pointer-events-none">
          {/* Kelp Blade 3 */}
          <path
            d="M 120 350 Q 150 200 100 100 T 120 10"
            fill="none"
            stroke="url(#kelp-grad-1)"
            strokeWidth="22"
            strokeLinecap="round"
            className="origin-bottom"
            style={{
              animation: 'swayKelp 13s ease-in-out infinite',
              animationDelay: '-2s'
            }}
          />
          {/* Kelp Blade 4 */}
          <path
            d="M 70 350 Q 40 230 80 120 T 60 20"
            fill="none"
            stroke="url(#kelp-grad-2)"
            strokeWidth="14"
            strokeLinecap="round"
            className="origin-bottom"
            style={{
              animation: 'swayKelp 10s ease-in-out infinite',
              animationDelay: '-5s'
            }}
          />
        </svg>
      </div>

      {/* 5. Immersive Liquid Water Bubbles (Micro-Physics sway) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2] select-none">
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="absolute rounded-full border border-white/20 dark:border-white/10 pointer-events-none"
            style={{
              width: b.size,
              height: b.size,
              left: `${b.left}%`,
              bottom: '-50px',
              background: option === 'B'
                ? 'radial-gradient(circle at 30% 30%, rgba(209,250,229,0.15) 0%, rgba(209,250,229,0.01) 75%)'
                : option === 'C'
                  ? 'radial-gradient(circle at 30% 30%, rgba(240,232,255,0.15) 0%, rgba(240,232,255,0.01) 75%)'
                  : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.01) 75%)',
              boxShadow: option === 'B'
                ? 'inset 0 1px 2px rgba(52,211,153,0.15), 0 2px 5px rgba(0,0,0,0.05)'
                : option === 'C'
                  ? 'inset 0 1px 2px rgba(14,165,233,0.15), 0 2px 5px rgba(0,0,0,0.05)'
                  : 'inset 0 1px 2px rgba(255, 255, 255, 0.15), 0 2px 5px rgba(0,0,0,0.05)',
              animation: `floatBubble ${b.duration}s linear infinite`,
              animationDelay: `${b.delay}s`,
              '--sway': `${b.sway}px`,
              '--scale': b.scale,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* 6. Deep gradient water surface refraction shadows */}
      <div className={cn(
        "absolute inset-x-0 top-0 h-40 pointer-events-none z-[3] bg-gradient-to-b to-transparent transition-all duration-1000",
        isLight ? "from-white/45" : "from-black/45"
      )} />
      <div className={cn(
        "absolute inset-x-0 bottom-0 h-40 pointer-events-none z-[3] bg-gradient-to-t to-transparent transition-all duration-1000",
        isLight ? "from-white/45" : "from-black/45"
      )} />

      {/* Render children in high-fidelity floating viewport container */}
      <div className="relative z-10 w-full h-full min-h-screen flex flex-col">
        {children}
      </div>

      {/* Sway Kelp animation keyframe injecting directly to avoid CSS file compilation dependencies */}
      <style>{`
        @keyframes swayKelp {
          0%, 100% {
            transform: rotate(-4deg) skewX(-2deg);
          }
          50% {
            transform: rotate(4deg) skewX(2deg);
          }
        }
      `}</style>
    </div>
  );
};

export default AquaticBackground;
