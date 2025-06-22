import React from 'react';

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={`w-full bg-secondary rounded-full h-2.5 ${className}`}
    {...props}
  >
    <div
      className="bg-primary h-2.5 rounded-full transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
));

Progress.displayName = 'Progress';

export { Progress }; 