import React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = '', value = 0, ...props }, ref) => (
    <div
      ref={ref}
      className={`w-full bg-secondary rounded-full h-2.5 ${className}`}
      {...props}
    >
      <div
        className="bg-primary h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  )
);

Progress.displayName = 'Progress';

export { Progress };
export type { ProgressProps };
