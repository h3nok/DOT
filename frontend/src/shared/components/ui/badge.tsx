import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'cyber' | 'pulse';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className = '', variant = 'default', children, ...props }, ref) => {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground',
    cyber: 'border-border/30 dark:border-white/10 bg-muted/60 dark:bg-black/60 text-muted-foreground font-mono text-[9px] uppercase tracking-wider',
    pulse: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] uppercase tracking-wider gap-1.5'
  };

  const classes = `${baseClasses} ${variants[variant]} ${className}`;

  return (
    <div
      ref={ref}
      className={classes}
      {...props}
    >
      {variant === 'pulse' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
      {children}
    </div>
  );
});
Badge.displayName = 'Badge';

export { Badge };
