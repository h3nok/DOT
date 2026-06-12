import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import {
  Terminal,
  ChevronDown,
  Check,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// =========================================================================
// 1. PREMIUM HIGH-CONTRAST TEXT COMPONENT (REPLACES MUTED TEXT)
// =========================================================================
interface PremiumTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'contrast' | 'vibrant' | 'body' | 'editorial';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  mono?: boolean;
  serif?: boolean;
}

export const PremiumText: React.FC<PremiumTextProps> = ({
  children,
  variant = 'body',
  weight = 'normal',
  size = 'sm',
  mono = false,
  serif = false,
  className,
  ...props
}) => {
  const variants = {
    // Pure vibrant high contrast modes - absolutely NO faint slates or washed-out grays
    body: 'text-foreground/95 dark:text-foreground/95',
    contrast: 'text-foreground dark:text-white font-semibold',
    primary: 'text-primary font-bold dark:text-primary',
    secondary: 'text-secondary font-bold dark:text-secondary',
    accent: 'text-accent font-bold dark:text-accent',
    vibrant: 'text-foreground/90 font-medium leading-relaxed opacity-95',
    editorial: 'text-foreground/90 leading-relaxed font-serif italic'
  };

  const weights = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  };

  const sizes = {
    xs: 'text-xs sm:text-sm leading-normal tracking-wide',
    sm: 'text-sm sm:text-[15px] leading-relaxed tracking-wide',
    base: 'text-base sm:text-[17px] leading-relaxed tracking-wide',
    lg: 'text-lg sm:text-xl leading-relaxed tracking-wide',
    xl: 'text-xl sm:text-2xl leading-snug',
    '2xl': 'text-2xl sm:text-3xl leading-snug'
  };

  return (
    <p
      className={cn(
        variants[variant],
        weights[weight],
        sizes[size],
        serif ? 'font-serif' : mono ? 'font-mono' : 'font-sans',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

// =========================================================================
// 2. PREMIUM TITLE COMPONENT
// =========================================================================
interface PremiumTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  tag?: 'h1' | 'h2' | 'h3' | 'h4';
  variant?: 'gradient' | 'primary' | 'solid';
  mono?: boolean;
  serif?: boolean;
  withLine?: boolean;
}

export const PremiumTitle: React.FC<PremiumTitleProps> = ({
  children,
  tag = 'h2',
  variant = 'solid',
  mono = false,
  serif = false,
  withLine = false,
  className,
  ...props
}) => {
  const Tag = tag;

  const styleClasses = {
    solid: 'text-foreground dark:text-white',
    primary: 'text-primary dark:text-primary',
    gradient: 'text-transparent bg-clip-text bg-gradient-to-r from-foreground via-primary to-foreground dark:from-white dark:via-primary dark:to-white'
  };

  return (
    <div className={cn("group flex flex-col", className)}>
      <Tag
        className={cn(
          'font-bold leading-tight',
          serif ? 'font-serif tracking-normal' : mono ? 'font-mono tracking-wide' : 'font-sans tracking-tight',
          styleClasses[variant],
          tag === 'h1' && 'text-3xl sm:text-4xl',
          tag === 'h2' && 'text-2xl sm:text-[32px]',
          tag === 'h3' && 'text-xl sm:text-2xl',
          tag === 'h4' && 'text-base sm:text-lg'
        )}
        {...props}
      >
        {children}
      </Tag>

      {withLine && (
        <div className="h-[2px] w-12 bg-gradient-to-r from-primary via-accent to-transparent rounded-full mt-2.5 transition-all duration-500 group-hover:w-24 group-hover:from-accent group-hover:to-primary" />
      )}
    </div>
  );
};

// =========================================================================
// 3. PREMIUM GLASS CARD COMPONENT WITH SPOTLIGHT & CYBER ORNAMENTS
// =========================================================================
interface PremiumGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  enable3D?: boolean;
  className?: string;
  innerClassName?: string;
  glowColor?: string;
}

export const PremiumGlassCard = React.forwardRef<HTMLDivElement, PremiumGlassCardProps>(({
  children,
  enable3D = false,
  className,
  innerClassName,
  glowColor,
  ...props
}, ref) => {
  const localRef = useRef<HTMLDivElement>(null);
  const cardRef = (ref as React.RefObject<HTMLDivElement>) || localRef;

  // Track cursor spotlight positions
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCoords({ x, y });
    setIsHovered(true);

    if (enable3D) {
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      // 8-degree maximum tilt angle for pristine, high-fidelity responsive movement
      const rotateX = -(y - yc) / (yc / 8);
      const rotateY = (x - xc) / (xc / 8);

      el.style.setProperty('--rx', `${rotateX}deg`);
      el.style.setProperty('--ry', `${rotateY}deg`);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!cardRef.current) return;
    const el = cardRef.current;
    if (enable3D) {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'rounded-2xl p-[1px] transition-all duration-500 relative group overflow-hidden select-none flex items-center justify-center',
        'bg-gradient-to-b from-foreground/25 via-foreground/10 to-transparent dark:from-white/25 dark:via-white/10 dark:to-transparent hover:from-primary/35 hover:to-primary/10',
        enable3D && 'card-3d',
        className
      )}
      style={{
        boxShadow: glowColor
          ? `0 25px 60px -15px ${glowColor}30, 0 10px 25px -10px ${glowColor}15, inset 0 1px 1px rgba(255, 255, 255, 0.1)`
          : 'var(--premium-shadow)',
        ...props.style
      }}
      {...props}
    >
      {/* Inner glass pane */}
      <div className={cn("rounded-[15px] bg-card/90 dark:bg-card/85 backdrop-blur-3xl backdrop-saturate-[1.6] p-6 w-full relative overflow-hidden z-10 flex flex-col justify-between", innerClassName)}>
        {/* 1. Procedural Tech micro-grid scan overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.01)_1px,_transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-500 z-0" />

        {/* 2. Interactive Cursor Glow Spotlight */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0"
            style={{
              background: `radial-gradient(450px circle at ${coords.x}px ${coords.y}px, ${glowColor ? `${glowColor}12` : 'color-mix(in oklch, var(--primary) 6%, transparent)'}, transparent 65%)`
            }}
          />
        )}

        {/* 3. Moving glass aura gradient highlights */}
        <div
          className="absolute -inset-1 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 rounded-[15px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10"
          style={{
            background: glowColor ? `linear-gradient(135deg, ${glowColor}10, transparent, ${glowColor}05)` : ''
          }}
        />

        {/* 4. Cyber Notched Ornaments on Corners */}
        <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t-2 border-l-2 border-primary/30 rounded-tl-sm pointer-events-none opacity-30 group-hover:opacity-90 group-hover:border-primary transition-all duration-300 z-10" />
        <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t-2 border-r-2 border-primary/30 rounded-tr-sm pointer-events-none opacity-30 group-hover:opacity-90 group-hover:border-primary transition-all duration-300 z-10" />
        <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b-2 border-l-2 border-primary/30 rounded-bl-sm pointer-events-none opacity-30 group-hover:opacity-90 group-hover:border-primary transition-all duration-300 z-10" />
        <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b-2 border-r-2 border-primary/30 rounded-br-sm pointer-events-none opacity-30 group-hover:opacity-90 group-hover:border-primary transition-all duration-300 z-10" />

        {/* 5. Premium Diagonal Shine Sweep */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 rounded-[15px]">
          <div className="absolute top-0 left-0 w-[50%] h-[200%] bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-y-1/2 -skew-x-12 transition-transform duration-1000 group-hover:translate-x-[250%]" />
        </div>

        {/* Content wrapper with 3D depth alignment */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between">
          {enable3D ? (
            <div className="card-3d-inner w-full h-full flex flex-col justify-between">
              {children}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
});

PremiumGlassCard.displayName = 'PremiumGlassCard';

// =========================================================================
// 4. NEURAL NODE COMPONENT (HIGH-LUMINESCENCE GLASS ORB)
// =========================================================================
interface NeuralNodeProps {
  id: string;
  label: string;
  badge: string;
  tagline: string;
  icon: React.ReactNode;
  color: string;
  accentColor: string;
  isHovered: boolean;
  isSelected: boolean;
  index: number;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className?: string;
}

export const NeuralNode = React.forwardRef<HTMLDivElement, NeuralNodeProps>(({
  label,
  badge,
  tagline,
  icon,
  accentColor,
  isHovered,
  isSelected,
  index,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className
}, ref) => {
  const active = isHovered || isSelected;
  const localRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = localRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    // 8-degree maximum high-fidelity physical tilt mechanics
    const rotateX = -(y - yc) / (yc / 8);
    const rotateY = (x - xc) / (xc / 8);

    el.style.setProperty('--rx', `${rotateX}deg`);
    el.style.setProperty('--ry', `${rotateY}deg`);
  };

  const handleMouseLeaveLocal = () => {
    const el = localRef.current;
    if (el) {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    }
    onMouseLeave();
  };

  return (
    <motion.div
      ref={(node) => {
        (localRef as any).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as any).current = node;
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={handleMouseLeaveLocal}
      onClick={onClick}
      animate={{
        y: [0, -6, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.4
      }}
      className={cn(
        'w-52 h-52 rounded-full p-[1px] flex flex-col items-center justify-center cursor-pointer relative group select-none transition-all duration-500 shrink-0 overflow-hidden card-3d',
        isSelected ? 'scale-[1.03]' : '',
        className
      )}
      style={{
        background: active
          ? `linear-gradient(to bottom, ${accentColor}, ${accentColor}15)`
          : 'linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 15%, transparent), color-mix(in oklch, var(--foreground) 5%, transparent))',
        boxShadow: isSelected
          ? `0 25px 60px -10px ${accentColor}40, 0 0 30px ${accentColor}30, inset 0 1px 1px rgba(255,255,255,0.15)`
          : isHovered
            ? `0 20px 45px -10px ${accentColor}25, 0 0 20px ${accentColor}15, inset 0 1px 1px rgba(255,255,255,0.1)`
            : 'var(--premium-shadow)',
      }}
    >
      {/* Inner circular glass container */}
      <div className="w-full h-full rounded-full bg-gradient-to-b from-card/90 to-card/65 dark:from-card/85 dark:to-card/55 hover:from-card/95 hover:to-card/75 flex flex-col items-center justify-center text-center p-4 backdrop-blur-3xl backdrop-saturate-[1.6] overflow-hidden relative z-10">

        {/* 0. Razor-sharp physical glass double-layer reflection & micro bevel shadow */}
        <div className="absolute inset-0 rounded-full border border-foreground/10 dark:border-white/10 pointer-events-none z-10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.12),_inset_0_-1px_2px_rgba(0,0,0,0.15)]" />

        {/* 1. Nebula-Shift ambient background glow */}
        <div
          className="absolute inset-0 opacity-10 group-hover:opacity-20 blur-xl pointer-events-none transition-all duration-500 z-0 scale-[1.5]"
          style={{
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`
          }}
        />

        {/* 2. Concentric spinning outer border ring */}
        <div
          className="absolute inset-1.5 rounded-full border border-dashed border-border/20 group-hover:border-primary/30 animate-[spin_50s_linear_infinite] pointer-events-none z-0"
          style={{
            borderColor: active ? `${accentColor}30` : ''
          }}
        />

        {/* 3. Micro Tech Outer Degree Ticks */}
        <div
          className="absolute inset-3 rounded-full border border-dotted border-border/10 group-hover:border-primary/15 animate-[spin_80s_linear_infinite] pointer-events-none z-0"
          style={{
            borderColor: active ? `${accentColor}15` : ''
          }}
        />

        {/* 4. Active breathing status LED indicator */}
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 flex items-center space-x-1 z-20 pointer-events-none">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-500",
              active ? "animate-pulse" : "opacity-30"
            )}
            style={{
              backgroundColor: active ? accentColor : 'var(--border)',
              boxShadow: active ? `0 0 10px ${accentColor}, 0 0 4px ${accentColor}` : 'none'
            }}
          />
        </div>

        {/* 5. Internal status badge in tech brackets - vibrant text */}
        <div
          className="mb-2 mt-2 text-[11px] font-semibold font-mono tracking-widest uppercase border rounded-full px-2.5 py-0.5 pointer-events-none z-10 bg-background/60 dark:bg-black/30 flex items-center justify-center space-x-1"
          style={{
            borderColor: active ? `${accentColor}30` : 'color-mix(in oklch, var(--border) 30%, transparent)',
            color: active ? accentColor : 'var(--foreground)'
          }}
        >
          <span className="opacity-40 mr-0.5">[</span>
          <span>{badge}</span>
          <span className="opacity-40 ml-0.5">]</span>
        </div>

        {/* 6. Glowing Centerframe Icon */}
        <div
          className="w-12 h-12 rounded-full border flex items-center justify-center relative transition-all duration-500 mb-2 bg-background/80 dark:bg-black/60 z-10 pointer-events-none shadow-inner"
          style={{
            borderColor: active ? `${accentColor}40` : 'color-mix(in oklch, var(--border) 40%, transparent)',
            boxShadow: active ? `0 0 20px ${accentColor}30, inset 0 0 10px ${accentColor}15` : 'inset 0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          {active && (
            <div
              className="absolute inset-[-4px] rounded-full border border-dashed animate-[spin_12s_linear_infinite] pointer-events-none"
              style={{ borderColor: `${accentColor}50`, opacity: 0.5 }}
            />
          )}
          <div
            className="transition-all duration-500 scale-100 group-hover:scale-110"
            style={{ color: active ? accentColor : 'var(--foreground)' }}
          >
            {icon}
          </div>
        </div>

        {/* 7. Node Title Header */}
        <h4
          className="text-sm sm:text-[15px] font-extrabold uppercase font-serif transition-all duration-300 z-10 pointer-events-none"
          style={{
            color: active ? accentColor : 'var(--foreground)',
            textShadow: active ? `0 0 10px ${accentColor}40` : 'none',
            letterSpacing: active ? '0.15em' : '0.05em'
          }}
        >
          {label}
        </h4>

        {/* 8. Saturated tagline description */}
        <p className="mt-2 px-3 line-clamp-2 text-xs sm:text-sm text-foreground/80 leading-normal font-sans pointer-events-none select-none">
          {tagline}
        </p>

        {/* 9. Premium Diagonal Shine Sweep */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 rounded-full">
          <div className="absolute top-0 left-0 w-[50%] h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 -skew-x-12 transition-transform duration-1000 group-hover:translate-x-[250%]" />
        </div>
      </div>
    </motion.div>
  );
});

NeuralNode.displayName = 'NeuralNode';

// =========================================================================
// 5. NEURAL LINK SVG CONNECTION PATHWAY WITH PHOTON PARTICLE ANIMATION
// =========================================================================
interface NeuralLinkProps {
  from: { x: number; y: number } | null;
  to: { x: number; y: number } | null;
  accentColor: string;
  isHovered: boolean;
  isSelected: boolean;
}

export const NeuralLink: React.FC<NeuralLinkProps> = ({
  from,
  to,
  accentColor,
  isHovered,
  isSelected
}) => {
  if (!from || !to) return null;

  const isActive = isHovered || isSelected;

  // Draw organic S-curves that bend elegantly from the center outward
  const dx = to.x - from.x;
  const cx1 = from.x + dx * 0.5;
  const cy1 = from.y;
  const cx2 = from.x + dx * 0.5;
  const cy2 = to.y;
  const pathData = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;

  return (
    <g>
      {/* 1. Underlying soft halo backdrop link */}
      {isActive && (
        <path
          d={pathData}
          stroke={accentColor}
          strokeWidth="6"
          strokeOpacity="0.2"
          fill="none"
          className="transition-all duration-500 blur-[3px]"
        />
      )}

      {/* 2. Static connector line layer */}
      <path
        d={pathData}
        stroke={accentColor}
        strokeWidth={isActive ? "3.5" : "1.2"}
        strokeOpacity={isActive ? "0.8" : "0.22"}
        fill="none"
        className="transition-all duration-300"
        style={{
          filter: isActive ? `drop-shadow(0px 0px 5px ${accentColor})` : 'none'
        }}
      />

      {/* 3. Active state laser pulse dashes */}
      {isActive && (
        <path
          d={pathData}
          stroke={accentColor}
          strokeWidth="2.5"
          strokeDasharray="8 16"
          strokeDashoffset="0"
          fill="none"
          className="animate-pulse-flow"
        />
      )}

      {/* 4. HIGH-PERFORMANCE PHOTON PARTICLE (ZIP ANIMATION) */}
      {isActive && (
        <circle r="3.5" fill={accentColor} style={{ filter: `drop-shadow(0px 0px 8px ${accentColor})` }}>
          <animateMotion
            path={pathData}
            dur="2.8s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
};

// =========================================================================
// 6. HIGH-CONTRAST TECH BADGE WITH ORNAMENTAL BRACKETS
// =========================================================================
interface HighContrastBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: 'primary' | 'secondary' | 'accent' | 'success' | 'none';
  pulse?: boolean;
}

export const HighContrastBadge: React.FC<HighContrastBadgeProps> = ({
  children,
  glowColor = 'primary',
  pulse = false,
  className,
  ...props
}) => {
  const glowStyles = {
    primary: 'border-primary/35 bg-primary/10 text-primary shadow-sm shadow-primary/10',
    secondary: 'border-secondary/35 bg-secondary/10 text-secondary shadow-sm shadow-secondary/10',
    accent: 'border-accent/35 bg-accent/10 text-accent shadow-sm shadow-accent/10',
    success: 'border-foreground/15 bg-foreground/5 text-foreground dark:text-foreground/90 shadow-sm',
    none: 'border-border/30 bg-background/80 text-foreground/95'
  };

  return (
    <div
      className={cn(
            'inline-flex items-center rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold font-sans tracking-normal gap-1.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-[1.01]',
        glowStyles[glowColor],
        className
      )}
      {...props}
    >
      {pulse && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full animate-pulse shrink-0',
            glowColor === 'secondary' ? 'bg-secondary' : glowColor === 'accent' ? 'bg-accent' : glowColor === 'success' ? 'bg-foreground/60' : 'bg-primary'
          )}
        />
      )}
      {children}
    </div>
  );
};

// =========================================================================
// 7. CONCENTRIC ORBITAL TRACKS BACKGROUND SVG COMPONENT
// =========================================================================
interface OrbitalTracksProps {
  center: { x: number; y: number } | null;
}

export const OrbitalTracks: React.FC<OrbitalTracksProps> = ({ center }) => {
  if (!center) return null;

  return (
    <g className="pointer-events-none text-foreground/15 dark:text-white/10">
      {/* 1. Technical center reticle and micro grid alignment guides */}
      <line
        x1={center.x - 36} y1={center.y} x2={center.x + 36} y2={center.y}
        stroke="currentColor" strokeWidth="0.8" className="opacity-25"
      />
      <line
        x1={center.x} y1={center.y - 36} x2={center.x} y2={center.y + 36}
        stroke="currentColor" strokeWidth="0.8" className="opacity-25"
      />
      <circle
        cx={center.x} cy={center.y} r="32"
        fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 5" className="opacity-20 animate-[spin_40s_linear_infinite]"
      />

      {/* 2. Three multi-layered concentric dashed orbital tracks (geometric hexagons guides) */}
      {/* Inner Orbit Ellipse */}
      <ellipse
        cx={center.x}
        cy={center.y}
        rx="220"
        ry="130"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeDasharray="4 8"
        className="opacity-45 animate-[spin_100s_linear_infinite]"
      />
      {/* Mid Orbit Ellipse */}
      <ellipse
        cx={center.x}
        cy={center.y}
        rx="340"
        ry="200"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeDasharray="6 12"
        className="opacity-35 animate-[spin_160s_linear_infinite]"
      />
      {/* Outer Orbit Ellipse */}
      <ellipse
        cx={center.x}
        cy={center.y}
        rx="460"
        ry="270"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeDasharray="8 16"
        className="opacity-25 animate-[spin_220s_linear_infinite]"
      />
    </g>
  );
};

// =========================================================================
// 8. PREMIUM HARDWARE BUTTON PRIMITIVE (REPLACES BASIC RADIX BUTTONS)
// =========================================================================
interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  glow?: boolean;
  shimmer?: boolean;
  notched?: boolean;
  icon?: React.ReactNode;
}

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(({
  children,
  variant = 'glass',
  size = 'default',
  glow = false,
  shimmer = true,
  notched = true,
  icon,
  className,
  ...props
}, ref) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });
    setIsHovered(true);
  };

  const variants = {
    primary: 'bg-primary text-primary-foreground border-primary/30 shadow-[0_0_15px_rgba(37,99,235,0.15)] hover:border-primary/60 hover:shadow-[0_0_25px_rgba(37,99,235,0.28)]',
    secondary: 'bg-secondary text-secondary-foreground border-secondary/30 shadow-[0_0_15px_rgba(20,184,166,0.15)] hover:border-secondary/60 hover:shadow-[0_0_25px_rgba(20,184,166,0.35)]',
    accent: 'bg-accent text-accent-foreground border-accent/30 shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:border-accent/60 hover:shadow-[0_0_25px_rgba(249,115,22,0.35)]',
    outline: 'border border-border/60 bg-transparent text-foreground hover:bg-foreground/5 hover:border-foreground/30',
    ghost: 'border-transparent bg-transparent text-foreground hover:bg-foreground/5',
    glass: 'bg-white/[0.04] dark:bg-black/35 backdrop-blur-md border border-white/10 dark:border-white/5 text-foreground hover:bg-white/[0.08] dark:hover:bg-white/[0.05] shadow-[var(--premium-shadow)]'
  };

  const sizes = {
    sm: 'h-9 px-3.5 text-xs sm:text-sm tracking-wider',
    default: 'h-11 px-5 text-sm sm:text-base tracking-widest',
    lg: 'h-12 px-8 text-base sm:text-lg tracking-widest',
    icon: 'h-11 w-11 p-0 flex items-center justify-center'
  };

  return (
    <button
      ref={(el) => {
            (buttonRef as any).current = el;
            if (typeof ref === 'function') ref(el);
            else if (ref) (ref as any).current = el;
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
            'relative inline-flex items-center justify-center font-sans font-semibold select-none transition-all duration-300 rounded-lg overflow-hidden border active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group gap-2',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* 1. Diagonal Laser Shimmer Sweep */}
      {shimmer && !props.disabled && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 left-0 w-[50%] h-[200%] bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-y-1/2 -skew-x-12 transition-transform duration-1000 group-hover:translate-x-[250%]" />
        </div>
      )}

      {/* 2. Interactive Spotlight Glow */}
      {isHovered && glow && !props.disabled && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0"
          style={{
            background: `radial-gradient(100px circle at ${coords.x}px ${coords.y}px, rgba(255,255,255,0.12), transparent)`
          }}
        />
      )}

      {/* 3. Tech Corner Ornaments */}
      {notched && size !== 'icon' && (
        <>
          <span className="absolute top-1 left-1.5 w-1 h-1 border-t border-l border-foreground/20 group-hover:border-foreground/50 transition-colors pointer-events-none" />
          <span className="absolute bottom-1 right-1.5 w-1 h-1 border-b border-r border-foreground/20 group-hover:border-foreground/50 transition-colors pointer-events-none" />
        </>
      )}

      {/* Button Content */}
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="shrink-0 transition-transform duration-300 group-hover:scale-105">{icon}</span>}
        <span className="font-bold">{children}</span>
      </span>
    </button>
  );
});

PremiumButton.displayName = 'PremiumButton';

// =========================================================================
// 9. PREMIUM GLASS TECHNICAL INPUT PRIMITIVE
// =========================================================================
interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  badge?: string;
  error?: string;
  success?: boolean;
}

export const PremiumInput = React.forwardRef<HTMLInputElement, PremiumInputProps>(({
  label,
  badge,
  error,
  success,
  className,
  type = 'text',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn("flex flex-col gap-1.5 w-full text-left group", className)}>
      <div className="flex items-center justify-between px-1">
        {label && (
          <span className="text-sm sm:text-base font-sans font-semibold tracking-normal text-foreground/85 group-hover:text-foreground transition-colors duration-300">
            {label}
          </span>
        )}
        {badge && (
          <span className="text-xs font-sans font-semibold tracking-normal text-muted-foreground/75 border border-border/20 rounded px-2 py-0.5 bg-background/50">
            {badge}
          </span>
        )}
      </div>

      <div className="relative rounded-lg p-[1px] transition-all duration-500 overflow-hidden bg-gradient-to-b from-foreground/15 via-foreground/5 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent focus-within:from-primary/50 focus-within:to-accent/20">
        {/* Physical bevel overlay */}
        <div className="absolute inset-0 rounded-lg pointer-events-none z-10 border border-foreground/5 dark:border-white/5" />

        {/* Active Focus Highlight Corners */}
        <div className={cn(
          "absolute top-2 left-2 w-1.5 h-1.5 border-t border-l pointer-events-none z-20 transition-all duration-300 opacity-20",
          isFocused ? "opacity-100 border-primary scale-110" : "border-foreground/30"
        )} />
        <div className={cn(
          "absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r pointer-events-none z-20 transition-all duration-300 opacity-20",
          isFocused ? "opacity-100 border-primary scale-110" : "border-foreground/30"
        )} />

        <input
          type={type}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full h-11 px-4 py-2.5 rounded-[7px] bg-card/90 dark:bg-card/85 backdrop-blur-xl backdrop-saturate-[1.6] text-sm sm:text-base font-sans font-medium text-foreground placeholder:text-muted-foreground/75 focus:outline-none relative z-10 border-none transition-all duration-300",
            error && "text-red-500 placeholder:text-red-500/40",
            success && "text-emerald-500"
          )}
          {...props}
        />
      </div>

      {/* Feedback Micro tags */}
      {error && (
        <span className="text-[9.5px] font-mono font-semibold uppercase tracking-wider text-red-500 flex items-center gap-1 mt-0.5 px-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
});

PremiumInput.displayName = 'PremiumInput';

// =========================================================================
// 10. PREMIUM GLASS TECHNICAL TEXTAREA PRIMITIVE
// =========================================================================
interface PremiumTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  badge?: string;
  error?: string;
  success?: boolean;
}

export const PremiumTextArea = React.forwardRef<HTMLTextAreaElement, PremiumTextAreaProps>(({
  label,
  badge,
  error,
  success,
  className,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn("flex flex-col gap-1.5 w-full text-left group", className)}>
      <div className="flex items-center justify-between px-1">
        {label && (
          <span className="text-sm sm:text-base font-sans font-semibold tracking-normal text-foreground/85 group-hover:text-foreground transition-colors duration-300">
            {label}
          </span>
        )}
        {badge && (
          <span className="text-xs font-sans font-semibold tracking-normal text-muted-foreground/75 border border-border/20 rounded px-2 py-0.5 bg-background/50">
            {badge}
          </span>
        )}
      </div>

      <div className="relative rounded-xl p-[1px] transition-all duration-500 overflow-hidden bg-gradient-to-b from-foreground/15 via-foreground/5 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent focus-within:from-primary/50 focus-within:to-accent/20">
        {/* Physical bevel overlay */}
        <div className="absolute inset-0 rounded-xl pointer-events-none z-10 border border-foreground/5 dark:border-white/5" />

        {/* Active Focus Highlight Corners */}
        <div className={cn(
          "absolute top-2.5 left-2.5 w-1.5 h-1.5 border-t border-l pointer-events-none z-20 transition-all duration-300 opacity-20",
          isFocused ? "opacity-100 border-primary scale-110" : "border-foreground/30"
        )} />
        <div className={cn(
          "absolute bottom-2.5 right-2.5 w-1.5 h-1.5 border-b border-r pointer-events-none z-20 transition-all duration-300 opacity-20",
          isFocused ? "opacity-100 border-primary scale-110" : "border-foreground/30"
        )} />

        <textarea
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full min-h-[120px] px-4 py-3 rounded-[11px] bg-card/90 dark:bg-card/85 backdrop-blur-xl backdrop-saturate-[1.6] text-sm sm:text-base font-sans font-medium text-foreground placeholder:text-muted-foreground/75 focus:outline-none relative z-10 border-none transition-all duration-300 resize-y",
            error && "text-red-500 placeholder:text-red-500/40",
            success && "text-emerald-500"
          )}
          {...props}
        />
      </div>

      {/* Feedback Micro tags */}
      {error && (
        <span className="text-[9.5px] font-mono font-semibold uppercase tracking-wider text-red-500 flex items-center gap-1 mt-0.5 px-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
});

PremiumTextArea.displayName = 'PremiumTextArea';

// =========================================================================
// 11. PREMIUM COCKPIT TOGGLE SWITCH PRIMITIVE
// =========================================================================
interface PremiumSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  badge?: string;
  glowColor?: string;
  className?: string;
}

export const PremiumSwitch: React.FC<PremiumSwitchProps> = ({
  checked,
  onChange,
  label,
  badge,
  glowColor = '#2563eb',
  className
}) => {
  return (
    <div className={cn("flex items-center justify-between w-full select-none text-left", className)}>
      <div className="flex flex-col text-left">
        {label && (
          <span className="text-sm sm:text-base font-sans font-semibold tracking-normal text-foreground">
            {label}
          </span>
        )}
        {badge && (
          <span className="text-xs sm:text-sm font-sans text-muted-foreground mt-0.5 tracking-normal font-medium">
            {badge}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "w-12 h-6 rounded-full p-[1px] relative flex items-center transition-all duration-300 overflow-hidden border border-border/40 hover:border-border cursor-pointer",
          checked ? "bg-card shadow-inner" : "bg-black/25"
        )}
        style={{
          boxShadow: checked ? `inset 0 1px 3px rgba(0,0,0,0.3), 0 0 12px ${glowColor}15` : 'none'
        }}
      >
        {/* Track highlight when checked */}
        <div
          className={cn("absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none")}
          style={{
            background: `radial-gradient(40px circle at ${checked ? 'calc(100% - 12px)' : '12px'} center, ${glowColor}30, transparent 75%)`,
            opacity: checked ? 1 : 0
          }}
        />

        {/* Sliding thumb ball */}
        <motion.div
          animate={{ x: checked ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="w-5 h-5 rounded-full relative z-10 flex items-center justify-center border shadow-md bg-white dark:bg-zinc-100"
          style={{
            borderColor: checked ? glowColor : 'rgba(0,0,0,0.12)',
            boxShadow: checked ? `0 0 10px ${glowColor}, 0 2px 4px rgba(0,0,0,0.1)` : '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {/* Internal LED core */}
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: checked ? glowColor : 'rgba(0,0,0,0.2)',
              boxShadow: checked ? `0 0 6px ${glowColor}` : 'none'
            }}
          />
        </motion.div>
      </button>
    </div>
  );
};

// =========================================================================
// 12. PREMIUM GLASS SLIDER CONTROL PRIMITIVE
// =========================================================================
interface PremiumSliderProps {
  min?: number;
  max?: number;
  value: number;
  onChange: (val: number) => void;
  label?: string;
  badge?: string;
  unit?: string;
  glowColor?: string;
  className?: string;
}

export const PremiumSlider: React.FC<PremiumSliderProps> = ({
  min = 0,
  max = 100,
  value,
  onChange,
  label,
  badge,
  unit = '%',
  glowColor = '#3b82f6',
  className
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("flex flex-col gap-2 w-full text-left select-none", className)}>
      <div className="flex items-center justify-between px-1 font-sans font-semibold text-sm sm:text-base">
        <span className="text-foreground/80">{label}</span>
        <span className="flex items-center gap-1" style={{ color: glowColor }}>
          {badge && <span className="opacity-60 mr-1">{badge}</span>}
          <span className="font-bold font-mono tracking-widest">{value}{unit}</span>
        </span>
      </div>

      <div className="relative w-full h-5 flex items-center">
        {/* Track backdrop */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-black/20 border border-white/5 overflow-hidden">
          {/* Active track segment */}
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, color-mix(in oklch, ${glowColor} 70%, transparent), ${glowColor})`,
              boxShadow: `0 0 10px ${glowColor}50`
            }}
          />
        </div>

        {/* Input Range (Hidden overlay, native controls) */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />

        {/* Custom thumb tracker */}
        <div
          className="absolute w-4 h-4 rounded-full border bg-white dark:bg-zinc-100 flex items-center justify-center pointer-events-none z-10 -ml-2 select-none shadow-md transition-all duration-100"
          style={{
            left: `${percentage}%`,
            borderColor: glowColor,
            boxShadow: `0 0 12px ${glowColor}, 0 2px 4px rgba(0,0,0,0.15)`
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: glowColor }} />
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 13. PREMIUM NEON COGNITIVE PROGRESS BAR PRIMITIVE
// =========================================================================
interface PremiumProgressProps {
  value: number; // 0 to 100
  label?: string;
  badge?: string;
  glowColor?: string;
  className?: string;
}

export const PremiumProgress: React.FC<PremiumProgressProps> = ({
  value,
  label,
  badge,
  glowColor = '#10b981',
  className
}) => {
  const cappedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn("flex flex-col gap-1.5 w-full text-left", className)}>
      <div className="flex items-center justify-between px-1 text-sm sm:text-base font-sans font-semibold tracking-normal">
        <span className="text-foreground/80">{label}</span>
        <span className="font-bold flex items-center gap-1" style={{ color: glowColor }}>
          {badge && <span className="opacity-45 mr-1 font-semibold">{badge}</span>}
          <span>{cappedValue.toFixed(0)}%</span>
        </span>
      </div>

      {/* Progress track tube with premium inset shading */}
      <div className="h-3 rounded-full w-full bg-black/25 dark:bg-black/35 border border-white/5 p-[2px] shadow-inner overflow-hidden relative">
        {/* Glowing aura tube backdrop */}
        <div
          className="absolute inset-0 opacity-10 blur-sm pointer-events-none"
          style={{ background: glowColor }}
        />

        {/* Inner dynamic fill meter */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${cappedValue}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full relative overflow-hidden flex items-center justify-end"
          style={{
            background: `linear-gradient(90deg, color-mix(in oklch, ${glowColor} 60%, transparent), ${glowColor})`,
            boxShadow: `0 0 8px ${glowColor}70`
          }}
        >
          {/* Horizontal high-frequency stripe sweeps */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,_rgba(255,255,255,0.12)_25%,_transparent_25%,_transparent_50%,_rgba(255,255,255,0.12)_50%,_rgba(255,255,255,0.12)_75%,_transparent_75%,_transparent)] bg-[size:12px_12px] opacity-25 animate-[pulse_1s_infinite]" />
        </motion.div>
      </div>
    </div>
  );
};

// =========================================================================
// 14. PREMIUM TERMINAL DECK PRIMITIVE (REUSABLE LOGS TERMINAL)
// =========================================================================
interface PremiumTerminalProps {
  logs: string[];
  onCommand?: (cmd: string) => void;
  title?: string;
  latency?: string;
  className?: string;
  disabled?: boolean;
}

export const PremiumTerminal: React.FC<PremiumTerminalProps> = ({
  logs,
  onCommand,
  title = "LOCAL COGNITIVE STREAM CORE",
  latency = "3.2ms",
  className,
  disabled = false
}) => {
  const [cmdInput, setCmdInput] = useState('');
  const terminalScrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim() || disabled || !onCommand) return;
    onCommand(cmdInput);
    setCmdInput('');
  };

  useEffect(() => {
    const terminal = terminalScrollRef.current;
    if (terminal) {
      terminal.scrollTop = terminal.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={cn("rounded-xl border border-sky-500/10 bg-black/45 shadow-2xl flex flex-col overflow-hidden text-left relative group select-none", className)}>

      {/* 1. Terminal Bar Header */}
      <div className="min-h-10 border-b border-sky-500/10 px-4 py-2 bg-black/60 flex items-center justify-between shrink-0 font-sans text-xs sm:text-sm font-semibold tracking-normal text-foreground/85 gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
          <span className="text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-emerald-500/95 flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live channel
          </span>
          <span className="opacity-30">|</span>
          <span className="text-sky-400 font-semibold">Latency: {latency}</span>
        </div>
      </div>

      {/* 2. Log Stream viewport */}
      <div ref={terminalScrollRef} className="flex-1 p-4 font-mono text-xs md:text-sm leading-relaxed space-y-1.5 overflow-y-auto max-h-[210px] text-foreground/95 select-text custom-scrollbar">
        {logs.map((log, index) => {
          // Color-code telemetry labels dynamically
          const isError = log.includes('[ERR]') || log.includes('Failed');
          const isZK = log.includes('[ZK-TRUST]') || log.includes('[ZK]');
          const isSys = log.includes('[SYSTEM]') || log.includes('[SYS]');
          const isGeo = log.includes('[GEOLOCATION]') || log.includes('[STAY-MESH]');
          const isTwin = log.includes('[TWIN-CORE]') || log.includes('[TWIN-GRAPH]');

          let textClass = "text-foreground/90";
          if (isError) textClass = "text-red-400 font-bold";
          else if (isZK) textClass = "text-yellow-400 font-medium";
          else if (isSys) textClass = "text-blue-400";
          else if (isGeo) textClass = "text-emerald-400";
          else if (isTwin) textClass = "text-sky-400";

          return (
            <div key={index} className={cn("font-mono", textClass)}>
              {log}
            </div>
          );
        })}
      </div>

      {/* 3. Interactive prompt overlay */}
      {onCommand && (
        <form onSubmit={handleSubmit} className="border-t border-sky-500/10 h-11 px-4 bg-black/60 flex items-center gap-2 shrink-0 font-mono text-sm">
          <span className="text-sky-500 font-bold select-none">&gt;_</span>
          <input
            type="text"
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            disabled={disabled}
            placeholder={disabled ? "Processing previous task feed..." : "Inscribe local command or seed query..."}
            className="flex-1 h-full bg-transparent border-none focus:outline-none text-foreground text-sm font-mono placeholder:text-muted-foreground/75"
          />
          <button type="submit" className="hidden" />
          <span className="w-1.5 h-4 bg-sky-500 animate-blink pointer-events-none" />
        </form>
      )}
    </div>
  );
};

// =========================================================================
// 15. PREMIUM HIGH-IMPACT METRICS BLOCK PRIMITIVE
// =========================================================================
interface PremiumMetricProps {
  value: string | number;
  label: string;
  badge?: string;
  trend?: { direction: 'up' | 'down'; amount: string };
  glowColor?: string;
  className?: string;
}

export const PremiumMetric: React.FC<PremiumMetricProps> = ({
  value,
  label,
  badge,
  trend,
  glowColor = '#2563eb',
  className
}) => {
  return (
    <div className={cn("p-4 rounded-xl border border-border/10 bg-card/65 backdrop-blur-xl relative overflow-hidden group select-none text-left flex flex-col justify-between h-28", className)}>
      {/* Underlying glow layer */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-lg pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)` }}
      />

      <div className="flex items-center justify-between w-full relative z-10">
        <span className="text-sm font-sans font-semibold tracking-normal text-muted-foreground leading-snug">
          {label}
        </span>
        {badge && (
          <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded border bg-background/50 leading-none" style={{ borderColor: `${glowColor}30`, color: glowColor }}>
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between w-full mt-3 relative z-10">
        <span className="text-xl sm:text-2xl font-mono font-extrabold leading-none text-foreground tracking-tight">
          {value}
        </span>

        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded text-xs font-sans font-semibold leading-none select-none",
            trend.direction === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-red-500/10 text-red-400 border border-red-500/15'
          )}>
            {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.amount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// 16. PREMIUM SELECT OPTION DROPDOWN PRIMITIVE
// =========================================================================
interface PremiumDropdownProps {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  glowColor?: string;
  className?: string;
}

export const PremiumDropdown: React.FC<PremiumDropdownProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = "Select Option",
  glowColor = '#2563eb',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-1.5 w-full text-left relative", className)}>
      {label && (
        <span className="text-sm sm:text-base font-sans font-semibold tracking-normal text-foreground/85 px-1">
          {label}
        </span>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-4 rounded-lg bg-card/90 dark:bg-card/85 backdrop-blur-xl border border-border/40 hover:border-foreground/20 text-sm sm:text-base text-foreground flex items-center justify-between focus:outline-none focus:border-primary/50 relative overflow-hidden transition-all duration-300 shadow-sm"
      >
        <span className="flex items-center gap-2 relative z-10">
          {selectedOption?.icon && <span className="opacity-75">{selectedOption.icon}</span>}
          <span className="font-medium">{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300 relative z-10", isOpen && "rotate-180")} />
      </button>

      {/* Floating Options Glass Pane */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+6px)] left-0 w-full rounded-lg border border-border/40 bg-card/95 backdrop-blur-3xl p-1 z-50 shadow-2xl max-h-[180px] overflow-y-auto"
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full h-10 px-3 rounded-md text-sm font-sans text-left flex items-center justify-between transition-colors select-none",
                    active
                      ? "bg-foreground/5 text-foreground font-bold"
                      : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {opt.icon && <span style={{ color: active ? glowColor : 'inherit' }}>{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </span>
                  {active && <Check className="w-4 h-4" style={{ color: glowColor }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
