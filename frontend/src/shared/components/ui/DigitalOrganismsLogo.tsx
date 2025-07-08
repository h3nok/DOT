import React from 'react';

interface DigitalOrganismsLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'horizontal' | 'stacked';
}

const DigitalOrganismsLogo: React.FC<DigitalOrganismsLogoProps> = ({
  size = 'md',
  className = '',
  variant = 'horizontal'
}) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl'
  };

  const dotSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const BlueDot = () => (
    <div className={`
      ${dotSizes[size]} 
      bg-blue-500
      rounded-full 
      inline-flex 
      items-center 
      justify-center
      relative
      mx-1
      shadow-lg
      shadow-blue-500/30
    `}>
      {/* Simple white highlight */}
      <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-white rounded-full opacity-40"></div>
      {/* Blue glow effect */}
      <div className="absolute inset-0 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
    </div>
  );

  if (variant === 'stacked') {
    return (
      <div className={`text-center ${className}`}>
        <div className={`${sizeClasses[size]} font-light text-foreground tracking-wide`}>
          Digital
        </div>
        <div className={`${sizeClasses[size]} font-light text-foreground tracking-wide flex items-center justify-center`}>
          <BlueDot />
          <span>rganisms</span>
        </div>
        <div className={`${sizeClasses[size]} font-light text-muted-foreground tracking-wide mt-2`}>
          Theory
        </div>
      </div>
    );
  }

  // For horizontal layout, we'll show it in two lines: "Digital Organisms" and "Theory"
  return (
    <div className={`text-center ${className}`}>
      <div className={`${sizeClasses[size]} font-light text-foreground tracking-wide flex items-center justify-center`}>
        <span>Digital</span>
        <span className="ml-4 flex items-center">
          <BlueDot />
          <span>rganisms</span>
        </span>
      </div>
      <div className={`${sizeClasses[size]} font-light text-muted-foreground tracking-wide mt-2`}>
        Theory
      </div>
    </div>
  );
};

export default DigitalOrganismsLogo;
