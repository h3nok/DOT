import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'premium' | 'glass';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
    premium: 'bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_15px_color-mix(in_oklch,var(--primary)_25%,transparent)] hover:shadow-[0_0_25px_color-mix(in_oklch,var(--primary)_45%,transparent)] hover:scale-[1.02] active:scale-[0.98] border border-white/10 hover:border-white/25',
    glass: 'bg-white/[0.04] dark:bg-black/30 backdrop-blur-md border border-white/10 dark:border-white/5 text-foreground hover:bg-white/[0.09] dark:hover:bg-white/[0.05] shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10'
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      ref={ref}
      className={classes}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button };
