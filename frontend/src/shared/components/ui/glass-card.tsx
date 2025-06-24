import React from 'react';
import { cn } from '../../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle' | 'bright';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  variant = 'default',
  blur = 'md',
  shadow = 'lg'
}) => {
  const variants = {
    default: 'bg-card/60 border-border/40',
    elevated: 'bg-card/70 border-border/50',
    subtle: 'bg-card/40 border-border/30',
    bright: 'bg-card/80 border-border/60'
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
    <div className={cn(
      'rounded-2xl border transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] group',
      variants[variant],
      blurClasses[blur],
      shadowClasses[shadow],
      'hover:bg-card/70 hover:border-border/60',
      className
    )}>
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10" />
      {children}
    </div>
  );
};

export default GlassCard;
