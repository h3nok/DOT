import React, { useRef } from 'react';
import { cn } from '../../../lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle' | 'bright' | 'premium';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  enable3D?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(({
  children,
  className,
  variant = 'default',
  blur = 'md',
  shadow = 'lg',
  enable3D = false,
  ...props
}, ref) => {
  const localRef = useRef<HTMLDivElement>(null);
  const cardRef = (ref as React.RefObject<HTMLDivElement>) || localRef;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enable3D || !cardRef.current) return;
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xc = rect.width / 2;
    const yc = rect.height / 2;
    // Maximum tilt angle of 10 degrees for perfect visual control
    const rotateX = -(y - yc) / (yc / 10);
    const rotateY = (x - xc) / (xc / 10);

    el.style.setProperty('--rx', `${rotateX}deg`);
    el.style.setProperty('--ry', `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    if (!enable3D || !cardRef.current) return;
    const el = cardRef.current;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  const variants = {
    default: 'bg-card/60 border-border/40 hover:bg-card/70 hover:border-border/60',
    elevated: 'bg-card/70 border-border/50 hover:bg-card/85 hover:border-border/70',
    subtle: 'bg-card/40 border-border/30 hover:bg-card/55 hover:border-border/50',
    bright: 'bg-card/80 border-border/60 hover:bg-card/90 hover:border-border/80',
    premium: 'glass-card-premium'
  };

  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl'
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl'
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'rounded-2xl border transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] group relative',
        enable3D && 'card-3d',
        variants[variant],
        variant !== 'premium' && blurClasses[blur],
        variant !== 'premium' && shadowClasses[shadow],
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10" />
      {enable3D ? (
        <div className="card-3d-inner w-full h-full flex flex-col items-center justify-center">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;
